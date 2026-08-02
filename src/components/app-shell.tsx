"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Moon, Settings, Sparkles, Sun, Target } from "lucide-react";
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

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Your daily overview and quick actions" },
  "/onboarding": { title: "Setup", subtitle: "Personalize how your planner works" },
  "/progress": { title: "Goals", subtitle: "Track your mission and milestones" },
  "/settings": { title: "Config", subtitle: "Integrations and preferences" },
};

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const page = pageTitles[pathname] ?? pageTitles["/"];

  return (
    <>
      <AmbientBackground />
      <div className="shell">
        <header className="site-header">
          <div className="header-inner">
            <span className="brand">Guide Todoo</span>

            <nav className="top-nav" aria-label="Main navigation">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link key={href} href={href} className={`top-nav-link ${active ? "active" : ""}`}>
                    <Icon />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="header-actions">
              <BtnGhost onClick={toggle} aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </BtnGhost>
            </div>
          </div>
        </header>

        <FadeIn>
          <div className="page-intro">
            <h1 className="display-xl text-heading">{page.title}</h1>
            <p className="mt-1 text-body text-muted">{page.subtitle}</p>
          </div>
        </FadeIn>

        <main>{children}</main>
      </div>
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
