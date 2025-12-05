/**
 * React Query hooks for API data fetching
 * Provides type-safe, cached data access with automatic refetching
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';

// ============================================
// QUERY KEYS - centralized for cache invalidation
// ============================================
export const queryKeys = {
  orders: ['orders'],
  order: (id) => ['orders', id],
  customers: ['customers'],
  customer: (id) => ['customers', id],
  products: ['products'],
  product: (id) => ['products', id],
  inventory: ['inventory'],
  employees: ['employees'],
  timesheets: ['timesheets'],
  analytics: {
    summary: (params) => ['analytics', 'summary', params],
    revenueByMonth: ['analytics', 'revenueByMonth'],
    topCustomers: (params) => ['analytics', 'topCustomers', params],
    topOrders: (params) => ['analytics', 'topOrders', params],
  },
  demandScenarios: ['demandScenarios'],
};

// ============================================
// ORDERS
// ============================================
export function useOrders(options = {}) {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: () => api.getOrders(),
    ...options,
  });
}

export function useOrder(orderId, options = {}) {
  return useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => api.getOrder(orderId),
    enabled: !!orderId,
    ...options,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData) => api.createOrder(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, data }) => api.updateOrder(orderId, data),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId) => api.deleteOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

// ============================================
// CUSTOMERS
// ============================================
export function useCustomers(options = {}) {
  return useQuery({
    queryKey: queryKeys.customers,
    queryFn: () => api.getCustomers(),
    ...options,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerData) => api.createCustomer(customerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, data }) => api.updateCustomer(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerId) => api.deleteCustomer(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
  });
}

// ============================================
// PRODUCTS
// ============================================
export function useProducts(options = {}) {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: () => api.getProducts(),
    ...options,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productData) => api.createProduct(productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, data }) => api.updateProduct(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId) => api.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}

// ============================================
// INVENTORY
// ============================================
export function useInventory(options = {}) {
  return useQuery({
    queryKey: queryKeys.inventory,
    queryFn: () => api.getInventory(),
    ...options,
  });
}

export function useCreateInventoryTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (txnData) => api.createInventoryTransaction(txnData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
    },
  });
}

// ============================================
// EMPLOYEES & TIMESHEETS
// ============================================
export function useEmployees(options = {}) {
  return useQuery({
    queryKey: queryKeys.employees,
    queryFn: () => api.getEmployees(),
    ...options,
  });
}

export function useTimesheets(options = {}) {
  return useQuery({
    queryKey: queryKeys.timesheets,
    queryFn: () => api.getTimesheets(),
    ...options,
  });
}

// ============================================
// ANALYTICS
// ============================================
export function useAnalyticsSummary(params = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.analytics.summary(params),
    queryFn: () => api.getAnalyticsSummary(params),
    staleTime: 5 * 60 * 1000, // 5 minutes for analytics
    ...options,
  });
}

export function useRevenueByMonth(options = {}) {
  return useQuery({
    queryKey: queryKeys.analytics.revenueByMonth,
    queryFn: () => api.getRevenueByMonth(),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useTopCustomers(params = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.analytics.topCustomers(params),
    queryFn: () => api.getTopCustomers(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

// ============================================
// DEMAND SCENARIOS
// ============================================
export function useDemandScenarios(options = {}) {
  return useQuery({
    queryKey: queryKeys.demandScenarios,
    queryFn: () => api.getDemandScenarios?.() || Promise.resolve([]),
    ...options,
  });
}

export function useCreateDemandScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scenarioData) => api.createDemandScenario?.(scenarioData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.demandScenarios });
    },
  });
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Prefetch data for anticipated navigation
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  return {
    prefetchOrders: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.orders,
        queryFn: () => api.getOrders(),
      });
    },
    prefetchCustomers: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.customers,
        queryFn: () => api.getCustomers(),
      });
    },
    prefetchProducts: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.products,
        queryFn: () => api.getProducts(),
      });
    },
  };
}

/**
 * Invalidate all queries (useful for logout)
 */
export function useInvalidateAll() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries();
  };
}

