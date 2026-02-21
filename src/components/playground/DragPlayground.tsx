"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import "photoswipe/style.css";

interface PlaygroundPhoto {
  src: string;
  label: string;
  w: number;
  h: number;
  color?: string | null;
}

const grabSVG =
  '<svg viewBox="0 0 24 24"><path d="M6.5 9.5V5.5a1.5 1.5 0 013 0v4m0 0V4a1.5 1.5 0 013 0v5.5m0-2V5a1.5 1.5 0 013 0v4.5m0 1V6.5a1.5 1.5 0 013 0v7a7.5 7.5 0 01-15 0v-3.5a1.5 1.5 0 013 0v3" stroke="rgba(255,255,255,.5)" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>';

interface PhotoState {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rotation: number;
  dragging: boolean;
  driftVx: number;
  driftVy: number;
  dataIndex: number; // index into photoData for lightbox
}

/** Scale original dimensions so the longest side = maxPx */
function thumbSize(ow: number, oh: number, maxPx: number) {
  const scale = maxPx / Math.max(ow, oh);
  return { w: Math.round(ow * scale), h: Math.round(oh * scale) };
}

export default function DragPlayground({
  photos: photoData,
}: {
  photos: PlaygroundPhoto[];
}) {
  const playgroundRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const photosRef = useRef<PhotoState[]>([]);
  const dragTargetRef = useRef<PhotoState | null>(null);
  const maxZRef = useRef(20);
  const powerThrowsRef = useRef(0);
  const cachedBoundsRef = useRef({ w: 0, h: 0 });
  const animIdRef = useRef(0);
  const initializedRef = useRef(false);
  const offRef = useRef({ x: 0, y: 0 });
  const lastRef = useRef({ mx: 0, my: 0, t: 0 });
  const dragMovedRef = useRef(false);
  const lightboxRef = useRef<{ destroy: () => void } | null>(null);

  const updateBounds = useCallback(() => {
    const rect = playgroundRef.current?.getBoundingClientRect();
    if (rect) {
      cachedBoundsRef.current.w = rect.width;
      cachedBoundsRef.current.h = rect.height;
    }
  }, []);

  // Initialize PhotoSwipe lightbox
  useEffect(() => {
    let lb: { init: () => void; destroy: () => void } | null = null;
    async function initLightbox() {
      const PhotoSwipeLightbox = (await import("photoswipe/lightbox")).default;
      const PhotoSwipe = (await import("photoswipe")).default;
      lb = new PhotoSwipeLightbox({
        dataSource: photoData.map((p) => ({
          src: p.src,
          w: p.w,
          h: p.h,
        })),
        pswpModule: PhotoSwipe,
        bgOpacity: 0.85,
        padding: { top: 20, bottom: 20, left: 20, right: 20 },
        showHideAnimationType: "fade",
        showAnimationDuration: 300,
        hideAnimationDuration: 200,
      });
      lb.init();
      lightboxRef.current = lb;
    }
    if (photoData.length > 0) initLightbox();
    return () => { lb?.destroy(); };
  }, [photoData]);

  useEffect(() => {
    const playground = playgroundRef.current;
    const canvas = canvasRef.current;
    if (!playground || !canvas || initializedRef.current) return;
    initializedRef.current = true;

    const isMobile = window.innerWidth <= 768;
    const isSmall = window.innerWidth <= 480;

    // Cap image count on mobile to keep things smooth
    const MAX_PHOTOS = isSmall ? 24 : isMobile ? 40 : 500;
    const maxPx = isSmall ? 73 : isMobile ? 93 : 147;

    const capped = photoData.slice(0, MAX_PHOTOS);
    const images = capped.map((d) => ({
      ...d,
      ...thumbSize(d.w, d.h, maxPx + Math.random() * 20),
    }));

    // Much harder to throw — higher thresholds
    const POWER_THRESHOLD = isMobile ? 25 : 35;
    const FRICTION = 0.92;
    const VEL_SCALE = 8;
    // Skip DOM updates when total movement is sub-pixel
    const MIN_MOVE = 0.5;

    function initPlayground() {
      updateBounds();
      const pW = cachedBoundsRef.current.w;
      const pH = cachedBoundsRef.current.h;
      const pad = 10;

      // Stagger image loading — create DOM with color placeholders first,
      // then load actual images in batches to avoid slamming the network
      const BATCH = isMobile ? 6 : 12;

      images.forEach((data, i) => {
        const div = document.createElement("div");
        div.className = "p-photo";
        div.style.width = data.w + "px";
        div.style.height = data.h + "px";
        if (data.color) div.style.backgroundColor = data.color;
        div.innerHTML = `<img alt="" decoding="async"><div class="p-border"></div>${i % 8 === 0 ? `<div class="grab-hint">${grabSVG}</div>` : ""}`;
        canvas!.appendChild(div);

        // Load image in staggered batches
        const img = div.querySelector("img")!;
        setTimeout(() => { img.src = data.src; }, Math.floor(i / BATCH) * 150);

        // Scatter randomly
        const x = pad + Math.random() * Math.max(0, pW - data.w - pad * 2);
        const y = pad + Math.random() * Math.max(0, pH - data.h - pad * 2);
        const rotation = (Math.random() - 0.5) * 16;

        // Use GPU-composited transform for position + rotation
        div.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
        div.style.zIndex = String(i + 2);

        const driftVx = (Math.random() - 0.5) * 0.15;
        const driftVy = (Math.random() - 0.5) * 0.15;

        photosRef.current.push({
          el: div,
          x, y,
          vx: driftVx, vy: driftVy,
          w: data.w, h: data.h,
          rotation, dragging: false,
          driftVx, driftVy,
          dataIndex: i,
        });
      });

      const achDiv = document.createElement("div");
      achDiv.className = "achievement";
      achDiv.textContent = "Power Thrower Unlocked";
      achDiv.id = "achievement";
      canvas!.appendChild(achDiv);
    }

    function spawnStreak(x: number, y: number, vx: number, vy: number) {
      const s = document.createElement("div");
      s.className = "streak";
      const len = Math.min(120, Math.hypot(vx, vy) * 4);
      const angle = (Math.atan2(vy, vx) * 180) / Math.PI;
      s.style.cssText = `left:${x}px;top:${y}px;width:${len}px;transform:rotate(${angle}deg);transform-origin:left center`;
      canvas!.appendChild(s);
      setTimeout(() => s.remove(), 500);
    }

    function openLightbox(index: number) {
      const lb = lightboxRef.current as { loadAndOpen: (i: number) => void; destroy: () => void } | null;
      if (lb && 'loadAndOpen' in lb) {
        lb.loadAndOpen(index);
      }
    }

    function onDown(cx: number, cy: number, e?: Event) {
      const pr = playground!.getBoundingClientRect();
      const px = cx - pr.left;
      const py = cy - pr.top;
      const photos = photosRef.current;
      dragMovedRef.current = false;
      for (let i = photos.length - 1; i >= 0; i--) {
        const p = photos[i];
        if (px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h) {
          if (e?.preventDefault) e.preventDefault();
          dragTargetRef.current = p;
          p.dragging = true;
          p.vx = 0;
          p.vy = 0;
          offRef.current = { x: px - p.x, y: py - p.y };
          lastRef.current = { mx: px, my: py, t: Date.now() };
          p.el.style.zIndex = String(++maxZRef.current);
          p.el.classList.add("active");
          p.el.classList.add("touched");
          break;
        }
      }
    }

    function onMove(cx: number, cy: number, e?: Event) {
      const dt = dragTargetRef.current;
      if (!dt) return;
      if (e?.preventDefault) e.preventDefault();
      dragMovedRef.current = true;
      const pr = playground!.getBoundingClientRect();
      const px = cx - pr.left;
      const py = cy - pr.top;
      const now = Date.now();
      const elapsed = Math.max(1, now - lastRef.current.t);
      dt.vx = ((px - lastRef.current.mx) / elapsed) * VEL_SCALE;
      dt.vy = ((py - lastRef.current.my) / elapsed) * VEL_SCALE;
      dt.x = px - offRef.current.x;
      dt.y = py - offRef.current.y;
      dt.el.style.transform = `translate(${dt.x}px, ${dt.y}px) rotate(${dt.rotation}deg)`;
      lastRef.current = { mx: px, my: py, t: now };
    }

    function onUp() {
      const dt = dragTargetRef.current;
      if (dt) {
        // Click detection — if barely moved, open lightbox
        if (!dragMovedRef.current) {
          openLightbox(dt.dataIndex);
        }

        const speed = Math.hypot(dt.vx, dt.vy);
        if (speed > POWER_THRESHOLD) {
          powerThrowsRef.current++;
          dt.el.classList.add("power-throw");
          setTimeout(() => dt.el.classList.remove("power-throw"), 400);
          spawnStreak(
            dt.x + dt.w / 2,
            dt.y + dt.h / 2,
            dt.vx,
            dt.vy
          );
          playground!.classList.add("shake");
          setTimeout(() => playground!.classList.remove("shake"), 300);
          if (powerThrowsRef.current === 5) {
            const a = document.getElementById("achievement");
            if (a) {
              a.classList.add("show");
              setTimeout(() => a.classList.remove("show"), 2500);
            }
          }
        }
        dt.dragging = false;
        dt.el.classList.remove("active");
      }
      dragTargetRef.current = null;
    }

    function animate() {
      const pW = cachedBoundsRef.current.w;
      const pH = cachedBoundsRef.current.h;
      const photos = photosRef.current;

      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        if (p.dragging) continue;

        // Drift when nearly stopped
        if (Math.abs(p.vx) < 0.2 && Math.abs(p.vy) < 0.2) {
          p.vx = p.driftVx;
          p.vy = p.driftVy;
        }

        p.vx *= FRICTION;
        p.vy *= FRICTION;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vx * 0.04;

        // Wall bounce
        if (p.x < 0) { p.x = 0; p.vx *= -0.3; p.driftVx *= -1; }
        if (p.x + p.w > pW) { p.x = pW - p.w; p.vx *= -0.3; p.driftVx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -0.3; p.driftVy *= -1; }
        if (p.y + p.h > pH) { p.y = pH - p.h; p.vy *= -0.3; p.vx *= 0.9; p.driftVy *= -1; }

        // Skip DOM update if movement is sub-pixel (big perf win at scale)
        if (Math.abs(p.vx) < MIN_MOVE && Math.abs(p.vy) < MIN_MOVE) continue;

        p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`;
      }
      animIdRef.current = requestAnimationFrame(animate);
    }

    // Mouse events
    const handleMouseDown = (e: MouseEvent) => onDown(e.clientX, e.clientY, e);
    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY, e);
    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      onDown(t.clientX, t.clientY, e);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!dragTargetRef.current) return;
      const t = e.touches[0];
      onMove(t.clientX, t.clientY, e);
    };

    playground.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", onUp);
    playground.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", onUp);

    // Resize
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateBounds, 200);
    };
    window.addEventListener("resize", handleResize);

    // Init immediately
    updateBounds();
    initPlayground();
    animIdRef.current = requestAnimationFrame(animate);

    return () => {
      playground.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", onUp);
      playground.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", onUp);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animIdRef.current);
    };
  }, [photoData, updateBounds]);

  return (
    <div className="playground-fullscreen" ref={playgroundRef}>
      {/* Overlay UI — doubled sizes */}
      <div className="pg-overlay-header">
        <Link href="/" className="pg-back-link">
          <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h2 className="text-[clamp(27px,4vw,48px)] text-white leading-none" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Explore<span className="text-brand">.</span>
          </h2>
          <div className="text-[12px] font-bold uppercase tracking-[.2em] text-white/25 mt-1.5">
            Drag &amp; throw — {photoData.length} photos
          </div>
        </div>
      </div>
      <div className="pg-canvas" ref={canvasRef} aria-hidden="true" />
      {photoData.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-white/40 text-lg">
            Upload photos in the{" "}
            <Link href="/admin" className="text-brand underline">
              admin panel
            </Link>{" "}
            to populate the playground.
          </p>
        </div>
      )}
    </div>
  );
}
