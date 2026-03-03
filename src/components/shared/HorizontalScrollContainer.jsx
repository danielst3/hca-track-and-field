import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * A horizontally scrollable container that shows a right-side gradient fade
 * when content overflows, disappearing once the user scrolls to the end.
 */
export default function HorizontalScrollContainer({ children, className }) {
  const scrollRef = useRef(null);
  const [showFade, setShowFade] = useState(false);

  const checkOverflow = () => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth;
    const scrolledToEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setShowFade(hasOverflow && !scrolledToEnd);
  };

  useEffect(() => {
    checkOverflow();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkOverflow);
    window.addEventListener("resize", checkOverflow);
    return () => {
      el.removeEventListener("scroll", checkOverflow);
      window.removeEventListener("resize", checkOverflow);
    };
  }, [children]);

  return (
    <div className="relative">
      <div
        ref={scrollRef} className="pt-3 pb-3 flex gap-2 overflow-x-auto scroll-smooth scrollbar-hide [scroll-snap-type:x_mandatory]"






        style={{ WebkitOverflowScrolling: "touch" }}>

        {children}
      </div>
      {/* Right fade gradient — only visible when overflow exists */}
      {showFade &&
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-2 w-15"
        style={{
          background: "linear-gradient(to right, transparent, var(--fade-color, rgba(248,250,252,0.95)))"
        }} />

      }
    </div>);

}