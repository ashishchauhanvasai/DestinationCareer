import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FiX, FiCameraOff } from 'react-icons/fi';

const QrScannerModal = ({ onResult, onClose }) => {
  const regionId = 'qr-scan-region';
  const scannerRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let isMounted = true;
    let scanner = null;

    // Small delay ensures the DOM element with `regionId` is fully painted by React
    const timer = setTimeout(() => {
      if (!isMounted) return;

      scanner = new Html5Qrcode(regionId);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: 'environment' }, // Prefers the rear camera on mobile
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (scannerRef.current) {
              scannerRef.current
                .stop()
                .then(() => onResult(decodedText))
                .catch(() => onResult(decodedText));
            }
          },
          (errorMessage) => {
            // html5-qrcode continuously throws minor frame errors while scanning; ignore them
          }
        )
        .catch((err) => {
          if (isMounted) {
            console.error('Camera initialization error:', err);
            setErrorMsg('Camera access denied or device not found.');
          }
        });
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-panel bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 max-w-sm w-full shadow-2xl relative">
        <div className="flex justify-between items-center mb-5 border-b border-gray-200 dark:border-slate-700 pb-3">
          <p className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight">Scan QR Code</p>
          <button 
            onClick={onClose} 
            className="p-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors border border-gray-200 dark:border-slate-600 shadow-sm shrink-0"
          >
            <FiX size={18} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        
        {/* Camera viewport container */}
        <div className="bg-gray-100 dark:bg-slate-800 rounded-3xl p-3 border border-gray-200 dark:border-slate-700 shadow-inner mb-5">
          {errorMsg ? (
            <div className="aspect-square w-full bg-black rounded-2xl flex flex-col items-center justify-center text-red-500 p-6 text-center border-2 border-slate-700">
              <FiCameraOff size={40} className="mb-4 opacity-80" />
              <p className="font-extrabold text-sm">{errorMsg}</p>
              <p className="text-[10px] text-gray-400 mt-2">Check browser site permissions.</p>
            </div>
          ) : (
            <div id={regionId} className="rounded-2xl overflow-hidden border-2 border-white dark:border-slate-600 shadow-sm bg-black aspect-square w-full relative" />
          )}
        </div>
        
        <p className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mt-2 text-center uppercase tracking-widest bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 py-3 rounded-[1rem] shadow-sm">
          Point your camera at the QR code
        </p>
      </div>
    </div>
  );
};

export default QrScannerModal;