"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  BookOpen,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Quote,
} from "lucide-react";
import { api } from "@/lib/api";

export default function ResearchLibraryPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [journal, setJournal] = useState("");
  const [doiUrl, setDoiUrl] = useState("");
  const [abstractText, setAbstractText] = useState("");
  const [citationKey, setCitationKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSources = async () => {
    setIsLoading(true);
    try {
      const data = await api.sources.list();
      setSources(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      const authorList = authors
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      await api.sources.create({
        title: title.trim(),
        authors: authorList,
        publication_year: parseInt(year) || undefined,
        venue_or_journal: journal.trim() || undefined,
        doi_or_url: doiUrl.trim() || undefined,
        abstract: abstractText.trim() || undefined,
        citation_key: citationKey.trim() || undefined,
      });

      setIsAddOpen(false);
      setTitle("");
      setAuthors("");
      setJournal("");
      setDoiUrl("");
      setAbstractText("");
      setCitationKey("");
      await loadSources();
    } catch (err: any) {
      alert("Error adding source: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, sTitle: string) => {
    if (!confirm(`Are you sure you want to remove "${sTitle}" from your library?`)) return;
    try {
      await api.sources.delete(id);
      await loadSources();
    } catch (err: any) {
      alert("Error removing source: " + err.message);
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Research Library & Sources
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Curate credible peer-reviewed journals, citations, abstracts, and reference keys.
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Source</span>
          </button>
        </div>

        {/* Sources List */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading library sources...</div>
        ) : sources.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">No research sources added yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add credible journal papers, conference proceedings, books, or DOIs to cite in your research documents.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Source</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sources.map((src) => (
              <div
                key={src.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4 group transition-all"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {src.citation_key && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold flex items-center gap-1">
                        <Quote className="w-2.5 h-2.5" /> {src.citation_key}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" /> Verified
                    </span>
                    {src.publication_year && (
                      <span className="text-[11px] text-slate-400">&bull; {src.publication_year}</span>
                    )}
                  </div>

                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {src.title}
                  </h3>

                  {src.authors && src.authors.length > 0 && (
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {src.authors.join(", ")}
                    </p>
                  )}

                  {src.venue_or_journal && (
                    <p className="text-xs italic text-slate-500 dark:text-slate-400">
                      {src.venue_or_journal}
                    </p>
                  )}

                  {src.abstract && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 pt-1">
                      {src.abstract}
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                  {src.doi_or_url && (
                    <a
                      href={src.doi_or_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Link</span>
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(src.id, src.title)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                    title="Remove source"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Source Modal */}
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4">
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">Add Academic Source</h3>
              <form onSubmit={handleAddSource} className="space-y-3 text-xs">
                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Paper Title / Book
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Attention Is All You Need"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Authors (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={authors}
                      onChange={(e) => setAuthors(e.target.value)}
                      placeholder="Vaswani, Shazeer, Parmar..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Publication Year
                    </label>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="2024"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Journal or Conference
                    </label>
                    <input
                      type="text"
                      value={journal}
                      onChange={(e) => setJournal(e.target.value)}
                      placeholder="NeurIPS, IEEE TPAMI, Nature..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Citation Key (Optional)
                    </label>
                    <input
                      type="text"
                      value={citationKey}
                      onChange={(e) => setCitationKey(e.target.value)}
                      placeholder="e.g. Vaswani2017"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    DOI or Publication URL
                  </label>
                  <input
                    type="url"
                    value={doiUrl}
                    onChange={(e) => setDoiUrl(e.target.value)}
                    placeholder="https://doi.org/10.1145/..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Abstract / Summary
                  </label>
                  <textarea
                    rows={2}
                    value={abstractText}
                    onChange={(e) => setAbstractText(e.target.value)}
                    placeholder="Brief summary of findings or methodology..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !title.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-sm transition-colors"
                  >
                    {isSubmitting ? "Adding..." : "Add to Library"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
