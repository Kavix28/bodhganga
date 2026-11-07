import { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import SecurePdfViewer from "../SecurePdfViewer";
import { X, AlertCircle, RefreshCw, Lock } from "lucide-react";

const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "gif", "svg"];
const AUDIO_EXTS = ["mp3", "m4a", "wav", "aac", "ogg"];
const VIDEO_EXTS = ["mp4", "webm", "mkv"];
const OFFICE_EXTS = ["docx", "doc", "xlsx", "xls", "pptx", "ppt"];

export default function ResourceViewerModal({ resource, onClose }) {
  const [signedUrl, setSignedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const title = resource?.displayTitle || resource?.title || resource?.fileName || "Protected Document";

  // Derive file extension
  const getExtension = useCallback(() => {
    if (resource?.fileExtension) {
      return resource.fileExtension.toLowerCase().replace(".", "");
    }
    const name = resource?.fileName || resource?.originalFileName || resource?.s3Key || resource?.storageKey || "";
    const parts = name.split(".");
    if (parts.length > 1) {
      return parts.pop().toLowerCase().split("?")[0];
    }
    return "pdf";
  }, [resource]);

  const ext = getExtension();

  // Fetch or resolve secure presigned URL
  const resolveUrl = useCallback(async () => {
    if (!resource) return;

    setLoading(true);
    setError(null);

    // 1. If already presigned (contains AWS signature params), use directly
    const raw = resource.signedUrl || resource.previewUrl || resource.url || resource.s3Url;
    if (raw && (raw.includes("X-Amz-Signature") || raw.includes("X-Amz-Credential"))) {
      setSignedUrl(raw);
      setLoading(false);
      return;
    }

    // 2. Identify key for backend presigning
    let key = resource.s3Key || resource.storageKey;
    if (!key && resource.s3Url) {
      const match = resource.s3Url.match(/amazonaws\.com\/(.+)$/);
      if (match) {
        key = decodeURIComponent(match[1]);
      }
    }
    if (!key) {
      key = resource.id || resource._id;
    }

    if (!key) {
      if (raw) {
        setSignedUrl(raw);
        setLoading(false);
        return;
      }
      setError("Unable to locate document storage key.");
      setLoading(false);
      return;
    }

    // 3. Request presigned URL from backend
    try {
      const res = await api.get(`/pdf/${encodeURIComponent(key)}`);
      const url = res.url || res.data?.url || (typeof res.data === "string" ? res.data : null);
      if (url) {
        setSignedUrl(url);
      } else {
        setError("Failed to generate secure access link for this material.");
      }
    } catch (err) {
      console.error("ResourceViewerModal: Presigned URL fetch error:", err);
      if (err.response?.status === 401) {
        setError("Please login to access this material.");
      } else if (err.response?.status === 403) {
        setError("Subscription or purchase required to access this material.");
      } else {
        setError(err?.message || "Failed to secure access link from server.");
      }
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    resolveUrl();
  }, [resolveUrl]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!resource) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 select-none"
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 bg-gray-950 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-semibold text-sm truncate">{title}</h3>
              <p className="text-gray-400 text-xs">Protected BodhGanga Study Material (Read Only)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
              {ext.toUpperCase()}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-lg"
              title="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden relative bg-gray-950">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-gray-950">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-amber-400 text-sm font-semibold">Securing and preparing document…</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-950 border border-red-800 flex items-center justify-center text-red-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">Unable to open material</h4>
              <p className="text-xs text-gray-400 max-w-sm">{error}</p>
              <button
                onClick={resolveUrl}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 shadow"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          ) : ext === "pdf" ? (
            <SecurePdfViewer
              pdfUrl={signedUrl}
              title={title}
              watermarkText="BodhGanga Academy • Protected Document"
              onClose={onClose}
              className="w-full h-full rounded-none border-none"
            />
          ) : IMAGE_EXTS.includes(ext) ? (
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              <img
                src={signedUrl}
                alt={title}
                onContextMenu={(e) => e.preventDefault()}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg pointer-events-none"
              />
            </div>
          ) : AUDIO_EXTS.includes(ext) ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/30 flex items-center justify-center text-4xl shadow-xl">
                🎵
              </div>
              <p className="text-white font-semibold text-center text-sm px-4 max-w-md">{title}</p>
              <audio
                controls
                controlsList="nodownload"
                className="w-full max-w-md"
                src={signedUrl}
              >
                Your browser does not support audio playback.
              </audio>
            </div>
          ) : VIDEO_EXTS.includes(ext) ? (
            <div className="w-full h-full flex items-center justify-center bg-black p-4">
              <video
                controls
                controlsList="nodownload"
                disablePictureInPicture
                className="max-w-full max-h-full rounded-lg shadow-2xl"
                src={signedUrl}
              >
                Your browser does not support video playback.
              </video>
            </div>
          ) : OFFICE_EXTS.includes(ext) ? (
            <iframe
              src={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(signedUrl)}`}
              className="w-full h-full rounded-lg border-none"
              title={title}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-6">
              <div className="text-5xl">📎</div>
              <p className="text-gray-400 text-sm">Preview not available for this file type.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
