import { useState } from 'react';
import ProductCard from './ProductCard';

export default function ShopPage({
  user,
  products,
  categories,
  cart,
  wishlist,
  search,
  promoOffer,
  onUpdateCart,
  onToggleWishlist,
  onViewDetail,
  onOpenAdminOffer,
  showWishlistOnly,
  setPage
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [inStockOnly, setInStockOnly] = useState(false);

  let filtered = products
    .filter(p => selectedCategory === 'All' || p.category === Number(selectedCategory))
    .filter(p => !inStockOnly || p.stock > 0)
    .filter(p => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
    });

  if (showWishlistOnly) {
    filtered = filtered.filter(p => wishlist.includes(p.id));
  }

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'low') return Number(a.price) - Number(b.price);
    if (sortBy === 'high') return Number(b.price) - Number(a.price);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div className="shop-page">
      {!showWishlistOnly && promoOffer && promoOffer.is_active && (
        <div className="promo-banner">
          <div className="promo-inner">
            <span className="promo-tag">{promoOffer.tag || 'Special Offer'}</span>
            <span className="promo-text">{promoOffer.text}</span>
          </div>
          {user?.is_staff && (
            <button
              className="promo-admin-edit-btn"
              onClick={onOpenAdminOffer}
              title="Edit Special Offer banner in Admin Console"
              type="button"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              <span>Edit Offer</span>
            </button>
          )}
        </div>
      )}

      {!showWishlistOnly && promoOffer && !promoOffer.is_active && user?.is_staff && (
        <div className="promo-banner promo-banner-disabled">
          <div className="promo-inner">
            <span className="promo-tag promo-tag-off">BANNER OFF</span>
            <span className="promo-text text-secondary">Special Offer banner is currently hidden from shoppers.</span>
          </div>
          <button
            className="promo-admin-edit-btn"
            onClick={onOpenAdminOffer}
            type="button"
          >
            <span>Enable & Edit Offer</span>
          </button>
        </div>
      )}

      {showWishlistOnly && (
        <div className="page-header">
          <div>
            <h2>Saved Wishlist</h2>
            <p className="text-secondary">{filtered.length} {filtered.length === 1 ? 'item' : 'items'} saved for later</p>
          </div>
          {filtered.length > 0 && (
            <button className="btn-outline" onClick={() => setPage('shop')}>Continue Shopping</button>
          )}
        </div>
      )}

      <div className="toolbar">
        <div className="category-scroll">
          <button
            className={selectedCategory === 'All' ? 'pill active' : 'pill'}
            onClick={() => setSelectedCategory('All')}
          >
            All Groceries
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              className={Number(selectedCategory) === c.id ? 'pill active' : 'pill'}
              onClick={() => setSelectedCategory(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="filter-controls">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={e => setInStockOnly(e.target.checked)}
            />
            <span>In stock only</span>
          </label>

          <div className="sort-select-wrapper">
            <select
              aria-label="Sort products"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="default">Sort: Recommended</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {search && (
        <div className="search-status-bar">
          <span>Search results for "<strong>{search}</strong>" ({filtered.length} items found)</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" opacity="0.35">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3>{showWishlistOnly ? 'Your wishlist is empty' : 'No products found'}</h3>
          <p className="text-secondary">
            {showWishlistOnly
              ? 'Click the heart icon on any grocery item to save it here.'
              : 'Try checking your spelling, selecting another category, or resetting filters.'}
          </p>
          {showWishlistOnly ? (
            <button className="btn-primary" onClick={() => setPage('shop')}>Browse Groceries</button>
          ) : (
            <button className="btn-outline" onClick={() => { setSelectedCategory('All'); setInStockOnly(false); }}>Reset Filters</button>
          )}
        </div>
      ) : (
        <div className="product-grid">
          {filtered.map(p => {
            const inCart = cart.find(i => i.product === p.id);
            const catName = categories.find(c => c.id === p.category)?.name || 'Grocery';
            return (
              <ProductCard
                key={p.id}
                product={p}
                catName={catName}
                inCart={inCart}
                wishlist={wishlist}
                onUpdateCart={onUpdateCart}
                onToggleWishlist={onToggleWishlist}
                onViewDetail={onViewDetail}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
