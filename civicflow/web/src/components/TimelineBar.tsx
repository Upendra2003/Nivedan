import React from "react";

interface Step {
  label: string;
  done: boolean;
  timestamp?: string;
}

interface Props {
  steps: Step[];
}

export default function TimelineBar({ steps }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "1.5rem 0" }}>
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: step.done ? "#22c55e" : "#e2e8f0",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: step.done ? "#fff" : "#94a3b8",
              fontWeight: 700, fontSize: 14,
            }}>
              {i + 1}
            </div>
            <div style={{ fontSize: 11, marginTop: 4, color: "#64748b" }}>{step.label}</div>
            {step.timestamp && (
              <div style={{ fontSize: 10, color: "#94a3b8" }}>{step.timestamp}</div>
            )}
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: steps[i + 1].done ? "#22c55e" : "#e2e8f0" }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
