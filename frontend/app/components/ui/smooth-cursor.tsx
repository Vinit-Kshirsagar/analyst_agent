"use client";

import { FC, useEffect, useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";

export interface SmoothCursorProps {
  cursor?: React.ReactNode;
  springConfig?: {
    damping: number;
    stiffness: number;
    mass: number;
    restDelta: number;
  };
}

const DESKTOP_POINTER_QUERY = "(any-hover: hover) and (any-pointer: fine)";
const CLICK_SOUND_URL = "/sound/mouse-click-290204.ogg";

function isTrackablePointer(pointerType: string) {
  return pointerType !== "touch";
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "button, a, [role='button'], input, select, textarea, label, summary, img, [data-click-sound]"
    )
  );
}

function parseCssColor(
  color: string
): { r: number; g: number; b: number; a: number } | null {
  if (!color || color === "transparent") return null;
  const rgba = color.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i
  );
  if (rgba) {
    return {
      r: Number(rgba[1]),
      g: Number(rgba[2]),
      b: Number(rgba[3]),
      a: rgba[4] !== undefined ? Number(rgba[4]) : 1,
    };
  }
  const hex = color.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) {
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (h.length === 6 || h.length === 8) {
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
        a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
      };
    }
  }
  return null;
}

function relativeLuminance(r: number, g: number, b: number) {
  const lin = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** Walk the stack under the pointer; pick first opaque-enough background. */
function sampleBackgroundLuminance(x: number, y: number): number {
  const stack = document.elementsFromPoint(x, y);
  for (const el of stack) {
    if (!(el instanceof HTMLElement)) continue;
    if (el.dataset.smoothCursorRoot === "true") continue;

    const style = window.getComputedStyle(el);
    const bg = parseCssColor(style.backgroundColor);
    if (!bg || bg.a < 0.45) continue;

    // Prefer solid-ish fills; skip near-transparent overlays
    return relativeLuminance(bg.r, bg.g, bg.b);
  }

  // Fallback: page / theme
  const bodyBg = parseCssColor(
    window.getComputedStyle(document.body).backgroundColor
  );
  if (bodyBg && bodyBg.a >= 0.3) {
    return relativeLuminance(bodyBg.r, bodyBg.g, bodyBg.b);
  }
  const theme = document.documentElement.getAttribute("data-theme");
  return theme === "dark" ? 0.06 : 0.92;
}

type CursorTone = "dark" | "light";

const DefaultCursorSVG: FC<{ tone: CursorTone }> = ({ tone }) => {
  // Opposite of background: light bg → dark cursor; dark bg → light cursor
  const fill = tone === "dark" ? "#0a0a0a" : "#f8fafc";
  const stroke = tone === "dark" ? "#ffffff" : "#0f172a";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={40}
      height={44}
      viewBox="0 0 50 54"
      fill="none"
      style={{ scale: 0.65 }}
      aria-hidden
    >
      <g filter="url(#smooth_cursor_shadow)">
        <path
          d="M42.6817 41.1495L27.5103 6.79925C26.7269 5.02557 24.2082 5.02558 23.3927 6.79925L7.59814 41.1495C6.75833 42.9759 8.52712 44.8902 10.4125 44.1954L24.3757 39.0496C24.8829 38.8627 25.4385 38.8627 25.9422 39.0496L39.8121 44.1954C41.6849 44.8902 43.4884 42.9759 42.6817 41.1495Z"
          fill={fill}
        />
        <path
          d="M43.7146 40.6933L28.5431 6.34306C27.3556 3.65428 23.5772 3.69516 22.3668 6.32755L6.57226 40.6778C5.3134 43.4156 7.97238 46.298 10.803 45.2549L24.7662 40.109C25.0221 40.0147 25.2999 40.0156 25.5494 40.1082L39.4193 45.254C42.2261 46.2953 44.9254 43.4347 43.7146 40.6933Z"
          stroke={stroke}
          strokeWidth={2.25}
        />
      </g>
      <defs>
        <filter
          id="smooth_cursor_shadow"
          x={0.602397}
          y={0.952444}
          width={49.0584}
          height={52.428}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy={2.25825} />
          <feGaussianBlur stdDeviation={2.25825} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
};

/**
 * Physics-based smooth cursor — spring position, velocity-driven rotation,
 * background-aware contrast, click burst + sound on interactive targets.
 */
export function SmoothCursor({
  springConfig = {
    damping: 45,
    stiffness: 400,
    mass: 1,
    restDelta: 0.001,
  },
}: SmoothCursorProps) {
  const lastMousePos = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const lastUpdateTime = useRef(Date.now());
  const previousAngle = useRef(0);
  const accumulatedRotation = useRef(0);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [burst, setBurst] = useState(0);
  // "dark" cursor on light bg; "light" cursor on dark bg
  const [tone, setTone] = useState<CursorTone>("dark");
  const lastSample = useRef(0);

  const clickAudioRef = useRef<HTMLAudioElement | null>(null);

  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);
  const rotation = useSpring(0, {
    ...springConfig,
    damping: 60,
    stiffness: 300,
  });
  const scale = useSpring(1, {
    ...springConfig,
    stiffness: 500,
    damping: 35,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_POINTER_QUERY);
    const updateEnabled = () => {
      const next = mediaQuery.matches;
      setIsEnabled(next);
      if (!next) setIsVisible(false);
    };
    updateEnabled();
    mediaQuery.addEventListener("change", updateEnabled);
    return () => mediaQuery.removeEventListener("change", updateEnabled);
  }, []);

  useEffect(() => {
    if (!isEnabled) return;
    const audio = new Audio(CLICK_SOUND_URL);
    audio.preload = "auto";
    audio.volume = 0.45;
    clickAudioRef.current = audio;
    return () => {
      clickAudioRef.current = null;
    };
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled) return;

    const previousCursor = document.documentElement.style.cursor;
    const previousBodyCursor = document.body.style.cursor;
    document.documentElement.style.cursor = "none";
    document.body.style.cursor = "none";
    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-smooth-cursor", "true");
    styleEl.textContent =
      "*, *::before, *::after { cursor: none !important; }";
    document.head.appendChild(styleEl);

    let timeout: ReturnType<typeof setTimeout> | null = null;
    let rafId = 0;

    const updateVelocity = (currentPos: { x: number; y: number }) => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastUpdateTime.current;
      if (deltaTime > 0) {
        velocity.current = {
          x: (currentPos.x - lastMousePos.current.x) / deltaTime,
          y: (currentPos.y - lastMousePos.current.y) / deltaTime,
        };
      }
      lastUpdateTime.current = currentTime;
      lastMousePos.current = currentPos;
    };

    const updateTone = (x: number, y: number) => {
      const now = performance.now();
      // Throttle sampling (~30fps) — elementsFromPoint is not free
      if (now - lastSample.current < 32) return;
      lastSample.current = now;
      const lum = sampleBackgroundLuminance(x, y);
      // Midpoint ~0.5: light surfaces get dark pointer
      const next: CursorTone = lum > 0.52 ? "dark" : "light";
      setTone((prev) => (prev === next ? prev : next));
    };

    const smoothPointerMove = (e: PointerEvent) => {
      if (!isTrackablePointer(e.pointerType)) return;
      setIsVisible(true);

      const currentPos = { x: e.clientX, y: e.clientY };
      updateVelocity(currentPos);
      updateTone(currentPos.x, currentPos.y);

      const speed = Math.sqrt(
        velocity.current.x ** 2 + velocity.current.y ** 2
      );

      cursorX.set(currentPos.x);
      cursorY.set(currentPos.y);

      if (speed > 0.1) {
        const currentAngle =
          Math.atan2(velocity.current.y, velocity.current.x) * (180 / Math.PI) +
          90;

        let angleDiff = currentAngle - previousAngle.current;
        if (angleDiff > 180) angleDiff -= 360;
        if (angleDiff < -180) angleDiff += 360;
        accumulatedRotation.current += angleDiff;
        rotation.set(accumulatedRotation.current);
        previousAngle.current = currentAngle;

        scale.set(0.92);
        if (timeout !== null) clearTimeout(timeout);
        timeout = setTimeout(() => scale.set(1), 150);
      }
    };

    const throttledPointerMove = (e: PointerEvent) => {
      if (!isTrackablePointer(e.pointerType)) return;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        smoothPointerMove(e);
        rafId = 0;
      });
    };

    const onDown = (e: PointerEvent) => {
      if (!isTrackablePointer(e.pointerType)) return;
      setBurst((k) => k + 1);
      if (isInteractiveTarget(e.target)) {
        const a = clickAudioRef.current;
        if (a) {
          try {
            a.currentTime = 0;
            void a.play();
          } catch {
            /* ignore */
          }
        }
      }
      scale.set(0.88);
    };

    const onUp = () => scale.set(1);

    window.addEventListener("pointermove", throttledPointerMove, {
      passive: true,
    });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });

    return () => {
      window.removeEventListener("pointermove", throttledPointerMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (rafId) cancelAnimationFrame(rafId);
      if (timeout !== null) clearTimeout(timeout);
      document.documentElement.style.cursor = previousCursor;
      document.body.style.cursor = previousBodyCursor;
      styleEl.remove();
    };
  }, [cursorX, cursorY, rotation, scale, isEnabled]);

  if (!isEnabled) return null;

  const sparkColor = tone === "dark" ? "#0a0a0a" : "#f8fafc";

  return (
    <motion.div
      data-smooth-cursor-root="true"
      style={{
        position: "fixed",
        left: cursorX,
        top: cursorY,
        translateX: "-50%",
        translateY: "-50%",
        rotate: rotation,
        scale: scale,
        zIndex: 99999,
        pointerEvents: "none",
        willChange: "transform",
        opacity: isVisible ? 1 : 0,
      }}
      initial={false}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.15 }}
    >
      <ClickSpark key={burst} active={burst > 0} color={sparkColor} />
      <DefaultCursorSVG tone={tone} />
    </motion.div>
  );
}

function ClickSpark({ active, color }: { active: boolean; color: string }) {
  if (!active) return null;
  const rays = [-50, -22, 8, 38, -80, 65];
  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/2"
      initial={{ opacity: 1, scale: 0.7 }}
      animate={{ opacity: 0, scale: 1.3 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ width: 0, height: 0 }}
    >
      {rays.map((rot, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            width: 3,
            height: 10,
            left: -1.5,
            top: -14,
            background: color,
            transform: `rotate(${rot}deg)`,
            transformOrigin: "50% 100%",
            opacity: 0.85,
          }}
        />
      ))}
    </motion.div>
  );
}
