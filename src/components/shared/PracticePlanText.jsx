import React from "react";
import DrillLink, { parseDrillText } from "./DrillLink";

export default function PracticePlanText({ text }) {
  if (!text) return null;

  const parts = parseDrillText(text);

  return (
    <p className="text-slate-700 dark:text-gray-300 whitespace-pre-wrap">
      {parts.map((part, idx) => {
        if (part.type === 'drill') {
          return <DrillLink key={idx} drillKey={part.drillKey} displayText={part.displayText} />;
        }
        return <span key={idx}>{part.content}</span>;
      })}
    </p>
  );
}