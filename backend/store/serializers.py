from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Product, Order, OrderItem, Address, PromoOffer

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'product_count']

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Product
        fields = ['id', 'category', 'category_name', 'name', 'description', 'unit', 'price', 'stock', 'image']

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_price = serializers.ReadOnlyField(source='product.price')
    product_unit = serializers.ReadOnlyField(source='product.unit')
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_price', 'product_unit', 'product_image', 'quantity']

    def get_product_image(self, obj):
        if obj.product and obj.product.image:
            return obj.product.image.url
        return None

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'user', 'full_name', 'phone', 'street_address', 'city', 'state', 'postal_code', 'is_default', 'created_at']
        read_only_fields = ['user', 'created_at']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Order
        fields = ['id', 'user', 'username', 'address', 'phone', 'payment_method', 'delivery_fee', 'discount', 'total', 'status', 'created_at', 'items']
        read_only_fields = ['user', 'created_at']

class UserSerializer(serializers.ModelSerializer):
    addresses = AddressSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'date_joined', 'addresses']
        read_only_fields = ['id', 'username', 'is_staff', 'date_joined']

class PromoOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoOffer
        fields = ['id', 'tag', 'text', 'coupon_code', 'discount_percent', 'free_delivery_threshold', 'is_active', 'updated_at']
