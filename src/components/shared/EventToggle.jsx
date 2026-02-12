import { cn } from "@/lib/utils";

export default function EventToggle({ event, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg font-semibold transition-all border-2",
        isSelected
          ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]"
          : "!bg-white !text-black !border-black line-through"
      )}
      style={{
        backgroundColor: isSelected ? "var(--brand-primary)" : "white",
        color: isSelected ? "white" : "black",
        borderColor: "black",
      }}
    >
      {event.label}
    </button>
  );
}