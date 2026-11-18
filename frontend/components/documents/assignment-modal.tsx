"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  X,
  Sparkles,
  BookOpen,
  Award,
  AlertCircle,
  GraduationCap,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssignmentModal({ isOpen, onClose }: AssignmentModalProps) {
  const router = useRouter();

  const [title, setTitle] = useState("Artificial Intelligence in Higher Education");
  const [brief, setBrief] = useState(
    "Write a rigorous academic analysis on the transformative impacts, ethical considerations, and pedagogical challenges of generative AI in university teaching and research. Address both opportunities for personalized learning and challenges to scientific integrity."
  );
  const [docType, setDocType] = useState("Academic Essay");
  const [wordCount, setWordCount] = useState(500);
  const [academicLevel, setAcademicLevel] = useState("Undergraduate");
  const [citationStyle, setCitationStyle] = useState("APA 7th");
  const [includeResearch, setIncludeResearch] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !brief.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setProgressText("Analyzing assignment brief and requirements...");

    const steps = [
      "Analyzing requirements and structure...",
      "Retrieving scholarly papers from arXiv & Crossref...",
      "Synthesizing arguments and thesis statement...",
      "Drafting sections and generating APA references...",
      "Finalizing document workspace...",
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      setProgressText(steps[stepIdx]);
    }, 2000);

    try {
      const res = await api.documents.generateAssignment({
        title: title.trim(),
        assignment_brief: brief.trim(),
        document_type: docType,
        target_word_count: Number(wordCount),
        academic_level: academicLevel,
        citation_style: citationStyle,
        include_research: includeResearch,
      });

      clearInterval(interval);
      // Navigate to the newly created document editor
      router.push(`/documents/${res.document_id}`);
      onClose();
    } catch (err: any) {
      clearInterval(interval);
      setErrorMessage(
        err.message || "Assignment generation failed. Please ensure your AI Provider Key is configured in Settings."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-brand-500/20 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-brand-500/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-glow-purple">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Create New Assignment</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-300 font-semibold">
                  AI Generator
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                End-to-end academic paper generation backed by verified scholarly literature.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Progress State */}
        {isLoading && (
          <div className="mt-4 p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 space-y-2.5 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-brand-700 dark:text-brand-300">
              <Sparkles className="w-4 h-4 animate-spin text-brand-500" />
              <span>{progressText}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-brand-600 to-indigo-600 h-full rounded-full animate-pulse w-3/4 mx-auto" />
            </div>
            <p className="text-[11px] text-slate-400">
              Generating semantic HTML structure, citations, and critical analysis...
            </p>
          </div>
        )}

        {/* Generation Form */}
        <form onSubmit={handleGenerate} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Assignment Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Artificial Intelligence in Higher Education"
              required
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-500/20 bg-white/80 dark:bg-slate-900/80 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Document Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-xl border border-brand-500/20 bg-white/80 dark:bg-slate-900/80 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                <option value="Academic Essay">Academic Essay</option>
                <option value="Research Paper">Research Paper</option>
                <option value="Literature Review">Literature Review</option>
                <option value="Term Paper">Term Paper</option>
                <option value="Case Study">Case Study</option>
                <option value="Executive Report">Executive Report</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Target Words
              </label>
              <select
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-xl border border-brand-500/20 bg-white/80 dark:bg-slate-900/80 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                <option value={300}>~300 words</option>
                <option value={500}>~500 words (Standard)</option>
                <option value={800}>~800 words</option>
                <option value={1200}>~1,200 words</option>
                <option value={2000}>~2,000 words</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Academic Level
              </label>
              <select
                value={academicLevel}
                onChange={(e) => setAcademicLevel(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-xl border border-brand-500/20 bg-white/80 dark:bg-slate-900/80 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                <option value="Undergraduate">Undergraduate</option>
                <option value="Master's / Graduate">Master&apos;s</option>
                <option value="Doctoral / PhD">Doctoral</option>
                <option value="Professional Scholar">Professional</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Citation Style
              </label>
              <select
                value={citationStyle}
                onChange={(e) => setCitationStyle(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-xl border border-brand-500/20 bg-white/80 dark:bg-slate-900/80 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                <option value="APA 7th">APA 7th</option>
                <option value="MLA 9th">MLA 9th</option>
                <option value="Chicago 17th">Chicago 17th</option>
                <option value="Harvard">Harvard</option>
                <option value="IEEE">IEEE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Assignment Instructions & Requirements
            </label>
            <textarea
              rows={4}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Paste assignment questions, thesis guidelines, or specific rubric requirements..."
              required
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-500/20 bg-white/80 dark:bg-slate-900/80 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="includeResearch"
              checked={includeResearch}
              onChange={(e) => setIncludeResearch(e.target.checked)}
              disabled={isLoading}
              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
            <label htmlFor="includeResearch" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              Retrieve verified academic papers from arXiv & Crossref to cite in the text
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-brand-500/15 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !brief.trim() || isLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 text-white text-xs font-semibold shadow-glow-purple hover:opacity-95 disabled:opacity-40 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? "Generating Assignment..." : "Generate Assignment"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
