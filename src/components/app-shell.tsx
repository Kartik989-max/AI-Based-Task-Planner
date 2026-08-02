"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Moon, Settings, Sparkles, Sun, Target, Zap } from "lucide-react";
import { AmbientBackground } from "@/components/ambient";
import { CustomCursor } from "@/components/cursor";
import { FadeIn, Marquee } from "@/components/motion";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { BtnGhost } from "@/components/ui";

const links = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/onboarding", label: "Setup", icon: Sparkles },
  { href: "/progress", label: "Goals", icon: Target },
  { href: "/settings", label: "Config", icon: Settings },
];

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <>
      <CustomCursor />
      <AmbientBackground />
      <div className="shell">
        <FadeIn>
          <header className="mb-5 flex flex-col gap-4 md:mb-10 md:gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <p className="eyebrow flex items-center gap-2">
                <Zap className="h-3.5 w-3.5" />
                AI task intelligence
              </p>
              <h1 className="display-xl text-gradient-animated">Guide Todoo</h1>
              <p className="max-w-md text-body text-muted">
                Plan smarter. Ship faster. Your autonomous productivity cockpit.
              </p>
            </div>
            <BtnGhost onClick={toggle} aria-label="Toggle theme" className="self-start md:self-auto">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </BtnGhost>
          </header>

          <Marquee className="mb-5 md:mb-8">
            Plan · Sync · Ship · Review · Repeat · AI-powered focus · Deep work blocks · Goal tracking ·
          </Marquee>

          <div className="section-divider mb-8" />
        </FadeIn>

        <main>{children}</main>
      </div>

      <nav className="dock" aria-label="Main navigation">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={`dock-link ${active ? "active" : ""}`} data-cursor-hover="">
              <Icon />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ShellInner>{children}</ShellInner>
    </ThemeProvider>
  );
}
