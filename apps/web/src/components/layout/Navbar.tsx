"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Settings, Zap, ChevronDown, Crown } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function Navbar() {
  const { user, profile, isAuthenticated, isPro, loading } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.push("/");
      toast.success("Signed out successfully");
    } catch {
      toast.error("Failed to sign out");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    /* Dark nav bar — #060606 bg, border below from --border (#3b3b3b) */
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-sm shadow-sm group-hover:shadow-[0_0_12px_rgba(98,186,71,0.4)] transition-shadow">
              ATS
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-[var(--brand-text-nav)] leading-none text-sm">
                Webortex
              </span>
              <span className="text-xs text-[var(--muted-foreground)] leading-none">
                ATS Resume
              </span>
            </div>
          </Link>

          {/* Marketing nav links — only shown for unauthenticated, hidden during load to avoid shift */}
          {!loading && !isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6">
              {["Features", "Templates", "Pricing", "ATS Checker"].map((label) => (
                <Link
                  key={label}
                  href={`/${label.toLowerCase().replace(" ", "-")}`}
                  className="text-sm text-[var(--brand-text-nav)] hover:text-[var(--brand-green-light)] transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Stable skeleton while auth resolves — prevents layout shift */}
            {loading ? (
              <>
                <div className="h-8 w-16 rounded-md bg-[var(--muted)] animate-pulse" />
                <div className="h-8 w-8 rounded-full bg-[var(--muted)] animate-pulse" />
              </>
            ) : !isAuthenticated ? (
              <>
                {/* Ghost = transparent, foreground text (#efefef), hover muted */}
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                {/* Default = green bg, dark text */}
                <Button size="sm" asChild>
                  <Link href="/signup">Get Started Free</Link>
                </Button>
              </>
            ) : (
              <>
                {!isPro && (
                  <Button variant="premium" size="sm" asChild>
                    <Link href="/billing">
                      <Crown className="h-3.5 w-3.5" />
                      Upgrade
                    </Link>
                  </Button>
                )}

                {/* User dropdown */}
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
                      {/* Avatar — green bg, dark text */}
                      <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                        {profile?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="hidden sm:flex flex-col items-start">
                        <span className="text-sm font-medium text-[var(--foreground)] leading-none">
                          {profile?.displayName?.split(" ")[0] || "User"}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Badge variant={isPro ? "pro" : "free"} className="text-[10px] px-1.5 py-0">
                            {profile?.plan?.toUpperCase() || "FREE"}
                          </Badge>
                        </div>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                    </button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Portal>
                    {/* Dropdown — #1a1a1a bg, #3b3b3b border */}
                    <DropdownMenu.Content
                      className="z-50 min-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--popover)] p-1 shadow-xl shadow-black/40 animate-in fade-in-0 zoom-in-95"
                      sideOffset={8}
                      align="end"
                    >
                      <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          {profile?.displayName || "User"}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)] truncate">
                          {user?.email}
                        </p>
                      </div>

                      <DropdownMenu.Item asChild>
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-[var(--muted)] text-[var(--foreground)] outline-none transition-colors"
                        >
                          <Zap className="h-4 w-4 text-[var(--primary)]" />
                          Dashboard
                        </Link>
                      </DropdownMenu.Item>

                      <DropdownMenu.Item asChild>
                        <Link
                          href="/settings"
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-[var(--muted)] text-[var(--foreground)] outline-none transition-colors"
                        >
                          <Settings className="h-4 w-4 text-[var(--muted-foreground)]" />
                          Settings
                        </Link>
                      </DropdownMenu.Item>

                      {!isPro && (
                        <DropdownMenu.Item asChild>
                          {/* Upgrade item — green tint on dark bg */}
                          <Link
                            href="/billing"
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer bg-[#62ba47]/10 text-[#62ba47] hover:bg-[#62ba47]/20 outline-none mx-1 mb-1 transition-colors border border-[#62ba47]/20"
                          >
                            <Crown className="h-4 w-4" />
                            Upgrade to Pro
                          </Link>
                        </DropdownMenu.Item>
                      )}

                      <DropdownMenu.Separator className="h-px bg-[var(--border)] my-1" />

                      <DropdownMenu.Item asChild>
                        <button
                          onClick={handleSignOut}
                          disabled={signingOut}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-red-500/10 text-red-400 outline-none transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          {signingOut ? "Signing out…" : "Sign Out"}
                        </button>
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
