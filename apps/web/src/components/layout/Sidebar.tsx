"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Palette,
  Settings,
  CreditCard,
  Plus,
  Crown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const navItems = [
  { label: "Dashboard",  href: "/dashboard",            icon: LayoutDashboard },
  { label: "My Resumes", href: "/dashboard/resumes",    icon: FileText },
  { label: "ATS Checker",href: "/dashboard/ats-checker",icon: BarChart3 },
  { label: "Templates",  href: "/dashboard/templates",  icon: Palette },
];

const bottomItems = [
  { label: "Billing",  href: "/dashboard/billing",  icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, isPro } = useAuth();

  return (
    /* Dark sidebar — #222222 bg (#brand-card), #3b3b3b border */
    <aside className="hidden lg:flex flex-col w-60 border-r border-[var(--border)] bg-[var(--card)] h-screen sticky top-0">

      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-16 border-b border-[var(--border)]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-sm">
          ATS
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[var(--foreground)] leading-none text-sm">Webortex</span>
          <span className="text-xs text-[var(--muted-foreground)] leading-none">ATS Resume</span>
        </div>
      </div>

      {/* New Resume CTA — green button, dark text */}
      <div className="p-3">
        <Button className="w-full" size="sm" asChild>
          <Link href="/dashboard/resume/new">
            <Plus className="h-4 w-4" />
            New Resume
          </Link>
        </Button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-2 pb-4 overflow-y-auto">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  active
                    /* Active — green bg, dark text (primary-foreground = #060606) */
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm shadow-[#62ba47]/20"
                    /* Inactive — muted text, hover brings elevated surface */
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    active ? "text-[var(--primary-foreground)]" : ""
                  )}
                />
                {item.label}
                {active && <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
              </Link>
            );
          })}
        </div>

        {/* Upgrade card — green → blue tint, dark theme safe */}
        {!isPro && (
          <div className="mt-6 mx-1 rounded-lg bg-gradient-to-br from-[#62ba47]/10 to-[#009dda]/10 border border-[#62ba47]/25 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-4 w-4 text-[#62ba47]" />
              <span className="text-sm font-semibold text-[var(--foreground)]">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mb-3 leading-relaxed">
              Unlimited resumes, AI writing assistant &amp; clean PDFs.
            </p>
            <Button variant="premium" size="sm" className="w-full text-xs" asChild>
              <Link href="/dashboard/billing">Get Pro — ₹299/mo</Link>
            </Button>
          </div>
        )}
      </nav>

      {/* Bottom Nav */}
      <div className="border-t border-[var(--border)] p-2">
        {bottomItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-[var(--muted)] text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {/* User info chip */}
        <div className="mt-2 px-3 py-2 rounded-lg bg-[var(--muted)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-xs font-semibold">
              {profile?.displayName?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--foreground)] truncate">
                {profile?.displayName || "User"}
              </p>
              <Badge variant={isPro ? "pro" : "free"} className="text-[9px] px-1.5 py-0 mt-0.5">
                {profile?.plan?.toUpperCase() || "FREE"}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
