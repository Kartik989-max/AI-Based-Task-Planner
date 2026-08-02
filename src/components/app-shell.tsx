"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Sparkles, Target } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { BtnGhost } from "@/components/ui";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/onboarding", label: "Onboarding", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/progress", label: "Progress", icon: Target },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-8 md:px-8">
      <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 top-32 h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl" />

      <FadeIn>
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200/60">Guide Todoo</p>
            <h1 className="mt-1 bg-gradient-to-r from-white via-indigo-100 to-cyan-200 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
              Liquid glass planner
            </h1>
          </div>
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
        </header>
      </FadeIn>

      <main className="relative flex-1">{children}</main>
    </div>
  );
}
