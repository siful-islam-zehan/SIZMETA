"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  Key,
  Cpu,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Save,
  Sliders,
  User as UserIcon,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/components/providers/theme-provider";

interface ProviderConfig {
  id: string;
  provider: string;
  has_api_key: boolean;
  key_masked: string | null;
  api_base_url: string | null;
  is_active: boolean;
  is_valid: boolean;
  last_tested_at: string | null;
  last_error_message: string | null;
  default_model: string | null;
  available_models: Array<{ id: string; name: string; description?: string; context_window?: number }>;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<"providers" | "general" | "account">("providers");
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Key form states
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ provider: string; success: boolean; message: string } | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [provList, userSettings] = await Promise.all([
        api.providers.list(),
        api.settings.get(),
      ]);
      setProviders(provList);
      setSettings(userSettings);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveKey = async (provider: "gemini" | "openai") => {
    const key = provider === "gemini" ? geminiKey : openaiKey;
    if (!key.trim()) return;

    setSavingKey(provider);
    setTestResult(null);
    try {
      await api.providers.saveKey({
        provider,
        api_key: key.trim(),
      });
      if (provider === "gemini") setGeminiKey("");
      if (provider === "openai") setOpenaiKey("");
      await loadData();
      setTestResult({
        provider,
        success: true,
        message: `Successfully validated and encrypted ${provider.toUpperCase()} API key at rest.`,
      });
    } catch (err: any) {
      setTestResult({
        provider,
        success: false,
        message: err.message || "Failed to save and validate key.",
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleTestKey = async (provider: "gemini" | "openai") => {
    setTestingProvider(provider);
    setTestResult(null);
    try {
      const unsavedKey = provider === "gemini" ? geminiKey.trim() : openaiKey.trim();
      const res = await api.providers.test({
        provider,
        api_key: unsavedKey || undefined,
      });
      setTestResult({
        provider,
        success: res.success,
        message: res.message,
      });
      await loadData();
    } catch (err: any) {
      setTestResult({
        provider,
        success: false,
        message: err.message || "Connectivity test failed.",
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const handleDeleteKey = async (provider: "gemini" | "openai") => {
    if (!confirm(`Are you sure you want to remove your ${provider.toUpperCase()} API key?`)) return;
    try {
      await api.providers.delete(provider);
      await loadData();
    } catch (err: any) {
      alert("Error deleting key: " + err.message);
    }
  };

  const handleUpdatePreferences = async (updates: any) => {
    try {
      const updated = await api.settings.update(updates);
      setSettings(updated);
    } catch (err: any) {
      alert("Error updating settings: " + err.message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    try {
      await api.settings.update({}); // trigger check
      const res = await fetch("http://localhost:8000/api/v1/users/me/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("researchmeta_token")}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to change password");
      setPasswordMsg({ type: "success", text: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message });
    }
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Workspace Settings</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your AI provider credentials, model selection, citation standards, and security.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab("providers")}
            className={`pb-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "providers"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>AI Providers & API Keys</span>
          </button>
          <button
            onClick={() => setActiveTab("general")}
            className={`pb-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "general"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>General & Citations</span>
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`pb-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "account"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Account & Security</span>
          </button>
        </div>

        {/* TAB 1: AI Providers & API Keys */}
        {activeTab === "providers" && (
          <div className="space-y-6">
            {/* Preferred Provider Selector Card */}
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Preferred AI Provider
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Choose which provider powers your document review and research workflows.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(["gemini", "openai"] as const).map((prov) => {
                    const isSelected = settings?.preferred_ai_provider === prov;
                    return (
                      <button
                        key={prov}
                        type="button"
                        onClick={() => handleUpdatePreferences({ preferred_ai_provider: prov })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize border transition-all ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {prov}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Test Result Alert */}
            {testResult && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                  testResult.success
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold capitalize">{testResult.provider}: </span>
                  <span>{testResult.message}</span>
                </div>
              </div>
            )}

            {/* Provider Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Google Gemini Card */}
              {(() => {
                const geminiCfg = providers.find((p) => p.provider === "gemini");
                const hasKey = geminiCfg?.has_api_key;
                const isValid = geminiCfg?.is_valid;

                return (
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                            G
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">Google Gemini</h4>
                            <p className="text-[11px] text-slate-400">Gemini 2.0 Flash & 1.5 Pro</p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            hasKey && isValid
                              ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 text-emerald-700 dark:text-emerald-400"
                              : hasKey && !isValid
                              ? "bg-rose-50 dark:bg-rose-950 border-rose-200 text-rose-700 dark:text-rose-400"
                              : "bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-500"
                          }`}
                        >
                          {hasKey && isValid ? "Connected" : hasKey ? "Validation Error" : "Not Configured"}
                        </span>
                      </div>

                      {/* Stored Key Preview */}
                      {hasKey && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{geminiCfg?.key_masked}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteKey("gemini")}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            title="Remove key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Add/Update Key Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {hasKey ? "Update Gemini API Key" : "Enter Gemini API Key"}
                        </label>
                        <input
                          type="password"
                          value={geminiKey}
                          onChange={(e) => setGeminiKey(e.target.value)}
                          placeholder={hasKey ? "Enter new key to replace..." : "AIzaSy..."}
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <p className="text-[11px] text-slate-400">
                          Keys are encrypted at rest using AES-Fernet encryption on the backend.
                        </p>
                      </div>

                      {/* Discovered Models Dropdown */}
                      {geminiCfg && geminiCfg.available_models.length > 0 && (
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-slate-400" />
                            Default Model
                          </label>
                          <select
                            value={geminiCfg.default_model || "gemini-2.0-flash"}
                            onChange={(e) => handleUpdatePreferences({ preferred_ai_model: e.target.value })}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            {geminiCfg.available_models.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.id})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleSaveKey("gemini")}
                        disabled={savingKey === "gemini" || !geminiKey.trim()}
                        className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
                      >
                        {savingKey === "gemini" ? "Validating & Saving..." : "Save Key"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTestKey("gemini")}
                        disabled={testingProvider === "gemini" || (!hasKey && !geminiKey.trim())}
                        className="py-1.5 px-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${testingProvider === "gemini" ? "animate-spin" : ""}`} />
                        <span>Test</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* OpenAI Card */}
              {(() => {
                const openaiCfg = providers.find((p) => p.provider === "openai");
                const hasKey = openaiCfg?.has_api_key;
                const isValid = openaiCfg?.is_valid;

                return (
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                            O
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">OpenAI</h4>
                            <p className="text-[11px] text-slate-400">GPT-4o, GPT-4o-mini</p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            hasKey && isValid
                              ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 text-emerald-700 dark:text-emerald-400"
                              : hasKey && !isValid
                              ? "bg-rose-50 dark:bg-rose-950 border-rose-200 text-rose-700 dark:text-rose-400"
                              : "bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-500"
                          }`}
                        >
                          {hasKey && isValid ? "Connected" : hasKey ? "Validation Error" : "Not Configured"}
                        </span>
                      </div>

                      {/* Stored Key Preview */}
                      {hasKey && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{openaiCfg?.key_masked}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteKey("openai")}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            title="Remove key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Add/Update Key Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {hasKey ? "Update OpenAI API Key" : "Enter OpenAI API Key"}
                        </label>
                        <input
                          type="password"
                          value={openaiKey}
                          onChange={(e) => setOpenaiKey(e.target.value)}
                          placeholder={hasKey ? "Enter new key to replace..." : "sk-proj-..."}
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <p className="text-[11px] text-slate-400">
                          Keys are never logged, exposed to frontend, or sent unencrypted.
                        </p>
                      </div>

                      {/* Discovered Models Dropdown */}
                      {openaiCfg && openaiCfg.available_models.length > 0 && (
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-slate-400" />
                            Default Model
                          </label>
                          <select
                            value={openaiCfg.default_model || "gpt-4o-mini"}
                            onChange={(e) => handleUpdatePreferences({ preferred_ai_model: e.target.value })}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            {openaiCfg.available_models.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleSaveKey("openai")}
                        disabled={savingKey === "openai" || !openaiKey.trim()}
                        className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
                      >
                        {savingKey === "openai" ? "Validating & Saving..." : "Save Key"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTestKey("openai")}
                        disabled={testingProvider === "openai" || (!hasKey && !openaiKey.trim())}
                        className="py-1.5 px-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${testingProvider === "openai" ? "animate-spin" : ""}`} />
                        <span>Test</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 2: General & Citations */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
              {/* Citation Style */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Default Academic Citation Standard
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Preselects citation rules for new documents and exports.
                  </p>
                </div>
                <select
                  value={settings?.default_citation_style || "APA 7th"}
                  onChange={(e) => handleUpdatePreferences({ default_citation_style: e.target.value })}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                >
                  <option value="APA 7th">APA 7th Edition</option>
                  <option value="MLA 9th">MLA 9th Edition</option>
                  <option value="Chicago 17th">Chicago 17th (Author-Date)</option>
                  <option value="Harvard">Harvard Referencing</option>
                  <option value="IEEE">IEEE Computer Society</option>
                </select>
              </div>

              {/* Autosave Interval */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Editor Autosave Interval
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Frequency of background document persistence to prevent loss.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={settings?.auto_save_interval_seconds || 3}
                    onChange={(e) => handleUpdatePreferences({ auto_save_interval_seconds: parseInt(e.target.value) || 3 })}
                    className="w-20 text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center"
                  />
                  <span className="text-xs text-slate-500">seconds</span>
                </div>
              </div>

              {/* Interface Theme */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Workspace Theme
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Toggle between light, dark, or system match.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(["light", "dark", "system"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize border transition-all ${
                        theme === t
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Account & Security */}
        {activeTab === "account" && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-emerald-600" />
                  Scholar Profile
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Your isolated workspace account credentials.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    disabled
                    value={user?.full_name || "Scholar"}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">Email Address</label>
                  <input
                    type="text"
                    disabled
                    value={user?.email || "scholar@university.edu"}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* Password Change Form */}
              <form onSubmit={handleChangePassword} className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Change Password
                </h4>

                {passwordMsg && (
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      passwordMsg.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-800 dark:text-emerald-300"
                        : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-800 dark:text-rose-300"
                    }`}
                  >
                    {passwordMsg.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-500 dark:text-slate-400 block mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 dark:text-slate-400 block mb-1">New Password (min 8 chars)</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
