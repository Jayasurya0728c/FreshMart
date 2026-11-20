from django.contrib import admin
from .models import Category, Product, Order, OrderItem, Address, PromoOffer

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'price', 'unit', 'stock')
    list_filter = ('category',)
    search_fields = ('name', 'description')
    list_editable = ('price', 'stock', 'unit')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'total', 'payment_method', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = ('id', 'user__username', 'address', 'phone')
    inlines = [OrderItemInline]

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'full_name', 'phone', 'city', 'is_default', 'created_at')
    list_filter = ('city', 'is_default')
    search_fields = ('user__username', 'full_name', 'phone', 'street_address', 'city')

@admin.register(PromoOffer)
class PromoOfferAdmin(admin.ModelAdmin):
    list_display = ('id', 'tag', 'coupon_code', 'discount_percent', 'free_delivery_threshold', 'is_active', 'updated_at')
    list_editable = ('tag', 'coupon_code', 'discount_percent', 'is_active')
