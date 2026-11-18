"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import {
  FolderKanban,
  Plus,
  Trash2,
  FileText,
  BookOpen,
  ArrowRight,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

function ProjectsContent() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [academicLevel, setAcademicLevel] = useState("Undergraduate");
  const [researchField, setResearchField] = useState("Computer Science");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await api.projects.list();
      setProjects(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    if (searchParams.get("create") === "true") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await api.projects.create({
        title: title.trim(),
        description: description.trim() || undefined,
        academic_level: academicLevel,
        research_field: researchField,
        status: "active",
      });
      setIsCreateOpen(false);
      setTitle("");
      setDescription("");
      await loadProjects();
    } catch (err: any) {
      alert("Error creating project: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, projTitle: string) => {
    if (!confirm(`Are you sure you want to delete project "${projTitle}"? Associated documents will remain.`)) return;
    try {
      await api.projects.delete(id);
      await loadProjects();
    } catch (err: any) {
      alert("Error deleting project: " + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Research Projects
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize your research topics, papers, sources, and rubrics in isolated workspaces.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <FolderKanban className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">No research projects yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create a research project to structure your academic assignment, sources, and documents together.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm flex flex-col justify-between group transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    {proj.academic_level}
                  </span>
                  <button
                    onClick={() => handleDelete(proj.id, proj.title)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mt-2 line-clamp-1">
                  {proj.title}
                </h3>

                {proj.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {proj.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-3">
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <FileText className="w-3 h-3" /> {proj.document_count} doc(s)
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <BookOpen className="w-3 h-3" /> {proj.source_count} source(s)
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatDate(proj.updated_at)}
                </span>
                <Link
                  href={`/documents?project_id=${proj.id}`}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>View Docs</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">Create Research Project</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus in Blockchain"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Research Field
                </label>
                <input
                  type="text"
                  value={researchField}
                  onChange={(e) => setResearchField(e.target.value)}
                  placeholder="e.g. Computer Science, Neuroscience, Economics"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Academic Level
                </label>
                <select
                  value={academicLevel}
                  onChange={(e) => setAcademicLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Graduate">Graduate / Master's</option>
                  <option value="Doctoral">Doctoral / Ph.D.</option>
                  <option value="Postdoctoral">Postdoctoral / Faculty</option>
                  <option value="Professional">Professional Industry</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Project Summary (Optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key research questions, scope, and objectives..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-sm transition-colors"
                >
                  {isSubmitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-xs text-slate-400">Loading projects workspace...</div>}>
        <ProjectsContent />
      </Suspense>
    </AppShell>
  );
}
