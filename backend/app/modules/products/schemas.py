
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field



# PRODUCT CREATE
class ProductCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=255
    )

    description: str | None = None

    price: Decimal = Field(
        ge=0,
        max_digits=10,
        decimal_places=2
    )

    stock: int = Field(
        default=0,
        ge=0
    )



# PRODUCT UPDATE
class ProductUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=255
    )

    description: str | None = None

    price: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=10,
        decimal_places=2
    )

    stock: int | None = Field(
        default=None,
        ge=0
    )



# PRODUCT RESPONSE
class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    price: Decimal
    stock: int



# PRODUCT PAGINATED RESPONSE

class ProductPaginatedResponse(BaseModel):
    items: list[ProductResponse]

    total: int
    page: int
    limit: int
    total_pages: int
