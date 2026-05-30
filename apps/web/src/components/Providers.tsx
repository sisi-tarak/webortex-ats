"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";

/** All client-side context providers, wrapped here so the root layout stays a Server Component. */
export function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures a new QueryClient is created per browser session (not shared across requests)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With real-time Firestore listeners active, we rarely need background refetch
            staleTime: 60 * 1000,       // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
