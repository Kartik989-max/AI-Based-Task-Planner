"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Moon, Settings, Sparkles, Sun, Target } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { BtnGhost } from "@/components/ui";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/onboarding", label: "Onboarding", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/progress", label: "Progress", icon: Target },
];

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-8 md:px-8">
      <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 top-32 h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl" />

      <FadeIn>
        <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold text-heading md:text-3xl">Guide Todoo</h1>
          <div className="flex flex-wrap items-center gap-2">
            <BtnGhost onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Light" : "Dark"}
            </BtnGhost>
            <nav className="flex flex-wrap gap-2">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link key={href} href={href}>
                    <BtnGhost className={active ? "active" : ""}>
                      <Icon className="h-4 w-4" />
                      {label}
                    </BtnGhost>
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>
      </FadeIn>

      <main className="relative flex-1">{children}</main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ShellInner>{children}</ShellInner>
    </ThemeProvider>
  );
}
