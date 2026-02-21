"use client";

import { useEffect, useRef, useCallback } from "react";

interface PlaygroundPhoto {
  src: string;
  label: string;
  w: number;
  h: number;
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

  const updateBounds = useCallback(() => {
    const rect = playgroundRef.current?.getBoundingClientRect();
    if (rect) {
      cachedBoundsRef.current.w = rect.width;
      cachedBoundsRef.current.h = rect.height;
    }
  }, []);

  useEffect(() => {
    const playground = playgroundRef.current;
    const canvas = canvasRef.current;
    if (!playground || !canvas || initializedRef.current) return;
    initializedRef.current = true;

    const isMobile = window.innerWidth <= 768;
    const mobileScale = isMobile ? 0.55 : 1;

    let images = photoData.map((d) => ({
      ...d,
      w: Math.round(d.w * mobileScale),
      h: Math.round(d.h * mobileScale),
    }));

    if (window.innerWidth <= 480) images = images.slice(0, 6);

    const POWER_THRESHOLD = isMobile ? 12 : 18;

    function initPlayground() {
      updateBounds();
      const pW = cachedBoundsRef.current.w;
      const pH = cachedBoundsRef.current.h;

      images.forEach((data, i) => {
        const div = document.createElement("div");
        div.className = "p-photo";
        div.style.width = data.w + "px";
        div.style.height = data.h + "px";
        div.innerHTML = `<img src="${data.src}" alt="" loading="lazy" decoding="async"><div class="p-label">${data.label}</div><div class="p-border"></div><div class="grab-hint">${grabSVG}</div>`;
        canvas!.appendChild(div);

        const angle = (i / images.length) * Math.PI * 2;
        const rx = pW * (isMobile ? 0.25 : 0.2);
        const ry = pH * 0.2;
        const x = Math.max(
          0,
          Math.min(
            pW - data.w,
            pW / 2 +
              Math.cos(angle) * rx -
              data.w / 2 +
              (Math.random() - 0.5) * 40
          )
        );
        const y = Math.max(
          60,
          Math.min(
            pH - data.h - 30,
            pH / 2 +
              Math.sin(angle) * ry -
              data.h / 2 +
              (Math.random() - 0.5) * 30
          )
        );
        const rotation = (Math.random() - 0.5) * 10;

        div.style.left = x + "px";
        div.style.top = y + "px";
        div.style.transform = `rotate(${rotation}deg)`;
        div.style.zIndex = String(i + 2);

        const driftVx = (Math.random() - 0.5) * 0.3;
        const driftVy = (Math.random() - 0.5) * 0.3;

        photosRef.current.push({
          el: div,
          x,
          y,
          vx: driftVx,
          vy: driftVy,
          w: data.w,
          h: data.h,
          rotation,
          dragging: false,
          driftVx,
          driftVy,
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

    function onDown(cx: number, cy: number, e?: Event) {
      const pr = playground!.getBoundingClientRect();
      const px = cx - pr.left;
      const py = cy - pr.top;
      const photos = photosRef.current;
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
      const pr = playground!.getBoundingClientRect();
      const px = cx - pr.left;
      const py = cy - pr.top;
      const now = Date.now();
      const elapsed = Math.max(1, now - lastRef.current.t);
      dt.vx = ((px - lastRef.current.mx) / elapsed) * 16;
      dt.vy = ((py - lastRef.current.my) / elapsed) * 16;
      dt.x = px - offRef.current.x;
      dt.y = py - offRef.current.y;
      dt.el.style.left = dt.x + "px";
      dt.el.style.top = dt.y + "px";
      lastRef.current = { mx: px, my: py, t: now };
    }

    function onUp() {
      const dt = dragTargetRef.current;
      if (dt) {
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

        if (Math.abs(p.vx) < 0.3 && Math.abs(p.vy) < 0.3) {
          p.vx = p.driftVx;
          p.vy = p.driftVy;
        }

        p.vx *= 0.97;
        p.vy *= 0.97;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vx * 0.06;

        if (p.x < 0) {
          p.x = 0;
          p.vx *= -0.5;
          p.driftVx *= -1;
        }
        if (p.x + p.w > pW) {
          p.x = pW - p.w;
          p.vx *= -0.5;
          p.driftVx *= -1;
        }
        if (p.y < 0) {
          p.y = 0;
          p.vy *= -0.4;
          p.driftVy *= -1;
        }
        if (p.y + p.h > pH - 28) {
          p.y = pH - 28 - p.h;
          p.vy *= -0.4;
          p.vx *= 0.95;
          p.driftVy *= -1;
        }

        p.el.style.left = p.x + "px";
        p.el.style.top = p.y + "px";
        p.el.style.transform = `rotate(${p.rotation}deg)`;
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
    playground.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", onUp);

    // Resize
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateBounds, 200);
    };
    window.addEventListener("resize", handleResize);

    // IntersectionObserver
    let playVisible = false;
    const playObs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (!playVisible) {
            playVisible = true;
            updateBounds();
            if (photosRef.current.length) {
              animIdRef.current = requestAnimationFrame(animate);
            } else {
              initPlayground();
              animate();
            }
          }
        } else {
          playVisible = false;
          cancelAnimationFrame(animIdRef.current);
        }
      },
      { threshold: 0.05 }
    );
    playObs.observe(playground);

    return () => {
      playground.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", onUp);
      playground.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", onUp);
      window.removeEventListener("resize", handleResize);
      playObs.disconnect();
      cancelAnimationFrame(animIdRef.current);
    };
  }, [photoData, updateBounds]);

  return (
    <div className="playground" ref={playgroundRef}>
      <div className="pg-header">
        <div>
          <h2 className="font-[family-name:var(--font-instrument-serif)] text-[clamp(24px,4vw,48px)] text-white">
            Explore
          </h2>
          <div className="text-[10px] font-bold uppercase tracking-[.2em] text-white/30 mt-1.5">
            Interactive Gallery
          </div>
        </div>
      </div>
      <div className="pg-canvas" ref={canvasRef} aria-hidden="true" />
    </div>
  );
}
