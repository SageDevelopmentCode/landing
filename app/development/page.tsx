"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingSMSButton from "../components/FloatingSMSButton";

type DevelopmentTask = {
  id: string;
  title: string;
  status: "not_started" | "in_progress" | "done";
  assignee: string | null;
  created_at: string;
};

const KANBAN_COLUMNS = [
  {
    key: "not_started",
    label: "Not Started",
    accent: "#f59e0b",
    bgAccent: "#fffbeb",
    textAccent: "#92400e",
  },
  {
    key: "in_progress",
    label: "In Progress",
    accent: "#3b82f6",
    bgAccent: "#eff6ff",
    textAccent: "#1e40af",
  },
  {
    key: "done",
    label: "Done",
    accent: "#22c55e",
    bgAccent: "#f0fdf4",
    textAccent: "#166534",
  },
] as const;

const ASSIGNEE_COLORS: Record<string, { bg: string; text: string }> = {
  Sabrina: { bg: "#fce7f3", text: "#9d174d" },
  Paige:   { bg: "#ede9fe", text: "#5b21b6" },
  Zelinda: { bg: "#d1fae5", text: "#065f46" },
  Julius:  { bg: "#dbeafe", text: "#1e40af" },
};

function getAssigneeColor(name: string) {
  if (ASSIGNEE_COLORS[name]) return ASSIGNEE_COLORS[name];
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue = hash % 360;
  return { bg: `hsl(${hue}, 70%, 90%)`, text: `hsl(${hue}, 50%, 30%)` };
}

export default function DevelopmentPage() {
  const [tasks, setTasks] = useState<DevelopmentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/development-tasks")
      .then((res) => res.json())
      .then((json) => {
        console.log("[development] API response:", json);
        if (json.error) {
          setError(json.error);
        } else {
          setTasks(json.tasks ?? []);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("[development] fetch error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      {/* Header */}
      <section className="pt-32 pb-12 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              Our Campus
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold text-center mb-6 font-heading text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            School Development
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-center text-gray-600 font-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            Follow along as we build out our outdoor campus. Here&apos;s everything
            we&apos;re working on.
          </motion.p>
        </div>
      </section>

      {/* Kanban Board */}
      <section className="pb-24 px-8 sm:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="overflow-x-auto pb-4"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-mono">
              Error: {error}
            </div>
          )}

          {loading ? (
            <div className="flex gap-4">
              {KANBAN_COLUMNS.map((col) => (
                <div
                  key={col.key}
                  className="w-80 flex-shrink-0 bg-gray-50 rounded-2xl p-4 border border-gray-200"
                >
                  <div className="h-6 bg-gray-200 rounded-full w-24 mb-4 animate-pulse" />
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-gray-100 rounded-xl mb-3 animate-pulse"
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 min-w-max">
              {KANBAN_COLUMNS.map((col, colIdx) => {
                const colTasks = tasks.filter((t) => t.status === col.key);
                return (
                  <motion.div
                    key={col.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.1 * colIdx,
                      ease: "easeOut",
                    }}
                    className="w-80 flex-shrink-0 flex flex-col gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-200"
                  >
                    {/* Column header */}
                    <div
                      className="flex items-center justify-between pl-3 py-1.5"
                      style={{ borderLeft: `3px solid ${col.accent}` }}
                    >
                      <span className="text-sm font-semibold text-gray-700 font-body">
                        {col.label}
                      </span>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: col.bgAccent,
                          color: col.textAccent,
                        }}
                      >
                        {colTasks.length}
                      </span>
                    </div>

                    {/* Cards */}
                    {colTasks.length === 0 ? (
                      <p className="text-xs text-gray-400 italic px-3 py-2">
                        No tasks yet
                      </p>
                    ) : (
                      colTasks.map((task, i) => {
                        const assigneeColor = task.assignee
                          ? getAssigneeColor(task.assignee)
                          : null;
                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.3,
                              delay: 0.05 * i,
                              ease: "easeOut",
                            }}
                            className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <p className="text-sm text-gray-800 font-body leading-snug">
                              {task.title}
                            </p>
                            {task.assignee && assigneeColor && (
                              <div className="mt-2">
                                <span
                                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
                                  style={{
                                    backgroundColor: assigneeColor.bg,
                                    color: assigneeColor.text,
                                  }}
                                >
                                  {task.assignee}
                                </span>
                              </div>
                            )}
                          </motion.div>
                        );
                      })
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </section>

      <Footer />
      <FloatingSMSButton />
    </div>
  );
}
