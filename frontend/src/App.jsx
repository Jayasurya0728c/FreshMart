import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

import Header from './components/Header';
import ShopPage from './components/ShopPage';
import CartPage from './components/CartPage';
import OrdersPage from './components/OrdersPage';
import ProfilePage from './components/ProfilePage';
import AdminPage from './components/AdminPage';
import AuthPage from './components/AuthPage';
import ProductDetailModal from './components/ProductDetailModal';
import Toast from './components/Toast';

let rawApi = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
if (!rawApi.includes('.') && !rawApi.includes('localhost')) {
  rawApi = `${rawApi}.onrender.com`;
}
const API = (rawApi.startsWith('http') ? rawApi : `https://${rawApi}`).replace(/\/+$/, '').replace(/\/api$/, '') + '/api';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [promoOffer, setPromoOffer] = useState({
    id: 1,
    tag: 'Special Offer',
    text: 'Get 20% off with coupon code FRESH20 at checkout. Free delivery on orders over ₹500.',
    coupon_code: 'FRESH20',
    discount_percent: 20,
    free_delivery_threshold: 500,
    is_active: true
  });

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wishlist') || '[]');
    } catch {
      return [];
    }
  });

  const [page, setPage] = useState('shop');
  const [adminTab, setAdminTab] = useState('inventory');
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast('');
    }, 3200);
  };

  const authHeader = useCallback(() => {
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }, [token]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setAddresses([]);
    setOrders([]);
    setPage('shop');
    notify('You have been signed out.');
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, prodRes, promoRes] = await Promise.all([
        axios.get(`${API}/categories/`),
        axios.get(`${API}/products/`),
        axios.get(`${API}/promo/`).catch(() => ({ data: null }))
      ]);
      const baseUrl = API.replace(/\/api$/, '');
      const normalizeProduct = (p) => {
        if (p.image && !p.image.startsWith('http://') && !p.image.startsWith('https://')) {
          return {
            ...p,
            image: `${baseUrl}${p.image.startsWith('/') ? '' : '/'}${p.image}`
          };
        }
        return p;
      };

      setCategories(catRes.data);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data.map(normalizeProduct) : []);
      if (promoRes?.data) {
        setPromoOffer(promoRes.data);
      }

      if (token) {
        try {
          const [userRes, addrRes, orderRes] = await Promise.all([
            axios.get(`${API}/profile/`, authHeader()),
            axios.get(`${API}/addresses/`, authHeader()),
            axios.get(`${API}/orders/`, authHeader())
          ]);
          setUser(userRes.data);
          setAddresses(addrRes.data);
          setOrders(orderRes.data);
        } catch {
          // If token expired, clear auth
          handleLogout();
        }
      }
    } catch (err) {
      console.error('Failed to load store data:', err);
    } finally {
      setLoading(false);
    }
  }, [token, authHeader, handleLogout]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Intercept 401s globally to notify expired session
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && token) {
          localStorage.removeItem('token');
          setToken('');
          setUser(null);
          setPage('login');
          notify('Your session has expired. Please sign in again.');
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [token]);

  // Persist cart and wishlist
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Sync cart prices & stock with fresh product catalog
  useEffect(() => {
    if (products.length > 0 && cart.length > 0) {
      setCart(prevCart =>
        prevCart
          .map(cartItem => {
            const found = products.find(p => p.id === cartItem.product);
            if (!found) return null;
            return {
              ...cartItem,
              name: found.name,
              price: Number(found.price),
              unit: found.unit,
              stock: found.stock,
              quantity: Math.min(cartItem.quantity, Math.max(1, found.stock))
            };
          })
          .filter(Boolean)
      );
    }
  }, [products]);

  // Auth Handlers
  const handleLogin = async (username, password) => {
    const res = await axios.post(`${API}/token/`, { username, password });
    const accessToken = res.data.access;
    localStorage.setItem('token', accessToken);
    setToken(accessToken);

    try {
      const userRes = await axios.get(`${API}/profile/`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setUser(userRes.data);
      if (userRes.data?.is_staff) {
        setPage('admin');
        notify(`Welcome to Store Admin Console, ${username}!`);
        return;
      }
    } catch (e) {
      console.error('Failed to get user profile on login:', e);
    }

    setPage('shop');
    notify(`Welcome back, ${username}!`);
  };

  const handleRegister = async (username, password, email) => {
    await axios.post(`${API}/register/`, { username, password, email });
    notify('Account registered! Signing you in...');
    await handleLogin(username, password);
  };

  // Cart Handlers
  const updateCartQty = (product, delta) => {
    const prodId = product.id || product.product;
    const existing = cart.find(i => i.product === prodId);

    // Lookup catalog product for authoritative stock
    const catalogItem = products.find(p => p.id === prodId) || product;
    const maxStock = catalogItem.stock;

    if (existing) {
      const nextQty = existing.quantity + delta;
      if (nextQty > maxStock) {
        notify(`Only ${maxStock} units of "${catalogItem.name}" are available in stock.`);
        return;
      }
      if (nextQty <= 0) {
        setCart(cart.filter(i => i.product !== prodId));
        notify(`Removed "${catalogItem.name}" from your basket.`);
      } else {
        setCart(cart.map(i => i.product === prodId ? { ...i, quantity: nextQty } : i));
      }
    } else if (delta > 0) {
      if (maxStock <= 0) {
        notify(`Sorry, "${catalogItem.name}" is currently out of stock.`);
        return;
      }
      setCart([
        ...cart,
        {
          product: catalogItem.id,
          name: catalogItem.name,
          price: Number(catalogItem.price),
          unit: catalogItem.unit,
          stock: catalogItem.stock,
          quantity: 1
        }
      ]);
      notify(`Added "${catalogItem.name}" to your basket.`);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(i => i.product !== productId));
    notify('Item removed from your basket.');
  };

  // Wishlist Handlers
  const toggleWishlist = (productId) => {
    if (wishlist.includes(productId)) {
      setWishlist(wishlist.filter(id => id !== productId));
      notify('Item removed from your wishlist.');
    } else {
      setWishlist([...wishlist, productId]);
      notify('Item saved to your wishlist.');
    }
  };

  // Checkout Handler
  const handleCheckout = async (orderPayload) => {
    await axios.post(`${API}/orders/`, orderPayload, authHeader());
    setCart([]);
    await fetchData();
  };

  // Order Cancel Handler
  const handleCancelOrder = async (orderId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/cancel/`, {}, authHeader());
      notify(`Order #${orderId} has been cancelled.`);
      await fetchData();
    } catch {
      try {
        await axios.delete(`${API}/orders/${orderId}/`, authHeader());
        notify(`Order #${orderId} was cancelled.`);
        await fetchData();
      } catch {
        notify('Could not cancel order.');
      }
    }
  };

  // Profile Handlers
  const handleUpdateProfile = async (profileData) => {
    const res = await axios.patch(`${API}/profile/`, profileData, authHeader());
    setUser(res.data);
    await fetchData();
  };

  const handleAddAddress = async (addressData) => {
    await axios.post(`${API}/addresses/`, addressData, authHeader());
    await fetchData();
  };

  const handleDeleteAddress = async (addressId) => {
    await axios.delete(`${API}/addresses/${addressId}/`, authHeader());
    await fetchData();
    notify('Address deleted.');
  };

  const handleSetDefaultAddress = async (addressId) => {
    await axios.patch(`${API}/addresses/${addressId}/`, { is_default: true }, authHeader());
    await fetchData();
    notify('Default delivery address updated.');
  };

  // Admin Handlers
  const handleAddCategory = async (name) => {
    await axios.post(`${API}/categories/`, { name }, authHeader());
    await fetchData();
  };

  const handleDeleteCategory = async (id) => {
    await axios.delete(`${API}/categories/${id}/`, authHeader());
    await fetchData();
  };

  const handleSaveProduct = async (formData) => {
    await axios.post(`${API}/products/`, formData, authHeader());
    await fetchData();
  };

  const handleUpdateProduct = async (id, data) => {
    await axios.patch(`${API}/products/${id}/`, data, authHeader());
    await fetchData();
  };

  const handleDeleteProduct = async (id) => {
    await axios.delete(`${API}/products/${id}/`, authHeader());
    await fetchData();
    notify('Product removed from catalog.');
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    await axios.patch(`${API}/orders/${orderId}/`, { status: newStatus }, authHeader());
    await fetchData();
    notify(`Order #${orderId} marked as "${newStatus}".`);
  };

  const handleUpdatePromoOffer = async (newOfferData) => {
    const res = await axios.patch(`${API}/promo/`, newOfferData, authHeader());
    setPromoOffer(res.data);
    notify('Special offer & banner updated successfully.');
    await fetchData();
  };

  return (
    <div className="app-shell">
      <Header
        user={user}
        token={token}
        cart={cart}
        wishlist={wishlist}
        orders={orders}
        search={search}
        page={page}
        setPage={setPage}
        setSearch={setSearch}
        handleLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <main className="main-content">
        {loading && <div className="loading-bar" aria-label="Loading data" />}
        {page === 'shop' && (
          <ShopPage
            user={user}
            products={products}
            categories={categories}
            cart={cart}
            wishlist={wishlist}
            search={search}
            promoOffer={promoOffer}
            onUpdateCart={updateCartQty}
            onToggleWishlist={toggleWishlist}
            onViewDetail={(p) => setSelectedProduct(p)}
            onOpenAdminOffer={() => { setAdminTab('offer'); setPage('admin'); }}
            showWishlistOnly={false}
            setPage={setPage}
          />
        )}

        {page === 'wishlist' && (
          <ShopPage
            user={user}
            products={products}
            categories={categories}
            cart={cart}
            wishlist={wishlist}
            search={search}
            promoOffer={promoOffer}
            onUpdateCart={updateCartQty}
            onToggleWishlist={toggleWishlist}
            onViewDetail={(p) => setSelectedProduct(p)}
            onOpenAdminOffer={() => { setAdminTab('offer'); setPage('admin'); }}
            showWishlistOnly={true}
            setPage={setPage}
          />
        )}

        {page === 'cart' && (
          <CartPage
            cart={cart}
            token={token}
            addresses={addresses}
            promoOffer={promoOffer}
            onUpdateCart={updateCartQty}
            removeFromCart={removeFromCart}
            onCheckout={handleCheckout}
            onSaveAddress={handleAddAddress}
            setPage={setPage}
            notify={notify}
          />
        )}

        {page === 'orders' && (
          <OrdersPage
            orders={orders}
            onCancel={handleCancelOrder}
            setPage={setPage}
          />
        )}

        {page === 'profile' && (
          <ProfilePage
            user={user}
            addresses={addresses}
            onUpdateProfile={handleUpdateProfile}
            onAddAddress={handleAddAddress}
            onDeleteAddress={handleDeleteAddress}
            onSetDefaultAddress={handleSetDefaultAddress}
            notify={notify}
            handleLogout={handleLogout}
            setPage={setPage}
          />
        )}

        {page === 'admin' && (
          <AdminPage
            user={user}
            products={products}
            categories={categories}
            orders={orders}
            promoOffer={promoOffer}
            activeTab={adminTab}
            setActiveTab={setAdminTab}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onSaveProduct={handleSaveProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdatePromoOffer={handleUpdatePromoOffer}
            notify={notify}
          />
        )}

        {page === 'login' && (
          <AuthPage
            onLogin={handleLogin}
            onRegister={handleRegister}
            setPage={setPage}
            apiEndpoint={API}
          />
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          categoryName={categories.find(c => c.id === selectedProduct.category)?.name || 'Grocery'}
          inCart={cart.find(i => i.product === selectedProduct.id)}
          isWished={wishlist.includes(selectedProduct.id)}
          onClose={() => setSelectedProduct(null)}
          onUpdateCart={updateCartQty}
          onToggleWishlist={toggleWishlist}
        />
      )}

      {/* Toast Notification */}
      <Toast message={toast} onClose={() => setToast('')} />

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <strong>FreshMart</strong>
            <span>Fresh, wholesome groceries delivered daily to your doorstep.</span>
          </div>
          <div className="footer-links">
            <button className="footer-link-btn" onClick={() => setPage('shop')}>Groceries</button>
            <button className="footer-link-btn" onClick={() => setPage('cart')}>Basket ({cart.length})</button>
            {token && <button className="footer-link-btn" onClick={() => setPage('orders')}>Orders</button>}
            {token && <button className="footer-link-btn" onClick={() => setPage('profile')}>Account</button>}
          </div>
          <div className="footer-copy">
            © 2026 FreshMart. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
