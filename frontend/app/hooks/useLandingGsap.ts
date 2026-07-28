"use client";

import { useRef } from "react";
import { gsap, useGSAP, registerGsap } from "@/lib/gsap";

registerGsap();

/**
 * Landing-page GSAP sequences:
 * - Hero entrance timeline
 * - Soft parallax on light-rays layer
 * - Trusted-stack chip lift-in (supplemental to ScrollStagger)
 * - Eco-nav entrance
 */
export function useLandingGsap() {
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = pageRef.current;
      if (!root) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          root.querySelectorAll(
            ".hero-anim, .eco-nav, .gsap-hero-terminal, .light-rays"
          ),
          { clearProps: "all", opacity: 1, y: 0, x: 0 }
        );
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // ── Nav drops in ──
        const nav = root.querySelector(".eco-nav");
        if (nav) {
          gsap.from(nav, {
            opacity: 0,
            y: -16,
            duration: 0.55,
            ease: "power3.out",
            delay: 0.05,
          });
        }

        // ── Hero entrance ──
        const heroItems = root.querySelectorAll(".hero-anim");
        if (heroItems.length) {
          gsap.from(heroItems, {
            opacity: 0,
            y: 28,
            duration: 0.7,
            stagger: 0.09,
            ease: "power3.out",
            delay: 0.12,
          });
        }

        const terminal = root.querySelector(".gsap-hero-terminal");
        if (terminal) {
          gsap.from(terminal, {
            opacity: 0,
            y: 36,
            duration: 0.8,
            ease: "power3.out",
            delay: 0.45,
          });
        }

        // ── Light rays: subtle vertical parallax while hero is in view ──
        const rays = root.querySelector(".light-rays");
        const hero = root.querySelector(".gsap-hero-section");
        if (rays && hero) {
          gsap.to(rays, {
            yPercent: 12,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        }

        // ── Product shots: slight scale settle on scroll ──
        root.querySelectorAll(".gsap-product-shot").forEach((shot) => {
          gsap.from(shot, {
            opacity: 0,
            y: 20,
            scale: 0.98,
            duration: 0.65,
            ease: "power2.out",
            scrollTrigger: {
              trigger: shot,
              start: "top 90%",
              once: true,
            },
          });
        });

        // ── Section headings: soft rise ──
        root.querySelectorAll(".gsap-section-heading").forEach((heading) => {
          gsap.from(heading, {
            opacity: 0,
            y: 20,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: {
              trigger: heading,
              start: "top 90%",
              once: true,
            },
          });
        });
      });

      return () => mm.revert();
    },
    { scope: pageRef }
  );

  return pageRef;
}
