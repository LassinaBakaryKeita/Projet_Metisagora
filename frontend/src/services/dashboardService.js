
import api from './api';

/**
 * Service de consultation des statistiques du Dashboard.
 */
export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');

    const data = response.data;

    // Adaptation snake_case (Backend) -> camelCase (Frontend)
    return {
      metrics: {
        totalProducts: data.metrics.total_products,
        totalStock: data.metrics.total_stock,
        pendingEscalations: data.metrics.pending_escalations,
        totalOrders: data.metrics.total_orders,
        totalRevenue: data.metrics.total_revenue,
      },

      trends: {
        stockHealth: data.trends.stock_health,
      },

      lowStockProducts: data.low_stock_products.map((product) => ({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        stock: product.stock,
      })),
    };
  },
};
