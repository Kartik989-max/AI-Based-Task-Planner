"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CircleDashed, Compass, Moon, Sun, Target, Waves } from "lucide-react";
import type { ReactNode } from "react";
import { AmbientBackground } from "@/components/ambient";
import { ParticleField } from "@/components/particles";
import { FadeIn, glide } from "@/components/motion";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { Eyebrow } from "@/components/ui";

type Route = {
  href: string;
  label: string;
  index: string;
  icon: typeof Compass;
  kicker: string;
  title: ReactNode;
  subtitle: string;
};

const routes: Route[] = [
  {
    href: "/",
    label: "Today",
    index: "01",
    icon: Compass,
    kicker: "01 — Dashboard",
    title: (
      <>
        Today, at a <em>glance</em>
      </>
    ),
    subtitle: "One page. Everything that matters, nothing that doesn't.",
  },
  {
    href: "/onboarding",
    label: "Setup",
    index: "02",
    icon: Waves,
    kicker: "02 — Setup",
    title: (
      <>
        Teach it how you <em>work</em>
      </>
    ),
    subtitle: "Set the rhythm once — the planner keeps time from here.",
  },
  {
    href: "/progress",
    label: "Goals",
    index: "03",
    icon: Target,
    kicker: "03 — Goals",
    title: (
      <>
        The long <em>game</em>
      </>
    ),
    subtitle: "Where you're headed, and how far along you already are.",
  },
  {
    href: "/settings",
    label: "Config",
    index: "04",
    icon: CircleDashed,
    kicker: "04 — Config",
    title: (
      <>
        Wires and <em>switches</em>
      </>
    ),
    subtitle: "Connect the things that feed your plan.",
  },
];

/** Sun ⇄ moon crossfade with a quarter turn. */
function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggle } = useTheme();
  const reduced = useReducedMotion();
  const dark = theme === "dark";
  const Icon = dark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggle}
      className={`theme-btn ${compact ? "theme-btn--icon" : ""}`.trim()}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="theme-orb">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={reduced ? { opacity: 0 } : { opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="grid place-items-center"
          >
            <Icon className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.6} />
          </motion.span>
        </AnimatePresence>
      </span>
      {compact ? null : <span className="rail-label">{dark ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}

function Rail({ pathname }: { pathname: string }) {
  return (
    <aside className="rail" aria-label="Main navigation">
      <div className="rail-mark">
        <span className="mark-glyph" aria-hidden>
          gt
        </span>
        <span className="rail-label text-[0.95rem] font-semibold tracking-tight ink">Guide Todoo</span>
      </div>

      <nav className="rail-nav">
        {routes.map(({ href, label, index, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`rail-link ${active ? "is-active" : ""}`.trim()}
            >
              {active ? <motion.span layoutId="rail-pill" className="rail-pill" transition={glide} /> : null}
              <span className="rail-link-icon">
                <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.6} />
              </span>
              <span className="rail-label">{label}</span>
              <span className="rail-index">{index}</span>
            </Link>
          );
        })}
      </nav>

      <div className="rail-foot">
        <ThemeToggle />
      </div>
    </aside>
  );
}

function Dock({ pathname }: { pathname: string }) {
  return (
    <nav className="dock" aria-label="Main navigation">
      {routes.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={`dock-link ${active ? "is-active" : ""}`.trim()}
          >
            {active ? <motion.span layoutId="dock-pill" className="dock-pill" transition={glide} /> : null}
            <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.6} />
          </Link>
        );
      })}
      <span className="dock-sep" aria-hidden />
      <ThemeToggle compact />
    </nav>
  );
}

function ShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const page = routes.find((r) => r.href === pathname) ?? routes[0]!;

  return (
    <>
      <AmbientBackground />
      <ParticleField />

      <div className="shell">
        <Rail pathname={pathname} />
        <Dock pathname={pathname} />

        <div className="canvas">
          <FadeIn className="page-head">
            <Eyebrow>{page.kicker}</Eyebrow>
            <h1 className="display mt-4">{page.title}</h1>
            <p className="lede mt-4">{page.subtitle}</p>
            <div className="rule mt-8" />
          </FadeIn>

          <main>{children}</main>
        </div>
      </div>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ShellInner>{children}</ShellInner>
    </ThemeProvider>
  );
}
