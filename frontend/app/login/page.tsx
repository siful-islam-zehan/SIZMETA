"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { api } from "@/lib/api";
import { ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (isRegister) {
        const res = await api.auth.register({
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          password,
        });
        await login(res.access_token);
      } else {
        const res = await api.auth.login({
          email: email.trim().toLowerCase(),
          password,
        });
        await login(res.access_token);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#11101A] text-slate-900 dark:text-slate-100 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="ambient-glow-purple top-1/4 -left-32 w-96 h-96 opacity-40 pointer-events-none" />
      <div className="ambient-glow-blue bottom-1/4 -right-32 w-96 h-96 opacity-30 pointer-events-none" />

      <div className="w-full max-w-md glass-card rounded-3xl p-6 sm:p-8 shadow-glass space-y-6 relative z-10 border border-brand-500/20">
        {/* Header / Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-glow-purple">
            R
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              ResearchMeta AI
            </h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-500/25 inline-block mt-1">
              SiZ Edition
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Personal AI-Powered Academic Research & Writing Workspace
          </p>
        </div>

        {/* Toggle Mode */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold border border-brand-500/10">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setErrorMsg(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              !isRegister
                ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-300 shadow-sm font-bold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setErrorMsg(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              isRegister
                ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-300 shadow-sm font-bold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {isRegister && (
            <div>
              <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Scholar Name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          )}

          <div>
            <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Academic Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="scholar@university.edu"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:opacity-95 disabled:opacity-50 text-white rounded-xl font-semibold shadow-glow-purple transition-all flex items-center justify-center gap-1.5 mt-2"
          >
            <span>{isSubmitting ? "Authenticating..." : isRegister ? "Create Account" : "Sign In to Workspace"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-2 text-[11px] text-center text-slate-400 space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
            <span>Strict per-user data isolation & encrypted key storage</span>
          </div>
          <p className="text-[10px] text-slate-400/80">
            Created by Siful Islam Zehan (SiZ)
          </p>
        </div>
      </div>
    </div>
  );
}
