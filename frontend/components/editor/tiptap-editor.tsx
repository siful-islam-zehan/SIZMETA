"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Save,
  Clock,
  History,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileCheck,
} from "lucide-react";
import { EditorToolbar } from "./editor-toolbar";
import { VersionHistoryModal } from "./version-history-modal";
import { ExportDialog } from "./export-dialog";
import { api } from "@/lib/api";

interface TipTapEditorProps {
  documentId: string;
  initialTitle: string;
  initialContent: string;
  citationStyle?: string;
  currentVersion?: number;
  versions?: Array<any>;
  onTitleChange?: (newTitle: string) => void;
  onVersionCreated?: () => void;
}

export function TipTapEditor({
  documentId,
  initialTitle,
  initialContent,
  citationStyle = "APA 7th",
  currentVersion = 1,
  versions = [],
  onTitleChange,
  onVersionCreated,
}: TipTapEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<Date>(new Date());
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Write your thesis statement, literature review, methodology, or analysis here...",
      }),
      CharacterCount,
    ],
    content: initialContent || "<p></p>",
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert max-w-none focus:outline-none p-6 sm:p-8 min-h-[500px]",
      },
    },
    onUpdate: ({ editor }) => {
      setSaveStatus("unsaved");
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
      setCharCount(text.length);

      // Trigger debounced autosave
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        performAutosave(editor.getHTML(), title);
      }, 2000);
    },
  });

  // Keep metrics updated on initial load
  useEffect(() => {
    if (editor) {
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
      setCharCount(text.length);
    }
  }, [editor]);

  const performAutosave = useCallback(
    async (htmlContent: string, currentTitle: string) => {
      setSaveStatus("saving");
      try {
        await api.documents.autosave(documentId, {
          content: htmlContent,
          title: currentTitle,
          word_count: wordCount,
          character_count: charCount,
        });
        setSaveStatus("saved");
        setLastSavedTime(new Date());
      } catch {
        setSaveStatus("error");
      }
    },
    [documentId, wordCount, charCount]
  );

  const handleManualSave = async () => {
    if (!editor) return;
    setSaveStatus("saving");
    try {
      await api.documents.update(documentId, {
        title,
        content: editor.getHTML(),
        word_count: wordCount,
        character_count: charCount,
      });
      setSaveStatus("saved");
      setLastSavedTime(new Date());
    } catch {
      setSaveStatus("error");
    }
  };

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleManualSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [title, wordCount, charCount, editor]);

  const handleTitleBlur = () => {
    if (onTitleChange) onTitleChange(title);
    if (editor) {
      performAutosave(editor.getHTML(), title);
    }
  };

  const handleCreateSnapshot = async (summary: string) => {
    await api.documents.createVersion(documentId, summary);
    if (onVersionCreated) onVersionCreated();
  };

  const handleRestoreVersion = async (versionId: string) => {
    const doc = await api.documents.restoreVersion(documentId, versionId);
    setTitle(doc.title);
    if (editor) {
      editor.commands.setContent(doc.content);
    }
    setSaveStatus("saved");
    if (onVersionCreated) onVersionCreated();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Top Document Header Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Document Title"
            className="w-full text-lg sm:text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Style: {citationStyle}
            </span>
            <span className="font-mono text-[11px]">
              v{currentVersion}
            </span>
            <span>&bull;</span>
            <span>{wordCount.toLocaleString()} words</span>
            <span>&bull;</span>
            <span>{charCount.toLocaleString()} characters</span>
          </div>
        </div>

        {/* Action Controls & Autosave Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            {saveStatus === "saved" && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400">Saved</span>
              </>
            )}
            {saveStatus === "saving" && (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span className="text-amber-600 dark:text-amber-400">Saving...</span>
              </>
            )}
            {saveStatus === "unsaved" && (
              <>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Unsaved</span>
              </>
            )}
            {saveStatus === "error" && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-rose-500">Save failed</span>
              </>
            )}
          </div>

          {/* Explicit Save */}
          <button
            type="button"
            onClick={handleManualSave}
            disabled={saveStatus === "saving"}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Explicit Save (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Versions */}
          <button
            type="button"
            onClick={() => setIsVersionModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Version Snapshots"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History ({versions.length})</span>
          </button>

          {/* Export */}
          <button
            type="button"
            onClick={() => setIsExportDialogOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-colors"
            title="Export manuscript"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Editor Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor Paper / Content Canvas */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/30">
        <div className="max-w-4xl mx-auto my-4 sm:my-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[600px]">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Modals */}
      <VersionHistoryModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        versions={versions}
        currentVersion={currentVersion}
        onCreateSnapshot={handleCreateSnapshot}
        onRestoreVersion={handleRestoreVersion}
      />

      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        documentId={documentId}
        documentTitle={title}
        citationStyle={citationStyle}
      />
    </div>
  );
}
