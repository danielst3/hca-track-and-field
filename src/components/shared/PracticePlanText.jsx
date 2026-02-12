import React from "react";
import DrillLink, { parseDrillText } from "./DrillLink";

export default function PracticePlanText({ text }) {
  if (!text) return null;

  const parts = parseDrillText(text);

  return (
    <p className="text-slate-700 whitespace-pre-wrap">
      {parts.map((part, idx) => {
        if (part.type === 'drill') {
          return <DrillLink key={idx} code={part.code} />;
        }
        return <span key={idx}>{part.content}</span>;
      })}
    </p>
  );
}