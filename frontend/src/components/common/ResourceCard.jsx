import React from 'react';
import {
  FileText,
  FileImage,
  Music,
  FileSpreadsheet,
  Presentation,
  File,
  ExternalLink,
} from 'lucide-react';

/**
 * ResourceCard — displays a single ingested file from the S3 pipeline.
 *
 * Props:
 *  - title        : human-readable title from the document
 *  - fileName     : raw filename (e.g. "notes.pdf")
 *  - fileType     : file extension from metadata (e.g. "pdf", "docx")
 *  - mimeType     : MIME type string (e.g. "application/pdf") — preferred over fileType
 *  - s3Url        : direct S3/CDN download URL
 *  - districtName : district label (name or slug)
 */
const ResourceCard = ({ title, fileName, fileType, mimeType, s3Url, districtName }) => {
  /**
   * Resolve display style from mimeType (preferred) or file extension.
   * Order of precedence: mimeType → fileType prop → inferred from fileName extension.
   */
  const getFileStyle = (mime, type, name) => {
    // 1. Try MIME type first — most reliable signal
    if (mime) {
      if (mime.startsWith('image/'))
        return {
          icon: <FileImage className="w-8 h-8 text-sky-600" />,
          bgColor: 'bg-sky-50 border-sky-100',
          badgeText: 'Image',
          badgeColor: 'bg-sky-100 text-sky-800',
        };
      if (mime.startsWith('audio/'))
        return {
          icon: <Music className="w-8 h-8 text-violet-600" />,
          bgColor: 'bg-violet-50 border-violet-100',
          badgeText: 'Audio File',
          badgeColor: 'bg-violet-100 text-violet-800',
        };
      if (mime === 'application/pdf')
        return {
          icon: <FileText className="w-8 h-8 text-rose-600" />,
          bgColor: 'bg-rose-50 border-rose-100',
          badgeText: 'PDF Document',
          badgeColor: 'bg-rose-100 text-rose-800',
        };
      if (
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mime === 'application/msword'
      )
        return {
          icon: <FileText className="w-8 h-8 text-blue-600" />,
          bgColor: 'bg-blue-50 border-blue-100',
          badgeText: 'Word Doc',
          badgeColor: 'bg-blue-100 text-blue-800',
        };
      if (
        mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mime === 'application/vnd.ms-excel'
      )
        return {
          icon: <FileSpreadsheet className="w-8 h-8 text-emerald-600" />,
          bgColor: 'bg-emerald-50 border-emerald-100',
          badgeText: 'Spreadsheet',
          badgeColor: 'bg-emerald-100 text-emerald-800',
        };
      if (
        mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        mime === 'application/vnd.ms-powerpoint'
      )
        return {
          icon: <Presentation className="w-8 h-8 text-amber-600" />,
          bgColor: 'bg-amber-50 border-amber-100',
          badgeText: 'Presentation',
          badgeColor: 'bg-amber-100 text-amber-800',
        };
    }

    // 2. Fallback to file extension
    const ext = (type || '').toLowerCase() || (name || '').split('.').pop().toLowerCase();

    switch (ext) {
      case 'pdf':
        return {
          icon: <FileText className="w-8 h-8 text-rose-600" />,
          bgColor: 'bg-rose-50 border-rose-100',
          badgeText: 'PDF Document',
          badgeColor: 'bg-rose-100 text-rose-800',
        };
      case 'docx':
      case 'doc':
        return {
          icon: <FileText className="w-8 h-8 text-blue-600" />,
          bgColor: 'bg-blue-50 border-blue-100',
          badgeText: 'Word Doc',
          badgeColor: 'bg-blue-100 text-blue-800',
        };
      case 'xlsx':
      case 'xls':
        return {
          icon: <FileSpreadsheet className="w-8 h-8 text-emerald-600" />,
          bgColor: 'bg-emerald-50 border-emerald-100',
          badgeText: 'Spreadsheet',
          badgeColor: 'bg-emerald-100 text-emerald-800',
        };
      case 'pptx':
      case 'ppt':
        return {
          icon: <Presentation className="w-8 h-8 text-amber-600" />,
          bgColor: 'bg-amber-50 border-amber-100',
          badgeText: 'Presentation',
          badgeColor: 'bg-amber-100 text-amber-800',
        };
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp':
        return {
          icon: <FileImage className="w-8 h-8 text-sky-600" />,
          bgColor: 'bg-sky-50 border-sky-100',
          badgeText: 'Image',
          badgeColor: 'bg-sky-100 text-sky-800',
        };
      case 'mp3':
      case 'm4a':
      case 'wav':
        return {
          icon: <Music className="w-8 h-8 text-violet-600" />,
          bgColor: 'bg-violet-50 border-violet-100',
          badgeText: 'Audio File',
          badgeColor: 'bg-violet-100 text-violet-800',
        };
      default:
        return {
          icon: <File className="w-8 h-8 text-slate-500" />,
          bgColor: 'bg-slate-50 border-slate-100',
          badgeText: 'Resource',
          badgeColor: 'bg-slate-100 text-slate-800',
        };
    }
  };

  const style = getFileStyle(mimeType, fileType, fileName);

  return (
    <div className="group bg-white rounded-2xl border border-emerald/10 hover:border-emerald/30 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
      <div className="p-5 space-y-4">
        {/* Top Header: File Icon and District Badge */}
        <div className="flex items-start justify-between">
          <div
            className={`p-3 rounded-xl ${style.bgColor} border transition-transform duration-300 group-hover:scale-105`}
          >
            {style.icon}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {districtName && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gold/10 text-gold-dark border border-gold/20 shadow-sm uppercase tracking-wider">
                {districtName}
              </span>
            )}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-semibold ${style.badgeColor}`}
            >
              {style.badgeText}
            </span>
          </div>
        </div>

        {/* Title and Filename */}
        <div className="space-y-1.5">
          <h3 className="text-[14px] font-bold text-emerald-950 font-serif leading-snug line-clamp-2 group-hover:text-emerald transition-colors duration-200">
            {title || fileName}
          </h3>
          <p className="text-[10px] text-slate-500 truncate font-mono" title={fileName}>
            {fileName}
          </p>
        </div>
      </div>

      {/* Action Area: Button to S3 Link */}
      <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex justify-end">
        <a
          href={s3Url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald to-emerald-dark text-white hover:from-gold hover:to-gold-dark text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all duration-300 hover:shadow-md active:scale-95"
        >
          <span>View / Download</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};

export default ResourceCard;
