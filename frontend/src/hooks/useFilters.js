import { useMemo } from 'react';

/**
 * Hook to apply advanced filters to data array
 */
export function useFilteredData(data, filters, fields) {
  return useMemo(() => {
    if (!data || !filters.length) return data;

    return data.filter(item => {
      return filters.every(filter => {
        if (!filter.field || !filter.value) return true;

        const field = fields.find(f => f.id === filter.field);
        if (!field) return true;

        const itemValue = item[filter.field];
        const filterValue = filter.value;
        const filterValue2 = filter.value2;

        switch (filter.operator) {
          case 'contains':
            return String(itemValue || '').toLowerCase().includes(String(filterValue).toLowerCase());
          case 'notContains':
            return !String(itemValue || '').toLowerCase().includes(String(filterValue).toLowerCase());
          case 'equals':
            if (field.type === 'number') {
              return Number(itemValue) === Number(filterValue);
            }
            return String(itemValue || '').toLowerCase() === String(filterValue).toLowerCase();
          case 'notEquals':
            if (field.type === 'number') {
              return Number(itemValue) !== Number(filterValue);
            }
            return String(itemValue || '').toLowerCase() !== String(filterValue).toLowerCase();
          case 'startsWith':
            return String(itemValue || '').toLowerCase().startsWith(String(filterValue).toLowerCase());
          case 'endsWith':
            return String(itemValue || '').toLowerCase().endsWith(String(filterValue).toLowerCase());
          case 'greaterThan':
            return Number(itemValue) > Number(filterValue);
          case 'lessThan':
            return Number(itemValue) < Number(filterValue);
          case 'greaterOrEqual':
            return Number(itemValue) >= Number(filterValue);
          case 'lessOrEqual':
            return Number(itemValue) <= Number(filterValue);
          case 'between':
            if (field.type === 'date') {
              const date = new Date(itemValue);
              return date >= new Date(filterValue) && date <= new Date(filterValue2);
            }
            return Number(itemValue) >= Number(filterValue) && Number(itemValue) <= Number(filterValue2);
          case 'before':
            return new Date(itemValue) < new Date(filterValue);
          case 'after':
            return new Date(itemValue) > new Date(filterValue);
          case 'lastNDays': {
            const date = new Date(itemValue);
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - Number(filterValue));
            return date >= daysAgo;
          }
          case 'in':
            return filterValue.split(',').map(v => v.trim().toLowerCase()).includes(String(itemValue).toLowerCase());
          default:
            return true;
        }
      });
    });
  }, [data, filters, fields]);
}

/**
 * Hook to convert orders to calendar events
 */
export function useOrdersAsEvents(orders) {
  return useMemo(() => {
    if (!orders) return [];

    return orders
      .filter(order => order.due_date)
      .map(order => ({
        id: order.order_id,
        title: `#${order.order_id}`,
        date: order.due_date,
        status: order.status,
        customer: order.customer_id,
        data: order,
      }));
  }, [orders]);
}

