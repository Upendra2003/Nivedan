import React from "react";

interface Props {
  label: string;
  value: number | string;
}

export default function StatCard({ label, value }: Props) {
  return (
    <div style={{
      background: "#f0f4ff",
      borderRadius: 12,
      padding: "1.2rem 1.6rem",
      minWidth: 140,
    }}>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 13, color: "#64748b" }}>{label}</div>
    </div>
  );
}
