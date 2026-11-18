"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  Sliders,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";

export default function RubricsPage() {
  const [rubrics, setRubrics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [criteria, setCriteria] = useState<Array<{ name: string; description: string; weight: number }>>([
    { name: "Thesis & Research Question", description: "Clarity, novelty, and academic focus of the thesis statement.", weight: 25 },
    { name: "Methodology & Literature Review", description: "Rigor of cited sources, critical analysis of existing corpus.", weight: 35 },
    { name: "Argumentation & Evidence", description: "Empirical support, logical validity, and factual accuracy.", weight: 25 },
    { name: "Academic Style & Citations", description: "Adherence to style standard (APA/MLA), formatting, and mechanics.", weight: 15 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRubrics = async () => {
    setIsLoading(true);
    try {
      const data = await api.rubrics.list();
      setRubrics(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRubrics();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await api.rubrics.create({
        title: title.trim(),
        description: description.trim() || undefined,
        max_score: maxScore,
        criteria,
      });
      setIsCreateOpen(false);
      setTitle("");
      setDescription("");
      await loadRubrics();
    } catch (err: any) {
      alert("Error creating rubric: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, rTitle: string) => {
    if (!confirm(`Are you sure you want to delete rubric "${rTitle}"?`)) return;
    try {
      await api.rubrics.delete(id);
      await loadRubrics();
    } catch (err: any) {
      alert("Error deleting rubric: " + err.message);
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Academic Assignment Rubrics
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Structure grading criteria, evaluation weights, and assignment benchmarks.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Rubric</span>
          </button>
        </div>

        {/* Rubrics List */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading rubrics...</div>
        ) : rubrics.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <Award className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">No rubrics created yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create an academic grading rubric with weighted criteria to benchmark and review your papers.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Rubric</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rubrics.map((r) => (
              <div
                key={r.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 font-semibold">
                      Max Score: {r.max_score} pts
                    </span>
                    <button
                      onClick={() => handleDelete(r.id, r.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                      title="Delete rubric"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mt-2">
                    {r.title}
                  </h3>

                  {r.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {r.description}
                    </p>
                  )}

                  <div className="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <h4 className="text-[11px] uppercase font-mono text-slate-400 tracking-wider">
                      Criteria & Weights
                    </h4>
                    {r.criteria && r.criteria.length > 0 ? (
                      <div className="space-y-1.5">
                        {r.criteria.map((c: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 text-xs flex items-center justify-between"
                          >
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {c.name}
                            </span>
                            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              {c.weight || c.weight_percentage || 0}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No criteria defined.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Rubric Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">Create Academic Rubric</h3>
              <form onSubmit={handleCreate} className="space-y-3 text-xs">
                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Rubric Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Master's Thesis Evaluation Rubric"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Max Score
                    </label>
                    <input
                      type="number"
                      value={maxScore}
                      onChange={(e) => setMaxScore(parseFloat(e.target.value) || 100)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Course, assignment description, or department instructions..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none"
                  />
                </div>

                {/* Preconfigured Criteria Display */}
                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Evaluation Criteria ({criteria.length} areas)
                  </label>
                  <div className="space-y-1.5">
                    {criteria.map((c, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                      >
                        <span className="font-medium text-slate-700 dark:text-slate-300">{c.name}</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{c.weight}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
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
                    {isSubmitting ? "Creating..." : "Save Rubric"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
