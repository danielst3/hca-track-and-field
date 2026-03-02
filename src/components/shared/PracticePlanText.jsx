import React from "react";
import { parseDrillText, useResourceTitles } from "./DrillLink";
import DrillLink from "./DrillLink";

export default function PracticePlanText({ text }) {
  const resources = useResourceTitles();
  if (!text) return null;

  const parts = parseDrillText(text, resources);

  return (
    <p className="text-slate-700 dark:text-gray-300 whitespace-pre-wrap">
      {parts.map((part, idx) => {
        if (part.type === "drill") {
          return (
            <DrillLink
              key={idx}
              linkItem={part.linkItem}
              displayText={part.displayText}
              resources={resources}
            />
          );
        }
        return <span key={idx}>{part.content}</span>;
      })}
    </p>
  );
}