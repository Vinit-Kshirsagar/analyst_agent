"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ArrowRight,
  ArrowDown,
  Server,
  Cpu,
  Share2,
  Database,
  Lock,
  CheckCircle2,
  Brain,
  LineChart,
  Upload,
  Zap,
  Stars,
  ShieldAlert,
  Clock,
  ChevronDown,
  Quote,
  Bell,
  Network,
} from "lucide-react";

import { SmoothCursor } from "./ui/smooth-cursor";
import { TextAnimate } from "./ui/text-animate";
import { Terminal } from "./ui/terminal";
import { LightRays } from "./ui/light-rays";
import { AnimatedThemeToggler, ThemeMode } from "./ui/animated-theme-toggler";
import { ScrollReveal, ScrollStagger, ScrollItem } from "./ui/scroll-reveal";
import IntegrationBeamDemo from "./IntegrationBeamDemo";
interface WelcomePageProps {
  onEnterDashboard: () => void;
  theme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
}

/** Public assets from frontend/public */
const ASSETS = {
  svg: {
    docker: "/svg/Docker.svg",
    elasticsearch: "/svg/Elastic%20Search.svg",
    langchain: "/svg/langchain_text.svg",
    nextjs: "/svg/Next_js.svg",
    redis: "/svg/Redis.svg",
    typescript: "/svg/TypeScript.svg",
  },
  images: {
    dashboard: "/images/dashboard.png",
    pipeline: "/images/pipeline.png",
    stackHealth: "/images/stack_health_cpmponent.png",
    systemOverview: "/images/system_overview.png",
  },
} as const;

const stackPills = [
  { label: "FastAPI", icon: Server },
  { label: "Elasticsearch", icon: Database },
  { label: "Ollama · gemma4", icon: Cpu },
  { label: "Elastic MCP", icon: Share2 },
  { label: "Local-first", icon: Lock },
];

const brandLogos = [
  { name: "Elasticsearch", src: ASSETS.svg.elasticsearch },
  { name: "Docker", src: ASSETS.svg.docker },
  { name: "Next.js", src: ASSETS.svg.nextjs },
  { name: "TypeScript", src: ASSETS.svg.typescript },
  { name: "LangChain", src: ASSETS.svg.langchain },
  { name: "Redis", src: ASSETS.svg.redis },
];

function ProductShot({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--shadow-card)] ${className ?? ""}`}
    >
      <div className="flex items-center gap-1.5 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/50 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-red-400/80" />
        <span className="h-2 w-2 rounded-full bg-amber-400/80" />
        <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
        <span className="ml-2 truncate font-mono text-[10px] text-[var(--text-muted)]">
          {alt}
        </span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-auto w-full object-cover object-top"
        loading="lazy"
        draggable={false}
      />
    </div>
  );
}

const problems = [
  {
    icon: Brain,
    title: "Alert overload",
    body: "SOC teams drown in raw logs and noisy events without a local-first way to ask clear questions of their own data.",
  },
  {
    icon: Clock,
    title: "Slow investigations",
    body: "Jumping between Kibana, shells, and tickets burns minutes when you need answers about IPs, hosts, and windows now.",
  },
  {
    icon: ShieldAlert,
    title: "Cloud lock-in risk",
    body: "Shipping sensitive security telemetry to third-party AI endpoints is a non-starter for many regulated environments.",
  },
];

/** Solution cards — real product screenshots from /public/images */
const solutions = [
  {
    title: "Stack health at a glance",
    body: "ES, Ollama, MCP, and the API report real reachability before you trust a green dashboard.",
    image: ASSETS.images.stackHealth,
    alt: "stack health component",
  },
  {
    title: "System overview",
    body: "See the full Phase 0 foundation — services, status, and the operational surface in one view.",
    image: ASSETS.images.systemOverview,
    alt: "system overview",
  },
  {
    title: "Pipeline visibility",
    body: "Trace how security data moves through intake, indexing, and analysis across the local stack.",
    image: ASSETS.images.pipeline,
    alt: "pipeline view",
  },
];

const howSteps = [
  {
    n: "1",
    icon: Upload,
    title: "Boot the local stack",
    body: "Bring up Elasticsearch, Ollama, Elastic MCP, and FastAPI with Docker Compose. Seed alerts land in alerts-security.",
  },
  {
    n: "2",
    icon: Zap,
    title: "Verify health in one place",
    body: "The console checks real connectivity — model tag, MCP ping, cluster health — not fake status badges.",
  },
  {
    n: "3",
    icon: Stars,
    title: "Investigate with context",
    body: "Open the operations console to explore modules, logs, and the foundation that later agent phases will use.",
  },
];

const featureTabs = [
  {
    id: "dashboard",
    icon: LineChart,
    label: "SOC Dashboard",
    blurb: "Operations console and workspace at a glance.",
    image: ASSETS.images.dashboard,
    alt: "analyst agent dashboard",
  },
  {
    id: "overview",
    icon: Brain,
    label: "System Overview",
    blurb: "Foundation services and Phase 0 status together.",
    image: ASSETS.images.systemOverview,
    alt: "system overview",
  },
  {
    id: "pipeline",
    icon: Bell,
    label: "Pipelines",
    blurb: "How data and alerts flow through the stack.",
    image: ASSETS.images.pipeline,
    alt: "pipeline",
  },
  {
    id: "health",
    icon: Network,
    label: "Stack Health",
    blurb: "Component-level health for ES, Ollama, and MCP.",
    image: ASSETS.images.stackHealth,
    alt: "stack health",
  },
] as const;

const architecturePoints = [
  {
    icon: Database,
    title: "Intake",
    body: "Security alerts index into Elasticsearch (alerts-security) with deterministic seed data for demos.",
  },
  {
    icon: Network,
    title: "Topology",
    body: "FastAPI gateway links the analyst to Ollama, Elasticsearch, and Elastic MCP over the Docker network.",
  },
  {
    icon: Bell,
    title: "Triage",
    body: "Incidents surface with severity so you can scope the window before agent workflows arrive in later phases.",
  },
];

const faqs = [
  {
    q: "What is Phase 0?",
    a: "Phase 0 is the foundation: Dockerized Elasticsearch, Ollama, Elastic MCP, FastAPI health APIs, and a Next.js console. No LangGraph agent loop yet.",
  },
  {
    q: "Does data leave my machine?",
    a: "The default design is local-first. Models run via Ollama on your host; Elasticsearch and MCP run in your compose network.",
  },
  {
    q: "Which model is expected?",
    a: "Health checks look for gemma4:e4b in Ollama. You can change GEMMA_MODEL_TAG if you pin another tag.",
  },
  {
    q: "How do I open the real console?",
    a: "Click Enter dashboard / Launch console on this landing page. That unlocks the ops shell with modules.",
  },
];

const stats = [
  { value: "Phase 0", label: "Foundation ready" },
  { value: "200", label: "Seed security alerts" },
  { value: "4", label: "Core services wired" },
  { value: "0", label: "Cloud keys required" },
];

function FeatureTabsSection() {
  const [active, setActive] = useState(0);
  const tab = featureTabs[active];

  return (
    <section
      id="features"
      className="border-t border-[var(--border-color)] bg-[var(--bg-primary)]"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <ScrollReveal className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <p className="mb-3 font-mono text-[10px] font-bold tracking-[0.16em] text-[var(--accent-blue)]">
            FEATURES
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Surfaces you will use day to day
          </h2>
          <p className="mt-3 text-base text-[var(--text-secondary)]">
            Switch tabs to preview modules — not the same console repeated
            three times.
          </p>
        </ScrollReveal>

        <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-0 sm:border-b sm:border-[var(--border-color)]">
          {featureTabs.map((t, i) => {
            const Icon = t.icon;
            const on = i === active;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive(i)}
                className={`relative flex flex-col items-center gap-3 rounded-2xl px-3 py-5 text-center transition-colors sm:rounded-none cursor-pointer ${
                  on
                    ? "bg-[var(--accent-blue-subtle)] sm:bg-transparent"
                    : "hover:bg-[var(--bg-card-hover)]"
                }`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-color)] ${
                    on
                      ? "bg-[var(--accent-blue-subtle)] text-[var(--accent-blue)]"
                      : "bg-[var(--bg-card)] text-[var(--text-muted)]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <div
                    className={`text-sm font-bold ${
                      on
                        ? "text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {t.label}
                  </div>
                  <p className="mx-auto mt-1 hidden max-w-[170px] text-xs text-[var(--text-muted)] md:block">
                    {t.blurb}
                  </p>
                </div>
                {on && (
                  <span className="absolute bottom-0 left-4 right-4 hidden h-0.5 bg-[var(--accent-blue)] sm:block" />
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-4xl"
          >
            <ProductShot src={tab.image} alt={tab.alt} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--border-color)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left cursor-pointer"
      >
        <span className="text-sm font-semibold text-[var(--text-primary)] sm:text-base">
          {q}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <p className="pb-5 text-sm leading-relaxed text-[var(--text-secondary)]">
          {a}
        </p>
      )}
    </div>
  );
}

export default function WelcomePage({
  onEnterDashboard,
  theme,
  onSelectTheme,
}: WelcomePageProps) {
  const navItems = [
    { id: "problem", label: "Problem", href: "#problem" },
    { id: "solution", label: "Solution", href: "#solution" },
    { id: "how", label: "How it works", href: "#how" },
    { id: "features", label: "Features", href: "#features" },
    { id: "faq", label: "FAQ", href: "#faq" },
  ] as const;

  const [activeNav, setActiveNav] = useState<string>(navItems[0].id);

  useEffect(() => {
    const sections = navItems
      .map((n) => document.getElementById(n.id))
      .filter(Boolean) as HTMLElement[];
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) setActiveNav(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[var(--bg-primary)]">
      <SmoothCursor />

      {/* Brand — left edge of landing (outside nav) */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className="fixed left-4 top-5 z-50 flex items-center gap-2 sm:left-6 sm:top-6"
        aria-label="Analyst Agent home"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-blue)] text-white shadow-sm">
          <Shield className="h-4 w-4" />
        </span>
        <span className="hidden text-sm font-bold tracking-tight text-[var(--text-primary)] sm:inline">
          Analyst Agent
        </span>
      </a>

      {/* Theme — right edge of landing (outside nav) */}
      <div className="fixed right-4 top-5 z-50 sm:right-6 sm:top-6">
        <AnimatedThemeToggler theme={theme} onSelectTheme={onSelectTheme} />
      </div>

      {/* Centered eco-style glass pill nav */}
      <header className="pointer-events-none fixed inset-x-0 top-4 z-40 flex justify-center px-3 sm:top-5">
        <nav
          className="eco-nav pointer-events-auto flex max-w-[calc(100vw-1.5rem)] items-stretch overflow-x-auto rounded-full text-sm font-medium"
          aria-label="Primary"
        >
          {navItems.map((item, i) => {
            const active = activeNav === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={() => setActiveNav(item.id)}
                className={`relative flex shrink-0 items-center px-4 py-2.5 transition-colors duration-200 sm:px-5 sm:py-3 ${
                  i > 0 ? "border-l border-[var(--nav-divider)]" : ""
                } ${
                  active
                    ? "text-[var(--nav-text-active)]"
                    : "text-[var(--nav-text)] hover:text-[var(--nav-text-active)]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="eco-nav-pill"
                    className="absolute inset-1 -z-0 rounded-full bg-[var(--nav-pill)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10 whitespace-nowrap">{item.label}</span>
              </a>
            );
          })}
        </nav>
      </header>

      {/* ─── HERO ─── */}
      <section className="dot-grid-bg relative min-h-screen overflow-hidden">
        <LightRays className="z-0" count={11} intensity={1} />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:px-8 lg:pt-36">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)]/90 px-4 py-2 text-xs font-medium text-[var(--text-secondary)] shadow-sm backdrop-blur-sm">
              <span className="status-pulse h-2 w-2 rounded-full bg-[var(--accent-green)]" />
              Phase 0 · local stack healthy
            </div>
            <TextAnimate
              as="h1"
              by="word"
              animation="blurInUp"
              className="text-4xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-5xl md:text-6xl md:leading-[1.08] lg:text-[3.75rem]"
            >
              Automate security investigations with a local AI workflow
            </TextAnimate>
            <TextAnimate
              as="p"
              by="word"
              animation="fadeIn"
              delay={0.15}
              className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg md:text-xl"
            >
              Natural-language SOC assistance on your stack — Elasticsearch,
              Ollama, and Elastic MCP — without shipping logs to the cloud.
            </TextAnimate>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5">
              <button
                type="button"
                onClick={onEnterDashboard}
                className="welcome-cta inline-flex min-h-[3.25rem] items-center gap-2.5 rounded-full bg-[var(--accent-blue)] px-8 py-3.5 text-base font-semibold text-white cursor-pointer"
              >
                Enter dashboard
                <ArrowRight className="h-5 w-5" />
              </button>
              <a
                href="#how"
                className="inline-flex min-h-[3.25rem] items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)]/90 px-7 py-3.5 text-base font-semibold text-[var(--text-primary)] backdrop-blur-sm hover:bg-[var(--bg-card-hover)]"
              >
                See how it works
                <ArrowDown className="h-5 w-5" />
              </a>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-2.5">
              {stackPills.map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)]/85 px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] backdrop-blur-sm"
                >
                  <Icon className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <ScrollReveal className="mx-auto mt-14 w-full max-w-2xl sm:mt-16">
            <Terminal
              className="max-w-none px-0"
              username="analyst@local"
              typingSpeed={45}
              delayBetweenCommands={900}
              enableSound
              commands={[
                "analyst-agent init --stack=local",
                "curl -s http://localhost:8000/health",
                "open dashboard --mode=interactive",
              ]}
              outputs={{
                0: [
                  "✓ Elasticsearch · alerts-security",
                  "✓ Ollama · gemma4:e4b",
                  "✓ Elastic MCP · :8080",
                ],
                1: ['{"status":"healthy"}'],
                2: ["Console ready."],
              }}
            />
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {[
                { label: "ES", value: ":9200" },
                { label: "API", value: ":8000" },
                { label: "UI", value: ":3000" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]/90 px-3 py-3 text-center backdrop-blur-sm"
                >
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {s.label}
                  </div>
                  <div className="font-mono text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Trusted logos — larger, high-contrast on dark themes */}
      <section
        id="trusted-stack"
        className="trusted-stack border-y border-[var(--border-color)] py-14 sm:py-16"
      >
        <p className="mb-8 text-center font-mono text-xs font-bold tracking-[0.2em] text-[var(--text-secondary)] sm:text-[13px]">
          BUILT ON A TRUSTED LOCAL STACK
        </p>
        <div className="overflow-hidden">
          <div className="animate-marquee items-center gap-10 px-6 sm:gap-14">
            {brandLogos.concat(brandLogos).map((logo, i) => (
              <div
                key={`${logo.name}-${i}`}
                className="trusted-logo-chip flex shrink-0 items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-5 py-3.5 shadow-[var(--shadow-card)]"
                title={logo.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.src}
                  alt={logo.name}
                  className="trusted-logo-img h-10 w-auto max-w-[140px] object-contain sm:h-12"
                  loading="lazy"
                  draggable={false}
                />
                <span className="text-sm font-bold text-[var(--text-primary)] sm:text-base">
                  {logo.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 font-mono text-[10px] font-bold tracking-[0.16em] text-[var(--accent-blue)]">
              PROBLEM
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Manual log hunting is a hassle.
            </h2>
          </ScrollReveal>
          <ScrollStagger className="grid gap-5 sm:grid-cols-3">
            {problems.map(({ icon: Icon, title, body }) => (
              <ScrollItem key={title}>
                <div className="h-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 text-center shadow-[var(--shadow-card)] sm:p-7">
                  <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-blue-subtle)] text-[var(--accent-blue)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {body}
                  </p>
                </div>
              </ScrollItem>
            ))}
          </ScrollStagger>
        </div>
      </section>

      {/* Solution — compact cards, no full console */}
      <section
        id="solution"
        className="border-t border-[var(--border-color)] bg-[var(--bg-card)]/35 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 font-mono text-[10px] font-bold tracking-[0.16em] text-[var(--accent-blue)]">
              SOLUTION
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Evidence first. Language second.
            </h2>
            <p className="mt-3 text-base text-[var(--text-secondary)]">
              Purpose-built around local models and security indices — not a
              generic chat wrapper.
            </p>
          </ScrollReveal>
          <ScrollStagger className="grid gap-5 md:grid-cols-3">
            {solutions.map((s) => (
              <ScrollItem key={s.title}>
                <div className="welcome-card flex h-full flex-col rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
                  <h3 className="text-base font-bold text-[var(--accent-blue)]">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {s.body}
                  </p>
                  <div className="mt-4 flex-1 overflow-hidden">
                    <ProductShot src={s.image} alt={s.alt} />
                  </div>
                </div>
              </ScrollItem>
            ))}
          </ScrollStagger>
        </div>
      </section>

      {/* How it works — console mock lives HERE only */}
      <section
        id="how"
        className="border-t border-[var(--border-color)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 font-mono text-[10px] font-bold tracking-[0.16em] text-[var(--accent-blue)]">
              HOW IT WORKS
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Just 3 steps to get started
            </h2>
          </ScrollReveal>

          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="relative">
              <div className="absolute bottom-6 left-[1.35rem] top-6 w-px bg-[var(--border-color)]" />
              {howSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <ScrollReveal key={step.n} delay={i * 0.05}>
                    <div className="relative flex gap-5 pb-10 last:pb-0">
                      <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--accent-blue-subtle)] text-[var(--accent-blue)]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">
                          {step.n}. {step.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                          {step.body}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
              <ScrollReveal>
                <button
                  type="button"
                  onClick={onEnterDashboard}
                  className="welcome-cta mt-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-semibold text-white cursor-pointer"
                >
                  Open operations console
                  <ArrowRight className="h-4 w-4" />
                </button>
              </ScrollReveal>
            </div>

            <div className="lg:sticky lg:top-28">
              <ScrollReveal>
                <p className="mb-3 font-mono text-[10px] font-bold tracking-[0.14em] text-[var(--text-muted)]">
                  OPERATIONS CONSOLE PREVIEW
                </p>
                <ProductShot
                  src={ASSETS.images.dashboard}
                  alt="analyst agent operations console"
                />
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture as ONE compact section (replaces chapter scroll) */}
      <section
        id="architecture"
        className="border-t border-[var(--border-color)] bg-[var(--bg-card)]/40 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mx-auto mb-10 max-w-2xl text-center">
            <p className="mb-3 font-mono text-[10px] font-bold tracking-[0.16em] text-[var(--accent-blue)]">
              ARCHITECTURE
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Foundation in three layers
            </h2>
            <p className="mt-3 text-base text-[var(--text-secondary)]">
              Intake, topology, and triage — one screen, no endless sticky
              chapters.
            </p>
          </ScrollReveal>

          <ScrollStagger className="mb-10 grid gap-4 sm:grid-cols-3">
            {architecturePoints.map(({ icon: Icon, title, body }) => (
              <ScrollItem key={title}>
                <div className="h-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-card)]">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-blue-subtle)] text-[var(--accent-blue)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {body}
                  </p>
                </div>
              </ScrollItem>
            ))}
          </ScrollStagger>

          {/* Stack logos (SVGs) */}
          <ScrollReveal className="mb-10">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {brandLogos.map((logo) => (
                <div
                  key={logo.name}
                  className="flex h-14 items-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2 shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo.src}
                    alt={logo.name}
                    className="h-7 w-7 object-contain sm:h-8 sm:w-8"
                    loading="lazy"
                    draggable={false}
                  />
                  <span className="text-xs font-semibold text-[var(--text-secondary)] sm:text-sm">
                    {logo.name}
                  </span>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="grid gap-4 lg:grid-cols-2">
              <ProductShot
                src={ASSETS.images.systemOverview}
                alt="system overview architecture"
              />
              <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--shadow-card)]">
                <div className="border-b border-[var(--border-color)] px-5 py-3 font-mono text-[11px] text-[var(--text-muted)]">
                  service mesh · analyst → gateway → dependencies
                </div>
                <div className="h-[260px] sm:h-[300px]">
                  <IntegrationBeamDemo className="h-full w-full" />
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <FeatureTabsSection />

      {/* Quote */}
      <section className="border-t border-[var(--border-color)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="mb-3 font-mono text-[10px] font-bold tracking-[0.16em] text-[var(--accent-blue)]">
            DESIGN PRINCIPLE
          </p>
          <Quote className="mx-auto mb-5 h-7 w-7 text-[var(--accent-blue)] opacity-40" />
          <blockquote className="text-xl font-semibold leading-snug tracking-tight text-[var(--text-primary)] sm:text-2xl">
            &ldquo;Evidence first, language second. The agent only earns trust
            when Elasticsearch, Ollama, and MCP are actually healthy.&rdquo;
          </blockquote>
        </ScrollReveal>
      </section>

      {/* Stats */}
      <section className="border-t border-[var(--border-color)] bg-[var(--bg-card)]/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <ScrollStagger className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((s) => (
              <ScrollItem key={s.label} className="text-center">
                <div className="text-3xl font-extrabold tabular-nums text-[var(--text-primary)] sm:text-4xl">
                  {s.value}
                </div>
                <div className="mt-1 text-sm text-[var(--text-muted)]">
                  {s.label}
                </div>
              </ScrollItem>
            ))}
          </ScrollStagger>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="border-t border-[var(--border-color)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-2xl">
          <ScrollReveal className="mb-8 text-center">
            <p className="mb-3 font-mono text-[10px] font-bold tracking-[0.16em] text-[var(--accent-blue)]">
              FAQ
            </p>
            <h2 className="text-3xl font-extrabold text-[var(--text-primary)]">
              Frequently asked questions
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] px-5 sm:px-8">
              {faqs.map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl bg-[var(--bg-sidebar)] px-8 py-10 text-[var(--text-on-dark)] sm:flex-row sm:items-center sm:px-12">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">
                Ready when your stack is healthy
              </h2>
              <p className="mt-2 max-w-lg text-sm text-white/65 sm:text-base">
                Open the operations console to verify health and explore Phase 0
                modules.
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-white/70">
                {[
                  "Docker Compose foundation",
                  "Seed security alerts",
                  "Ollama + Elasticsearch + MCP",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={onEnterDashboard}
              className="welcome-cta inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-900 cursor-pointer"
            >
              Launch console
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </ScrollReveal>
      </section>

      <footer className="border-t border-[var(--border-color)] py-8 text-center text-xs text-[var(--text-muted)]">
        Analyst Agent · Phase 0 foundation · Local-first SOC console
      </footer>
    </div>
  );
}
