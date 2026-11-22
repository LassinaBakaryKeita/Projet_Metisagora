
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class DashboardMetrics(BaseModel):
    total_products: int
    total_stock: int
    pending_escalations: int

    # Ces données seront disponibles après le développement
    # du module Commandes.
    total_orders: int | None = None
    total_revenue: Decimal | None = None


class DashboardTrends(BaseModel):
    stock_health: str


class LowStockProduct(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    price: Decimal
    stock: int


class DashboardStatsResponse(BaseModel):
    metrics: DashboardMetrics
    trends: DashboardTrends
    low_stock_products: list[LowStockProduct]
