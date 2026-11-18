"use client";

import React, { useState } from "react";
import { History, X, Check, RotateCcw, Plus, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Version {
  id: string;
  version_number: number;
  title: string;
  content: string;
  word_count: number;
  change_summary: string | null;
  created_at: string;
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: Version[];
  currentVersion: number;
  onCreateSnapshot: (summary: string) => Promise<void>;
  onRestoreVersion: (versionId: string) => Promise<void>;
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  versions,
  currentVersion,
  onCreateSnapshot,
  onRestoreVersion,
}: VersionHistoryModalProps) {
  const [snapshotSummary, setSnapshotSummary] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotSummary.trim()) return;
    setIsCreating(true);
    try {
      await onCreateSnapshot(snapshotSummary.trim());
      setSnapshotSummary("");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!confirm("Are you sure you want to restore this version? Your current state will be preserved as a new version checkpoint.")) {
      return;
    }
    setRestoringId(versionId);
    try {
      await onRestoreVersion(versionId);
      onClose();
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-semibold text-base">Document Version History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create Snapshot Form */}
        <form onSubmit={handleCreate} className="p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            value={snapshotSummary}
            onChange={(e) => setSnapshotSummary(e.target.value)}
            placeholder="Label this checkpoint (e.g. 'Completed Literature Review draft')..."
            className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={isCreating || !snapshotSummary.trim()}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isCreating ? "Saving..." : "Take Snapshot"}</span>
          </button>
        </form>

        {/* Version List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {versions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
              No version snapshots recorded yet.
            </div>
          ) : (
            versions.map((v) => {
              const isCurrent = v.version_number === currentVersion;
              return (
                <div
                  key={v.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCurrent
                      ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono">
                          v{v.version_number}
                        </span>
                        {isCurrent && (
                          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Current Working Version
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1">
                        {v.change_summary || "Autosave checkpoint"}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDate(v.created_at)}
                        </span>
                        <span>&bull;</span>
                        <span>{v.word_count.toLocaleString()} words</span>
                      </div>
                    </div>

                    {!isCurrent && (
                      <button
                        onClick={() => handleRestore(v.id)}
                        disabled={restoringId === v.id}
                        className="px-2.5 py-1 text-xs font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1 shrink-0 transition-colors"
                        title="Restore this version"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{restoringId === v.id ? "Restoring..." : "Restore"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
