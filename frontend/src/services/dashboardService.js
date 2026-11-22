
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

      weeklyActivity: data.weekly_activity
        ? {
            totalConversations: data.weekly_activity.total_conversations,
            aiResolutionRate: data.weekly_activity.ai_resolution_rate,
            avgResponseTime: data.weekly_activity.avg_response_time,
            activeNow: data.weekly_activity.active_now,
            days: data.weekly_activity.days.map((d) => ({
              day: d.day,
              date: d.date,
              conversations: d.conversations,
              resolvedByAi: d.resolved_by_ai,
              escalated: d.escalated,
              isToday: d.is_today,
            })),
          }
        : null,
    };
  },
};
