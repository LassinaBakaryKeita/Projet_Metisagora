
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.modules.products.models import Product
from app.modules.notifications.models import Notification


def get_dashboard_stats(db: Session):

    # 1. Nombre total de produits
    total_products = db.scalar(
        select(func.count(Product.id))
    ) or 0

    # 2. Quantité totale en stock
    total_stock = db.scalar(
        select(func.coalesce(func.sum(Product.stock), 0))
    ) or 0

    # 3. Nombre de notifications non résolues
    pending_escalations = db.scalar(
        select(func.count(Notification.id)).where(
            Notification.status == "pending"
        )
    ) or 0

    # 4. Nombre de produits ayant un stock optimal
    products_with_healthy_stock = db.scalar(
        select(func.count(Product.id)).where(
            Product.stock > 5
        )
    ) or 0

    # 5. Récupération des produits avec un stock faible
    low_stock_statement = (
        select(Product)
        .where(Product.stock <= 5)
        .order_by(Product.stock.asc())
    )

    low_stock_products = db.scalars(
        low_stock_statement
    ).all()

    # 6. Construction des statistiques
    return {
        "metrics": {
            "total_products": total_products,
            "total_stock": total_stock,
            "pending_escalations": pending_escalations,
            "total_orders": None,
            "total_revenue": None,
        },
        "trends": {
            "stock_health": (
                f"{products_with_healthy_stock} "
                "articles avec stock optimal"
            )
        },
        "low_stock_products": low_stock_products,
    }
