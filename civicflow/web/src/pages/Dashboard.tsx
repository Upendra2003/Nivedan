import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Layout from "../components/Layout";
import { api } from "../services/api";

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const IcoBriefcase = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>;
const IcoShield    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IcoCart      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>;
const IcoLock      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
const IcoFile      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IcoUpload    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>;
const IcoCheck     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoSearch    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoRefresh   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;
const IcoXCircle   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const IcoBell      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>;
const IcoChevron   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>;

// ── Category icon helper ───────────────────────────────────────────────────────

function CatIcon({ cat }: { cat: string }) {
  const c = cat.toLowerCase();
  if (c.includes("labor"))    return <span className="text-amber-500"><IcoBriefcase /></span>;
  if (c.includes("police") || c.includes("criminal")) return <span className="text-blue-500"><IcoShield /></span>;
  if (c.includes("consumer")) return <span className="text-green-500"><IcoCart /></span>;
  if (c.includes("cyber"))    return <span className="text-purple-500"><IcoLock /></span>;
  return <span className="text-slate-400"><IcoFile /></span>;
}

function NotifIconEl({ type }: { type: string }) {
  const base = "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0";
  if (type === "filed")       return <div className={`${base} bg-blue-100 text-blue-600`}><IcoUpload /></div>;
  if (type === "acknowledged") return <div className={`${base} bg-teal-100 text-teal-600`}><IcoCheck /></div>;
  if (type === "under_review") return <div className={`${base} bg-amber-100 text-amber-600`}><IcoSearch /></div>;
  if (type === "next_step")    return <div className={`${base} bg-indigo-100 text-indigo-600`}><IcoRefresh /></div>;
  if (type === "failed")       return <div className={`${base} bg-red-100 text-red-600`}><IcoXCircle /></div>;
  if (type === "resolved")     return <div className={`${base} bg-green-100 text-green-600`}><IcoCheck /></div>;
  return <div className={`${base} bg-slate-100 text-slate-500`}><IcoBell /></div>;
}

// ── Carousel ──────────────────────────────────────────────────────────────────

const CAROUSEL_IMAGES = [
  { src: "/CarouselImage1.png", label: "File complaints in your language" },
  { src: "/CarouselImage2.png", label: "AI-guided step-by-step process" },
  { src: "/CarouselImage3.png", label: "Track your case in real time" },
  { src: "/CarouselImage4.png", label: "Get notified on every update" },
];

function AppCarousel() {
  const [active, setActive] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setActive((p) => (p + 1) % CAROUSEL_IMAGES.length), 4000);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  const go = (i: number) => { setActive(i); startTimer(); };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* Image */}
      <div className="relative bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-slate-700 dark:to-slate-800 overflow-hidden" style={{ height: 200 }}>
        {CAROUSEL_IMAGES.map((img, i) => (
          <img
            key={img.src}
            src={img.src}
            alt={img.label}
            className={`absolute inset-0 w-full h-full object-contain p-4 transition-all duration-500 ${
              i === active ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          />
        ))}
      </div>
      {/* Text below image */}
      <div className="px-4 py-3 flex flex-col gap-2">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug min-h-[2.5rem]">
          {CAROUSEL_IMAGES[active].label}
        </p>
        {/* Dot indicators */}
        <div className="flex items-center gap-1.5">
          {CAROUSEL_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-5 bg-purple-600" : "w-1.5 bg-slate-300 dark:bg-slate-600"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Complaint {
  _id: string;
  category: string;
  subcategory: string;
  title?: string;
  status: string;
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

const STATUS: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pending:      { bg: "bg-slate-100 dark:bg-slate-700", text: "text-slate-600 dark:text-slate-300", dot: "bg-slate-400", label: "Pending" },
  filed:        { bg: "bg-blue-50 dark:bg-blue-900/30",  text: "text-blue-600 dark:text-blue-400",  dot: "bg-blue-500",  label: "Filed" },
  submitted:    { bg: "bg-blue-50 dark:bg-blue-900/30",  text: "text-blue-600 dark:text-blue-400",  dot: "bg-blue-500",  label: "Submitted" },
  acknowledged: { bg: "bg-teal-50 dark:bg-teal-900/30",  text: "text-teal-700 dark:text-teal-300",  dot: "bg-teal-500",  label: "Acknowledged" },
  under_review: { bg: "bg-amber-50 dark:bg-amber-900/30",text: "text-amber-600 dark:text-amber-400",dot: "bg-amber-500", label: "Under Review" },
  next_step:    { bg: "bg-indigo-50 dark:bg-indigo-900/30",text:"text-indigo-600 dark:text-indigo-400",dot:"bg-indigo-500",label:"In Progress"},
  resolved:     { bg: "bg-green-50 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400",dot: "bg-green-500", label: "Resolved" },
  failed:       { bg: "bg-red-50 dark:bg-red-900/30",    text: "text-red-600 dark:text-red-400",   dot: "bg-red-500",   label: "Failed" },
};

const PROGRESS_STAGES = ["Filed", "Acknowledged", "Under Review", "Decision"];

function getStageIndex(status: string) {
  if (["filed", "submitted", "pending"].includes(status)) return 0;
  if (status === "acknowledged") return 1;
  if (["under_review", "next_step"].includes(status)) return 2;
  if (["resolved", "failed"].includes(status)) return 3;
  return 0;
}

const CHART_COLORS = ["#7c3aed", "#f59e0b", "#22c55e", "#3b82f6", "#ef4444", "#06b6d4"];

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="flex-1 min-w-0 rounded-xl p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} bg-opacity-10 flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{value}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-tight">{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS["pending"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
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
          active && failed ? "bg-red-500 ring-2 ring-red-200"
          : active ? "bg-purple-500 ring-2 ring-purple-200"
          : done  ? "bg-purple-400"
          : "bg-slate-200 dark:bg-slate-600";
        return (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-2.5 h-2.5 rounded-full ${dotColor} transition-all`} />
              <span className={`text-[9px] whitespace-nowrap ${active ? "font-bold text-slate-700 dark:text-slate-200" : "text-slate-400"}`}>
                {stage}
              </span>
            </div>
            {!isLast && (
              <div className={`h-px flex-1 mx-1 mb-3.5 ${done ? "bg-purple-400" : "bg-slate-200 dark:bg-slate-600"}`} />
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
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-sm transition-all"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center flex-shrink-0">
            <CatIcon cat={c.category} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{c.category}</div>
            <div className="text-xs text-slate-400">{subLabel}</div>
          </div>
        </div>
        <StatusBadge status={c.status} />
      </div>

      {c.title && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 truncate">{c.title}</p>
      )}

      <ProgressBar status={c.status} />

      <div className="flex items-center justify-between mt-2.5">
        <span className="text-xs text-slate-400">Filed {fmtDate(c.created_at)}</span>
        {lastEvent && (
          <span className="text-xs text-slate-400 truncate max-w-[150px]">{lastEvent.event}</span>
        )}
      </div>
    </div>
  );
}

function NotifItem({ n }: { n: Notification }) {
  return (
    <div className={`flex gap-3 px-4 py-3 ${!n.read ? "bg-purple-50/50 dark:bg-purple-900/10" : ""}`}>
      <NotifIconEl type={n.type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{n.message}</p>
        <p className="text-xs text-slate-400 mt-0.5">{timeAgo(n.created_at)}</p>
      </div>
      {!n.read && <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />}
    </div>
  );
}

// ── Dashboard page ────────────────────────────────────────────────────────────

const IcoTotal   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IcoActive  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoResolved= () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IcoFailed  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;

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

  const total    = complaints.length;
  const active   = complaints.filter((c) => ["pending","filed","acknowledged","under_review","next_step"].includes(c.status)).length;
  const resolved = complaints.filter((c) => c.status === "resolved").length;
  const failed   = complaints.filter((c) => c.status === "failed").length;

  const catMap = new Map<string, number>();
  complaints.forEach((c) => catMap.set(c.category, (catMap.get(c.category) ?? 0) + 1));
  const chartData = Array.from(catMap, ([name, value]) => ({ name, value }));

  return (
    <Layout>
      <div className="p-6 max-w-[1400px] mx-auto">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-5">Dashboard</h1>

        {/* ── Stat cards ─────────────────────────────────────────────── */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <StatCard label="Total"    value={total}    color="text-purple-600" icon={<IcoTotal />} />
          <StatCard label="Active"   value={active}   color="text-amber-500"  icon={<IcoActive />} />
          <StatCard label="Resolved" value={resolved} color="text-green-500"  icon={<IcoResolved />} />
          <StatCard label="Failed"   value={failed}   color="text-red-500"    icon={<IcoFailed />} />
        </div>

        {/* ── Three-column content ────────────────────────────────────── */}
        <div className="flex gap-5 items-start">

          {/* Col 1 — Active cases (60%) */}
          <div className="flex-[3] min-w-0">
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Active Cases</h2>
            {loading ? (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>
            ) : complaints.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-10 text-center">
                <div className="text-slate-300 dark:text-slate-600 mb-2"><IcoFile /></div>
                <p className="text-slate-400 text-sm">No complaints yet. File one from the mobile app.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {complaints.map((c) => (
                  <CaseRow key={c._id} c={c} onClick={() => navigate(`/cases/${c._id}`)} />
                ))}
              </div>
            )}
          </div>

          {/* Col 2 — Chart + Notifications (30%) */}
          <div className="flex-[2] min-w-0 flex flex-col gap-4">
            {/* Donut chart */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">By Category</h2>
              {chartData.length === 0 ? (
                <div className="h-36 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
                      {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Recent notifications */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notifications</h2>
                <button onClick={() => navigate("/notifications")} className="text-xs text-purple-600 font-semibold flex items-center gap-0.5 hover:underline">
                  See all <IcoChevron />
                </button>
              </div>
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">No notifications</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-72 overflow-y-auto">
                  {notifications.slice(0, 6).map((n) => <NotifItem key={n._id} n={n} />)}
                </div>
              )}
            </div>
          </div>

          {/* Col 3 — App Carousel vertical (fixed width) */}
          <div className="w-52 flex-shrink-0">
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Mobile App</h2>
            <AppCarousel />
          </div>

        </div>
      </div>
    </Layout>
  );
}
