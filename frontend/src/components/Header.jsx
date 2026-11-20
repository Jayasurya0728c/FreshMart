export default function Header({
  user,
  token,
  cart,
  wishlist,
  orders,
  search,
  page,
  setPage,
  setSearch,
  handleLogout,
  mobileMenuOpen,
  setMobileMenuOpen
}) {
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        {/* Left Section: Three-bar Hamburger menu button (on mobile, to the LEFT of the logo) + Brand */}
        <div className="header-brand-wrap">
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            type="button"
          >
            {mobileMenuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <div className="brand" onClick={() => { setPage('shop'); setMobileMenuOpen(false); }}>
            <div className="logo-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div className="brand-text">
              <span className="brand-name">FreshMart</span>
              <span className="brand-tagline">Fresh Daily Groceries</span>
            </div>
          </div>
        </div>

        {/* Global Product Search Box */}
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="search"
            placeholder="Search fresh vegetables, dairy, bakery, snacks..."
            value={search}
            onChange={e => { setSearch(e.target.value); if (page !== 'shop') setPage('shop'); }}
          />
          {search && (
            <button className="search-clear-btn" onClick={() => setSearch('')} aria-label="Clear search" type="button">✕</button>
          )}
        </div>

        {/* Mobile Quick Cart Button (visible on mobile next to brand on the right) */}
        <button
          className={`mobile-cart-btn ${page === 'cart' ? 'active' : ''}`}
          onClick={() => { setPage('cart'); setMobileMenuOpen(false); }}
          aria-label="View shopping basket"
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </button>

        {/* Navigation Links and Actions */}
        <nav className={`nav-actions ${mobileMenuOpen ? 'open' : ''}`}>
          <button
            className={`nav-btn ${page === 'shop' ? 'active' : ''}`}
            onClick={() => { setPage('shop'); setMobileMenuOpen(false); }}
          >
            Groceries
          </button>

          <button
            className={`nav-btn ${page === 'wishlist' ? 'active' : ''}`}
            onClick={() => { setPage('wishlist'); setMobileMenuOpen(false); }}
          >
            Wishlist
            {wishlist.length > 0 && <span className="nav-badge">{wishlist.length}</span>}
          </button>

          {token && (
            <button
              className={`nav-btn ${page === 'orders' ? 'active' : ''}`}
              onClick={() => { setPage('orders'); setMobileMenuOpen(false); }}
            >
              My Orders
              {orders.length > 0 && <span className="nav-badge">{orders.length}</span>}
            </button>
          )}

          {user?.is_staff && (
            <button
              className={`nav-btn nav-admin-btn ${page === 'admin' ? 'active' : ''}`}
              onClick={() => { setPage('admin'); setMobileMenuOpen(false); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Admin Console</span>
            </button>
          )}

          {/* Desktop Cart Trigger */}
          <button
            className={`cart-btn ${page === 'cart' ? 'active' : ''}`}
            onClick={() => { setPage('cart'); setMobileMenuOpen(false); }}
            aria-label="View shopping cart"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <span className="cart-text">Basket</span>
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>

          {/* User Profile / Auth */}
          {token ? (
            <div className="user-profile-menu">
              <button
                className={`nav-btn user-btn ${page === 'profile' ? 'active' : ''}`}
                onClick={() => { setPage('profile'); setMobileMenuOpen(false); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>{user?.first_name || user?.username}</span>
              </button>
              <button
                className="btn-text"
                onClick={() => {
                  if (window.confirm('Sign out of FreshMart?')) {
                    handleLogout();
                    setMobileMenuOpen(false);
                    setPage('shop');
                  }
                }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              className="btn-primary"
              onClick={() => { setPage('login'); setMobileMenuOpen(false); }}
            >
              Sign In
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
