"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, FileText, Sparkles, ShieldCheck, GraduationCap, Bot } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#11101A] text-slate-900 dark:text-slate-100 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="ambient-glow-purple top-1/4 -left-32 w-96 h-96 opacity-35 pointer-events-none" />
      <div className="ambient-glow-blue bottom-1/4 -right-32 w-96 h-96 opacity-25 pointer-events-none" />

      <div className="max-w-2xl text-center space-y-6 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-glow-purple">
          R
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-500/25">
              Academic Research Suite
            </span>
            <span className="text-xs font-mono text-slate-400">SiZ Edition</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            ResearchMeta AI
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            A personal AI-powered academic research and writing workspace designed with Python-first architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
          <div className="glass-card p-4 rounded-2xl border border-brand-500/20">
            <Sparkles className="w-5 h-5 text-brand-500 mb-2" />
            <h3 className="font-semibold text-xs text-slate-900 dark:text-slate-100">Live Scholarly Search</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">arXiv & Crossref verified papers with DOI confidence metrics.</p>
          </div>
          <div className="glass-card p-4 rounded-2xl border border-brand-500/20">
            <GraduationCap className="w-5 h-5 text-indigo-500 mb-2" />
            <h3 className="font-semibold text-xs text-slate-900 dark:text-slate-100">Assignment Generator</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Deep prompt analysis, thesis planning, and grounded draft synthesis.</p>
          </div>
          <div className="glass-card p-4 rounded-2xl border border-brand-500/20">
            <FileText className="w-5 h-5 text-blue-500 mb-2" />
            <h3 className="font-semibold text-xs text-slate-900 dark:text-slate-100">TipTap & Multi-Export</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Autosave workspace with PDF, DOCX, Markdown, and TXT export.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-glow-purple transition-all"
          >
            <span>Open Research Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3 glass-card border border-brand-500/25 hover:bg-brand-500/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors"
          >
            <span>Sign In / Register</span>
          </Link>
        </div>

        <p className="text-[11px] text-slate-400">
          Created by Siful Islam Zehan (SiZ)
        </p>
      </div>
    </div>
  );
}
