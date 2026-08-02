"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Moon, Settings, Sparkles, Sun, Target, Zap } from "lucide-react";
import { AmbientBackground } from "@/components/ambient";
import { FadeIn } from "@/components/motion";
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
      <AmbientBackground />
      <div className="shell">
        <FadeIn>
          <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="eyebrow flex items-center gap-2">
                <Zap className="h-3.5 w-3.5" />
                AI task intelligence
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight text-gradient md:text-5xl">Guide Todoo</h1>
              <p className="max-w-md text-sm text-muted">Plan smarter. Ship faster. Your autonomous productivity cockpit.</p>
            </div>
            <BtnGhost onClick={toggle} aria-label="Toggle theme" className="self-start md:self-auto">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </BtnGhost>
          </header>
        </FadeIn>

        <main>{children}</main>
      </div>

      <nav className="dock" aria-label="Main navigation">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={`dock-link ${active ? "active" : ""}`}>
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
