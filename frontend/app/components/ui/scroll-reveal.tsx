"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { gsap, useGSAP, registerGsap } from "@/lib/gsap";

registerGsap();

/**
 * GSAP ScrollTrigger reveal — opacity + y only.
 * Honors prefers-reduced-motion (shows content immediately).
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(el, { clearProps: "all", opacity: 1, y: 0 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(el, {
          opacity: 0,
          y: 28,
          duration: 0.65,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none none",
            once: true,
          },
        });
      });

      return () => mm.revert();
    },
    { scope: ref, dependencies: [delay] }
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}

/**
 * Stagger children with class `.gsap-stagger-item` (or direct children).
 */
export function ScrollStagger({
  children,
  className,
  stagger = 0.08,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;

      const items =
        root.querySelectorAll<HTMLElement>(".gsap-stagger-item").length > 0
          ? root.querySelectorAll<HTMLElement>(".gsap-stagger-item")
          : (Array.from(root.children) as HTMLElement[]);

      if (!items.length) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(items, { clearProps: "all", opacity: 1, y: 0 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(items, {
          opacity: 0,
          y: 24,
          duration: 0.55,
          stagger,
          ease: "power3.out",
          scrollTrigger: {
            trigger: root,
            start: "top 88%",
            toggleActions: "play none none none",
            once: true,
          },
        });
      });

      return () => mm.revert();
    },
    { scope: ref, dependencies: [stagger] }
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}

/** Marker class wrapper for stagger children when mixed markup needs a target. */
export function ScrollItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("gsap-stagger-item", className)}>{children}</div>;
}
