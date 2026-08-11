import { useEffect, useRef, useState } from "react";
import { syncCursorAttrs, useCursorStore } from "@/store/cursorStore";
import { useLoadingStore } from "@/lib/networkMonitor";

const INTERACTIVE_SELECTOR =
  "a, button, [role='button'], [role='menuitem'], [role='tab'], input, textarea, select, [contenteditable='true'], label, [tabindex], [data-cursor-interactive]";

const TEXT_INPUT_TYPES = new Set([
  "text",
  "search",
  "email",
  "url",
  "tel",
  "password",
  "number",
  "date",
  "time",
  "datetime-local",
  "month",
  "week",
]);

// True when the pointer is over a field you type into (excludes checkbox/radio/range/color/file/buttons).
const isTextTarget = (el: Element): boolean => {
  const node = el.closest("input, textarea, [contenteditable='true']");
  if (!node) return false;
  if (node.tagName === "TEXTAREA") return true;
  if (node.getAttribute("contenteditable") === "true") return true;
  const type = (node.getAttribute("type") || "text").toLowerCase();
  return TEXT_INPUT_TYPES.has(type);
};

// True when the pointer is over something that cannot be clicked (disabled or cursor-not-allowed).
const isNotAllowedTarget = (el: Element): boolean => {
  if (el.closest("[disabled], [aria-disabled='true']")) return true;
  return getComputedStyle(el).cursor === "not-allowed";
};

const CustomCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const notAllowedRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [isInteractive, setIsInteractive] = useState(false);
  const [isText, setIsText] = useState(false);
  const [isNotAllowed, setIsNotAllowed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const enabled = useCursorStore((s) => s.enabled);
  const shape = useCursorStore((s) => s.shape);
  const isLoading = useLoadingStore((s) => s.isLoading);

  // Push the persisted settings onto <html> so the CSS reacts on first load.
  useEffect(() => {
    syncCursorAttrs();
  }, []);

  useEffect(() => {
    // Only run on devices with a precise pointer (mouse / trackpad) and while enabled.
    if (!enabled) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const caret = caretRef.current;
    const notAllowed = notAllowedRef.current;
    const loading = loadingRef.current;
    if (!dot || !ring || !caret || !notAllowed || !loading) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const current = { x: target.x, y: target.y };
    // How fast the trailing elements catch up to the pointer (higher = snappier).
    const lerp = reducedMotion ? 1 : 0.18;
    let rafId = 0;

    const tick = () => {
      current.x += (target.x - current.x) * lerp;
      current.y += (target.y - current.y) * lerp;
      dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      ring.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      caret.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      notAllowed.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      loading.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      const el = e.target as HTMLElement | null;
      if (!el) return;
      setIsInteractive(!!el.closest(INTERACTIVE_SELECTOR));
      setIsText(isTextTarget(el));
      setIsNotAllowed(isNotAllowedTarget(el));
      setIsVisible(true);
    };

    const onLeave = () => setIsVisible(false);
    const onEnter = () => setIsVisible(true);
    const onDown = () => setIsPressed(true);
    const onUp = () => setIsPressed(false);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
    };
  }, [enabled]);

  // Dot + ring show on normal content; caret replaces them over text fields;
  // the not-allowed badge replaces them over disabled / unclickable elements;
  // the loading spinner (like Windows) replaces everything while a request is in flight.
  if (!enabled) return null;

  const dotRingShown = isVisible && !isText && !isNotAllowed && !isLoading;
  const caretShown = isVisible && isText && !isLoading;
  const badgeShown = isVisible && isNotAllowed && !isLoading;
  const loadingShown = isVisible && isLoading;
  const pressed = isPressed ? "is-pressed" : "";
  const interactive = isInteractive && dotRingShown ? "is-interactive" : "";

  const dotRingClass = `custom-cursor custom-cursor--${shape} ${dotRingShown ? "is-visible" : ""} ${interactive} ${pressed}`.trim();
  const caretClass = `custom-cursor ${caretShown ? "is-visible" : ""}`.trim();
  const badgeClass = `custom-cursor ${badgeShown ? "is-visible" : ""}`.trim();

  return (
    <>
      <div ref={dotRef} className={dotRingClass} aria-hidden="true">
        <div className="custom-cursor__dot" />
      </div>
      <div ref={ringRef} className={dotRingClass} aria-hidden="true">
        <div className="custom-cursor__ring" />
        <div className="custom-cursor__crosshair" />
        <div className="custom-cursor__arrow" />
      </div>
      <div ref={caretRef} className={caretClass} aria-hidden="true">
        <div className="custom-cursor__caret" />
      </div>
      <div ref={notAllowedRef} className={badgeClass} aria-hidden="true">
        <div className="custom-cursor__not-allowed" />
      </div>
      <div
        ref={loadingRef}
        className={`custom-cursor ${loadingShown ? "is-visible" : ""}`.trim()}
        aria-hidden="true"
      >
        <div className="custom-cursor__loading" />
      </div>
    </>
  );
};

export default CustomCursor;
