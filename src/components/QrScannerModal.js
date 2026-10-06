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
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 max-w-sm w-full">
        <div className="flex justify-between items-center mb-3">
          <p className="font-bold">Scan QR Code</p>
          <button onClick={onClose} className="text-gray-400"><FiX size={22} /></button>
        </div>
        <div id={regionId} className="rounded-lg overflow-hidden" />
        <p className="text-xs text-gray-500 mt-2 text-center">Point your camera at the QR code</p>
      </div>
    </div>
  );
};
export default QrScannerModal;