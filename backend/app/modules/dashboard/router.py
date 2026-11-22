
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.security import get_current_admin

from app.modules.dashboard import service
from app.modules.dashboard.schemas import DashboardStatsResponse


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(get_current_admin)]
)


@router.get(
    "/stats",
    response_model=DashboardStatsResponse
)
def get_stats(
    db: Annotated[Session, Depends(get_db)]
):
    return service.get_dashboard_stats(db)
