import React, { useRef, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Minus, Triangle, Trash2, Save, Undo, Palette } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ffffff"];

export default function VideoAnnotationCanvas({ analysisId, videoUrl, videoRef }) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState("line"); // "line" | "angle"
  const [color, setColor] = useState("#ef4444");
  const [annotations, setAnnotations] = useState([]);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
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

  // Redraw canvas whenever annotations or currentPoints change
  useEffect(() => {
    redraw();
  }, [annotations, currentPoints, color]);

  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw saved annotations
    annotations.forEach((ann) => drawAnnotation(ctx, ann));

    // Draw in-progress current points
    if (currentPoints.length > 0) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(currentPoints[0].x, currentPoints[0].y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      if (currentPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        ctx.lineTo(currentPoints[1].x, currentPoints[1].y);
        ctx.stroke();
      }
      if (tool === "angle" && currentPoints.length === 2) {
        ctx.beginPath();
        ctx.arc(currentPoints[1].x, currentPoints[1].y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.setLineDash([]);
    }
  }, [annotations, currentPoints, color, tool]);

  const drawAnnotation = (ctx, ann) => {
    ctx.strokeStyle = ann.color || "#ef4444";
    ctx.lineWidth = 2.5;
    ctx.fillStyle = ann.color || "#ef4444";
    ctx.setLineDash([]);

    if (ann.type === "line" && ann.points.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(ann.points[0].x, ann.points[0].y);
      ctx.lineTo(ann.points[1].x, ann.points[1].y);
      ctx.stroke();
      // Arrow head
      drawArrow(ctx, ann.points[0], ann.points[1], ann.color || "#ef4444");
    } else if (ann.type === "angle" && ann.points.length >= 3) {
      ctx.beginPath();
      ctx.moveTo(ann.points[0].x, ann.points[0].y);
      ctx.lineTo(ann.points[1].x, ann.points[1].y);
      ctx.lineTo(ann.points[2].x, ann.points[2].y);
      ctx.stroke();
      // Draw angle arc
      const angle = calcAngle(ann.points[0], ann.points[1], ann.points[2]);
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(`${Math.round(angle)}°`, ann.points[1].x + 8, ann.points[1].y - 8);
    }
  };

  const drawArrow = (ctx, from, to, color) => {
    const headLen = 12;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  const calcAngle = (p1, vertex, p2) => {
    const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
    const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
    const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);
    return (Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2)))) * 180) / Math.PI;
  };

  const handleCanvasClick = (e) => {
    e.preventDefault();
    const pt = getCanvasPoint(e);

    if (tool === "line") {
      if (currentPoints.length === 0) {
        setCurrentPoints([pt]);
      } else {
        setAnnotations((prev) => [...prev, { type: "line", points: [currentPoints[0], pt], color }]);
        setCurrentPoints([]);
      }
    } else if (tool === "angle") {
      const next = [...currentPoints, pt];
      if (next.length < 3) {
        setCurrentPoints(next);
      } else {
        setAnnotations((prev) => [...prev, { type: "angle", points: next, color }]);
        setCurrentPoints([]);
      }
    }
  };

  const handleUndo = () => {
    if (currentPoints.length > 0) {
      setCurrentPoints([]);
    } else {
      setAnnotations((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    setAnnotations([]);
    setCurrentPoints([]);
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

  // Sync canvas size with video
  useEffect(() => {
    const syncSize = () => {
      const canvas = canvasRef.current;
      const video = videoRef?.current;
      if (!canvas || !video) return;
      canvas.width = video.videoWidth || video.offsetWidth;
      canvas.height = video.videoHeight || video.offsetHeight;
      redraw();
    };
    const video = videoRef?.current;
    if (video) {
      video.addEventListener("loadedmetadata", syncSize);
      syncSize();
    }
    return () => video?.removeEventListener("loadedmetadata", syncSize);
  }, [videoRef, redraw]);

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-900 rounded-lg">
        <Button
          size="sm"
          variant={tool === "line" ? "default" : "ghost"}
          onClick={() => { setTool("line"); setCurrentPoints([]); }}
          className="gap-1.5 text-xs h-7"
        >
          <Minus className="w-3.5 h-3.5" /> Line
        </Button>
        <Button
          size="sm"
          variant={tool === "angle" ? "default" : "ghost"}
          onClick={() => { setTool("angle"); setCurrentPoints([]); }}
          className="gap-1.5 text-xs h-7"
        >
          <Triangle className="w-3.5 h-3.5" /> Angle
        </Button>

        <div className="flex items-center gap-1 ml-1">
          <Palette className="w-3.5 h-3.5 text-slate-400" />
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
              style={{ backgroundColor: c, borderColor: color === c ? "white" : "transparent" }}
            />
          ))}
        </div>

        <div className="ml-auto flex gap-1">
          <Button size="sm" variant="ghost" onClick={handleUndo} className="h-7 text-xs text-slate-300 hover:text-white">
            <Undo className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClear} className="h-7 text-xs text-red-400 hover:text-red-300">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white">
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Hint */}
      <p className="text-xs text-slate-500 dark:text-gray-500">
        {tool === "line" ? "Click two points to draw an arrow line." : "Click three points: start → vertex → end to measure an angle."}
        {currentPoints.length > 0 && <span className="text-amber-500 ml-2">({tool === "angle" ? `${3 - currentPoints.length} more click(s)` : "click endpoint"})</span>}
      </p>

      {/* Canvas overlay */}
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full h-full object-contain"
        />
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onTouchEnd={(e) => { e.preventDefault(); handleCanvasClick(e.changedTouches ? { ...e, clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY } : e); }}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          style={{ touchAction: "none" }}
        />
      </div>
    </div>
  );
}