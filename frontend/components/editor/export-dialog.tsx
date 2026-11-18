"use client";

import React, { useState } from "react";
import { Download, X, FileText, FileCode, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  citationStyle: string;
}

export function ExportDialog({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  citationStyle,
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<"pdf" | "docx" | "txt" | "md">("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const formats = [
    {
      id: "pdf" as const,
      name: "Adobe PDF (.pdf)",
      desc: "Standard academic formatting with title header and margins (ReportLab engine).",
      icon: FileText,
      badge: "Standard",
    },
    {
      id: "docx" as const,
      name: "Microsoft Word (.docx)",
      desc: "Formatted editable manuscript with academic 1-inch margins and line spacing.",
      icon: FileText,
      badge: "Editable",
    },
    {
      id: "md" as const,
      name: "Markdown (.md)",
      desc: "Clean structured markdown with headers, bullet points, blockquotes, and citations.",
      icon: FileCode,
      badge: "Text",
    },
    {
      id: "txt" as const,
      name: "Plain Text (.txt)",
      desc: "Universal UTF-8 text file compatible with all terminal editors and word processors.",
      icon: FileText,
      badge: "Raw",
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    try {
      const ext = selectedFormat;
      const safeName = `${documentTitle.replace(/[\\/*?:"<>|]/g, "_") || "ResearchMeta_Document"}.${ext}`;
      await api.export.download(documentId, selectedFormat, safeName);
      setExportSuccess(true);
      setTimeout(() => {
        onClose();
        setExportSuccess(false);
      }, 1200);
    } catch (err: any) {
      alert("Export failed: " + (err.message || "Server error"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-semibold text-base">Export Document</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <span>Citation Standard: <strong className="text-slate-700 dark:text-slate-300 font-mono">{citationStyle}</strong></span>
            <span>Document: <strong className="text-slate-700 dark:text-slate-300 truncate max-w-[180px] inline-block align-bottom">{documentTitle}</strong></span>
          </div>

          <div className="space-y-2">
            {formats.map((fmt) => {
              const Icon = fmt.icon;
              const isSelected = selectedFormat === fmt.id;
              return (
                <div
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs text-slate-900 dark:text-slate-100">
                        {fmt.name}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {fmt.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {fmt.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            {exportSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{isExporting ? "Generating..." : `Export ${selectedFormat.toUpperCase()}`}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
