import { cn } from "@/lib/utils";

export default function EventToggle({ event, isSelected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 rounded-lg font-semibold transition-all border-2"
      style={{
        backgroundColor: isSelected ? "#551e1b" : "#f5f5f5",
        color: isSelected ? "white" : "#1f2937",
        borderColor: isSelected ? "#551e1b" : "#374151",
        minWidth: "120px",
        textDecoration: isSelected ? "none" : "line-through",
      }}
    >
      {event.label}
    </button>
  );
}