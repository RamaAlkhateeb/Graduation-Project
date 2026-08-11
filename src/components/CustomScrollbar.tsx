import { useEffect, useRef, useState } from "react";

const MIN_THUMB = 44;
// How fast the thumb catches up to the real scroll position (higher = snappier).
const GLIDE = 0.14;

const CustomScrollbar = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [canScroll, setCanScroll] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Eased thumb position (kept in refs so we never re-render per frame).
  const targetTopRef = useRef(0);
  const currentTopRef = useRef(0);
  const rafIdRef = useRef(0);
  const scheduleRafRef = useRef(0);
  const idleTimerRef = useRef<number | undefined>(undefined);
  const dragRef = useRef<{ startY: number; startScrollY: number } | null>(null);

  // In RTL the root scrollbar sits on the left edge.
  const isRtl =
    typeof document !== "undefined" && document.documentElement.dir === "rtl";

  const applyThumb = (top: number) => {
    if (thumbRef.current) {
      thumbRef.current.style.transform = `translate(-50%, ${top}px)`;
    }
  };

  const update = () => {
    const doc = document.documentElement;
    const viewportH = window.innerHeight;
    const contentH = doc.scrollHeight;
    const scrollable = contentH - viewportH;

    if (scrollable <= 1) {
      setCanScroll(false);
      setThumbHeight(0);
      targetTopRef.current = 0;
      return;
    }

    const h = Math.max(MIN_THUMB, (viewportH * viewportH) / contentH);
    const maxTop = viewportH - h;
    targetTopRef.current = (window.scrollY / scrollable) * maxTop;

    setCanScroll(true);
    setThumbHeight(h);
    startGlideLoop();
  };

  const scheduleUpdate = () => {
    if (scheduleRafRef.current) return;
    scheduleRafRef.current = requestAnimationFrame(() => {
      scheduleRafRef.current = 0;
      update();
    });
  };

  // Ease the thumb toward the real position; snap while dragging so the
  // thumb stays glued to the pointer.
  const startGlideLoop = () => {
    if (rafIdRef.current) return;
    const tick = () => {
      const target = targetTopRef.current;
      const current = currentTopRef.current;
      const lerp = dragRef.current ? 1 : GLIDE;
      const next = current + (target - current) * lerp;

      if (Math.abs(target - next) < 0.1) {
        currentTopRef.current = target;
        applyThumb(target);
        rafIdRef.current = 0;
        return;
      }

      currentTopRef.current = next;
      applyThumb(next);
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);
  };

  const markActive = () => {
    setIsActive(true);
    if (idleTimerRef.current !== undefined) {
      window.clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = window.setTimeout(() => setIsActive(false), 1200);
  };

  useEffect(() => {
    update();

    const onScroll = (e: Event) => {
      scheduleUpdate();
      // Only light up for the page scroll itself, not inner containers.
      if (
        e.target === document ||
        e.target === document.documentElement ||
        e.target === document.body
      ) {
        markActive();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", scheduleUpdate);

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(document.documentElement);

    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver.disconnect();
      if (idleTimerRef.current !== undefined) {
        window.clearTimeout(idleTimerRef.current);
      }
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (scheduleRafRef.current) cancelAnimationFrame(scheduleRafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { startY: e.clientY, startScrollY: window.scrollY };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // synthetic or unsupported pointer events — drag still works via move/up handlers
    }
    markActive();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const viewportH = window.innerHeight;
    const contentH = document.documentElement.scrollHeight;
    const h = Math.max(MIN_THUMB, (viewportH * viewportH) / contentH);
    const dy = e.clientY - drag.startY;
    const ratio = (contentH - viewportH) / (viewportH - h);
    window.scrollTo(0, drag.startScrollY + dy * ratio);
    markActive();
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const onTrackDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Click on the track (not the thumb) jumps the page to that spot.
    if (dragRef.current) return;
    const thumb = thumbRef.current;
    if (!thumb) return;
    const trackRect = e.currentTarget.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    if (e.clientY >= thumbRect.top && e.clientY <= thumbRect.bottom) return;

    const viewportH = window.innerHeight;
    const contentH = document.documentElement.scrollHeight;
    const clickY = e.clientY - trackRect.top - thumbRect.height / 2;
    const ratio = (contentH - viewportH) / (viewportH - thumbRect.height);
    window.scrollTo(0, Math.max(0, clickY * ratio));
    markActive();
  };

  const show = canScroll && (isActive || isHovered);
  const edge = isRtl ? { left: 0 } : { right: 0 };

  return (
    <div
      ref={trackRef}
      className={`custom-scrollbar-track ${show ? "is-active" : ""}`}
      style={edge}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onPointerDown={onTrackDown}
      aria-hidden="true"
    >
      <div
        ref={thumbRef}
        className="custom-scrollbar-thumb"
        style={{ height: `${thumbHeight}px` }}
        onPointerDown={startDrag}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
    </div>
  );
};

export default CustomScrollbar;
