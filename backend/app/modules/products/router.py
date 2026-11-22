
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.security import get_current_admin

from app.modules.products.schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductPaginatedResponse,
)
from app.modules.products import service


router = APIRouter(
    prefix="/products",
    tags=["Products"],
    dependencies=[Depends(get_current_admin)]
)


# CREATE PRODUCT
@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED
)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db)
):
    return service.create_product(db, product_data)


# GET PRODUCTS (SEARCH + PAGINATION)
@router.get(
    "",
    response_model=ProductPaginatedResponse
)
def get_products(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    search: str | None = Query(default=None, max_length=255),
    db: Session = Depends(get_db)
):
    return service.get_products(
        db=db,
        page=page,
        limit=limit,
        search=search
    )


# GET PRODUCT BY ID
@router.get(
    "/{product_id}",
    response_model=ProductResponse
)
def get_product_by_id(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = service.get_product_by_id(db, product_id)

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found."
        )

    return product


# UPDATE PRODUCT
@router.put(
    "/{product_id}",
    response_model=ProductResponse
)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db)
):
    try:
        product = service.update_product(
            db,
            product_id,
            product_data
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error)
        )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found."
        )

    return product


# DELETE PRODUCT
@router.delete(
    "/{product_id}",
    response_model=dict[str, str]
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    deleted = service.delete_product(db, product_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found."
        )

    return {"message": "Product deleted successfully."}
