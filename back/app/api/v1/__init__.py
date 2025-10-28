from fastapi import APIRouter
from .auth import router as auth_router
from .oit import router as oit_router
from .resources import router as resources_router
from .ai import router as ai_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(oit_router, tags=["oit"])
api_router.include_router(resources_router, tags=["resources"]) 
api_router.include_router(ai_router, tags=["ai"])