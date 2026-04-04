import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";

interface Notification {
  _id: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

type Filter = "all" | "unread" | "status" | "rejections";

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getIcon(type: string) {
  const m: Record<string, string> = {
    filed: "📤", acknowledged: "✅", under_review: "🔍",
    next_step: "🔄", failed: "❌", resolved: "🏆",
  };
  return m[type] ?? "🔔";
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all",        label: "All" },
  { key: "unread",     label: "Unread" },
  { key: "status",     label: "Status Updates" },
  { key: "rejections", label: "Rejections" },
];

export default function Notifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    api.get<Notification[]>("/notifications/mine")
      .then((n) => { setItems(n); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    try {
      await api.post(`/notifications/read/${id}`, {});
      setItems((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    const unread = items.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markRead(n._id)));
  };

  const filtered = items.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "status") return ["filed","acknowledged","under_review","next_step","resolved"].includes(n.type);
    if (filter === "rejections") return n.type === "failed";
    return true;
  });

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {unreadCount} unread
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mb-6 w-fit">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                filter === f.key
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm gap-2">
              <span className="text-3xl">🔔</span>
              <span>No notifications in this category</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map((n) => (
                <div
                  key={n._id}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                    !n.read
                      ? "bg-blue-50/60 dark:bg-blue-900/10 border-l-4 border-blue-500"
                      : "border-l-4 border-transparent"
                  }`}
                >
                  <span className="text-xl mt-0.5 flex-shrink-0">{getIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${!n.read ? "font-semibold text-slate-800 dark:text-slate-200" : "text-slate-600 dark:text-slate-400"}`}>
                      {n.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-slate-400">{timeAgo(n.created_at)}</span>
                      {n.type && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 capitalize">
                          {n.type.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => markRead(n._id)}
                      className="flex-shrink-0 text-xs text-blue-500 hover:text-blue-700 font-semibold whitespace-nowrap"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
