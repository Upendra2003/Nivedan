import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Layout from "../components/Layout";
import { api } from "../services/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Complaint {
  _id: string;
  category: string;
  subcategory: string;
  title?: string;
  status: string;
  current_step_label?: string;
  portal_ref_id?: string;
  portal_ref?: string;
  rejection_reason?: string;
  timeline: { timestamp: string; event: string; detail?: string }[];
  created_at: string;
  updated_at: string;
}

interface Notification {
  _id: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}

const STATUS: Record<string, { bg: string; text: string; label: string }> = {
  pending:      { bg: "bg-slate-100 dark:bg-slate-700", text: "text-slate-600 dark:text-slate-300", label: "Pending" },
  filed:        { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-600 dark:text-blue-400", label: "Filed" },
  submitted:    { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-600 dark:text-blue-400", label: "Submitted" },
  acknowledged: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300", label: "Acknowledged" },
  under_review: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-600 dark:text-amber-400", label: "Under Review" },
  next_step:    { bg: "bg-green-100 dark:bg-green-900/40", text: "text-green-600 dark:text-green-400", label: "In Progress" },
  resolved:     { bg: "bg-green-100 dark:bg-green-900/40", text: "text-green-700 dark:text-green-300", label: "Resolved" },
  failed:       { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-600 dark:text-red-400", label: "Failed" },
};

const PROGRESS_STAGES = ["Filed", "Acknowledged", "Under Review", "Decision"];

function getStageIndex(status: string) {
  if (["filed", "submitted", "pending"].includes(status)) return 0;
  if (status === "acknowledged") return 1;
  if (["under_review", "next_step"].includes(status)) return 2;
  if (["resolved", "failed"].includes(status)) return 3;
  return 0;
}

const CHART_COLORS = ["#3b82f6", "#f59e0b", "#22c55e", "#a855f7", "#ef4444", "#06b6d4"];

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, color, trend }: { label: string; value: number; color: string; trend?: string }) {
  return (
    <div className={`flex-1 min-w-0 rounded-xl p-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800`}>
      <div className={`text-3xl font-extrabold ${color} mb-1`}>{value}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</div>
      {trend && <div className="text-xs text-slate-400 mt-1">{trend}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS["pending"];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function ProgressBar({ status }: { status: string }) {
  const current = getStageIndex(status);
  const failed = status === "failed";
  return (
    <div className="flex items-center gap-0 mt-3">
      {PROGRESS_STAGES.map((stage, i) => {
        const done = i < current;
        const active = i === current;
        const isLast = i === PROGRESS_STAGES.length - 1;
        const dotColor =
          active && failed ? "bg-red-500 ring-2 ring-red-300 dark:ring-red-800"
          : active ? "bg-blue-500 ring-2 ring-blue-300 dark:ring-blue-800"
          : done ? "bg-blue-400 dark:bg-blue-600"
          : "bg-slate-300 dark:bg-slate-600";

        return (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${dotColor} transition-all`} />
              <span className={`text-[10px] whitespace-nowrap ${active ? "font-bold text-slate-700 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"}`}>
                {stage}
              </span>
            </div>
            {!isLast && (
              <div className={`h-0.5 flex-1 mx-1 mb-3.5 ${done || active ? "bg-blue-400 dark:bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function CaseRow({ c, onClick }: { c: Complaint; onClick: () => void }) {
  const subLabel = c.subcategory.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const lastEvent = c.timeline?.[c.timeline.length - 1];

  return (
    <div
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg leading-none">{getCatIcon(c.category)}</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{c.category}</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{subLabel}</div>
        </div>
        <StatusBadge status={c.status} />
      </div>

      {c.title && (
        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mt-1 mb-1 truncate">{c.title}</p>
      )}

      <ProgressBar status={c.status} />

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-slate-400">Filed {fmtDate(c.created_at)}</span>
        {lastEvent && (
          <span className="text-xs text-slate-400 italic truncate max-w-[160px]">
            {lastEvent.event}
          </span>
        )}
      </div>
    </div>
  );
}

function getCatIcon(cat: string) {
  const m: Record<string, string> = {
    "Labor Issues": "⚖️", "Police & Criminal": "🚔",
    "Consumer Complaint": "🛒", "Cyber Fraud": "🔐",
  };
  for (const key of Object.keys(m)) {
    if (cat.toLowerCase().includes(key.toLowerCase().split(" ")[0].toLowerCase())) return m[key];
  }
  return "📋";
}

function NotifItem({ n }: { n: Notification }) {
  return (
    <div className={`flex gap-3 px-4 py-3 ${!n.read ? "border-l-2 border-blue-500" : "border-l-2 border-transparent"}`}>
      <span className="text-base mt-0.5">{getNotifIcon(n.type)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{n.message}</p>
        <p className="text-xs text-slate-400 mt-0.5">{timeAgo(n.created_at)}</p>
      </div>
    </div>
  );
}

function getNotifIcon(type: string) {
  const m: Record<string, string> = {
    filed: "📤", acknowledged: "✅", under_review: "🔍",
    next_step: "🔄", failed: "❌", resolved: "✅",
  };
  return m[type] ?? "🔔";
}

// ── Dashboard page ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Complaint[]>("/complaints/").catch(() => [] as Complaint[]),
      api.get<Notification[]>("/notifications/mine").catch(() => [] as Notification[]),
    ]).then(([c, n]) => {
      setComplaints(c);
      setNotifications(n);
      setLoading(false);
    });
  }, []);

  const total     = complaints.length;
  const active    = complaints.filter((c) => ["pending","filed","acknowledged","under_review","next_step"].includes(c.status)).length;
  const resolved  = complaints.filter((c) => c.status === "resolved").length;
  const failed    = complaints.filter((c) => c.status === "failed").length;

  // Category breakdown for donut chart
  const catMap = new Map<string, number>();
  complaints.forEach((c) => catMap.set(c.category, (catMap.get(c.category) ?? 0) + 1));
  const chartData = Array.from(catMap, ([name, value]) => ({ name, value }));

  return (
    <Layout>
      <div className="p-6 max-w-[1400px] mx-auto">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mb-6">Dashboard</h1>

        {/* ── Stat cards ─────────────────────────────────────────────── */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <StatCard label="Total Complaints" value={total}   color="text-blue-600 dark:text-blue-400" />
          <StatCard label="Active / Pending"  value={active}  color="text-amber-600 dark:text-amber-400" />
          <StatCard label="Resolved"          value={resolved} color="text-green-600 dark:text-green-400" />
          <StatCard label="Failed"            value={failed}  color="text-red-600 dark:text-red-400" />
        </div>

        {/* ── Two-column content ─────────────────────────────────────── */}
        <div className="flex gap-6 items-start">
          {/* Left 60%: Active cases */}
          <div className="flex-[3] min-w-0">
            <h2 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-3">Active Cases</h2>
            {loading ? (
              <div className="flex items-center justify-center h-40 text-slate-400">Loading…</div>
            ) : complaints.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-10 text-center text-slate-400 text-sm">
                No complaints yet. File one from the mobile app.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {complaints.map((c) => (
                  <CaseRow key={c._id} c={c} onClick={() => navigate(`/cases/${c._id}`)} />
                ))}
              </div>
            )}
          </div>

          {/* Right 40%: Chart + Notifications */}
          <div className="flex-[2] min-w-0 flex flex-col gap-5">
            {/* Donut chart */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
              <h2 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-3">Complaints by Category</h2>
              {chartData.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Recent notifications */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-base font-bold text-slate-700 dark:text-slate-300">Notifications</h2>
                <button
                  onClick={() => navigate("/notifications")}
                  className="text-xs text-blue-500 hover:underline font-semibold"
                >
                  See all →
                </button>
              </div>
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">No unread notifications</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-72 overflow-y-auto">
                  {notifications.slice(0, 6).map((n) => <NotifItem key={n._id} n={n} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
