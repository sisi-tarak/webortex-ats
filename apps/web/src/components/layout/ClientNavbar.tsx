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
    loading: () => (
      <header className="sticky top-0 z-50 w-full border-b border-[#3b3b3b] bg-[#060606]/95 backdrop-blur-sm h-16" />
    ),
  }
);

export function ClientNavbar() {
  return <NavbarInner />;
}
