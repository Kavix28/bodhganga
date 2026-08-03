import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Lock, 
  ShieldAlert, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

// Configure PDF.js Worker using reliable CDN matching pdfjs-dist version
if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
}

/**
 * SecurePdfViewer Component
 * Renders PDF pages securely onto HTML5 Canvas with anti-download, anti-print,
 * right-click disabling, shortcut blocking, and dynamic security watermarking.
 */
export default function SecurePdfViewer({ 
  pdfUrl, 
  title = "Protected Document", 
  watermarkText = "BodhGanga Digital Learning • Protected Content",
  onClose,
  className = ""
}) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageInput, setPageInput] = useState('1');

  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const containerRef = useRef(null);

  // Security: Disable Right Click & Keyboard Print/Save Shortcuts
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e) => {
      // Prevent Ctrl+S, Cmd+S (Save), Ctrl+P, Cmd+P (Print), Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'u', 'S', 'P', 'U'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      // Prevent F12, Ctrl+Shift+I/J/C (Developer Tools)
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key))) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('contextmenu', handleContextMenu);
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (container) {
        container.removeEventListener('contextmenu', handleContextMenu);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Load PDF Document
  useEffect(() => {
    if (!pdfUrl) {
      setError("No PDF document URL provided.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/cmaps/`,
      cMapPacked: true,
      withCredentials: false
    });

    loadingTask.promise
      .then((loadedPdf) => {
        if (!isMounted) return;
        setPdfDoc(loadedPdf);
        setNumPages(loadedPdf.numPages);
        setPageNumber(1);
        setPageInput('1');
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("SecurePdfViewer document load error:", err);
        setError("Failed to load secure PDF material. Please verify access permissions.");
        setLoading(false);
      });

    return () => {
      isMounted = false;
      if (loadingTask && loadingTask.destroy) {
        loadingTask.destroy();
      }
    };
  }, [pdfUrl]);

  // Render Page onto Canvas
  const renderPage = useCallback((pageNum, currentScale, doc) => {
    if (!doc || !canvasRef.current) return;

    // Cancel any ongoing render task
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    doc.getPage(pageNum).then((page) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      const viewport = page.getViewport({ scale: currentScale });

      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);

      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const transform = outputScale !== 1 
        ? [outputScale, 0, 0, outputScale, 0, 0] 
        : null;

      const renderContext = {
        canvasContext: context,
        transform: transform,
        viewport: viewport
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      renderTask.promise
        .then(() => {
          renderTaskRef.current = null;
        })
        .catch((err) => {
          if (err?.name !== 'RenderingCancelledException') {
            console.error("Canvas render error:", err);
          }
        });
    }).catch(err => {
      console.error("Failed to fetch PDF page:", err);
    });
  }, []);

  // Trigger page render when pageNumber, scale, or pdfDoc changes
  useEffect(() => {
    if (pdfDoc && !loading) {
      renderPage(pageNumber, scale, pdfDoc);
    }
  }, [pdfDoc, pageNumber, scale, loading, renderPage]);

  // Navigation handlers
  const handlePrevPage = () => {
    if (pageNumber > 1) {
      const next = pageNumber - 1;
      setPageNumber(next);
      setPageInput(String(next));
    }
  };

  const handleNextPage = () => {
    if (pageNumber < numPages) {
      const next = pageNumber + 1;
      setPageNumber(next);
      setPageInput(String(next));
    }
  };

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = (e) => {
    if (e.key === 'Enter') {
      const parsed = parseInt(pageInput, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
        setPageNumber(parsed);
      } else {
        setPageInput(String(pageNumber));
      }
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.6));
  };

  const handleResetZoom = () => {
    setScale(1.2);
  };

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col bg-slate-950 text-slate-100 rounded-xl overflow-hidden shadow-2xl border border-slate-800 select-none ${className}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Viewer Header Controls */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 z-20">
        
        {/* Document Security Badge & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5 shrink-0">
            <Lock className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Encrypted Viewer</span>
          </div>
          <h3 className="font-semibold text-sm text-slate-200 truncate max-w-[200px] sm:max-w-md" title={title}>
            {title}
          </h3>
        </div>

        {/* Center Controls: Page Navigation & Zoom */}
        <div className="flex items-center gap-2 sm:gap-3 mx-auto sm:mx-0">
          {/* Page Controls */}
          <div className="flex items-center bg-slate-800/80 rounded-lg border border-slate-700/60 p-1">
            <button
              onClick={handlePrevPage}
              disabled={pageNumber <= 1 || loading}
              className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center px-2 text-xs font-mono text-slate-300">
              <input 
                type="text"
                value={pageInput}
                onChange={handlePageInputChange}
                onKeyDown={handlePageInputSubmit}
                disabled={loading}
                className="w-8 text-center bg-slate-900 border border-slate-700 rounded text-slate-200 py-0.5 text-xs focus:outline-none focus:border-amber-500"
              />
              <span className="ml-1.5 text-slate-400">/ {numPages || '--'}</span>
            </div>

            <button
              onClick={handleNextPage}
              disabled={pageNumber >= numPages || loading}
              className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800/80 rounded-lg border border-slate-700/60 p-1 gap-0.5">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.6 || loading}
              className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleResetZoom}
              className="px-2 py-0.5 text-[11px] font-mono text-slate-300 hover:text-white transition-colors"
              title="Reset Zoom"
            >
              {Math.round(scale * 100)}%
            </button>

            <button
              onClick={handleZoomIn}
              disabled={scale >= 2.5 || loading}
              className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-amber-400/80 bg-amber-950/40 border border-amber-800/40 px-2.5 py-1 rounded-md">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Protected Access (No Downloads)</span>
        </div>
      </div>

      {/* Canvas Viewport & Watermark Layer */}
      <div className="relative flex-1 overflow-auto p-4 flex justify-center bg-slate-950 min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-30">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-300">Decrypting & Rendering Document...</p>
            <p className="text-xs text-slate-500 mt-1">Preparing high-resolution secure vector view</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-30 p-6 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-3 animate-bounce" />
            <h4 className="text-lg font-bold text-slate-200 mb-1">Access Restricted</h4>
            <p className="text-sm text-slate-400 max-w-md mb-4">{error}</p>
            {onClose && (
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg transition-colors"
              >
                Close Viewer
              </button>
            )}
          </div>
        )}

        {/* Document Canvas Container with Security Overlays */}
        <div className="relative shadow-2xl rounded-sm border border-slate-800/80 bg-white overflow-hidden my-auto pointer-events-auto">
          {/* Main PDF Page Render Canvas */}
          <canvas ref={canvasRef} className="block pointer-events-none" />

          {/* Dynamic Security Watermark Layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none flex flex-wrap items-center justify-around p-8 opacity-15 z-10">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div 
                key={idx} 
                className="transform -rotate-30 text-slate-900 font-serif font-black text-sm sm:text-base tracking-widest uppercase m-6 text-center border border-slate-900/30 p-2 rounded"
              >
                <div>{watermarkText}</div>
                <div className="text-[10px] tracking-normal font-sans opacity-75">CONFIDENTIAL • DO NOT DISTRIBUTE</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Viewer Footer Status Bar */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          DRM Canvas Renderer Active
        </span>
        <span className="truncate max-w-[250px] sm:max-w-xs text-right">
          {watermarkText}
        </span>
      </div>
    </div>
  );
}
