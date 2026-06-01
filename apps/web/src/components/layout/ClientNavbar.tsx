"use client";

// This wrapper exists so `ssr: false` can be used from a server-component page.
// next/dynamic with ssr:false is only valid inside client components.
// The landing page (server component) imports THIS file, not Navbar directly,
// which prevents Firebase Auth from being initialized during SSG pre-render.

import dynamic from "next/dynamic";

const NavbarInner = dynamic(
  () => import("./Navbar").then((m) => ({ default: m.Navbar })),
  {
    ssr: false,
    // Skeleton matches the real navbar's layout so there is no visible shift
    // when the JS bundle loads and the real Navbar mounts.
    loading: () => (
      <header className="sticky top-0 z-40 w-full border-b border-[#3b3b3b] bg-[#060606]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo — always visible, identical to real Navbar logo */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#62ba47] text-[#060606] font-bold text-sm">
                ATS
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-[#efefef] leading-none text-sm">Webortex</span>
                <span className="text-xs text-[#888888] leading-none">ATS Resume</span>
              </div>
            </div>
            {/* Right-side skeleton — same dimensions as the real buttons */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-16 rounded-md bg-[#222222] animate-pulse" />
              <div className="h-8 w-28 rounded-md bg-[#222222] animate-pulse" />
            </div>
          </div>
        </div>
      </header>
    ),
  }
);

export function ClientNavbar() {
  return <NavbarInner />;
}
