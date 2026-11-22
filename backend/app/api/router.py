
from fastapi import APIRouter

from app.modules.admin.router import router as admin_router
from app.modules.products.router import router as products_router
from app.modules.notifications.router import router as notification_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.chatbot.router import router as chatbot_router

from app.integrations.whatsapp.webhook import router as whatsapp_router


# Routeur API principal
api_router = APIRouter(prefix="/api/v1")

# Routeurs des modules applicatifs
api_router.include_router(admin_router)
api_router.include_router(products_router)
api_router.include_router(notification_router)
api_router.include_router(dashboard_router)
api_router.include_router(chatbot_router)

# Routeurs d'intégrations externes
api_router.include_router(
    whatsapp_router,
    prefix="/integrations/whatsapp"
)
