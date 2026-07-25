"use client";

import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string;
  className?: string;
  background: ReactNode;
  Icon: React.ElementType;
  description: string;
  href?: string;
  cta?: string;
  onClick?: () => void;
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-1 gap-4 md:grid-cols-3 md:gap-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta = "Open module",
  onClick,
  ...props
}: BentoCardProps) => (
  <div
    key={name}
    className={cn(
      "welcome-card group relative col-span-3 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-blue)]",
      className
    )}
    {...props}
  >
    {/* Header — solid layer, never overlaps media */}
    <div className="relative z-20 shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-card)] px-5 pb-3 pt-5 md:px-6 md:pt-6">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--accent-blue)] bg-[var(--accent-blue-subtle)] text-[var(--accent-blue)] transition-transform duration-300 group-hover:scale-105">
        <Icon className="h-5 w-5" />
      </div>
      <h3
        className="text-base font-bold tracking-tight text-[var(--text-primary)] md:text-lg"
        style={{ textWrap: "balance" } as CSSProperties}
      >
        {name}
      </h3>
      <p
        className="mt-1 max-w-lg text-xs leading-relaxed text-[var(--text-secondary)] md:text-[13px]"
        style={{ textWrap: "pretty" } as CSSProperties}
      >
        {description}
      </p>
    </div>

    {/* Media — own flex region, clipped, no text collision */}
    <div className="relative z-0 min-h-0 flex-1 overflow-hidden bg-[var(--bg-primary)]/40">
      <div className="absolute inset-0">{background}</div>
    </div>

    {/* Footer CTA */}
    <div className="relative z-20 shrink-0 border-t border-[var(--border-color)] bg-[var(--bg-card)] px-5 py-3 md:px-6">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-[var(--accent-blue)] transition-colors duration-150 hover:text-[var(--text-primary)] cursor-pointer"
      >
        <span>{cta}</span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
      </button>
    </div>
  </div>
);

export { BentoCard, BentoGrid };
