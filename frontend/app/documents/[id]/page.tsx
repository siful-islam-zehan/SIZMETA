"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TipTapEditor } from "@/components/editor/tiptap-editor";
import { api } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DocumentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params?.id as string;

  const [document, setDocument] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocument = async () => {
    try {
      const data = await api.documents.get(documentId);
      setDocument(data);
    } catch (err: any) {
      setError(err.message || "Failed to load document");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[70vh] text-xs text-slate-400">
          Loading workspace...
        </div>
      </AppShell>
    );
  }

  if (error || !document) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto my-16 text-center space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {error || "Document not found"}
          </h2>
          <p className="text-xs text-slate-500">
            The document could not be loaded or you do not have permission to view it.
          </p>
          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Documents</span>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="h-[calc(100vh-5.5rem)] flex flex-col">
        {/* Navigation Breadcrumb */}
        <div className="mb-2 flex items-center justify-between">
          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Documents</span>
          </Link>
        </div>

        {/* TipTap Editor Mount */}
        <div className="flex-1 min-h-0">
          <TipTapEditor
            documentId={document.id}
            initialTitle={document.title}
            initialContent={document.content}
            citationStyle={document.citation_style}
            currentVersion={document.current_version}
            versions={document.versions || []}
            onTitleChange={(t) => setDocument((prev: any) => ({ ...prev, title: t }))}
            onVersionCreated={fetchDocument}
          />
        </div>
      </div>
    </AppShell>
  );
}
