
from math import ceil

from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session

from app.modules.products.models import Product
from app.modules.products.schemas import ProductCreate, ProductUpdate



# CREATE PRODUCT

def create_product(db: Session, product_data: ProductCreate):
    try:
        new_product = Product(**product_data.model_dump())

        db.add(new_product)
        db.commit()
        db.refresh(new_product)

        return new_product

    except Exception:
        db.rollback()
        raise



# GET PRODUCTS (SEARCH + PAGINATION)
def get_products(
    db: Session,
    page: int = 1,
    limit: int = 10,
    search: str | None = None
):
    if page < 1:
        raise ValueError("Page must be greater than or equal to 1.")

    if limit < 1 or limit > 100:
        raise ValueError("Limit must be between 1 and 100.")

    query = select(Product)

    # Search by product name or description
    if search and search.strip():
        search_term = f"%{search.strip()}%"

        query = query.where(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term)
            )
        )

    # Calculate total matching products
    count_query = select(func.count()).select_from(
        query.order_by(None).subquery()
    )

    total = db.scalar(count_query) or 0

    # Apply pagination
    offset = (page - 1) * limit

    query = (
        query
        .order_by(Product.id.desc())
        .offset(offset)
        .limit(limit)
    )

    products = db.scalars(query).all()

    total_pages = ceil(total / limit) if total > 0 else 0

    return {
        "items": products,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }



# GET PRODUCT BY ID

def get_product_by_id(db: Session, product_id: int):

    statement = select(Product).where(
        Product.id == product_id
    )

    return db.scalar(statement)



# UPDATE PRODUCT

def update_product(
    db: Session,
    product_id: int,
    product_data: ProductUpdate
):
    product = get_product_by_id(db, product_id)

    if product is None:
        return None

    update_data = product_data.model_dump(exclude_unset=True)

    if not update_data:
        raise ValueError("At least one field must be provided.")

    # Required fields cannot be explicitly set to None
    for field in ("name", "price", "stock"):
        if field in update_data and update_data[field] is None:
            raise ValueError(f"{field} cannot be null.")

    try:
        for field, value in update_data.items():
            setattr(product, field, value)

        db.commit()
        db.refresh(product)

        return product

    except Exception:
        db.rollback()
        raise


# DELETE PRODUCT

def delete_product(db: Session, product_id: int):

    product = get_product_by_id(db, product_id)

    if product is None:
        return None

    try:
        db.delete(product)
        db.commit()

        return True

    except Exception:
        db.rollback()
        raise