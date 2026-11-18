"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import {
  FileText,
  Plus,
  ArrowRight,
  Trash2,
  Download,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { ExportDialog } from "@/components/editor/export-dialog";

function DocumentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [citationStyle, setCitationStyle] = useState("APA 7th");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Export dialog
  const [exportDoc, setExportDoc] = useState<any | null>(null);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await api.documents.list();
      setDocuments(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    if (searchParams.get("create") === "true") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    try {
      const doc = await api.documents.create({
        title: newTitle.trim(),
        citation_style: citationStyle,
        content: `<h1>${newTitle.trim()}</h1><p>Start drafting your research document...</p>`,
      });
      setIsCreateOpen(false);
      setNewTitle("");
      router.push(`/documents/${doc.id}`);
    } catch (err: any) {
      alert("Failed to create document: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.documents.delete(id);
      await loadDocuments();
    } catch (err: any) {
      alert("Failed to delete document: " + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Research Documents
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Draft, review, autosave, and export academic manuscripts with full version control.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Document</span>
        </button>
      </div>

      {/* Documents Grid / List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">No documents found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create your first academic document to start writing with autosave, version snapshots, and multi-format export.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm flex flex-col justify-between group transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    v{doc.current_version}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setExportDoc(doc)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded transition-colors"
                      title="Export document"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id, doc.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <Link href={`/documents/${doc.id}`} className="block mt-2">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {doc.title || "Untitled Research Document"}
                  </h3>
                </Link>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                  <span className="font-medium text-slate-600 dark:text-slate-400">{doc.citation_style}</span>
                  <span>&bull;</span>
                  <span>{doc.word_count.toLocaleString()} words</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatDate(doc.updated_at)}
                </span>
                <Link
                  href={`/documents/${doc.id}`}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>Open Editor</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Document Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">Create Research Document</h3>
            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Analysis of Neural Networks in Genomics"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Citation Standard
                </label>
                <select
                  value={citationStyle}
                  onChange={(e) => setCitationStyle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="APA 7th">APA 7th Edition</option>
                  <option value="MLA 9th">MLA 9th Edition</option>
                  <option value="Chicago 17th">Chicago 17th Edition</option>
                  <option value="Harvard">Harvard Referencing</option>
                  <option value="IEEE">IEEE Style</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  {isSubmitting ? "Creating..." : "Create & Open"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      {exportDoc && (
        <ExportDialog
          isOpen={Boolean(exportDoc)}
          onClose={() => setExportDoc(null)}
          documentId={exportDoc.id}
          documentTitle={exportDoc.title}
          citationStyle={exportDoc.citation_style || "APA 7th"}
        />
      )}
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-xs text-slate-400">Loading documents workspace...</div>}>
        <DocumentsContent />
      </Suspense>
    </AppShell>
  );
}
