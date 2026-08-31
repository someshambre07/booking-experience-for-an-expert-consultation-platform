import {
  Check,
  CheckCircle2,
  Download,
  FileCode,
  FolderArchive,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';
import React, { useState } from 'react';

interface ZipDownloadModalProps {
  onClose: () => void;
}

export const ZipDownloadModal: React.FC<ZipDownloadModalProps> = ({ onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    const link = document.createElement('a');
    link.href = '/api/download-zip';
    link.setAttribute('download', 'consult-expert-booking-project.zip');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <FolderArchive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Export Project ZIP Archive
              </h3>
              <p className="text-xs text-slate-500">
                Complete Full-Stack Application Package
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="my-5 space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            This archive includes the complete source code, backend API, unit test harness, and architecture documentation:
          </p>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 text-xs space-y-2 font-mono text-slate-700">
            <div className="flex items-center gap-2">
              <FileCode className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <span>/backend/ — Express API, in-memory store, seed generator</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCode className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <span>/backend/tests/ — Concurrency race-condition &amp; edge case tests</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCode className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <span>/src/ — Booking screen, History page, Live filters &amp; Calendar .ICS</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCode className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <span>DECISIONS.md — Full architectural breakdown and edge cases</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCode className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <span>package.json, tsconfig.json, server.ts, vite.config.ts</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Close
          </button>

          <button
            type="button"
            disabled={downloading}
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Preparing ZIP...</span>
              </>
            ) : downloaded ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download .ZIP Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
