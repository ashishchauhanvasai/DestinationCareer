import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FiX } from 'react-icons/fi';

const QrScannerModal = ({ onResult, onClose }) => {
  const regionId = 'qr-scan-region';
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5Qrcode(regionId);
    scannerRef.current = scanner;
    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        scanner.stop().then(() => onResult(decodedText)).catch(() => onResult(decodedText));
      },
      () => {}
    ).catch((err) => {
      alert('Could not access camera: ' + err);
      onClose();
    });
    return () => {
      if (scannerRef.current?.isScanning) scannerRef.current.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-panel rounded-[2.5rem] p-6 max-w-sm w-full shadow-2xl relative">
        <div className="flex justify-between items-center mb-5 border-b border-black/5 dark:border-white/5 pb-3">
          <p className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight">Scan QR Code</p>
          <button onClick={onClose} className="p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-colors">
            <FiX size={20} className="text-gray-500 dark:text-gray-300" />
          </button>
        </div>
        <div id={regionId} className="rounded-2xl overflow-hidden border-4 border-white/50 dark:border-slate-700/50 shadow-inner" />
        <p className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mt-5 text-center uppercase tracking-widest bg-black/5 dark:bg-white/5 py-2 rounded-lg">
          Point your camera at the QR code
        </p>
      </div>
    </div>
  );
};
export default QrScannerModal;