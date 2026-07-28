"use client";

/**
 * Central GSAP setup — import this once before using gsap in client components.
 * Only free core + ScrollTrigger (tree-shake friendly).
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

let registered = false;

export function registerGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  registered = true;
}

// Safe to call at module load in client components
if (typeof window !== "undefined") {
  registerGsap();
}

export { gsap, ScrollTrigger, useGSAP };
