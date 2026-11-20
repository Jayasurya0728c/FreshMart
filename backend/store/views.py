from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db import transaction
from decimal import Decimal
from .models import Category, Product, Order, OrderItem, Address, PromoOffer
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    OrderSerializer,
    AddressSerializer,
    UserSerializer,
    PromoOfferSerializer
)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer

    def get_queryset(self):
        queryset = Product.objects.all().select_related('category')
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        in_stock = self.request.query_params.get('in_stock')
        ordering = self.request.query_params.get('ordering')

        if category and category != 'All':
            queryset = queryset.filter(category_id=category)
        if search:
            queryset = queryset.filter(name__icontains=search) | queryset.filter(description__icontains=search)
        if in_stock and in_stock.lower() in ['true', '1']:
            queryset = queryset.filter(stock__gt=0)
        if ordering:
            if ordering == 'low':
                queryset = queryset.order_by('price')
            elif ordering == 'high':
                queryset = queryset.order_by('-price')
            elif ordering == 'name':
                queryset = queryset.order_by('name')
        else:
            queryset = queryset.order_by('name')

        return queryset

class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user).order_by('-is_default', '-created_at')

    def perform_create(self, serializer):
        is_default = serializer.validated_data.get('is_default', False)
        if is_default:
            Address.objects.filter(user=self.request.user).update(is_default=False)
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        is_default = serializer.validated_data.get('is_default', False)
        if is_default:
            Address.objects.filter(user=self.request.user).exclude(id=serializer.instance.id).update(is_default=False)
        serializer.save()

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.all().select_related('user').prefetch_related('items__product').order_by('-created_at')
        return Order.objects.filter(user=self.request.user).select_related('user').prefetch_related('items__product').order_by('-created_at')

    @transaction.atomic
    def perform_create(self, serializer):
        items_data = self.request.data.get('items', [])
        if not items_data:
            raise serializers.ValidationError({'items': 'Order must contain at least one item.'})

        # Calculate totals
        subtotal = Decimal('0.00')
        validated_items = []
        for item in items_data:
            try:
                product = Product.objects.select_for_update().get(id=item['product'])
            except (Product.DoesNotExist, KeyError):
                raise serializers.ValidationError({'error': f"Product {item.get('product')} not found."})

            qty = int(item.get('quantity', 1))
            if qty <= 0:
                continue
            if product.stock < qty:
                raise serializers.ValidationError({'error': f"Not enough stock for {product.name} (available: {product.stock})."})

            subtotal += product.price * qty
            validated_items.append((product, qty))

        # Check discount / delivery fee
        raw_delivery = self.request.data.get('delivery_fee', None)
        if raw_delivery is not None:
            delivery_fee = Decimal(str(raw_delivery))
        else:
            delivery_fee = Decimal('0.00') if subtotal > Decimal('500.00') or subtotal == Decimal('0.00') else Decimal('40.00')

        discount_val = Decimal(str(self.request.data.get('discount', 0)))
        total_val = self.request.data.get('total')
        if total_val is not None:
            computed_total = Decimal(str(total_val))
        else:
            computed_total = max(Decimal('0.00'), subtotal - discount_val + delivery_fee)

        phone = self.request.data.get('phone', '')
        payment_method = self.request.data.get('payment_method', 'Cash on Delivery')
        address_str = self.request.data.get('address', '')

        order = serializer.save(
            user=self.request.user,
            address=address_str,
            phone=phone,
            payment_method=payment_method,
            delivery_fee=delivery_fee,
            discount=discount_val,
            total=computed_total,
            status='Pending'
        )

        for product, qty in validated_items:
            OrderItem.objects.create(order=order, product=product, quantity=qty)
            product.stock -= qty
            product.save()

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status not in ['Pending']:
            return Response({'error': f"Cannot cancel an order that is {order.status}."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            order.status = 'Cancelled'
            order.save()
            # Restore product stock
            for item in order.items.all():
                item.product.stock += item.quantity
                item.product.save()

        return Response(OrderSerializer(order).data)

    def destroy(self, request, *args, **kwargs):
        order = self.get_object()
        # Restore stock if pending
        if order.status == 'Pending':
            for item in order.items.all():
                item.product.stock += item.quantity
                item.product.save()
        return super().destroy(request, *args, **kwargs)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_info(request):
    return Response({
        'id': request.user.id,
        'username': request.user.username,
        'email': request.user.email,
        'first_name': request.user.first_name,
        'last_name': request.user.last_name,
        'is_staff': request.user.is_staff
    })

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    if request.method == 'GET':
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    user = request.user
    if 'first_name' in request.data:
        user.first_name = request.data['first_name']
    if 'last_name' in request.data:
        user.last_name = request.data['last_name']
    if 'email' in request.data:
        user.email = request.data['email']
    user.save()
    return Response(UserSerializer(user).data)

@api_view(['GET', 'PUT', 'PATCH'])
def promo_offer_view(request):
    promo, _ = PromoOffer.objects.get_or_create(id=1)
    if request.method == 'GET':
        serializer = PromoOfferSerializer(promo)
        return Response(serializer.data)

    if not (request.user and request.user.is_authenticated and request.user.is_staff):
        return Response({'error': 'Admin privileges required to modify the store promo offer.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = PromoOfferSerializer(promo, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def register_user(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()

    if not username:
        return Response({'error': 'Username is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if len(username) < 3:
        return Response({'error': 'Username must be at least 3 characters long.'}, status=status.HTTP_400_BAD_REQUEST)
    if not password:
        return Response({'error': 'Password is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if len(password) < 6:
        return Response({'error': 'Password must be at least 6 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username__iexact=username).exists():
        return Response({'error': 'An account with this username already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    email = request.data.get('email', '').strip()
    user = User.objects.create_user(
        username=username,
        password=password,
        email=email
    )
    return Response({'message': 'Account created successfully', 'username': user.username}, status=status.HTTP_201_CREATED)
