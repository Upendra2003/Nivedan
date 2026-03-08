import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { api } from "../services/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TimelineEvent {
  timestamp: string;
  event: string;
  detail?: string;
}

interface Document {
  name: string;
  type: string;
  uploaded_at: string;
}

interface Complaint {
  _id: string;
  category: string;
  subcategory: string;
  title?: string;
  status: string;
  current_step_label?: string;
  form_data?: Record<string, string>;
  portal_ref_id?: string;
  portal_ref?: string;
  rejection_reason?: string;
  resubmission_count?: number;
  timeline: TimelineEvent[];
  documents?: Document[];
  created_at: string;
  updated_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function fmtDateShort(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
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

function getTimelineIcon(event: string) {
  const e = event.toLowerCase();
  if (e.includes("submit") || e.includes("filed")) return "📤";
  if (e.includes("acknowledg")) return "✅";
  if (e.includes("review")) return "🔍";
  if (e.includes("fail") || e.includes("reject")) return "❌";
  if (e.includes("resolv")) return "🏆";
  if (e.includes("resubmit")) return "🔄";
  if (e.includes("start") || e.includes("creat")) return "🆕";
  return "📌";
}

function isFailedEvent(event: string) {
  return event.toLowerCase().includes("fail") || event.toLowerCase().includes("reject");
}

function isResubmitEvent(event: string) {
  return event.toLowerCase().includes("resubmit");
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get<Complaint>(`/complaints/${id}`)
      .then((c) => { setComplaint(c); setLoading(false); })
      .catch((err) => {
        try { setError(JSON.parse(err.message).error); }
        catch { setError("Could not load complaint."); }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>
      </Layout>
    );
  }

  if (error || !complaint) {
    return (
      <Layout>
        <div className="p-8">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-5 text-red-600 dark:text-red-400 text-sm">
            {error ?? "Complaint not found."}
          </div>
          <button onClick={() => navigate("/dashboard")} className="mt-4 text-blue-500 text-sm hover:underline">
            ← Back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  const s = STATUS[complaint.status] ?? STATUS["pending"];
  const subLabel = complaint.subcategory.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const portalRef = complaint.portal_ref_id ?? complaint.portal_ref;
  const sortedTimeline = [...(complaint.timeline ?? [])].reverse(); // latest first

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-500 transition-colors mb-5"
        >
          ← Back to Dashboard
        </button>

        {/* ── Top section ──────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 font-medium">
            <span>{complaint.category}</span>
            <span>›</span>
            <span>{subLabel}</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                {complaint.title ?? `${subLabel} Complaint`}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
                {s.label}
              </span>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-6 mt-5 text-sm text-slate-500 dark:text-slate-400">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Filed</span>
              <br />{fmtDateShort(complaint.created_at)}
            </div>
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Last Updated</span>
              <br />{fmtDateShort(complaint.updated_at)}
            </div>
            {portalRef && (
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Portal Ref ID</span>
                <br />
                <code className="text-blue-500 text-xs">{portalRef}</code>
              </div>
            )}
            {complaint.current_step_label && (
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Current Step</span>
                <br />{complaint.current_step_label}
              </div>
            )}
          </div>
        </div>

        {/* ── Rejection panel ───────────────────────────────────────────── */}
        {complaint.status === "failed" && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 rounded-xl p-5 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">❌</span>
              <h3 className="font-bold text-red-600 dark:text-red-400 text-base">
                This complaint was rejected
              </h3>
            </div>
            {complaint.rejection_reason && (
              <p className="text-sm text-red-600 dark:text-red-300 mb-3">
                <span className="font-semibold">Reason:</span> {complaint.rejection_reason}
              </p>
            )}
            <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-xs text-red-500 dark:text-red-300">
              📱 To resubmit, open the CivicFlow mobile app, go to My Cases, and tap this complaint.
            </div>
          </div>
        )}

        {/* ── Timeline ──────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-5">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-5">Timeline</h2>
          {sortedTimeline.length === 0 ? (
            <p className="text-sm text-slate-400">No timeline events yet.</p>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700" />
              <div className="flex flex-col gap-6">
                {sortedTimeline.map((ev, i) => {
                  const isFailed = isFailedEvent(ev.event);
                  const isResub = isResubmitEvent(ev.event);
                  return (
                    <div key={i} className="flex gap-4 relative">
                      {/* Node */}
                      <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-sm z-10 ${
                        isFailed ? "bg-red-100 dark:bg-red-900/40"
                        : isResub ? "bg-amber-100 dark:bg-amber-900/40"
                        : "bg-slate-100 dark:bg-slate-700"
                      }`}>
                        {getTimelineIcon(ev.event)}
                      </div>
                      {/* Content */}
                      <div className="flex-1 pb-1">
                        <div className="flex items-center gap-3 mb-0.5">
                          <span className={`text-sm font-semibold ${
                            isFailed ? "text-red-600 dark:text-red-400"
                            : isResub ? "text-amber-600 dark:text-amber-400"
                            : "text-slate-800 dark:text-slate-200"
                          }`}>
                            {ev.event}
                          </span>
                        </div>
                        {ev.detail && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{ev.detail}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">{fmtDate(ev.timestamp)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Documents ─────────────────────────────────────────────────── */}
        {(complaint.documents ?? []).length > 0 && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-5">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4">Documents</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {complaint.documents!.map((doc, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-1 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📄</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {doc.name}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 mt-1">
                    {fmtDateShort(doc.uploaded_at)}
                  </span>
                  <a
                    href="#"
                    className="text-xs text-blue-500 hover:underline font-semibold mt-1"
                    onClick={(e) => e.preventDefault()}
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Form data ─────────────────────────────────────────────────── */}
        {complaint.form_data && Object.keys(complaint.form_data).length > 0 && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4">Filed Information</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {Object.entries(complaint.form_data).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {k.replace(/_/g, " ")}
                  </dt>
                  <dd className="text-sm text-slate-800 dark:text-slate-200 mt-0.5">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </Layout>
  );
}
