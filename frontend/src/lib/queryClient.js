/**
 * React Query Provider and Configuration
 * Centralizes API state management with caching, refetching, and optimistic updates
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client with sensible defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 2 minutes
      staleTime: 2 * 60 * 1000,
      // Cache data for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Refetch on window focus (good for keeping data fresh)
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data exists
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

export { QueryClientProvider };

