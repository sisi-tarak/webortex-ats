"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Menu,
  X,
  LayoutDashboard,
  FileText,
  BarChart3,
  Palette,
  Settings,
  CreditCard,
  Plus,
  Crown,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/firebase/auth";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard",   href: "/dashboard",              icon: LayoutDashboard },
  { label: "My Resumes",  href: "/dashboard/resumes",      icon: FileText },
  { label: "ATS Checker", href: "/dashboard/ats-checker",  icon: BarChart3 },
  { label: "Templates",   href: "/dashboard/templates",    icon: Palette },
];

const bottomItems = [
  { label: "Billing",  href: "/dashboard/billing",  icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isPro } = useAuth();

  const close = () => setOpen(false);

  const handleNav = (href: string) => {
    close();
    router.push(href);
  };

  const handleSignOut = async () => {
    close();
    try {
      await signOut();
      router.push("/");
      toast.success("Signed out successfully");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      {/* Hamburger trigger */}
      <DialogPrimitive.Trigger asChild>
        <button
          aria-label="Open navigation menu"
          className="flex items-center justify-center w-9 h-9 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <Menu className="h-5 w-5" />
        </button>
      </DialogPrimitive.Trigger>

      {/* Overlay */}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={close}
        />

        {/* Drawer — slides from the left */}
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 flex flex-col",
            "bg-[var(--card)] border-r border-[var(--border)] shadow-2xl shadow-black/50",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-left",
            "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left",
            "duration-300"
          )}
          onInteractOutside={close}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-[var(--border)] flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-sm">
                ATS
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[var(--foreground)] leading-none text-sm">Webortex</span>
                <span className="text-xs text-[var(--muted-foreground)] leading-none">ATS Resume</span>
              </div>
            </div>
            <DialogPrimitive.Close asChild>
              <button
                aria-label="Close navigation menu"
                className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogPrimitive.Close>
          </div>

          {/* New Resume CTA */}
          <div className="p-3 flex-shrink-0">
            <Button className="w-full" size="sm" onClick={() => handleNav("/dashboard/resume/new")}>
              <Plus className="h-4 w-4" />
              New Resume
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
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => handleNav(item.href)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      active
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm shadow-[#62ba47]/20"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-[var(--primary-foreground)]" : "")} />
                    {item.label}
                    {active && <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
                  </button>
                );
              })}
            </div>

            {/* Upgrade card */}
            {!isPro && (
              <div className="mt-6 mx-1 rounded-lg bg-gradient-to-br from-[#62ba47]/10 to-[#009dda]/10 border border-[#62ba47]/25 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-[#62ba47]" />
                  <span className="text-sm font-semibold text-[var(--foreground)]">Upgrade to Pro</span>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mb-3 leading-relaxed">
                  Unlimited resumes, AI writing &amp; clean PDFs.
                </p>
                <Button
                  variant="premium"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => handleNav("/dashboard/billing")}
                >
                  Get Pro — ₹299/mo
                </Button>
              </div>
            )}
          </nav>

          {/* Bottom Nav + user chip */}
          <div className="border-t border-[var(--border)] p-2 flex-shrink-0">
            {bottomItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => handleNav(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-[var(--muted)] text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}

            {/* Sign out */}
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              Sign Out
            </button>

            {/* User chip */}
            <div className="mt-2 px-3 py-2 rounded-lg bg-[var(--muted)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-xs font-semibold flex-shrink-0">
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
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
