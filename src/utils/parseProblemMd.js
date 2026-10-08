

const LANG_ALIASES = {
  java: 'java',
  python: 'python',
  python3: 'python',
  py: 'python',
  javascript: 'javascript',
  js: 'javascript',
  node: 'javascript',
  'c++': 'cpp',
  cpp: 'cpp',
  c: 'c',
  'c#': 'csharp',
  csharp: 'csharp',
  cs: 'csharp',
};
const langId = (s) => LANG_ALIASES[(s || '').trim().toLowerCase()] || null;
// the only languages students can use
const ALLOWED_LANGS = ['java', 'python', 'javascript'];


const FENCE = /^\s*(?:```+|~~~+)\s*(\S*)/;

// Used to recover when an author forgets to close a code fence.
const KNOWN_H2 =
  /^##\s+(problem statement|statement|description|difficulty|points|marks|time limit|memory limit|test cases?|starter code|constraints|examples?)\s*$/i;
const LANG_H3 = /^###\s+(java|python|py|javascript|js|c\+\+|cpp|c|c#|csharp)\s*$/i;
const STARTER_RE = /starter|boilerplate|template/i;

// ---- function signature helpers ----
const TYPE_ALIASES = {
  int: 'int', integer: 'int', long: 'long', double: 'double', float: 'double',
  boolean: 'boolean', bool: 'boolean', string: 'String',
  'int[]': 'int[]', 'long[]': 'long[]', 'double[]': 'double[]', 'boolean[]': 'boolean[]', 'bool[]': 'boolean[]',
  'string[]': 'String[]', 'int[][]': 'int[][]',
};
const normType = (t) => TYPE_ALIASES[(t || '').replace(/[`\s]/g, '').toLowerCase()] || null;

/** Reads:   Name: twoSum / Returns: int[] / Parameters: / - nums: int[] / - target: int */
function parseSignature(lines, warnings) {
  const out = { mode: 'function', functionName: '', returnType: '', params: [] };
  let inParams = false;
  for (const raw of lines) {
    const t = raw.replace(/^\s*[-*]\s*/, '').replace(/`/g, '').trim();
    if (!t) continue;
    let m;
    if (/^param(eter)?s\s*:?\s*$/i.test(t)) { inParams = true; continue; }
    if (!inParams && (m = t.match(/^(?:name|function|method)\s*:\s*(.+)$/i))) {
      out.functionName = m[1].replace(/[()\s]/g, '');
      continue;
    }
    if (!inParams && (m = t.match(/^(?:returns?|return type)\s*:\s*(.+)$/i))) {
      const ty = normType(m[1]);
      if (ty) out.returnType = ty;
      else warnings.push(`Return type "${m[1].trim()}" is not supported.`);
      continue;
    }
    if (inParams) {
      let name = '', type = '';
      if ((m = t.match(/^(\w+)\s*:\s*(\S+)$/))) { name = m[1]; type = m[2]; }
      else if ((m = t.match(/^(\S+)\s+(\w+)$/))) { type = m[1]; name = m[2]; }
      else { warnings.push(`Could not read parameter line "${t}" (use "- name: type").`); continue; }
      const ty = normType(type);
      if (!ty) { warnings.push(`Type "${type}" of parameter "${name}" is not supported.`); continue; }
      out.params.push({ name, type: ty });
    }
  }
  if (!out.functionName) warnings.push('Function Signature needs a "Name:" line.');
  if (!out.returnType) warnings.push('Function Signature needs a "Returns:" line.');
  return out;
}

const trimBlock = (s) => s.replace(/^\n+|\s+$/g, '');
const firstLine = (lines) => (lines.find((l) => l.trim()) || '').trim();
const cleanText = (lines) => lines.join('\n').trim();

/** Split the file into: title (# ...), sections (## ...), and sub-sections (### ...). */
function splitSections(md) {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  let title = '';
  let inFence = false;
  let cur = null;
  let sub = null;
  const sections = [];

  for (const line of lines) {
    const isFence = FENCE.test(line);

    // An unclosed code fence would swallow the rest of the file; close it when
    // we clearly reach the next known section / language heading.
    if (
      inFence &&
      !isFence &&
      (KNOWN_H2.test(line) || (cur && STARTER_RE.test(cur.name) && LANG_H3.test(line)))
    ) {
      inFence = false;
    }

    if (!inFence && !isFence) {
      let m;
      if (!title && !cur && (m = line.match(/^#\s+(.+?)\s*$/))) {
        title = m[1].trim();
        continue;
      }
      if ((m = line.match(/^##\s+(.+?)\s*$/))) {
        cur = { name: m[1].trim(), raw: [], subs: [] };
        sub = null;
        sections.push(cur);
        continue;
      }
      if (cur && (m = line.match(/^###\s+(.+?)\s*$/))) {
        sub = { name: m[1].trim(), body: [] };
        cur.subs.push(sub);
        cur.raw.push(line); // keep sub-headings inside the section's raw text
        continue;
      }
    }

    if (isFence) inFence = !inFence;
    if (cur) {
      cur.raw.push(line);
      if (sub) sub.body.push(line);
    }
  }
  return { title, sections };
}

/** All fenced code blocks in a set of lines. */
function fencedBlocks(lines) {
  const blocks = [];
  let open = null;
  for (const l of lines) {
    const m = l.match(FENCE);
    if (m) {
      if (open) {
        blocks.push(open);
        open = null;
      } else {
        open = { lang: m[1], code: [] };
      }
      continue;
    }
    if (open) open.code.push(l);
  }
  if (open) blocks.push(open); // unclosed fence: keep what we have
  return blocks.map((b) => ({ lang: b.lang, code: trimBlock(b.code.join('\n')) }));
}

/** First fenced block if there is one, otherwise the plain text. */
function codeFrom(lines) {
  const blocks = fencedBlocks(lines);
  return blocks.length ? blocks[0].code : trimBlock(lines.join('\n'));
}

/** Reads "Input:" / "Output:" (plain or **bold**) from one "### Test Case N" block. */
function parseTestCase(sub, index) {
  const buf = { input: [], output: [] };
  let mode = null;

  for (const raw of sub.body) {
    if (FENCE.test(raw)) continue;  
    const stripped = raw.replace(/\*\*|__/g, '');
    const m = stripped.match(/^\s*(input|expected output|expected|output)\s*:\s*(.*)$/i);
    if (m) {
      mode = m[1].toLowerCase() === 'input' ? 'input' : 'output';
      if (m[2].trim()) buf[mode].push(m[2]);
      continue;
    }
    if (mode) buf[mode].push(raw);
  }

  const input = buf.input.join('\n').trim();
  const expectedOutput = buf.output.join('\n').trim();
  if (!input || !expectedOutput) return null;

  // "### Test Case 3 (hidden)" -> hidden, "### Sample 1" -> visible, default: only the first is visible
  const isSample = /hidden/i.test(sub.name) ? false : /sample|example/i.test(sub.name) ? true : index === 0;
  return { input, expectedOutput, isSample };
}

export function parseProblemMd(md, fallbackTitle = 'Untitled Question') {
  const { title, sections } = splitSections(md);
  const warnings = [];
  const result = {
    title: title || fallbackTitle,
    difficulty: 'Easy',
    points: 100,
    timeLimit: 2,
    statementMd: '',
    testCases: [],
    starterCode: {},
    mode: 'stdin',
    functionName: '',
    returnType: 'int',
    params: [],
  };

  if (!title) warnings.push('No "# Title" heading found - using the file name.');

  let statement = '';
  const extras = []; // unknown sections (Constraints, Examples...) are appended to the statement

  for (const s of sections) {
    const name = s.name.toLowerCase().replace(/[:*_`]/g, '').trim();

    if (/^(problem\s*statement|statement|description|problem)$/.test(name)) {
      statement = cleanText(s.raw);
    } else if (name === 'difficulty') {
      const d = firstLine(s.raw).toLowerCase();
      if (/hard/.test(d)) result.difficulty = 'Hard';
      else if (/med/.test(d)) result.difficulty = 'Medium';
      else if (/easy/.test(d)) result.difficulty = 'Easy';
      else warnings.push('Difficulty not recognised - defaulted to Easy.');
    } else if (/^(points|marks|score)$/.test(name)) {
      const n = parseFloat((firstLine(s.raw).match(/\d+(\.\d+)?/) || [])[0]);
      if (n > 0) result.points = n;
      else warnings.push('Points not recognised - defaulted to 100.');
    } else if (/^time\s*limit/.test(name)) {
      const n = parseFloat((firstLine(s.raw).match(/\d+(\.\d+)?/) || [])[0]);
      if (n > 0) result.timeLimit = n;
      else warnings.push('Time limit not recognised - defaulted to 2 seconds.');
    } else if (/^(function(\s*signature)?|method(\s*signature)?)$/.test(name)) {
      Object.assign(result, parseSignature(s.raw, warnings));
    } else if (/^memory\s*limit/.test(name)) {
      // not editable in the admin form yet - ignored on purpose
    } else if (/^(test\s*cases?|tests)$/.test(name)) {
      let skipped = 0;
      s.subs.forEach((sb, i) => {
        const tc = parseTestCase(sb, i);
        if (tc) result.testCases.push(tc);
        else skipped += 1;
      });
      if (skipped) warnings.push(`${skipped} test case(s) skipped - each needs both an Input: and an Output: value.`);
    } else if (STARTER_RE.test(name)) {
      if (s.subs.length) {
        s.subs.forEach((sb) => {
          const id = langId(sb.name);
          if (!id) {
            warnings.push(`Unknown language "${sb.name}" in Starter Code - skipped.`);
            return;
          }
          if (!ALLOWED_LANGS.includes(id)) {
            warnings.push(`Starter code for ${sb.name} skipped - only Java, Python and JavaScript are available.`);
            return;
          }
          const code = codeFrom(sb.body);
          if (code) result.starterCode[id] = code;
        });
      } else {
        fencedBlocks(s.raw).forEach((b) => {
          const id = langId(b.lang);
          if (id && !ALLOWED_LANGS.includes(id)) {
            warnings.push(`Starter code for ${b.lang} skipped - only Java, Python and JavaScript are available.`);
            return;
          }
          if (id && b.code) result.starterCode[id] = b.code;
        });
      }
    } else {
      extras.push(`## ${s.name}\n\n${cleanText(s.raw)}`);
    }
  }

  result.statementMd = [statement, ...extras].filter(Boolean).join('\n\n');

  if (result.mode === 'function' && Object.keys(result.starterCode).length) {
    warnings.push('Starter Code is ignored for function questions - it is generated from the signature.');
  }
  if (!result.statementMd) warnings.push('No "## Problem Statement" section found.');
  if (!result.testCases.length) warnings.push('No valid test cases found - add them in the form before saving.');
  else if (!result.testCases.some((t) => t.isSample)) result.testCases[0].isSample = true;

  return { ...result, warnings };
}

// ---------- downloadable template for admins ----------

export const SAMPLE_MD = [
  '# Two Sum',
  '',
  '## Problem Statement',
  '',
  'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.',
  '',
  'You may assume that exactly one solution exists.',
  '',
  '### Constraints',
  '',
  '- 2 <= nums.length <= 10000',
  '',
  '## Function Signature',
  '',
  '<!-- Students write only this function. Delete this whole section for a full-program (stdin/stdout) question. -->',
  '',
  'Name: twoSum',
  'Returns: int[]',
  'Parameters:',
  '- nums: int[]',
  '- target: int',
  '',
  '## Difficulty',
  '',
  'Easy',
  '',
  '## Points',
  '',
  '10',
  '',
  '## Time Limit',
  '',
  '2',
  '',
  '## Test Cases',
  '',
  '### Test Case 1',
  '',
  'Input:',
  'nums = [2,7,11,15]',
  'target = 9',
  '',
  'Output:',
  '[0,1]',
  '',
  '### Test Case 2',
  '',
  'Input:',
  'nums = [3,2,4]',
  'target = 6',
  '',
  'Output:',
  '[1,2]',
  '',
  '### Test Case 3 (hidden)',
  '',
  'Input:',
  'nums = [3,3]',
  'target = 6',
  '',
  'Output:',
  '[0,1]',
  '',
].join('\n');

export function downloadSampleMd() {
  const url = URL.createObjectURL(new Blob([SAMPLE_MD], { type: 'text/markdown' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'two-sum.md';
  a.click();
  URL.revokeObjectURL(url);
}