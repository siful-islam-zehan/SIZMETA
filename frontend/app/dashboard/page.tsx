"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  FolderKanban,
  FileText,
  Plus,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  FilePlus,
  Key,
  GraduationCap,
  Bot,
  MessageSquare,
  Search,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { formatDate } from "@/lib/utils";
import { ResearchHub } from "@/components/research/research-hub";
import { AssignmentModal } from "@/components/documents/assignment-modal";

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [projList, docList, provList, convList] = await Promise.all([
          api.projects.list(),
          api.documents.list(),
          api.providers.list(),
          api.conversations.list(),
        ]);
        setProjects(projList);
        setDocuments(docList);
        setProviders(provList);
        setConversations(convList);
      } catch {
        // Handle gracefully
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const connectedProviders = providers.filter((p) => p.has_api_key && p.is_valid);
  const activeAi = connectedProviders.length > 0;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8 relative">
        {/* Welcome Banner */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-glass relative overflow-hidden border border-brand-500/20">
          <div className="ambient-glow-purple -top-12 -right-12 w-64 h-64 opacity-40" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-500/25">
                  Academic Research Suite
                </span>
                <span className="text-[10px] font-mono text-slate-400">SiZ Edition</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Welcome back{user ? `, ${user.full_name}` : ""}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
                Explore scholarly literature, run grounded research reviews, generate rigorous assignments, and edit manuscripts in a live workspace.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setIsAssignmentModalOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-glow-purple transition-all"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Create Assignment</span>
              </button>
              <Link
                href="/documents?create=true"
                className="px-4 py-2.5 border border-brand-500/25 hover:bg-brand-500/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors bg-white/50 dark:bg-slate-900/50"
              >
                <FilePlus className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>New Document</span>
              </Link>
            </div>
          </div>
        </div>

        {/* AI Provider Status Card */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-brand-500/15 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                activeAi
                  ? "bg-brand-500/15 border border-brand-500/30 text-brand-600 dark:text-brand-300"
                  : "bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300"
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  AI Provider Architecture
                </h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    activeAi
                      ? "bg-brand-500/15 border-brand-500/25 text-brand-700 dark:text-brand-300 font-semibold"
                      : "bg-amber-500/15 border-amber-500/25 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {activeAi ? `${connectedProviders.length} Provider Active` : "Key Configuration Needed"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {activeAi
                  ? `Active engine: ${connectedProviders.map((p) => p.provider.toUpperCase()).join(", ")}. Keys are encrypted at rest with Fernet.`
                  : "Add your personal Google Gemini or OpenAI API key in Settings to activate deep research synthesis & assignment generation."}
              </p>
            </div>
          </div>

          <Link
            href="/settings"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-brand-500/25 hover:bg-brand-500/10 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 shrink-0 transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Manage AI Keys</span>
          </Link>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <button
            onClick={() => setIsAssignmentModalOpen(true)}
            className="glass-card p-4 rounded-2xl text-left hover:border-brand-500/40 transition-all group flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">Create Assignment</div>
              <div className="text-[11px] text-slate-400 mt-0.5">End-to-end paper generator</div>
            </div>
          </button>

          <Link
            href="/documents?create=true"
            className="glass-card p-4 rounded-2xl text-left hover:border-brand-500/40 transition-all group flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">Open TipTap Editor</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Autosave & PDF/DOCX export</div>
            </div>
          </Link>

          <Link
            href="/conversations"
            className="glass-card p-4 rounded-2xl text-left hover:border-brand-500/40 transition-all group flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">Academic Assistant</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Literature & thesis advisor</div>
            </div>
          </Link>

          <Link
            href="/library"
            className="glass-card p-4 rounded-2xl text-left hover:border-brand-500/40 transition-all group flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">Research Library</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Verified sources & citations</div>
            </div>
          </Link>
        </div>

        {/* Live Academic Research Hub */}
        <section className="space-y-3">
          <ResearchHub />
        </section>

        {/* 3-Column Section: Recent Documents, Recent Projects, Recent Conversations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Recent Documents */}
          <div className="glass-card rounded-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-brand-500/15">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Recent Documents
                </h3>
              </div>
              <Link href="/documents" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                View all &rarr;
              </Link>
            </div>

            <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
              {documents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <p>No documents created yet.</p>
                  <Link
                    href="/documents?create=true"
                    className="inline-block mt-2 text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                  >
                    Start writing a paper &rarr;
                  </Link>
                </div>
              ) : (
                documents.slice(0, 3).map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className="py-3 flex items-center justify-between group hover:bg-brand-500/5 px-2 rounded-xl transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {doc.title || "Untitled Paper"}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-mono">v{doc.current_version}</span>
                        <span>&bull;</span>
                        <span>{doc.word_count.toLocaleString()} words</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent Projects */}
          <div className="glass-card rounded-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-brand-500/15">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Research Projects
                </h3>
              </div>
              <Link href="/projects" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                View all &rarr;
              </Link>
            </div>

            <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
              {projects.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <p>No projects initialized yet.</p>
                  <Link
                    href="/projects?create=true"
                    className="inline-block mt-2 text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                  >
                    Create a project &rarr;
                  </Link>
                </div>
              ) : (
                projects.slice(0, 3).map((proj) => (
                  <Link
                    key={proj.id}
                    href={`/documents?project_id=${proj.id}`}
                    className="py-3 flex items-center justify-between group hover:bg-brand-500/5 px-2 rounded-xl transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {proj.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-medium text-slate-500">{proj.academic_level}</span>
                        <span>&bull;</span>
                        <span className="truncate">{proj.research_field}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="glass-card rounded-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-brand-500/15">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  AI Conversations
                </h3>
              </div>
              <Link href="/conversations" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                View all &rarr;
              </Link>
            </div>

            <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
              {conversations.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <p>No chat history yet.</p>
                  <Link
                    href="/conversations"
                    className="inline-block mt-2 text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                  >
                    Start an inquiry &rarr;
                  </Link>
                </div>
              ) : (
                conversations.slice(0, 3).map((conv) => (
                  <Link
                    key={conv.id}
                    href={`/conversations?id=${conv.id}`}
                    className="py-3 flex items-center justify-between group hover:bg-brand-500/5 px-2 rounded-xl transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {conv.title || "Academic Inquiry"}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(conv.updated_at)}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Assignment Creation Modal */}
        <AssignmentModal
          isOpen={isAssignmentModalOpen}
          onClose={() => setIsAssignmentModalOpen(false)}
        />
      </div>
    </AppShell>
  );
}
