import { RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const CROP_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

type Props = {
  file: File;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
};

export default function ProfileImageCropper({ file, onCrop, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  const dragStart = useRef({ x: 0, y: 0 });
  const offsetAtDragStart = useRef({ x: 0, y: 0 });

  // ---------- Load image ----------
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // ---------- Fit canvas to container ----------
  const [displaySize, setDisplaySize] = useState(320);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const rect = container.getBoundingClientRect();
      const s = Math.min(rect.width, 400);
      setDisplaySize(s);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // ---------- Draw ----------
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, displaySize, displaySize);

    // Compute scale so the image fills the crop area at zoom=1
    const imgAspect = img.naturalWidth / img.naturalHeight;
    let baseW: number;
    let baseH: number;
    if (imgAspect > 1) {
      baseH = displaySize;
      baseW = displaySize * imgAspect;
    } else {
      baseW = displaySize;
      baseH = displaySize / imgAspect;
    }

    const w = baseW * zoom;
    const h = baseH * zoom;
    const x = (displaySize - w) / 2 + offset.x;
    const y = (displaySize - h) / 2 + offset.y;

    // Draw image
    ctx.drawImage(img, x, y, w, h);

    // Circular mask overlay
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.arc(displaySize / 2, displaySize / 2, displaySize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Subtle border ring
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(displaySize / 2, displaySize / 2, displaySize / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
  }, [img, zoom, offset, displaySize]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ---------- Pointer events (drag) ----------
  function handlePointerDown(e: React.PointerEvent) {
    if (saving) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetAtDragStart.current = { ...offset };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    e.preventDefault();
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset({
      x: offsetAtDragStart.current.x + dx,
      y: offsetAtDragStart.current.y + dy,
    });
  }

  function handlePointerUp() {
    setDragging(false);
  }

  // ---------- Wheel zoom ----------
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = -e.deltaY * 0.002;
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
  }

  // ---------- Touch pinch zoom ----------
  const lastTouchDist = useRef(0);

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scale = dist / lastTouchDist.current;
      lastTouchDist.current = dist;
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * scale)));
    }
  }

  // ---------- Reset ----------
  function handleReset() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  // ---------- Save (crop to blob) ----------
  async function handleSave() {
    if (!img || saving) return;
    setSaving(true);

    try {
      const offscreen = document.createElement("canvas");
      offscreen.width = CROP_SIZE;
      offscreen.height = CROP_SIZE;
      const ctx = offscreen.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      // Same math as draw()
      const imgAspect = img.naturalWidth / img.naturalHeight;
      let baseW: number;
      let baseH: number;
      if (imgAspect > 1) {
        baseH = CROP_SIZE;
        baseW = CROP_SIZE * imgAspect;
      } else {
        baseW = CROP_SIZE;
        baseH = CROP_SIZE / imgAspect;
      }

      const w = baseW * zoom;
      const h = baseH * zoom;
      const x = (CROP_SIZE - w) / 2 + offset.x;
      const y = (CROP_SIZE - h) / 2 + offset.y;

      // Clip to circle
      ctx.beginPath();
      ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
      ctx.clip();

      ctx.drawImage(img, x, y, w, h);

      const blob = await new Promise<Blob>((resolve, reject) => {
        offscreen.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Failed to create blob"))),
          "image/jpeg",
          0.92,
        );
      });

      onCrop(blob);
    } catch (error) {
      console.error("Crop failed:", error);
      setSaving(false);
    }
  }

  // ---------- Zoom slider ----------
  const zoomPercent = Math.round(((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100);

  return (
    <div
      className="cropper-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="cropper-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Crop profile photo"
      >
        {/* Header */}
        <div className="cropper-header">
          <div>
            <p className="eyebrow" style={{ marginBottom: 4 }}>Crop photo</p>
            <h2 style={{ margin: 0, fontSize: 22 }}>Adjust your photo</h2>
          </div>
          <button
            type="button"
            className="cropper-close-btn"
            onClick={onCancel}
            aria-label="Close cropper"
          >
            <X size={18} />
          </button>
        </div>

        {/* Canvas area */}
        <div className="cropper-body">
          <div
            ref={containerRef}
            className="cropper-canvas-container"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            style={{ cursor: dragging ? "grabbing" : "grab" }}
          >
            <canvas ref={canvasRef} className="cropper-canvas" />
          </div>

          {/* Zoom control */}
          <div className="cropper-zoom">
            <span className="cropper-zoom-label">Zoom</span>
            <input
              type="range"
              min={0}
              max={100}
              value={zoomPercent}
              onChange={(e) => {
                const pct = Number(e.target.value) / 100;
                setZoom(MIN_ZOOM + pct * (MAX_ZOOM - MIN_ZOOM));
              }}
              className="cropper-zoom-slider"
              aria-label="Zoom level"
            />
            <span className="cropper-zoom-value">{Math.round(zoom * 100)}%</span>
          </div>
        </div>

        {/* Footer */}
        <div className="cropper-footer">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleReset}
            disabled={saving}
          >
            <RotateCcw size={15} />
            Reset
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
