"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  BookOpen,
  MessageSquare,
  Award,
  Settings as SettingsIcon,
  Sun,
  Moon,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  Plus,
  Bot,
  Heart,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { api } from "@/lib/api";
import { FloatingChatbot } from "@/components/chat/floating-chatbot";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Research Projects", href: "/projects", icon: FolderKanban },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Research Library", href: "/library", icon: BookOpen },
  { name: "AI Assistant", href: "/conversations", icon: Bot },
  { name: "Rubrics", href: "/rubrics", icon: Award },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [aiStatus, setAiStatus] = useState<"configured" | "unconfigured">("unconfigured");

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await api.health.check();
        setBackendStatus(res.database_connected ? "connected" : "disconnected");
      } catch {
        setBackendStatus("disconnected");
      }

      try {
        const providers = await api.providers.list();
        const hasKey = providers.some((p) => p.has_api_key && p.is_valid);
        setAiStatus(hasKey ? "configured" : "unconfigured");
      } catch {
        // ignore
      }
    }
    checkHealth();
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F6FC] dark:bg-[#11101A] text-slate-900 dark:text-slate-100 transition-colors relative">
      {/* Subtle Ambient Glows */}
      <div className="ambient-glow-purple top-0 left-1/4 w-[500px] h-[500px] opacity-40" />
      <div className="ambient-glow-blue top-1/3 right-10 w-[450px] h-[450px] opacity-35" />

      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full h-14 border-b border-brand-500/15 dark:border-brand-500/25 bg-white/75 dark:bg-[#181528]/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-glow-purple">
              R
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">
                ResearchMeta <span className="text-brand-600 dark:text-brand-400">AI</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-300 font-bold border border-brand-500/20">
                SiZ
              </span>
            </div>
          </Link>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          {/* AI Connection Badge */}
          <Link
            href="/settings"
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              aiStatus === "configured"
                ? "bg-brand-500/10 border-brand-500/25 text-brand-700 dark:text-brand-300 hover:bg-brand-500/20"
                : "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{aiStatus === "configured" ? "AI Engine Active" : "Add AI Key"}</span>
          </Link>

          {/* Backend Status indicator */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === "connected"
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  : backendStatus === "checking"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-rose-500"
              }`}
            />
            <span className="hidden md:inline text-[11px]">
              {backendStatus === "connected" ? "Operational" : backendStatus === "checking" ? "Checking..." : "Offline"}
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-xl border border-brand-500/15 dark:border-brand-500/25 hover:bg-brand-500/10 text-slate-600 dark:text-slate-400 transition-colors"
            title="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile or Sign In */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-brand-500/20">
              <div className="w-7 h-7 rounded-full bg-brand-500/15 dark:bg-brand-500/30 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs">
                {user.full_name?.charAt(0) || "U"}
              </div>
              <span className="hidden lg:inline text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                {user.full_name}
              </span>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-60 border-r border-brand-500/15 dark:border-brand-500/25 bg-white/70 dark:bg-[#181528]/70 backdrop-blur-md p-3.5 space-y-1 shrink-0">
          <div className="px-3 py-2 text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
            Workspace
          </div>

          <div className="space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? "bg-brand-500/15 dark:bg-brand-500/25 text-brand-700 dark:text-brand-300 font-semibold shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-brand-500/10 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-brand-600 dark:text-brand-400" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Creator Identity & Footer */}
          <div className="pt-4 border-t border-brand-500/15 dark:border-brand-500/25 px-2 text-center space-y-1">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Created by <span className="text-brand-600 dark:text-brand-400 font-semibold">Siful Islam Zehan</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">ResearchMeta AI &bull; SiZ Edition</div>
          </div>
        </aside>

        {/* Mobile Slide-in Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-slate-950/70 backdrop-blur-sm flex">
            <div className="w-64 glass-panel p-4 flex flex-col h-full border-r border-brand-500/20 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-brand-500/15">
                <span className="font-bold text-sm">Navigation</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-1 flex-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                        active
                          ? "bg-brand-500/15 text-brand-600 dark:text-brand-400 font-semibold"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="pt-4 border-t border-brand-500/15 text-center text-[11px] text-slate-400">
                Created by Siful Islam Zehan
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto min-w-0 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Floating AI Assistant Chatbot Widget */}
      <FloatingChatbot />
    </div>
  );
}
