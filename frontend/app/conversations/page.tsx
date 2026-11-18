"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  MessageSquare,
  Send,
  Plus,
  Sparkles,
  Bot,
  User,
  Clock,
  Trash2,
  Copy,
  Check,
  Search,
  BookOpen,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputContent, setInputContent] = useState("");
  const [researchMode, setResearchMode] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const data = await api.conversations.list();
      setConversations(data);
      if (data.length > 0 && !activeConv) {
        selectConversation(data[0].id);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const selectConversation = async (id: string) => {
    try {
      const conv = await api.conversations.get(id);
      setActiveConv(conv);
      setMessages(conv.messages || []);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load conversation");
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleCreateNew = async () => {
    try {
      const newConv = await api.conversations.create({
        title: "Academic Inquiry",
        context_type: "general",
      });
      await loadConversations();
      selectConversation(newConv.id);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create conversation");
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.conversations.delete(id);
      const updated = conversations.filter((c) => c.id !== id);
      setConversations(updated);
      if (activeConv?.id === id) {
        if (updated.length > 0) {
          selectConversation(updated[0].id);
        } else {
          setActiveConv(null);
          setMessages([]);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete conversation");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || !activeConv || isSending) return;

    const userText = inputContent.trim();
    setInputContent("");
    setIsSending(true);
    setErrorMessage(null);

    // Optimistic user message
    const tempUserMsg = {
      id: "temp-" + Date.now(),
      role: "user",
      content: userText,
      created_at: new Date().toISOString(),
      metadata_json: { include_research: researchMode },
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const assistantMsg = await api.conversations.chat(activeConv.id, {
        content: userText,
        include_research: researchMode,
      });
      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh list to update updated_at and title
      const updatedList = await api.conversations.list();
      setConversations(updatedList);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Failed to generate AI response. Please ensure your AI Provider Key is configured in Settings."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto h-[calc(100vh-5.5rem)] flex flex-col space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-brand-500/15 dark:border-brand-500/25">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Academic Conversations & AI Copilot
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-300 font-semibold border border-brand-500/25">
                SiZ Edition
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive inquiries, paper structuring, grounded literature analysis, and thesis critique.
            </p>
          </div>

          <button
            onClick={handleCreateNew}
            className="px-3.5 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Inquiry</span>
          </button>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">
          {/* Left Sidebar: Conversation Threads */}
          <div className="w-64 sm:w-72 glass-panel rounded-2xl p-3 flex flex-col shrink-0">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
              Inquiry Threads
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {conversations.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  <p>No conversations yet.</p>
                </div>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => selectConversation(c.id)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between group cursor-pointer transition-colors ${
                      activeConv?.id === c.id
                        ? "bg-brand-500/15 dark:bg-brand-500/25 text-brand-700 dark:text-brand-300 font-semibold shadow-sm border border-brand-500/20"
                        : "text-slate-600 dark:text-slate-400 hover:bg-brand-500/5 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate">{c.title || "Academic Inquiry"}</div>
                      <div className="text-[10px] opacity-60 mt-0.5">{formatDate(c.updated_at)}</div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(e, c.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 transition-opacity"
                      title="Delete thread"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Chat Panel */}
          <div className="flex-1 glass-card rounded-2xl flex flex-col min-w-0 overflow-hidden shadow-sm">
            {/* Thread Header */}
            {activeConv && (
              <div className="px-5 py-3 border-b border-brand-500/15 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquare className="w-4 h-4 text-brand-600 shrink-0" />
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                    {activeConv.title}
                  </h3>
                </div>

                {/* Research Mode Toggle inside main chat */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setResearchMode(!researchMode)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                      researchMode
                        ? "bg-brand-500/15 text-brand-700 dark:text-brand-300 border-brand-500/30 shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent"
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Research Mode: {researchMode ? "ON" : "OFF"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="m-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
                    <Bot className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    Academic Inquiry Ready
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Ask questions about research methodologies, thesis statements, literature reviews, or critique of scholarly hypotheses.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role !== "user" && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-brand-600 text-white shadow-sm rounded-br-sm"
                          : "glass-card text-slate-800 dark:text-slate-200 rounded-bl-sm"
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                      {/* Grounded Citations if present */}
                      {msg.metadata_json?.citations && msg.metadata_json.citations.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-brand-500/20 space-y-1">
                          <div className="text-[10px] font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 uppercase tracking-wider">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Grounded Scholarly References</span>
                          </div>
                          {msg.metadata_json.citations.map((c: any, idx: number) => (
                            <a
                              key={idx}
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-[11px] text-brand-700 dark:text-brand-300 hover:underline truncate"
                            >
                              &bull; {c.title} ({c.year || "n.d."}) &rarr;
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="mt-2.5 flex items-center justify-between text-[10px] opacity-70">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                        </span>
                        {msg.role !== "user" && (
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="hover:opacity-100 flex items-center gap-1 text-[10px]"
                            title="Copy message"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-xl bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Generating state */}
              {isSending && (
                <div className="flex gap-3.5 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="glass-card rounded-2xl rounded-bl-sm p-4 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2.5">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                    <span>
                      {researchMode ? "Scanning arXiv & Crossref literature..." : "Synthesizing response with active AI provider..."}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-brand-500/15 bg-white/70 dark:bg-slate-900/70">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  placeholder={
                    researchMode
                      ? "Ask an academic question (Research Mode ON: grounds in arXiv & Crossref)..."
                      : "Type an academic query or research prompt..."
                  }
                  disabled={isSending || !activeConv}
                  className="flex-1 px-4 py-3 rounded-xl border border-brand-500/25 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 shadow-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputContent.trim() || isSending || !activeConv}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-semibold text-xs shadow-sm shadow-brand-500/25 hover:opacity-95 disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
