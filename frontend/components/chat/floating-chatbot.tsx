"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  Send,
  Bot,
  User,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Search,
  BookOpen,
  AlertCircle,
  Clock,
  Key,
} from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";

interface FloatingChatbotProps {
  initialOpen?: boolean;
}

export function FloatingChatbot({ initialOpen = false }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isExpanded, setIsExpanded] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [researchMode, setResearchMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hasAiKey, setHasAiKey] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Load user providers & conversation list on mount
  useEffect(() => {
    async function initChat() {
      try {
        const provs = await api.providers.list();
        const validKey = provs.some((p) => p.has_api_key && p.is_valid);
        setHasAiKey(validKey);

        const convs = await api.conversations.list();
        setConversations(convs);
        if (convs.length > 0 && !activeConvId) {
          loadConversation(convs[0].id);
        }
      } catch {
        // Fallback
      }
    }
    initChat();
  }, [isOpen]);

  const loadConversation = async (id: string) => {
    try {
      setActiveConvId(id);
      const conv = await api.conversations.get(id);
      setMessages(conv.messages || []);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load messages");
    }
  };

  const handleStartNewConversation = async () => {
    try {
      setIsLoading(true);
      const newConv = await api.conversations.create({
        title: "Academic Inquiry",
        context_type: "general",
      });
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([]);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create conversation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.conversations.delete(id);
      const updated = conversations.filter((c) => c.id !== id);
      setConversations(updated);
      if (activeConvId === id) {
        if (updated.length > 0) {
          loadConversation(updated[0].id);
        } else {
          setActiveConvId(null);
          setMessages([]);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");
    setErrorMessage(null);

    let currentId = activeConvId;
    if (!currentId) {
      try {
        const newConv = await api.conversations.create({
          title: userText.slice(0, 30),
          context_type: "general",
        });
        setConversations((prev) => [newConv, ...prev]);
        currentId = newConv.id;
        setActiveConvId(newConv.id);
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to start conversation");
        return;
      }
    }

    if (!currentId) return;

    // Optimistic user message
    const tempUserMsg = {
      id: "temp-" + Date.now(),
      role: "user",
      content: userText,
      created_at: new Date().toISOString(),
      metadata_json: { include_research: researchMode },
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const assistantMsg = await api.conversations.chat(currentId, {
        content: userText,
        include_research: researchMode,
      });

      // Update messages with real assistant message
      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh conversation list to get updated title/time
      const convs = await api.conversations.list();
      setConversations(convs);
    } catch (err: any) {
      setErrorMessage(err.message || "AI inference error. Please check your API key in Settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* Floating Action Trigger Button (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 text-white shadow-glow-purple hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 font-medium text-xs sm:text-sm group"
          aria-label="Open ResearchMeta AI Chatbot"
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span>Research AI Assistant</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/25">SiZ</span>
        </button>
      )}

      {/* Slide-over / Modal Chatbot Panel */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-in-out flex flex-col glass-panel shadow-2xl ${
            isExpanded
              ? "inset-4 sm:inset-8 rounded-3xl"
              : "bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[480px] h-[640px] max-h-[85vh] rounded-3xl"
          }`}
        >
          {/* Top Bar */}
          <div className="px-5 py-3.5 border-b border-brand-500/15 dark:border-brand-500/25 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 rounded-t-3xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    ResearchMeta Assistant
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold border border-brand-500/20">
                    SiZ
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Academic inquiry, source analysis & writing advisor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleStartNewConversation}
                className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                title="New Conversation"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:block"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body with Sidebar (if expanded) + Message Stream */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Conversation History Drawer (visible when expanded or on select) */}
            {isExpanded && (
              <div className="w-64 border-r border-brand-500/15 dark:border-brand-500/25 p-3 flex flex-col bg-slate-50/50 dark:bg-slate-950/40">
                <button
                  onClick={handleStartNewConversation}
                  className="w-full py-2 px-3 mb-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Conversation</span>
                </button>
                <div className="text-[11px] font-semibold text-slate-400 px-2 mb-1.5 uppercase tracking-wider">
                  History
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                  {conversations.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => loadConversation(c.id)}
                      className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between group cursor-pointer transition-colors ${
                        activeConvId === c.id
                          ? "bg-brand-500/15 dark:bg-brand-500/25 text-brand-700 dark:text-brand-300 font-medium"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <span className="truncate pr-2">{c.title || "Academic Inquiry"}</span>
                      <button
                        onClick={(e) => handleDeleteConversation(e, c.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Chat Stream */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* API Key Missing Notice */}
              {hasAiKey === false && (
                <div className="m-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Key className="w-4 h-4 shrink-0 text-amber-600" />
                    <span className="truncate">Connect Gemini or OpenAI in Settings to enable live AI responses.</span>
                  </div>
                  <Link
                    href="/settings"
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-semibold shrink-0"
                  >
                    Settings
                  </Link>
                </div>
              )}

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-3 shadow-inner">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                      ResearchMeta Academic Copilot
                    </h4>
                    <p className="text-xs text-slate-500 max-w-xs mt-1">
                      Ask questions, analyze literature gaps, test thesis statements, or seek assignment writing guidance.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 max-w-md w-full">
                      {[
                        "Synthesize recent findings in generative models",
                        "How do I structure a systematic literature review?",
                        "Critique this thesis statement on quantum computing",
                        "Explain difference between APA and Chicago citations",
                      ].map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => setInput(prompt)}
                          className="p-2 text-left rounded-xl border border-brand-500/15 dark:border-brand-500/25 bg-white/60 dark:bg-slate-900/60 hover:border-brand-500 text-[11px] text-slate-600 dark:text-slate-400 transition-colors"
                        >
                          &ldquo;{prompt}&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role !== "user" && (
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shrink-0 text-xs shadow-sm mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-brand-600 text-white shadow-sm rounded-br-sm"
                          : "glass-card text-slate-800 dark:text-slate-200 rounded-bl-sm"
                      }`}
                    >
                      {/* Message Content */}
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                      {/* Citations if available */}
                      {msg.metadata_json?.citations && msg.metadata_json.citations.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-brand-500/20 space-y-1">
                          <div className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1 uppercase tracking-wider">
                            <BookOpen className="w-3 h-3" />
                            <span>Grounded Literature Sources</span>
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

                      {/* Footer Actions */}
                      <div className="mt-2 flex items-center justify-between text-[10px] opacity-70">
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
                      <div className="w-7 h-7 rounded-xl bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 text-xs shadow-sm mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading / Generating State */}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shrink-0 text-xs shadow-sm animate-pulse">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="glass-card rounded-2xl rounded-bl-sm p-3.5 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                      <span className="text-[11px]">
                        {researchMode ? "Scanning arXiv & Crossref literature..." : "Synthesizing scholarly response..."}
                      </span>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-brand-500/15 dark:border-brand-500/25 bg-white/60 dark:bg-slate-900/60 rounded-b-3xl">
                {/* Research Mode Toggle inside Chat */}
                <div className="flex items-center justify-between pb-2 px-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setResearchMode(!researchMode)}
                      className={`px-2.5 py-0.5 rounded-full font-medium transition-all flex items-center gap-1.5 border ${
                        researchMode
                          ? "bg-brand-500/15 text-brand-700 dark:text-brand-300 border-brand-500/30 shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent"
                      }`}
                    >
                      <Search className="w-3 h-3" />
                      <span>Research Mode: {researchMode ? "ON" : "OFF"}</span>
                    </button>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      {researchMode ? "Grounded in arXiv & Crossref papers" : "Standard conversational reasoning"}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type an academic query, hypothesis, or question..."
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-brand-500/20 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white hover:opacity-95 disabled:opacity-40 transition-all shrink-0 shadow-sm shadow-brand-500/20"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
