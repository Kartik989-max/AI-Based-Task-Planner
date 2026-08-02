"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Menu, Moon, Settings, Sparkles, Sun, Target, X } from "lucide-react";
import { AmbientBackground } from "@/components/ambient";
import { AnimatedIcon } from "@/components/animated-icon";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const navLinks = links.map(({ href, label, icon }) => {
    const active = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        className={`sidebar-link ${active ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
      >
        <AnimatedIcon icon={icon} className="h-5 w-5" variant="scale" />
        <span>{label}</span>
      </Link>
    );
  });

  return (
    <>
      <AmbientBackground />
      <div className="app-layout">
        {mobileOpen ? (
          <button
            type="button"
            className="sidebar-backdrop"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <aside className={`sidebar ${mobileOpen ? "sidebar--open" : ""}`} aria-label="Main navigation">
          <div className="sidebar-brand">
            <span className="brand">Guide Todoo</span>
          </div>

          <nav className="sidebar-nav">{navLinks}</nav>

          <div className="sidebar-footer">
            <BtnGhost onClick={toggle} aria-label="Toggle theme" className="sidebar-theme-btn">
              <AnimatedIcon icon={theme === "dark" ? Sun : Moon} className="h-4 w-4" />
              <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
            </BtnGhost>
          </div>
        </aside>

        <div className="main-column">
          <header className="mobile-header">
            <button
              type="button"
              className="mobile-menu-btn"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="brand mobile-brand">Guide Todoo</span>
            <BtnGhost onClick={toggle} aria-label="Toggle theme" className="mobile-theme-btn">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </BtnGhost>
          </header>

          <FadeIn>
            <div className="page-intro">
              <h1 className="display-xl text-heading">{page.title}</h1>
              <p className="mt-1 text-body text-muted">{page.subtitle}</p>
              <div className="section-divider" />
            </div>
          </FadeIn>

          <main>{children}</main>
        </div>
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
