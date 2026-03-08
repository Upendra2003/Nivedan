import React from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  id: string;
  category: string;
  subcategory: string;
  status: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  approved: "#22c55e",
  failed: "#ef4444",
};

export default function CaseCard({ id, category, subcategory, status, createdAt }: Props) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/cases/${id}`)}
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "1rem",
        marginBottom: 12,
        cursor: "pointer",
      }}
    >
      <div style={{ fontWeight: 600 }}>{category} &rsaquo; {subcategory}</div>
      <div style={{ fontSize: 12, color: "#64748b" }}>{new Date(createdAt).toLocaleDateString()}</div>
      <span style={{
        display: "inline-block",
        marginTop: 8,
        padding: "2px 10px",
        borderRadius: 999,
        background: STATUS_COLORS[status] ?? "#e2e8f0",
        color: "#fff",
        fontSize: 12,
      }}>
        {status}
      </span>
    </div>
  );
}
