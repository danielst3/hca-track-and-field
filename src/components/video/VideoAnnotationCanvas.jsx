import React, { useRef, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Minus, Triangle, Trash2, Save, Undo, Palette } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ffffff"];

export default function VideoAnnotationCanvas({ analysisId, videoUrl }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [tool, setTool] = useState("line");
  const [drawMode, setDrawMode] = useState(false);
  const [color, setColor] = useState("#ef4444");
  const [annotations, setAnnotations] = useState([]);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [saving, setSaving] = useState(false);
  const [annotationId, setAnnotationId] = useState(null);

  // Load existing annotations
  useEffect(() => {
    base44.entities.VideoAnnotation.filter({ analysis_id: analysisId }).then((results) => {
      if (results.length > 0) {
        setAnnotations(results[0].annotations || []);
        setAnnotationId(results[0].id);
      }
    });
  }, [analysisId]);

  // Sync canvas internal resolution to its rendered size
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const sync = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const drawAnnotation = useCallback((ctx, ann) => {
    ctx.strokeStyle = ann.color || "#ef4444";
    ctx.lineWidth = 2.5;
    ctx.fillStyle = ann.color || "#ef4444";
    ctx.setLineDash([]);

    if (ann.type === "line" && ann.points?.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(ann.points[0].x, ann.points[0].y);
      ctx.lineTo(ann.points[1].x, ann.points[1].y);
      ctx.stroke();
      // Arrow head
      const headLen = 12;
      const angle = Math.atan2(ann.points[1].y - ann.points[0].y, ann.points[1].x - ann.points[0].x);
      ctx.beginPath();
      ctx.moveTo(ann.points[1].x, ann.points[1].y);
      ctx.lineTo(ann.points[1].x - headLen * Math.cos(angle - Math.PI / 6), ann.points[1].y - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(ann.points[1].x - headLen * Math.cos(angle + Math.PI / 6), ann.points[1].y - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    } else if (ann.type === "angle" && ann.points?.length >= 3) {
      ctx.beginPath();
      ctx.moveTo(ann.points[0].x, ann.points[0].y);
      ctx.lineTo(ann.points[1].x, ann.points[1].y);
      ctx.lineTo(ann.points[2].x, ann.points[2].y);
      ctx.stroke();
      const v1 = { x: ann.points[0].x - ann.points[1].x, y: ann.points[0].y - ann.points[1].y };
      const v2 = { x: ann.points[2].x - ann.points[1].x, y: ann.points[2].y - ann.points[1].y };
      const dot = v1.x * v2.x + v1.y * v2.y;
      const mag = Math.sqrt(v1.x**2+v1.y**2) * Math.sqrt(v2.x**2+v2.y**2);
      const deg = Math.round((Math.acos(Math.max(-1, Math.min(1, dot/mag))) * 180) / Math.PI);
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(`${deg}°`, ann.points[1].x + 8, ann.points[1].y - 8);
    }
  }, []);

  // Redraw everything
  const redraw = useCallback((anns, pts, clr, tl) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    anns.forEach((ann) => drawAnnotation(ctx, ann));
    if (pts.length > 0) {
      ctx.strokeStyle = clr;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.fillStyle = clr;
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, 5, 0, Math.PI * 2);
      ctx.fill();
      if (pts.length > 1) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.stroke();
        if (tl === "angle") {
          ctx.beginPath();
          ctx.arc(pts[1].x, pts[1].y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.setLineDash([]);
    }
  }, [drawAnnotation]);

  useEffect(() => {
    redraw(annotations, currentPoints, color, tool);
  }, [annotations, currentPoints, color, tool, redraw]);

  const getPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0] || e.changedTouches?.[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const pt = getPoint(e);

    if (tool === "line") {
      if (currentPoints.length === 0) {
        setCurrentPoints([pt]);
      } else {
        const newAnn = { type: "line", points: [currentPoints[0], pt], color };
        setAnnotations(prev => [...prev, newAnn]);
        setCurrentPoints([]);
      }
    } else if (tool === "angle") {
      const next = [...currentPoints, pt];
      if (next.length < 3) {
        setCurrentPoints(next);
      } else {
        setAnnotations(prev => [...prev, { type: "angle", points: next, color }]);
        setCurrentPoints([]);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    if (annotationId) {
      await base44.entities.VideoAnnotation.update(annotationId, { annotations });
    } else {
      const rec = await base44.entities.VideoAnnotation.create({ analysis_id: analysisId, video_url: videoUrl, annotations });
      setAnnotationId(rec.id);
    }
    setSaving(false);
    toast.success("Annotations saved.");
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-900 rounded-lg">
        <Button
          size="sm"
          onClick={() => { setDrawMode(v => !v); setCurrentPoints([]); }}
          className={`h-7 text-xs gap-1.5 ${drawMode ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-300"}`}
        >
          ✏️ {drawMode ? "Drawing ON" : "Drawing OFF"}
        </Button>
        <div className="w-px h-4 bg-slate-600" />
        <Button
          size="sm"
          variant={tool === "line" ? "default" : "ghost"}
          onClick={() => { setTool("line"); setCurrentPoints([]); }}
          className="gap-1.5 text-xs h-7 text-slate-300"
        >
          <Minus className="w-3.5 h-3.5" /> Line
        </Button>
        <Button
          size="sm"
          variant={tool === "angle" ? "default" : "ghost"}
          onClick={() => { setTool("angle"); setCurrentPoints([]); }}
          className="gap-1.5 text-xs h-7 text-slate-300"
        >
          <Triangle className="w-3.5 h-3.5" /> Angle
        </Button>
        <div className="flex items-center gap-1 ml-1">
          <Palette className="w-3.5 h-3.5 text-slate-400" />
          {COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)}
              className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
              style={{ backgroundColor: c, borderColor: color === c ? "white" : "transparent" }}
            />
          ))}
        </div>
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => currentPoints.length > 0 ? setCurrentPoints([]) : setAnnotations(prev => prev.slice(0, -1))} className="h-7 text-xs text-slate-300 hover:text-white">
            <Undo className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setAnnotations([]); setCurrentPoints([]); }} className="h-7 text-xs text-red-400 hover:text-red-300">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white">
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Hint */}
      {drawMode && (
        <p className="text-xs text-amber-500">
          {tool === "line" ? "Click two points to draw an arrow line." : "Click three points: start → vertex → end to measure angle."}
          {currentPoints.length > 0 && <span className="ml-2">({tool === "angle" ? `${3 - currentPoints.length} more click(s)` : "click endpoint"})</span>}
        </p>
      )}

      {/* Video + Canvas */}
      <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <video src={videoUrl} controls className="w-full h-full object-contain" />
        <canvas
          ref={canvasRef}
          onClick={drawMode ? handleClick : undefined}
          onTouchEnd={drawMode ? handleClick : undefined}
          className={`absolute inset-0 w-full h-full ${drawMode ? "cursor-crosshair" : "pointer-events-none"}`}
          style={{ touchAction: "none" }}
        />
      </div>
    </div>
  );
}