from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from store.views import (
    CategoryViewSet,
    ProductViewSet,
    OrderViewSet,
    AddressViewSet,
    user_info,
    user_profile,
    register_user,
    promo_offer_view
)

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='categories')
router.register('products', ProductViewSet, basename='products')
router.register('orders', OrderViewSet, basename='orders')
router.register('addresses', AddressViewSet, basename='addresses')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),
    path('api/', include(router.urls)),
    path('api/user/', user_info),
    path('api/profile/', user_profile),
    path('api/promo/', promo_offer_view),
    path('api/register/', register_user),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
