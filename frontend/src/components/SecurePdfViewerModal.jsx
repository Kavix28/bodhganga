import React from 'react';
import { X, ShieldAlert } from 'lucide-react';
import SecurePdfViewer from './SecurePdfViewer';

/**
 * SecurePdfViewerModal Component
 * Modal wrapper for SecurePdfViewer to display PDFs safely without allowing downloads.
 */
export default function SecurePdfViewerModal({ 
  isOpen, 
  onClose, 
  pdfUrl, 
  title = "Protected Document",
  watermarkText
}) {
  if (!isOpen || !pdfUrl) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      <div className="relative w-full max-w-5xl h-[92vh] flex flex-col bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Modal Top Close Bar */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            <span className="text-xs font-semibold text-amber-400 tracking-wide uppercase">
              BodhGanga Secure Document Viewer
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center justify-center"
            title="Close Document"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Embedded Secure PDF Canvas Reader */}
        <div className="flex-1 overflow-hidden relative">
          <SecurePdfViewer
            pdfUrl={pdfUrl}
            title={title}
            watermarkText={watermarkText}
            onClose={onClose}
            className="w-full h-full rounded-none border-none"
          />
        </div>
      </div>
    </div>
  );
}
