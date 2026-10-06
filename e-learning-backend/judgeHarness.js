// // e-learning-backend/judgeHarness.js
// //
// // "Function mode" for coding questions (like LeetCode):
// //   * the student only writes a method (class Solution { ... } / def / function)
// //   * this file builds the hidden code that reads the test input, CALLS that method
// //     and prints the returned value
// //   * and later compares the returned value with the expected output
// //
// // How the pieces fit together:
// //
// //   admin test case text        ->  buildStdin()          ->  Judge0 stdin
// //   student code + hidden driver->  buildSource()         ->  Judge0 source_code
// //   Judge0 stdout               ->  readResult()          ->  JS value  -> compare with parseExpected()

// // ---------------------------------------------------------------------------
// // 1. SUPPORTED TYPES (written the Java way; they are translated for every language)
// // ---------------------------------------------------------------------------
// const TYPES = [
//   'int', 'long', 'double', 'boolean', 'String',
//   'int[]', 'long[]', 'double[]', 'boolean[]', 'String[]',
//   'int[][]',
// ];

// const NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
// // words that cannot be used as a function / parameter name in at least one language
// const RESERVED = new Set([
//   'abstract', 'and', 'as', 'assert', 'auto', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
//   'continue', 'def', 'default', 'del', 'delete', 'do', 'double', 'elif', 'else', 'enum', 'except', 'explicit',
//   'export', 'extends', 'extern', 'false', 'final', 'finally', 'float', 'for', 'from', 'function', 'global', 'goto',
//   'if', 'implements', 'import', 'in', 'instanceof', 'int', 'interface', 'is', 'lambda', 'let', 'long', 'main',
//   'namespace', 'native', 'new', 'nonlocal', 'not', 'null', 'object', 'operator', 'or', 'out', 'override', 'package',
//   'pass', 'private', 'protected', 'public', 'raise', 'ref', 'register', 'return', 'self', 'short', 'signed',
//   'sizeof', 'static', 'string', 'struct', 'super', 'switch', 'synchronized', 'template', 'this', 'throw', 'throws',
//   'transient', 'true', 'try', 'typedef', 'typeof', 'union', 'unsigned', 'using', 'var', 'virtual', 'void',
//   'volatile', 'while', 'with', 'yield',
//   // more keywords from C#, C++ and JavaScript
//   'alignas', 'alignof', 'arguments', 'asm', 'await', 'base', 'bitand', 'bitor', 'checked', 'compl', 'concept',
//   'constexpr', 'decimal', 'decltype', 'delegate', 'dynamic_cast', 'eval', 'event', 'fixed', 'foreach', 'friend',
//   'implicit', 'inline', 'internal', 'lock', 'mutable', 'noexcept', 'nullptr', 'params', 'readonly', 'reinterpret_cast',
//   'requires', 'sbyte', 'sealed', 'stackalloc', 'static_assert', 'static_cast', 'strictfp', 'thread_local', 'typeid',
//   'typename', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort', 'wchar_t', 'xor', 'const_cast',
// ]);

// const isMatrix = (t) => t.endsWith('[][]');
// const isArray = (t) => t.endsWith('[]') && !isMatrix(t);
// const elemOf = (t) => (isMatrix(t) ? t.slice(0, -4) : isArray(t) ? t.slice(0, -2) : t);

// // Marker the hidden driver prints just before the returned value
// const MARK = '@@RESULT@@';

// // ---------------------------------------------------------------------------
// // 2. VALIDATING WHAT THE ADMIN SAVES
// // ---------------------------------------------------------------------------
// function validateSignature({ functionName, returnType, params }) {
//   if (!NAME_RE.test(functionName || '')) return 'Function name must be letters, digits and _ (and not start with a digit).';
//   if (RESERVED.has(functionName)) return `"${functionName}" cannot be used as a function name.`;
//   if (!TYPES.includes(returnType)) return 'Choose a valid return type.';
//   if (!Array.isArray(params)) return 'Parameters are missing.';
//   const seen = new Set();
//   for (const p of params) {
//     if (!NAME_RE.test(p.name || '')) return `Parameter name "${p.name || ''}" is not valid.`;
//     if (RESERVED.has(p.name)) return `"${p.name}" cannot be used as a parameter name.`;
//     if (seen.has(p.name)) return `Parameter name "${p.name}" is used twice.`;
//     seen.add(p.name);
//     if (!TYPES.includes(p.type)) return `Parameter "${p.name}" needs a valid type.`;
//   }
//   return null;
// }

// // Checks every test case can be converted. Returns an error message or null.
// function validateTestCases(problem) {
//   const types = problem.params.map((p) => p.type);
//   for (let i = 0; i < problem.testCases.length; i++) {
//     const t = problem.testCases[i];
//     try { buildStdin(t.input, types); }
//     catch (e) { return `Test case ${i + 1} input: ${e.message}`; }
//     try { parseExpected(t.expectedOutput, problem.returnType); }
//     catch (e) { return `Test case ${i + 1} expected output: ${e.message}`; }
//   }
//   return null;
// }

// // ---------------------------------------------------------------------------
// // 3. TEST INPUT TEXT  ->  tokens the hidden driver can read
// //
// // The admin may write the input any of these ways (one value per parameter, in order):
// //     [2,7,11,15]            nums = [2,7,11,15]           [2,7,11,15], 9
// //     9                      target = 9
// // Strings should be written in "quotes".
// // The driver itself reads a simple token stream, so we convert here:
// //     int/long/double/boolean -> the value
// //     String                  -> "x" + hex of its UTF-8 bytes   (so spaces/quotes never matter)
// //     arrays                  -> count, then the items
// //     int[][]                 -> row count, then for each row: count + items
// // ---------------------------------------------------------------------------
// function splitTop(s) {
//   const parts = [];
//   let depth = 0, inStr = false, start = 0;
//   for (let i = 0; i < s.length; i++) {
//     const c = s[i];
//     if (inStr) { if (c === '\\') i++; else if (c === '"') inStr = false; continue; }
//     if (c === '"') inStr = true;
//     else if (c === '[') depth++;
//     else if (c === ']') depth--;
//     else if (c === ',' && depth === 0) { parts.push(s.slice(start, i)); start = i + 1; }
//   }
//   parts.push(s.slice(start));
//   return parts.map((x) => x.trim());
// }

// // reads ONE value starting at position i; returns [rawText, nextIndex]
// function readValue(s, i, type) {
//   const ch = s[i];
//   if (ch === '[') {
//     let depth = 0, inStr = false, j = i;
//     for (; j < s.length; j++) {
//       const c = s[j];
//       if (inStr) { if (c === '\\') j++; else if (c === '"') inStr = false; continue; }
//       if (c === '"') inStr = true;
//       else if (c === '[') depth++;
//       else if (c === ']') { depth--; if (depth === 0) { j++; break; } }
//     }
//     if (depth !== 0) throw new Error('a [ is never closed');
//     return [s.slice(i, j), j];
//   }
//   if (ch === '"') {
//     let j = i + 1;
//     for (; j < s.length; j++) {
//       if (s[j] === '\\') { j++; continue; }
//       if (s[j] === '"') break;
//     }
//     if (j >= s.length) throw new Error('a " is never closed');
//     return [s.slice(i, j + 1), j + 1];
//   }
//   if (type === 'String') { // unquoted text: take the rest of the line
//     let j = s.indexOf('\n', i);
//     if (j === -1) j = s.length;
//     return [s.slice(i, j), j];
//   }
//   let j = i;
//   while (j < s.length && !/[\s,]/.test(s[j])) j++;
//   return [s.slice(i, j), j];
// }

// const INT_MIN = -(2n ** 31n), INT_MAX = 2n ** 31n - 1n;
// const LONG_MIN = -(2n ** 63n), LONG_MAX = 2n ** 63n - 1n;

// function encodeScalar(raw, type) {
//   const t = String(raw).trim();
//   switch (type) {
//     case 'int': {
//       if (!/^[+-]?\d+$/.test(t)) throw new Error(`"${t}" is not an int`);
//       const n = BigInt(t);
//       if (n < INT_MIN || n > INT_MAX) throw new Error(`${t} does not fit in an int (use long)`);
//       return String(n);
//     }
//     case 'long': {
//       if (!/^[+-]?\d+$/.test(t)) throw new Error(`"${t}" is not a long`);
//       const n = BigInt(t);
//       if (n < LONG_MIN || n > LONG_MAX) throw new Error(`${t} does not fit in a long`);
//       return String(n);
//     }
//     case 'double':
//       if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)) throw new Error(`"${t}" is not a number`);
//       return t.replace(/^\+/, '');
//     case 'boolean':
//       if (!/^(true|false)$/i.test(t)) throw new Error(`"${t}" is not true/false`);
//       return t.toLowerCase();
//     case 'String': {
//       let v = t;
//       if (t.startsWith('"')) {
//         try { v = JSON.parse(t); } catch (e) { throw new Error(`${t} is not a valid quoted string`); }
//       }
//       return 'x' + Buffer.from(v, 'utf8').toString('hex');
//     }
//     default:
//       throw new Error('unsupported type ' + type);
//   }
// }

// function listItems(raw, what) {
//   const t = String(raw).trim();
//   if (!(t.startsWith('[') && t.endsWith(']'))) throw new Error(`expected ${what} like [1,2,3] but found "${t}"`);
//   const inner = t.slice(1, -1).trim();
//   return inner === '' ? [] : splitTop(inner);
// }

// function encodeValue(raw, type) {
//   if (isMatrix(type)) {
//     const rows = listItems(raw, 'a 2D array');
//     const el = elemOf(type);
//     return [String(rows.length), ...rows.map((r) => {
//       const items = listItems(r, 'a row like [1,2]');
//       return [String(items.length), ...items.map((x) => encodeScalar(x, el))].join(' ');
//     })].join(' ');
//   }
//   if (isArray(type)) {
//     const items = listItems(raw, 'an array');
//     const el = elemOf(type);
//     return [String(items.length), ...items.map((x) => encodeScalar(x, el))].join(' ');
//   }
//   return encodeScalar(raw, type);
// }

// function buildStdin(inputText, types) {
//   const s = String(inputText || '').replace(/\r/g, '');
//   let i = 0;
//   const lines = [];
//   types.forEach((type, idx) => {
//     while (i < s.length && /[\s,]/.test(s[i])) i++;                  // skip spaces / commas / newlines
//     const m = /^[A-Za-z_]\w*\s*=\s*/.exec(s.slice(i));                // optional "name = "
//     if (m) i += m[0].length;
//     if (i >= s.length) throw new Error(`expected ${types.length} value(s) but found only ${idx}`);
//     const [raw, next] = readValue(s, i, type);
//     i = next;
//     lines.push(encodeValue(raw, type));
//   });
//   if (s.slice(i).replace(/[\s,]/g, '') !== '') throw new Error(`more than ${types.length} value(s) found - check the parameters`);
//   return lines.join('\n') + '\n';
// }

// // ---------------------------------------------------------------------------
// // 4. EXPECTED OUTPUT / RETURNED VALUE
// // ---------------------------------------------------------------------------
// function shapeOk(v, type) {
//   if (v === null) return !['int', 'long', 'double', 'boolean'].includes(type);
//   if (isMatrix(type)) return Array.isArray(v) && v.every((r) => shapeOk(r, 'int[]'));
//   if (isArray(type)) return Array.isArray(v) && v.every((x) => shapeOk(x, elemOf(type)));
//   switch (type) {
//     case 'int': case 'long': return Number.isInteger(v);
//     case 'double': return typeof v === 'number';
//     case 'boolean': return typeof v === 'boolean';
//     case 'String': return typeof v === 'string';
//     default: return false;
//   }
// }

// // Expected output text written by the admin -> JS value
// function parseExpected(text, type) {
//   const t = String(text === undefined || text === null ? '' : text).trim();
//   if (type === 'String') {
//     if (t.startsWith('"')) { try { return JSON.parse(t); } catch (e) { /* fall through: treat as raw text */ } }
//     return t;
//   }
//   let v;
//   try { v = JSON.parse(t); } catch (e) { throw new Error(`"${t}" is not a valid ${type} value (example: ${EXAMPLES[type]})`); }
//   if (!shapeOk(v, type)) throw new Error(`"${t}" does not look like a ${type} (example: ${EXAMPLES[type]})`);
//   return v;
// }
// const EXAMPLES = {
//   int: '5', long: '5', double: '2.5', boolean: 'true', String: 'hello',
//   'int[]': '[0,1]', 'long[]': '[0,1]', 'double[]': '[0.5,1.5]', 'boolean[]': '[true,false]',
//   'String[]': '["a","b"]', 'int[][]': '[[1,2],[3,4]]',
// };

// // The driver prints "@@RESULT@@ tokens..." as the very last thing. Everything printed before it
// // by the student's own code is returned separately as `printed`.
// function readResult(stdout, type) {
//   const idx = stdout.lastIndexOf(MARK);
//   if (idx === -1) return { found: false, printed: stdout };
//   const printed = stdout.slice(0, idx).replace(/\n$/, '');
//   const tk = stdout.slice(idx + MARK.length).trim().split(/\s+/).filter(Boolean);
//   let pos = 0;
//   const next = () => { if (pos >= tk.length) throw new Error('result is incomplete'); return tk[pos++]; };
//   const scalar = (el) => {
//     const t = next();
//     switch (el) {
//       case 'int': case 'long': case 'double': { const n = Number(t); return n; }
//       case 'boolean': return t === 'true';
//       case 'String': return Buffer.from(t.slice(1), 'hex').toString('utf8');
//       default: throw new Error('unsupported type');
//     }
//   };
//   try {
//     if (tk[0] === 'null') return { found: true, printed, value: null };
//     let value;
//     if (isMatrix(type)) {
//       const r = parseInt(next(), 10);
//       value = [];
//       for (let i = 0; i < r; i++) {
//         const c = parseInt(next(), 10);
//         const row = [];
//         for (let j = 0; j < c; j++) row.push(scalar(elemOf(type)));
//         value.push(row);
//       }
//     } else if (isArray(type)) {
//       const n = parseInt(next(), 10);
//       value = [];
//       for (let i = 0; i < n; i++) value.push(scalar(elemOf(type)));
//     } else {
//       value = scalar(type);
//     }
//     return { found: true, printed, value };
//   } catch (e) {
//     return { found: true, printed, error: e.message };
//   }
// }

// // doubles are compared with a small tolerance, everything else must match exactly
// function same(a, b, tol) {
//   if (typeof a === 'number' && typeof b === 'number') {
//     if (a === b) return true;
//     if (!tol || !Number.isFinite(a) || !Number.isFinite(b)) return false;
//     return Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
//   }
//   if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => same(x, b[i], tol));
//   return a === b;
// }
// const valuesMatch = (actual, expected, type) => same(actual, expected, elemOf(type) === 'double');

// // How a value is shown to the student ("Your output")
// const display = (v) => (typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v));

// // ---------------------------------------------------------------------------
// // 5. TYPE NAMES IN EACH LANGUAGE
// // ---------------------------------------------------------------------------
// const JAVA_T = {
//   int: 'int', long: 'long', double: 'double', boolean: 'boolean', String: 'String',
//   'int[]': 'int[]', 'long[]': 'long[]', 'double[]': 'double[]', 'boolean[]': 'boolean[]', 'String[]': 'String[]',
//   'int[][]': 'int[][]',
// };
// const CPP_T = {
//   int: 'int', long: 'long long', double: 'double', boolean: 'bool', String: 'string',
//   'int[]': 'vector<int>', 'long[]': 'vector<long long>', 'double[]': 'vector<double>', 'boolean[]': 'vector<bool>',
//   'String[]': 'vector<string>', 'int[][]': 'vector<vector<int>>',
// };
// const CS_T = {
//   int: 'int', long: 'long', double: 'double', boolean: 'bool', String: 'string',
//   'int[]': 'int[]', 'long[]': 'long[]', 'double[]': 'double[]', 'boolean[]': 'bool[]', 'String[]': 'string[]',
//   'int[][]': 'int[][]',
// };
// const PY_T = {
//   int: 'int', long: 'int', double: 'float', boolean: 'bool', String: 'str',
//   'int[]': 'List[int]', 'long[]': 'List[int]', 'double[]': 'List[float]', 'boolean[]': 'List[bool]',
//   'String[]': 'List[str]', 'int[][]': 'List[List[int]]',
// };
// const JS_T = {
//   int: 'number', long: 'number', double: 'number', boolean: 'boolean', String: 'string',
//   'int[]': 'number[]', 'long[]': 'number[]', 'double[]': 'number[]', 'boolean[]': 'boolean[]',
//   'String[]': 'string[]', 'int[][]': 'number[][]',
// };
// const pascal = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// // languages that work in function mode (C is left out: returning arrays from C needs extra size arguments)
// const FUNCTION_LANGS = ['java', 'python', 'javascript', 'cpp', 'csharp'];

// // ---------------------------------------------------------------------------
// // 6. STARTER CODE SHOWN TO THE STUDENT (generated from the signature)
// // ---------------------------------------------------------------------------
// function starterCode(p) {
//   const ps = p.params;
//   const fn = p.functionName;
//   const ret = p.returnType;
//   return {
//     java: [
//       'import java.util.*;',
//       '',
//       'class Solution {',
//       `    public ${JAVA_T[ret]} ${fn}(${ps.map((x) => `${JAVA_T[x.type]} ${x.name}`).join(', ')}) {`,
//       '        // write your code here',
//       '        ',
//       '    }',
//       '}',
//       '',
//     ].join('\n'),

//     python: [
//       'class Solution:',
//       `    def ${fn}(${['self', ...ps.map((x) => x.name)].join(', ')}):`,
//       ...(ps.length ? [`        # ${ps.map((x) => `${x.name}: ${PY_T[x.type]}`).join(', ')}`] : []),
//       `        # return: ${PY_T[ret]}`,
//       '        pass',
//       '',
//     ].join('\n'),

//     javascript: [
//       '/**',
//       ...ps.map((x) => ` * @param {${JS_T[x.type]}} ${x.name}`),
//       ` * @return {${JS_T[ret]}}`,
//       ' */',
//       `var ${fn} = function(${ps.map((x) => x.name).join(', ')}) {`,
//       '    // write your code here',
//       '    ',
//       '};',
//       '',
//     ].join('\n'),

//     cpp: [
//       '#include <bits/stdc++.h>',
//       'using namespace std;',
//       '',
//       'class Solution {',
//       'public:',
//       `    ${CPP_T[ret]} ${fn}(${ps.map((x) => `${CPP_T[x.type]}${x.type.includes('[]') ? '&' : ''} ${x.name}`).join(', ')}) {`,
//       '        // write your code here',
//       '        ',
//       '    }',
//       '};',
//       '',
//     ].join('\n'),

//     csharp: [
//       'using System;',
//       'using System.Collections.Generic;',
//       'using System.Linq;',
//       '',
//       'public class Solution {',
//       `    public ${CS_T[ret]} ${pascal(fn)}(${ps.map((x) => `${CS_T[x.type]} ${x.name}`).join(', ')}) {`,
//       '        // write your code here',
//       '        ',
//       '    }',
//       '}',
//       '',
//     ].join('\n'),

//     c: '', // not available in function mode
//   };
// }

// // ---------------------------------------------------------------------------
// // 7. HIDDEN DRIVERS  (appended after the student's code; they read the tokens,
// //    call the student's method and print the result after the marker)
// //    All helper names start with "jx_" so they never clash with student code.
// // ---------------------------------------------------------------------------

// // ----- Java -----
// function javaDriver(p) {
//   const reads = p.params.map((x, i) => {
//     const t = x.type;
//     const expr = {
//       int: 'Integer.parseInt(jx_next())', long: 'Long.parseLong(jx_next())', double: 'Double.parseDouble(jx_next())',
//       boolean: 'Boolean.parseBoolean(jx_next())', String: 'jx_str(jx_next())',
//       'int[]': 'jx_ints()', 'long[]': 'jx_longs()', 'double[]': 'jx_doubles()', 'boolean[]': 'jx_bools()',
//       'String[]': 'jx_strs()', 'int[][]': 'jx_matrix()',
//     }[t];
//     return `        ${JAVA_T[t]} a${i} = ${expr};`;
//   }).join('\n');
//   const args = p.params.map((x, i) => `a${i}`).join(', ');

//   return String.raw`
// public class Main {
//     static java.util.StringTokenizer jx_tk;
//     static String jx_next() { return jx_tk.nextToken(); }
//     static String jx_str(String t) {
//         byte[] b = new byte[(t.length() - 1) / 2];
//         for (int i = 0; i < b.length; i++) b[i] = (byte) Integer.parseInt(t.substring(1 + 2 * i, 3 + 2 * i), 16);
//         return new String(b, java.nio.charset.StandardCharsets.UTF_8);
//     }
//     static String jx_hex(String s) {
//         StringBuilder sb = new StringBuilder("x");
//         for (byte x : s.getBytes(java.nio.charset.StandardCharsets.UTF_8)) sb.append(String.format("%02x", x & 0xff));
//         return sb.toString();
//     }
//     static int[] jx_ints() { int n = Integer.parseInt(jx_next()); int[] a = new int[n]; for (int i = 0; i < n; i++) a[i] = Integer.parseInt(jx_next()); return a; }
//     static long[] jx_longs() { int n = Integer.parseInt(jx_next()); long[] a = new long[n]; for (int i = 0; i < n; i++) a[i] = Long.parseLong(jx_next()); return a; }
//     static double[] jx_doubles() { int n = Integer.parseInt(jx_next()); double[] a = new double[n]; for (int i = 0; i < n; i++) a[i] = Double.parseDouble(jx_next()); return a; }
//     static boolean[] jx_bools() { int n = Integer.parseInt(jx_next()); boolean[] a = new boolean[n]; for (int i = 0; i < n; i++) a[i] = Boolean.parseBoolean(jx_next()); return a; }
//     static String[] jx_strs() { int n = Integer.parseInt(jx_next()); String[] a = new String[n]; for (int i = 0; i < n; i++) a[i] = jx_str(jx_next()); return a; }
//     static int[][] jx_matrix() { int r = Integer.parseInt(jx_next()); int[][] m = new int[r][]; for (int i = 0; i < r; i++) m[i] = jx_ints(); return m; }

//     static void jx_w(StringBuilder o, int v) { o.append(' ').append(v); }
//     static void jx_w(StringBuilder o, long v) { o.append(' ').append(v); }
//     static void jx_w(StringBuilder o, double v) { o.append(' ').append(v); }
//     static void jx_w(StringBuilder o, boolean v) { o.append(v ? " true" : " false"); }
//     static void jx_w(StringBuilder o, String v) { if (v == null) o.append(" null"); else o.append(' ').append(jx_hex(v)); }
//     static void jx_w(StringBuilder o, int[] v) { if (v == null) { o.append(" null"); return; } o.append(' ').append(v.length); for (int x : v) o.append(' ').append(x); }
//     static void jx_w(StringBuilder o, long[] v) { if (v == null) { o.append(" null"); return; } o.append(' ').append(v.length); for (long x : v) o.append(' ').append(x); }
//     static void jx_w(StringBuilder o, double[] v) { if (v == null) { o.append(" null"); return; } o.append(' ').append(v.length); for (double x : v) o.append(' ').append(x); }
//     static void jx_w(StringBuilder o, boolean[] v) { if (v == null) { o.append(" null"); return; } o.append(' ').append(v.length); for (boolean x : v) o.append(x ? " true" : " false"); }
//     static void jx_w(StringBuilder o, String[] v) { if (v == null) { o.append(" null"); return; } o.append(' ').append(v.length); for (String x : v) jx_w(o, x); }
//     static void jx_w(StringBuilder o, int[][] v) { if (v == null) { o.append(" null"); return; } o.append(' ').append(v.length); for (int[] r : v) jx_w(o, r); }

//     public static void main(String[] args) throws Exception {
//         java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
//         StringBuilder all = new StringBuilder();
//         String line;
//         while ((line = br.readLine()) != null) all.append(line).append(' ');
//         jx_tk = new java.util.StringTokenizer(all.toString());
// ${reads}
//         ${JAVA_T[p.returnType]} res = new Solution().${p.functionName}(${args});
//         StringBuilder out = new StringBuilder("\n${MARK}");
//         jx_w(out, res);
//         System.out.println(out);
//     }
// }
// `;
// }

// // ----- Python -----
// function pythonDriver(p) {
//   const reads = p.params.map((x, i) => {
//     const expr = {
//       int: 'int(jx_next())', long: 'int(jx_next())', double: 'float(jx_next())',
//       boolean: "jx_next() == 'true'", String: 'jx_str(jx_next())',
//       'int[]': 'jx_arr(int)', 'long[]': 'jx_arr(int)', 'double[]': 'jx_arr(float)',
//       'boolean[]': "jx_arr(lambda t: t == 'true')", 'String[]': 'jx_arr(jx_str)', 'int[][]': 'jx_matrix()',
//     }[x.type];
//     return `jx_a${i} = ${expr}`;
//   }).join('\n');
//   const args = p.params.map((x, i) => `jx_a${i}`).join(', ');

//   const toks = {
//     int: '[str(jx_res)]', long: '[str(jx_res)]', double: '[repr(float(jx_res))]',
//     boolean: "['true' if jx_res else 'false']", String: '[jx_hex(str(jx_res))]',
//     'int[]': '[str(len(jx_res))] + [str(v) for v in jx_res]',
//     'long[]': '[str(len(jx_res))] + [str(v) for v in jx_res]',
//     'double[]': '[str(len(jx_res))] + [repr(float(v)) for v in jx_res]',
//     'boolean[]': "[str(len(jx_res))] + ['true' if v else 'false' for v in jx_res]",
//     'String[]': '[str(len(jx_res))] + [jx_hex(str(v)) for v in jx_res]',
//     'int[][]': '[str(len(jx_res))] + [t for row in jx_res for t in ([str(len(row))] + [str(v) for v in row])]',
//   }[p.returnType];

//   return String.raw`
// import sys as jx_sys
// jx_tok = jx_sys.stdin.read().split()
// jx_pos = 0
// def jx_next():
//     global jx_pos
//     jx_pos += 1
//     return jx_tok[jx_pos - 1]
// def jx_str(t):
//     return bytes.fromhex(t[1:]).decode('utf-8')
// def jx_hex(s):
//     return 'x' + s.encode('utf-8').hex()
// def jx_arr(conv):
//     n = int(jx_next())
//     return [conv(jx_next()) for _ in range(n)]
// def jx_matrix():
//     r = int(jx_next())
//     return [jx_arr(int) for _ in range(r)]

// ${reads}
// jx_res = Solution().${p.functionName}(${args})
// jx_parts = ['null'] if jx_res is None else ${toks}
// jx_sys.stdout.write("\n${MARK} " + " ".join(jx_parts) + "\n")
// `;
// }

// // ----- JavaScript -----
// function jsDriver(p) {
//   const reads = p.params.map((x, i) => {
//     const expr = {
//       int: 'Number(jx_next())', long: 'Number(jx_next())', double: 'Number(jx_next())',
//       boolean: "jx_next() === 'true'", String: 'jx_str(jx_next())',
//       'int[]': 'jx_arr(Number)', 'long[]': 'jx_arr(Number)', 'double[]': 'jx_arr(Number)',
//       'boolean[]': "jx_arr((t) => t === 'true')", 'String[]': 'jx_arr(jx_str)', 'int[][]': 'jx_matrix()',
//     }[x.type];
//     return `const jx_a${i} = ${expr};`;
//   }).join('\n');
//   const args = p.params.map((x, i) => `jx_a${i}`).join(', ');

//   const toks = {
//     int: '[String(jx_res)]', long: '[String(jx_res)]', double: '[String(jx_res)]',
//     boolean: "[jx_res ? 'true' : 'false']", String: '[jx_hex(jx_res)]',
//     'int[]': '[String(jx_res.length)].concat(jx_res.map(String))',
//     'long[]': '[String(jx_res.length)].concat(jx_res.map(String))',
//     'double[]': '[String(jx_res.length)].concat(jx_res.map(String))',
//     'boolean[]': "[String(jx_res.length)].concat(jx_res.map((v) => (v ? 'true' : 'false')))",
//     'String[]': '[String(jx_res.length)].concat(jx_res.map((v) => jx_hex(v)))',
//     'int[][]': '[String(jx_res.length)].concat(...jx_res.map((r) => [String(r.length)].concat(r.map(String))))',
//   }[p.returnType];

//   return String.raw`
// const jx_tok = require('fs').readFileSync(0, 'utf8').split(/\s+/).filter(Boolean);
// let jx_pos = 0;
// const jx_next = () => jx_tok[jx_pos++];
// const jx_str = (t) => Buffer.from(t.slice(1), 'hex').toString('utf8');
// const jx_hex = (s) => 'x' + Buffer.from(String(s), 'utf8').toString('hex');
// const jx_arr = (conv) => { const n = parseInt(jx_next(), 10); const a = []; for (let i = 0; i < n; i++) a.push(conv(jx_next())); return a; };
// const jx_matrix = () => { const r = parseInt(jx_next(), 10); const m = []; for (let i = 0; i < r; i++) m.push(jx_arr(Number)); return m; };

// ${reads}
// const jx_res = ${p.functionName}(${args});
// const jx_parts = (jx_res === null || jx_res === undefined) ? ['null'] : ${toks};
// process.stdout.write("\n${MARK} " + jx_parts.join(' ') + "\n");
// `;
// }

// // ----- C++ -----
// function cppDriver(p) {
//   const reads = p.params.map((x, i) => {
//     const t = x.type;
//     const line = {
//       int: `int a${i} = jx_toInt(jx_next());`,
//       long: `long long a${i} = jx_toLong(jx_next());`,
//       double: `double a${i} = jx_toDouble(jx_next());`,
//       boolean: `bool a${i} = jx_toBool(jx_next());`,
//       String: `std::string a${i} = jx_str(jx_next());`,
//       'int[]': `std::vector<int> a${i} = jx_vec<int>(jx_toInt);`,
//       'long[]': `std::vector<long long> a${i} = jx_vec<long long>(jx_toLong);`,
//       'double[]': `std::vector<double> a${i} = jx_vec<double>(jx_toDouble);`,
//       'boolean[]': `std::vector<bool> a${i} = jx_vec<bool>(jx_toBool);`,
//       'String[]': `std::vector<std::string> a${i} = jx_vec<std::string>(jx_str);`,
//       'int[][]': `std::vector<std::vector<int>> a${i} = jx_matrix();`,
//     }[t];
//     return `    ${line}`;
//   }).join('\n');
//   const args = p.params.map((x, i) => `a${i}`).join(', ');

//   const write = {
//     int: 'out += " " + std::to_string(res);',
//     long: 'out += " " + std::to_string(res);',
//     double: 'out += " " + jx_fmtD(res);',
//     boolean: 'out += res ? " true" : " false";',
//     String: 'out += " " + jx_hex(res);',
//     'int[]': 'out += " " + std::to_string(res.size()); for (auto v : res) out += " " + std::to_string(v);',
//     'long[]': 'out += " " + std::to_string(res.size()); for (auto v : res) out += " " + std::to_string(v);',
//     'double[]': 'out += " " + std::to_string(res.size()); for (auto v : res) out += " " + jx_fmtD(v);',
//     'boolean[]': 'out += " " + std::to_string(res.size()); for (bool v : res) out += v ? " true" : " false";',
//     'String[]': 'out += " " + std::to_string(res.size()); for (auto& v : res) out += " " + jx_hex(v);',
//     'int[][]': 'out += " " + std::to_string(res.size()); for (auto& row : res) { out += " " + std::to_string(row.size()); for (auto v : row) out += " " + std::to_string(v); }',
//   }[p.returnType];

//   return String.raw`
// #include <bits/stdc++.h>
// static std::vector<std::string> jx_tok;
// static size_t jx_pos = 0;
// static std::string jx_next() { return jx_tok[jx_pos++]; }
// static int jx_toInt(const std::string& t) { return std::stoi(t); }
// static long long jx_toLong(const std::string& t) { return std::stoll(t); }
// static double jx_toDouble(const std::string& t) { return std::stod(t); }
// static bool jx_toBool(const std::string& t) { return t == "true"; }
// static std::string jx_str(const std::string& t) {
//     std::string s;
//     for (size_t i = 1; i + 1 < t.size(); i += 2) s.push_back((char) std::stoi(t.substr(i, 2), nullptr, 16));
//     return s;
// }
// static std::string jx_hex(const std::string& s) {
//     static const char* d = "0123456789abcdef";
//     std::string r = "x";
//     for (unsigned char c : s) { r += d[c >> 4]; r += d[c & 15]; }
//     return r;
// }
// static std::string jx_fmtD(double d) { std::ostringstream o; o << std::setprecision(17) << d; return o.str(); }
// template <class T, class F> static std::vector<T> jx_vec(F conv) {
//     int n = std::stoi(jx_next());
//     std::vector<T> v;
//     for (int i = 0; i < n; i++) v.push_back(conv(jx_next()));
//     return v;
// }
// static std::vector<std::vector<int>> jx_matrix() {
//     int r = std::stoi(jx_next());
//     std::vector<std::vector<int>> m;
//     for (int i = 0; i < r; i++) m.push_back(jx_vec<int>(jx_toInt));
//     return m;
// }
// int main() {
//     std::string jx_t;
//     while (std::cin >> jx_t) jx_tok.push_back(jx_t);
// ${reads}
//     Solution sol;
//     auto res = sol.${p.functionName}(${args});
//     std::string out = "\n${MARK}";
//     ${write}
//     std::cout << out << std::endl;
//     return 0;
// }
// `;
// }

// // ----- C# -----
// function csDriver(p) {
//   const reads = p.params.map((x, i) => {
//     const expr = {
//       int: 'jx_int(jx_next())', long: 'jx_long(jx_next())', double: 'jx_dbl(jx_next())',
//       boolean: 'jx_next() == "true"', String: 'jx_str(jx_next())',
//       'int[]': 'jx_ints()', 'long[]': 'jx_longs()', 'double[]': 'jx_dbls()', 'boolean[]': 'jx_bools()',
//       'String[]': 'jx_strs()', 'int[][]': 'jx_matrix()',
//     }[x.type];
//     return `        ${CS_T[x.type]} a${i} = ${expr};`;
//   }).join('\n');
//   const args = p.params.map((x, i) => `a${i}`).join(', ');

//   const write = {
//     int: 'o.Append(" ").Append(jx_s(res));',
//     long: 'o.Append(" ").Append(jx_s(res));',
//     double: 'o.Append(" ").Append(jx_d(res));',
//     boolean: 'o.Append(res ? " true" : " false");',
//     String: 'if (res == null) o.Append(" null"); else o.Append(" ").Append(jx_hex(res));',
//     'int[]': 'if (res == null) o.Append(" null"); else { o.Append(" ").Append(jx_s(res.Length)); foreach (int v in res) o.Append(" ").Append(jx_s(v)); }',
//     'long[]': 'if (res == null) o.Append(" null"); else { o.Append(" ").Append(jx_s(res.Length)); foreach (long v in res) o.Append(" ").Append(jx_s(v)); }',
//     'double[]': 'if (res == null) o.Append(" null"); else { o.Append(" ").Append(jx_s(res.Length)); foreach (double v in res) o.Append(" ").Append(jx_d(v)); }',
//     'boolean[]': 'if (res == null) o.Append(" null"); else { o.Append(" ").Append(jx_s(res.Length)); foreach (bool v in res) o.Append(v ? " true" : " false"); }',
//     'String[]': 'if (res == null) o.Append(" null"); else { o.Append(" ").Append(jx_s(res.Length)); foreach (string v in res) o.Append(" ").Append(jx_hex(v == null ? "" : v)); }',
//     'int[][]': 'if (res == null) o.Append(" null"); else { o.Append(" ").Append(jx_s(res.Length)); foreach (int[] row in res) { o.Append(" ").Append(jx_s(row.Length)); foreach (int v in row) o.Append(" ").Append(jx_s(v)); } }',
//   }[p.returnType];

//   return String.raw`
// class JxMain {
//     static string[] jx_tok;
//     static int jx_pos = 0;
//     static string jx_next() { return jx_tok[jx_pos++]; }
//     static string jx_s(long v) { return v.ToString(System.Globalization.CultureInfo.InvariantCulture); }
//     static string jx_d(double v) { return v.ToString("R", System.Globalization.CultureInfo.InvariantCulture); }
//     static int jx_int(string t) { return int.Parse(t, System.Globalization.CultureInfo.InvariantCulture); }
//     static long jx_long(string t) { return long.Parse(t, System.Globalization.CultureInfo.InvariantCulture); }
//     static double jx_dbl(string t) { return double.Parse(t, System.Globalization.CultureInfo.InvariantCulture); }
//     static string jx_str(string t) {
//         var b = new System.Collections.Generic.List<byte>();
//         for (int i = 1; i + 1 < t.Length; i += 2) b.Add(System.Convert.ToByte(t.Substring(i, 2), 16));
//         return System.Text.Encoding.UTF8.GetString(b.ToArray());
//     }
//     static string jx_hex(string s) {
//         var sb = new System.Text.StringBuilder("x");
//         foreach (byte x in System.Text.Encoding.UTF8.GetBytes(s)) sb.Append(x.ToString("x2"));
//         return sb.ToString();
//     }
//     static int[] jx_ints() { int n = jx_int(jx_next()); int[] a = new int[n]; for (int i = 0; i < n; i++) a[i] = jx_int(jx_next()); return a; }
//     static long[] jx_longs() { int n = jx_int(jx_next()); long[] a = new long[n]; for (int i = 0; i < n; i++) a[i] = jx_long(jx_next()); return a; }
//     static double[] jx_dbls() { int n = jx_int(jx_next()); double[] a = new double[n]; for (int i = 0; i < n; i++) a[i] = jx_dbl(jx_next()); return a; }
//     static bool[] jx_bools() { int n = jx_int(jx_next()); bool[] a = new bool[n]; for (int i = 0; i < n; i++) a[i] = jx_next() == "true"; return a; }
//     static string[] jx_strs() { int n = jx_int(jx_next()); string[] a = new string[n]; for (int i = 0; i < n; i++) a[i] = jx_str(jx_next()); return a; }
//     static int[][] jx_matrix() { int r = jx_int(jx_next()); int[][] m = new int[r][]; for (int i = 0; i < r; i++) m[i] = jx_ints(); return m; }

//     static void Main() {
//         string all = System.Console.In.ReadToEnd();
//         jx_tok = all.Split(new char[] { ' ', '\n', '\r', '\t' }, System.StringSplitOptions.RemoveEmptyEntries);
// ${reads}
//         var res = new Solution().${pascal(p.functionName)}(${args});
//         var o = new System.Text.StringBuilder("\n${MARK}");
//         ${write}
//         System.Console.WriteLine(o.ToString());
//     }
// }
// `;
// }

// // ---------------------------------------------------------------------------
// // 8. FINAL SOURCE SENT TO JUDGE0  =  student's code + hidden driver
// // ---------------------------------------------------------------------------
// function buildSource(language, userCode, p) {
//   const code = String(userCode || '');
//   switch (language) {
//     case 'java':
//       // a public class must live in its own file, so quietly make "public class Solution" a normal class
//       return code.replace(/\bpublic\s+class\s+Solution\b/, 'class Solution') + '\n' + javaDriver(p);
//     case 'python': return code + '\n' + pythonDriver(p);
//     case 'javascript': return code + '\n' + jsDriver(p);
//     case 'cpp': return code + '\n' + cppDriver(p);
//     case 'csharp': return code + '\n' + csDriver(p);
//     default: throw new Error('This language is not available for function-style questions.');
//   }
// }

// // plain-object copy of the function settings of a Problem document
// const specOf = (problem) => ({
//   functionName: problem.functionName,
//   returnType: problem.returnType,
//   params: Array.from(problem.params || []).map((x) => ({ name: x.name, type: x.type })),
// });

// module.exports = {
//   TYPES, FUNCTION_LANGS, MARK,
//   validateSignature, validateTestCases,
//   buildStdin, parseExpected, readResult, valuesMatch, display,
//   starterCode, buildSource, specOf,
// };

// e-learning-backend/judgeHarness.js
//
// "Function mode" for coding questions (like LeetCode):
//   * the student only writes a method (class Solution { ... } / def / function)
//   * this file builds the hidden code that reads the test input, CALLS that method
//     and prints the returned value
//   * and later compares the returned value with the expected output
//
// How the pieces fit together:
//
//   admin test case text        ->  buildStdin()          ->  Judge0 stdin
//   student code + hidden driver->  buildSource()         ->  Judge0 source_code
//   Judge0 stdout               ->  readResult()          ->  JS value  -> compare with parseExpected()

// ---------------------------------------------------------------------------
// 1. SUPPORTED TYPES (written the Java way; they are translated for every language)
// ---------------------------------------------------------------------------
const TYPES = [
  'int', 'long', 'double', 'boolean', 'String',
  'int[]', 'long[]', 'double[]', 'boolean[]', 'String[]',
  'int[][]',
];

const NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
// words that cannot be used as a function / parameter name in at least one language
const RESERVED = new Set([
  'abstract', 'and', 'as', 'assert', 'auto', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
  'continue', 'def', 'default', 'del', 'delete', 'do', 'double', 'elif', 'else', 'enum', 'except', 'explicit',
  'export', 'extends', 'extern', 'false', 'final', 'finally', 'float', 'for', 'from', 'function', 'global', 'goto',
  'if', 'implements', 'import', 'in', 'instanceof', 'int', 'interface', 'is', 'lambda', 'let', 'long', 'main',
  'namespace', 'native', 'new', 'nonlocal', 'not', 'null', 'object', 'operator', 'or', 'out', 'override', 'package',
  'pass', 'private', 'protected', 'public', 'raise', 'ref', 'register', 'return', 'self', 'short', 'signed',
  'sizeof', 'static', 'string', 'struct', 'super', 'switch', 'synchronized', 'template', 'this', 'throw', 'throws',
  'transient', 'true', 'try', 'typedef', 'typeof', 'union', 'unsigned', 'using', 'var', 'virtual', 'void',
  'volatile', 'while', 'with', 'yield',
  // more keywords from C#, C++ and JavaScript
  'alignas', 'alignof', 'arguments', 'asm', 'await', 'base', 'bitand', 'bitor', 'checked', 'compl', 'concept',
  'constexpr', 'decimal', 'decltype', 'delegate', 'dynamic_cast', 'eval', 'event', 'fixed', 'foreach', 'friend',
  'implicit', 'inline', 'internal', 'lock', 'mutable', 'noexcept', 'nullptr', 'params', 'readonly', 'reinterpret_cast',
  'requires', 'sbyte', 'sealed', 'stackalloc', 'static_assert', 'static_cast', 'strictfp', 'thread_local', 'typeid',
  'typename', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort', 'wchar_t', 'xor', 'const_cast',
  // names of C library functions (a function with the same name would not compile in C)
  'abs', 'atof', 'atoi', 'calloc', 'ceil', 'clock', 'cos', 'exit', 'exp', 'fabs', 'floor', 'free', 'getchar', 'index',
  'labs', 'log', 'malloc', 'memcpy', 'memset', 'pow', 'printf', 'putchar', 'puts', 'qsort', 'rand', 'realloc', 'remove',
  'rename', 'scanf', 'signal', 'sin', 'sqrt', 'srand', 'strcat', 'strcmp', 'strcpy', 'strlen', 'system', 'tan', 'time',
  'returnSize', 'returnColumnSizes',
]);

const isMatrix = (t) => t.endsWith('[][]');
const isArray = (t) => t.endsWith('[]') && !isMatrix(t);
const elemOf = (t) => (isMatrix(t) ? t.slice(0, -4) : isArray(t) ? t.slice(0, -2) : t);

// Marker the hidden driver prints just before the returned value
const MARK = '@@RESULT@@';

// ---------------------------------------------------------------------------
// 2. VALIDATING WHAT THE ADMIN SAVES
// ---------------------------------------------------------------------------
function validateSignature({ functionName, returnType, params }) {
  if (!NAME_RE.test(functionName || '')) return 'Function name must be letters, digits and _ (and not start with a digit).';
  if (RESERVED.has(functionName)) return `"${functionName}" cannot be used as a function name.`;
  if (!TYPES.includes(returnType)) return 'Choose a valid return type.';
  if (!Array.isArray(params)) return 'Parameters are missing.';
  const seen = new Set();
  for (const p of params) {
    if (!NAME_RE.test(p.name || '')) return `Parameter name "${p.name || ''}" is not valid.`;
    if (RESERVED.has(p.name)) return `"${p.name}" cannot be used as a parameter name.`;
    if (seen.has(p.name)) return `Parameter name "${p.name}" is used twice.`;
    seen.add(p.name);
    if (!TYPES.includes(p.type)) return `Parameter "${p.name}" needs a valid type.`;
  }
  // In C every array parameter gets an extra "<name>Size" parameter (and "<name>ColSize" for 2D arrays).
  // Those extra names must not collide with another parameter.
  for (const p of params) {
    const extra = [];
    if (isArray(p.type) || isMatrix(p.type)) extra.push(p.name + 'Size');
    if (isMatrix(p.type)) extra.push(p.name + 'ColSize');
    for (const e of extra) {
      if (seen.has(e)) return `Parameter names "${p.name}" and "${e}" clash (the C version adds "${e}" automatically). Rename one of them.`;
    }
  }
  return null;
}

// Checks every test case can be converted. Returns an error message or null.
function validateTestCases(problem) {
  const types = problem.params.map((p) => p.type);
  for (let i = 0; i < problem.testCases.length; i++) {
    const t = problem.testCases[i];
    try { buildStdin(t.input, types); }
    catch (e) { return `Test case ${i + 1} input: ${e.message}`; }
    try { parseExpected(t.expectedOutput, problem.returnType); }
    catch (e) { return `Test case ${i + 1} expected output: ${e.message}`; }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 3. TEST INPUT TEXT  ->  tokens the hidden driver can read
//
// The admin may write the input any of these ways (one value per parameter, in order):
//     [2,7,11,15]            nums = [2,7,11,15]           [2,7,11,15], 9
//     9                      target = 9
// Strings should be written in "quotes".
// The driver itself reads a simple token stream, so we convert here:
//     int/long/double/boolean -> the value
//     String                  -> "x" + hex of its UTF-8 bytes   (so spaces/quotes never matter)
//     arrays                  -> count, then the items
//     int[][]                 -> row count, then for each row: count + items
// ---------------------------------------------------------------------------
function splitTop(s) {
  const parts = [];
  let depth = 0, inStr = false, start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) { if (c === '\\') i++; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '[') depth++;
    else if (c === ']') depth--;
    else if (c === ',' && depth === 0) { parts.push(s.slice(start, i)); start = i + 1; }
  }
  parts.push(s.slice(start));
  return parts.map((x) => x.trim());
}

// reads ONE value starting at position i; returns [rawText, nextIndex]
function readValue(s, i, type) {
  const ch = s[i];
  if (ch === '[') {
    let depth = 0, inStr = false, j = i;
    for (; j < s.length; j++) {
      const c = s[j];
      if (inStr) { if (c === '\\') j++; else if (c === '"') inStr = false; continue; }
      if (c === '"') inStr = true;
      else if (c === '[') depth++;
      else if (c === ']') { depth--; if (depth === 0) { j++; break; } }
    }
    if (depth !== 0) throw new Error('a [ is never closed');
    return [s.slice(i, j), j];
  }
  if (ch === '"') {
    let j = i + 1;
    for (; j < s.length; j++) {
      if (s[j] === '\\') { j++; continue; }
      if (s[j] === '"') break;
    }
    if (j >= s.length) throw new Error('a " is never closed');
    return [s.slice(i, j + 1), j + 1];
  }
  if (type === 'String') { // unquoted text: take the rest of the line
    let j = s.indexOf('\n', i);
    if (j === -1) j = s.length;
    return [s.slice(i, j), j];
  }
  let j = i;
  while (j < s.length && !/[\s,]/.test(s[j])) j++;
  return [s.slice(i, j), j];
}

const INT_MIN = -(2n ** 31n), INT_MAX = 2n ** 31n - 1n;
const LONG_MIN = -(2n ** 63n), LONG_MAX = 2n ** 63n - 1n;

function encodeScalar(raw, type) {
  const t = String(raw).trim();
  switch (type) {
    case 'int': {
      if (!/^[+-]?\d+$/.test(t)) throw new Error(`"${t}" is not an int`);
      const n = BigInt(t);
      if (n < INT_MIN || n > INT_MAX) throw new Error(`${t} does not fit in an int (use long)`);
      return String(n);
    }
    case 'long': {
      if (!/^[+-]?\d+$/.test(t)) throw new Error(`"${t}" is not a long`);
      const n = BigInt(t);
      if (n < LONG_MIN || n > LONG_MAX) throw new Error(`${t} does not fit in a long`);
      return String(n);
    }
    case 'double':
      if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)) throw new Error(`"${t}" is not a number`);
      return t.replace(/^\+/, '');
    case 'boolean':
      if (!/^(true|false)$/i.test(t)) throw new Error(`"${t}" is not true/false`);
      return t.toLowerCase();
    case 'String': {
      let v = t;
      if (t.startsWith('"')) {
        try { v = JSON.parse(t); } catch (e) { throw new Error(`${t} is not a valid quoted string`); }
      }
      return 'x' + Buffer.from(v, 'utf8').toString('hex');
    }
    default:
      throw new Error('unsupported type ' + type);
  }
}

function listItems(raw, what) {
  const t = String(raw).trim();
  if (!(t.startsWith('[') && t.endsWith(']'))) throw new Error(`expected ${what} like [1,2,3] but found "${t}"`);
  const inner = t.slice(1, -1).trim();
  return inner === '' ? [] : splitTop(inner);
}

function encodeValue(raw, type) {
  if (isMatrix(type)) {
    const rows = listItems(raw, 'a 2D array');
    const el = elemOf(type);
    return [String(rows.length), ...rows.map((r) => {
      const items = listItems(r, 'a row like [1,2]');
      return [String(items.length), ...items.map((x) => encodeScalar(x, el))].join(' ');
    })].join(' ');
  }
  if (isArray(type)) {
    const items = listItems(raw, 'an array');
    const el = elemOf(type);
    return [String(items.length), ...items.map((x) => encodeScalar(x, el))].join(' ');
  }
  return encodeScalar(raw, type);
}

function buildStdin(inputText, types) {
  const s = String(inputText || '').replace(/\r/g, '');
  let i = 0;
  const lines = [];
  types.forEach((type, idx) => {
    while (i < s.length && /[\s,]/.test(s[i])) i++;                  // skip spaces / commas / newlines
    const m = /^[A-Za-z_]\w*\s*=\s*/.exec(s.slice(i));                // optional "name = "
    if (m) i += m[0].length;
    if (i >= s.length) throw new Error(`expected ${types.length} value(s) but found only ${idx}`);
    const [raw, next] = readValue(s, i, type);
    i = next;
    lines.push(encodeValue(raw, type));
  });
  if (s.slice(i).replace(/[\s,]/g, '') !== '') throw new Error(`more than ${types.length} value(s) found - check the parameters`);
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// 4. EXPECTED OUTPUT / RETURNED VALUE
// ---------------------------------------------------------------------------
function shapeOk(v, type) {
  if (v === null) return !['int', 'long', 'double', 'boolean'].includes(type);
  if (isMatrix(type)) return Array.isArray(v) && v.every((r) => shapeOk(r, 'int[]'));
  if (isArray(type)) return Array.isArray(v) && v.every((x) => shapeOk(x, elemOf(type)));
  switch (type) {
    case 'int': case 'long': return Number.isInteger(v);
    case 'double': return typeof v === 'number';
    case 'boolean': return typeof v === 'boolean';
    case 'String': return typeof v === 'string';
    default: return false;
  }
}

// Expected output text written by the admin -> JS value
function parseExpected(text, type) {
  const t = String(text === undefined || text === null ? '' : text).trim();
  if (type === 'String') {
    if (t.startsWith('"')) { try { return JSON.parse(t); } catch (e) { /* fall through: treat as raw text */ } }
    return t;
  }
  let v;
  try { v = JSON.parse(t); } catch (e) { throw new Error(`"${t}" is not a valid ${type} value (example: ${EXAMPLES[type]})`); }
  if (!shapeOk(v, type)) throw new Error(`"${t}" does not look like a ${type} (example: ${EXAMPLES[type]})`);
  return v;
}
const EXAMPLES = {
  int: '5', long: '5', double: '2.5', boolean: 'true', String: 'hello',
  'int[]': '[0,1]', 'long[]': '[0,1]', 'double[]': '[0.5,1.5]', 'boolean[]': '[true,false]',
  'String[]': '["a","b"]', 'int[][]': '[[1,2],[3,4]]',
};

// The driver prints "@@RESULT@@ tokens..." as the very last thing. Everything printed before it
// by the student's own code is returned separately as `printed`.
function readResult(stdout, type) {
  const idx = stdout.lastIndexOf(MARK);
  if (idx === -1) return { found: false, printed: stdout };
  const printed = stdout.slice(0, idx).replace(/\n$/, '');
  const tk = stdout.slice(idx + MARK.length).trim().split(/\s+/).filter(Boolean);
  let pos = 0;
  const next = () => { if (pos >= tk.length) throw new Error('result is incomplete'); return tk[pos++]; };
  const scalar = (el) => {
    const t = next();
    switch (el) {
      case 'int': case 'long': case 'double': { const n = Number(t); return n; }
      case 'boolean': return t === 'true';
      case 'String': return Buffer.from(t.slice(1), 'hex').toString('utf8');
      default: throw new Error('unsupported type');
    }
  };
  try {
    if (tk[0] === 'null') return { found: true, printed, value: null };
    let value;
    if (isMatrix(type)) {
      const r = parseInt(next(), 10);
      value = [];
      for (let i = 0; i < r; i++) {
        const c = parseInt(next(), 10);
        const row = [];
        for (let j = 0; j < c; j++) row.push(scalar(elemOf(type)));
        value.push(row);
      }
    } else if (isArray(type)) {
      const n = parseInt(next(), 10);
      value = [];
      for (let i = 0; i < n; i++) value.push(scalar(elemOf(type)));
    } else {
      value = scalar(type);
    }
    return { found: true, printed, value };
  } catch (e) {
    return { found: true, printed, error: e.message };
  }
}

// doubles are compared with a small tolerance, everything else must match exactly
function same(a, b, tol) {
  if (typeof a === 'number' && typeof b === 'number') {
    if (a === b) return true;
    if (!tol || !Number.isFinite(a) || !Number.isFinite(b)) return false;
    return Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
  }
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => same(x, b[i], tol));
  return a === b;
}
const valuesMatch = (actual, expected, type) => same(actual, expected, elemOf(type) === 'double');

// How a value is shown to the student ("Your output")
const display = (v) => (typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v));

// ---------------------------------------------------------------------------
// 5. TYPE NAMES IN EACH LANGUAGE (Java, Python, JavaScript)
// ---------------------------------------------------------------------------
const JAVA_T = {
  int: 'int', long: 'long', double: 'double', boolean: 'boolean', String: 'String',
  'int[]': 'int[]', 'long[]': 'long[]', 'double[]': 'double[]', 'boolean[]': 'boolean[]', 'String[]': 'String[]',
  'int[][]': 'int[][]',
};
const PY_T = {
  int: 'int', long: 'int', double: 'float', boolean: 'bool', String: 'str',
  'int[]': 'List[int]', 'long[]': 'List[int]', 'double[]': 'List[float]', 'boolean[]': 'List[bool]',
  'String[]': 'List[str]', 'int[][]': 'List[List[int]]',
};
const JS_T = {
  int: 'number', long: 'number', double: 'number', boolean: 'boolean', String: 'string',
  'int[]': 'number[]', 'long[]': 'number[]', 'double[]': 'number[]', 'boolean[]': 'boolean[]',
  'String[]': 'string[]', 'int[][]': 'number[][]',
};
// the only languages students can use
const FUNCTION_LANGS = ['java', 'python', 'javascript'];

// ---------------------------------------------------------------------------
// 6. STARTER CODE SHOWN TO THE STUDENT (generated from the signature)
// ---------------------------------------------------------------------------
function starterCode(p) {
  const ps = p.params;
  const fn = p.functionName;
  const ret = p.returnType;
  return {
    java: [
      'import java.util.*;',
      '',
      'class Solution {',
      `    public ${JAVA_T[ret]} ${fn}(${ps.map((x) => `${JAVA_T[x.type]} ${x.name}`).join(', ')}) {`,
      '        // write your code here',
      '        ',
      '    }',
      '}',
      '',
    ].join('\n'),

    python: [
      'class Solution:',
      `    def ${fn}(${['self', ...ps.map((x) => x.name)].join(', ')}):`,
      ...(ps.length ? [`        # ${ps.map((x) => `${x.name}: ${PY_T[x.type]}`).join(', ')}`] : []),
      `        # return: ${PY_T[ret]}`,
      '        pass',
      '',
    ].join('\n'),

    javascript: [
      '/**',
      ...ps.map((x) => ` * @param {${JS_T[x.type]}} ${x.name}`),
      ` * @return {${JS_T[ret]}}`,
      ' */',
      `var ${fn} = function(${ps.map((x) => x.name).join(', ')}) {`,
      '    // write your code here',
      '    ',
      '};',
      '',
    ].join('\n'),

  };
}

// ---------------------------------------------------------------------------
// 7. HIDDEN DRIVERS  (appended after the student's code; they read the tokens,
//    call the student's method and print the result after the marker)
//    All helper names start with "jx_" so they never clash with student code.
// ---------------------------------------------------------------------------

// ----- Java -----
function javaDriver(p) {
  const reads = p.params.map((x, i) => {
    const t = x.type;
    const expr = {
      int: 'Integer.parseInt(jx_next())', long: 'Long.parseLong(jx_next())', double: 'Double.parseDouble(jx_next())',
      boolean: 'Boolean.parseBoolean(jx_next())', String: 'jx_str(jx_next())',
      'int[]': 'jx_ints()', 'long[]': 'jx_longs()', 'double[]': 'jx_doubles()', 'boolean[]': 'jx_bools()',
      'String[]': 'jx_strs()', 'int[][]': 'jx_matrix()',
    }[t];
    return `        ${JAVA_T[t]} a${i} = ${expr};`;
  }).join('\n');
  const args = p.params.map((x, i) => `a${i}`).join(', ');

  return String.raw`
public class Main {
    static java.util.StringTokenizer jx_tk;
    static String jx_next() { return jx_tk.nextToken(); }
    static String jx_str(String t) {
        byte[] b = new byte[(t.length() - 1) / 2];
        for (int i = 0; i < b.length; i++) b[i] = (byte) Integer.parseInt(t.substring(1 + 2 * i, 3 + 2 * i), 16);
        return new String(b, java.nio.charset.StandardCharsets.UTF_8);
    }
    static String jx_hex(String s) {
        StringBuilder sb = new StringBuilder("x");
        for (byte x : s.getBytes(java.nio.charset.StandardCharsets.UTF_8)) sb.append(String.format("%02x", x & 0xff));
        return sb.toString();
    }
    static int[] jx_ints() { int n = Integer.parseInt(jx_next()); int[] a = new int[n]; for (int i = 0; i < n; i++) a[i] = Integer.parseInt(jx_next()); return a; }
    static long[] jx_longs() { int n = Integer.parseInt(jx_next()); long[] a = new long[n]; for (int i = 0; i < n; i++) a[i] = Long.parseLong(jx_next()); return a; }
    static double[] jx_doubles() { int n = Integer.parseInt(jx_next()); double[] a = new double[n]; for (int i = 0; i < n; i++) a[i] = Double.parseDouble(jx_next()); return a; }
    static boolean[] jx_bools() { int n = Integer.parseInt(jx_next()); boolean[] a = new boolean[n]; for (int i = 0; i < n; i++) a[i] = Boolean.parseBoolean(jx_next()); return a; }
    static String[] jx_strs() { int n = Integer.parseInt(jx_next()); String[] a = new String[n]; for (int i = 0; i < n; i++) a[i] = jx_str(jx_next()); return a; }
    static int[][] jx_matrix() { int r = Integer.parseInt(jx_next()); int[][] m = new int[r][]; for (int i = 0; i < r; i++) m[i] = jx_ints(); return m; }

    static void jx_w(StringBuilder o, int v) { o.append(' ').append(v); }
    static void jx_w(StringBuilder o, long v) { o.append(' ').append(v); }
    static void jx_w(StringBuilder o, double v) { o.append(' ').append(v); }
    static void jx_w(StringBuilder o, boolean v) { o.append(v ? " true" : " false"); }
    static void jx_w(StringBuilder o, String v) { if (v == null) o.append(" null"); else o.append(' ').append(jx_hex(v)); }
    static void jx_w(StringBuilder o, int[] v) { if (v == null) { o.append(" null"); return; } o.append(' ').append(v.length); for (int x : v) o.append(' ').append(x); }
    static void jx_w(StringBuilder o, long[] v) { if (v == null) { o.append(" null"); return; } o.append(' ').append(v.length); for (long x : v) o.append(' ').append(x); }
    static void jx_w(StringBuilder o, double[] v) { if (v == null) { o.append(" null"); return; } o.append(' ').append(v.length); for (double x : v) o.append(' ').append(x); }
    static void jx_w(StringBuilder o, boolean[] v) { if (v == null) { o.append(" null"); return; } o.append(' ').append(v.length); for (boolean x : v) o.append(x ? " true" : " false"); }
    static void jx_w(StringBuilder o, String[] v) { if (v == null) { o.append(" null"); return; } o.append(' ').append(v.length); for (String x : v) jx_w(o, x); }
    static void jx_w(StringBuilder o, int[][] v) { if (v == null) { o.append(" null"); return; } o.append(' ').append(v.length); for (int[] r : v) jx_w(o, r); }

    public static void main(String[] args) throws Exception {
        java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
        StringBuilder all = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) all.append(line).append(' ');
        jx_tk = new java.util.StringTokenizer(all.toString());
${reads}
        ${JAVA_T[p.returnType]} res = new Solution().${p.functionName}(${args});
        StringBuilder out = new StringBuilder("\n${MARK}");
        jx_w(out, res);
        System.out.println(out);
    }
}
`;
}

// ----- Python -----
function pythonDriver(p) {
  const reads = p.params.map((x, i) => {
    const expr = {
      int: 'int(jx_next())', long: 'int(jx_next())', double: 'float(jx_next())',
      boolean: "jx_next() == 'true'", String: 'jx_str(jx_next())',
      'int[]': 'jx_arr(int)', 'long[]': 'jx_arr(int)', 'double[]': 'jx_arr(float)',
      'boolean[]': "jx_arr(lambda t: t == 'true')", 'String[]': 'jx_arr(jx_str)', 'int[][]': 'jx_matrix()',
    }[x.type];
    return `jx_a${i} = ${expr}`;
  }).join('\n');
  const args = p.params.map((x, i) => `jx_a${i}`).join(', ');

  const toks = {
    int: '[str(jx_res)]', long: '[str(jx_res)]', double: '[repr(float(jx_res))]',
    boolean: "['true' if jx_res else 'false']", String: '[jx_hex(str(jx_res))]',
    'int[]': '[str(len(jx_res))] + [str(v) for v in jx_res]',
    'long[]': '[str(len(jx_res))] + [str(v) for v in jx_res]',
    'double[]': '[str(len(jx_res))] + [repr(float(v)) for v in jx_res]',
    'boolean[]': "[str(len(jx_res))] + ['true' if v else 'false' for v in jx_res]",
    'String[]': '[str(len(jx_res))] + [jx_hex(str(v)) for v in jx_res]',
    'int[][]': '[str(len(jx_res))] + [t for row in jx_res for t in ([str(len(row))] + [str(v) for v in row])]',
  }[p.returnType];

  return String.raw`
import sys as jx_sys
jx_tok = jx_sys.stdin.read().split()
jx_pos = 0
def jx_next():
    global jx_pos
    jx_pos += 1
    return jx_tok[jx_pos - 1]
def jx_str(t):
    return bytes.fromhex(t[1:]).decode('utf-8')
def jx_hex(s):
    return 'x' + s.encode('utf-8').hex()
def jx_arr(conv):
    n = int(jx_next())
    return [conv(jx_next()) for _ in range(n)]
def jx_matrix():
    r = int(jx_next())
    return [jx_arr(int) for _ in range(r)]

${reads}
jx_res = Solution().${p.functionName}(${args})
jx_parts = ['null'] if jx_res is None else ${toks}
jx_sys.stdout.write("\n${MARK} " + " ".join(jx_parts) + "\n")
`;
}

// ----- JavaScript -----
function jsDriver(p) {
  const reads = p.params.map((x, i) => {
    const expr = {
      int: 'Number(jx_next())', long: 'Number(jx_next())', double: 'Number(jx_next())',
      boolean: "jx_next() === 'true'", String: 'jx_str(jx_next())',
      'int[]': 'jx_arr(Number)', 'long[]': 'jx_arr(Number)', 'double[]': 'jx_arr(Number)',
      'boolean[]': "jx_arr((t) => t === 'true')", 'String[]': 'jx_arr(jx_str)', 'int[][]': 'jx_matrix()',
    }[x.type];
    return `const jx_a${i} = ${expr};`;
  }).join('\n');
  const args = p.params.map((x, i) => `jx_a${i}`).join(', ');

  const toks = {
    int: '[String(jx_res)]', long: '[String(jx_res)]', double: '[String(jx_res)]',
    boolean: "[jx_res ? 'true' : 'false']", String: '[jx_hex(jx_res)]',
    'int[]': '[String(jx_res.length)].concat(jx_res.map(String))',
    'long[]': '[String(jx_res.length)].concat(jx_res.map(String))',
    'double[]': '[String(jx_res.length)].concat(jx_res.map(String))',
    'boolean[]': "[String(jx_res.length)].concat(jx_res.map((v) => (v ? 'true' : 'false')))",
    'String[]': '[String(jx_res.length)].concat(jx_res.map((v) => jx_hex(v)))',
    'int[][]': '[String(jx_res.length)].concat(...jx_res.map((r) => [String(r.length)].concat(r.map(String))))',
  }[p.returnType];

  return String.raw`
const jx_tok = require('fs').readFileSync(0, 'utf8').split(/\s+/).filter(Boolean);
let jx_pos = 0;
const jx_next = () => jx_tok[jx_pos++];
const jx_str = (t) => Buffer.from(t.slice(1), 'hex').toString('utf8');
const jx_hex = (s) => 'x' + Buffer.from(String(s), 'utf8').toString('hex');
const jx_arr = (conv) => { const n = parseInt(jx_next(), 10); const a = []; for (let i = 0; i < n; i++) a.push(conv(jx_next())); return a; };
const jx_matrix = () => { const r = parseInt(jx_next(), 10); const m = []; for (let i = 0; i < r; i++) m.push(jx_arr(Number)); return m; };

${reads}
const jx_res = ${p.functionName}(${args});
const jx_parts = (jx_res === null || jx_res === undefined) ? ['null'] : ${toks};
process.stdout.write("\n${MARK} " + jx_parts.join(' ') + "\n");
`;
}

// ---------------------------------------------------------------------------
// 8. FINAL SOURCE SENT TO JUDGE0  =  student's code + hidden driver
// ---------------------------------------------------------------------------
function buildSource(language, userCode, p) {
  const code = String(userCode || '');
  switch (language) {
    case 'java':
      // a public class must live in its own file, so quietly make "public class Solution" a normal class
      return code.replace(/\bpublic\s+class\s+Solution\b/, 'class Solution') + '\n' + javaDriver(p);
    case 'python': return code + '\n' + pythonDriver(p);
    case 'javascript': return code + '\n' + jsDriver(p);
    default: throw new Error('This language is not available for function-style questions.');
  }
}

// plain-object copy of the function settings of a Problem document
const specOf = (problem) => ({
  functionName: problem.functionName,
  returnType: problem.returnType,
  params: Array.from(problem.params || []).map((x) => ({ name: x.name, type: x.type })),
});

module.exports = {
  TYPES, FUNCTION_LANGS, MARK,
  validateSignature, validateTestCases,
  buildStdin, parseExpected, readResult, valuesMatch, display,
  starterCode, buildSource, specOf,
};