"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  Bookmark,
  FilePlus,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";

export function ResearchHub() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [researchMode, setResearchMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [progressStage, setProgressStage] = useState(0);
  const [results, setResults] = useState<any | null>(null);
  const [savedSourceIds, setSavedSourceIds] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const stages = [
    "Connecting to academic repositories...",
    "Querying arXiv preprints & Crossref DOIs...",
    "Validating source credibility & abstracts...",
    "Synthesizing structured findings with AI...",
  ];

  const handleExecuteResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    if (!researchMode) {
      setErrorMessage("Research mode is currently OFF. Toggle it ON to enable academic retrieval.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setResults(null);
    setProgressStage(0);

    // Progress step interval
    const interval = setInterval(() => {
      setProgressStage((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1200);

    try {
      const data = await api.research.query({
        query: query.trim(),
        research_mode: true,
        max_sources: 6,
      });
      clearInterval(interval);
      setResults(data);
    } catch (err: any) {
      clearInterval(interval);
      setErrorMessage(err.message || "Failed to execute research query. Please check network connectivity.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSourceToLibrary = async (source: any, idx: number) => {
    try {
      await api.sources.create({
        title: source.title,
        authors: source.authors,
        publication_year: source.year,
        venue_or_journal: source.venue_or_journal,
        doi_or_url: source.doi_or_url,
        abstract: source.abstract,
        citation_key: source.citation_key,
        notes: "Saved from Research Hub Live Search",
      });
      setSavedSourceIds((prev) => ({ ...prev, [idx]: true }));
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    }
  };

  const handleOpenInEditor = async () => {
    if (!results) return;
    try {
      const htmlContent = `<h1>${query}</h1>
<p><em>Synthesized research review based on ${results.sources_count} verified scholarly sources.</em></p>
<hr/>
${results.synthesis_markdown.replace(/\n\n/g, "</p><p>").replace(/### (.*?)\n/g, "<h2>$1</h2>")}`;

      const newDoc = await api.documents.create({
        title: `Research: ${query.slice(0, 40)}`,
        content: htmlContent,
      });
      router.push(`/documents/${newDoc.id}`);
    } catch (err: any) {
      alert("Error creating document: " + err.message);
    }
  };

  const handleCopyMarkdown = () => {
    if (!results) return;
    navigator.clipboard.writeText(results.synthesis_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Research Search & Toggle Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-glass relative overflow-hidden border border-brand-500/20">
        <div className="ambient-glow-purple -top-16 -right-16 w-64 h-64 opacity-50" />
        <div className="ambient-glow-blue -bottom-16 -left-16 w-64 h-64 opacity-40" />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                  Live Scholarly Retrieval
                </span>
                <span className="text-[10px] text-slate-400 font-mono">arXiv &bull; Crossref</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                Academic Research Hub
              </h2>
            </div>

            {/* Research ON / OFF Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Research Mode
              </span>
              <button
                type="button"
                onClick={() => setResearchMode(!researchMode)}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  researchMode ? "bg-brand-600 shadow-glow-purple" : "bg-slate-300 dark:bg-slate-700"
                }`}
                role="switch"
                aria-checked={researchMode}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    researchMode ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                  researchMode
                    ? "bg-brand-500/15 text-brand-600 dark:text-brand-300"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}
              >
                {researchMode ? "ON" : "OFF"}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            {researchMode
              ? "Research Mode is ACTIVE: Your query retrieves live peer-reviewed publications and preprints from arXiv and Crossref, checks DOIs, and synthesizes structured findings."
              : "Research Mode is OFF: Web and scholarly archives are not queried."}
          </p>

          {/* Search Input Form */}
          <form onSubmit={handleExecuteResearch} className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter research topic, literature gap, or thesis question (e.g., Quantum error mitigation in NISQ computers)..."
                disabled={isLoading}
                className="w-full pl-12 pr-32 py-3.5 rounded-2xl border border-brand-500/25 bg-white/90 dark:bg-slate-950/80 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 shadow-sm transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!query.trim() || isLoading || !researchMode}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-brand-500/25 disabled:opacity-40 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isLoading ? "Searching..." : "Research"}</span>
              </button>
            </div>
          </form>

          {/* Real-time Progress Animation */}
          {isLoading && (
            <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-brand-700 dark:text-brand-300">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping"></span>
                  {stages[progressStage]}
                </span>
                <span className="text-[11px] font-mono">{progressStage + 1} / 4</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${((progressStage + 1) / 4) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Structured Results Display */}
      {results && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Top Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Research Synthesis:</span>
                <span className="text-brand-600 dark:text-brand-400 font-semibold">{results.query}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Found {results.sources_count} verified publications &bull;{" "}
                {results.ai_synthesized ? "AI Synthesized with active provider" : "Literature Overview Mode"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyMarkdown}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy Synthesis"}</span>
              </button>
              <button
                onClick={handleOpenInEditor}
                className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>Open as Document</span>
              </button>
            </div>
          </div>

          {/* 2-Column Layout: Synthesis on Left, Verified Sources on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Synthesis Markdown (7 cols) */}
            <div className="lg:col-span-7 glass-card rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <Layers className="w-4 h-4 text-brand-600" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Structured Findings & Analysis
                </h4>
              </div>

              <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {results.synthesis_markdown}
              </div>
            </div>

            {/* Right: Verified Sources (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Verified Sources ({results.sources_count})
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400">arXiv & Crossref</span>
              </div>

              <div className="space-y-3">
                {results.sources.map((s: any, idx: number) => (
                  <div
                    key={idx}
                    className="glass-card rounded-2xl p-4 space-y-2.5 border border-brand-500/15 hover:border-brand-500/35 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                        {s.title}
                      </h5>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        {Math.round(s.credibility_score * 100)}% Credible
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{s.authors?.slice(0, 2).join(", ")}{s.authors?.length > 2 ? " et al." : ""}</span>
                      <span>&bull;</span>
                      <span>{s.year || "n.d."}</span>
                      <span>&bull;</span>
                      <span className="truncate max-w-[140px]">{s.venue_or_journal}</span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {s.abstract}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <a
                        href={s.doi_or_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
                      >
                        <span>View Publication</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => handleSaveSourceToLibrary(s, idx)}
                        disabled={savedSourceIds[idx]}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                          savedSourceIds[idx]
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {savedSourceIds[idx] ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3 h-3" />
                            <span>Save to Library</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
