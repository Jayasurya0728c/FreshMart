import { useState, useEffect } from 'react';

export default function ProductDetailModal({
  product,
  categoryName,
  inCart,
  isWished,
  onClose,
  onUpdateCart,
  onToggleWishlist
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [product]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content product-detail-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close details">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="product-detail-grid">
          <div className="product-detail-media">
            {product.image && !imgError ? (
              <img
                src={product.image}
                alt={product.name}
                className="product-detail-img"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="product-detail-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64" opacity="0.35">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            )}
          </div>

          <div className="product-detail-info">
            <div className="product-detail-meta">
              <span className="cat-label">{categoryName}</span>
              {product.unit && <span className="unit-label">{product.unit}</span>}
            </div>

            <h2 className="product-detail-title">{product.name}</h2>

            <div className="product-detail-price-row">
              <span className="product-detail-price">₹{product.price}</span>
              <span className="price-unit-hint">Inclusive of all taxes</span>
            </div>

            <div className="stock-info">
              {product.stock > 5 ? (
                <span className="stock-ok">✓ In stock ({product.stock} units available)</span>
              ) : product.stock > 0 ? (
                <span className="stock-low">⚠ Only {product.stock} left in stock</span>
              ) : (
                <span className="stock-out">✕ Currently out of stock</span>
              )}
            </div>

            <div className="product-detail-desc">
              <h4>Product Description</h4>
              <p>{product.description || 'Freshly sourced quality grocery product, hygienically handled and packed for everyday household use.'}</p>
            </div>

            <div className="product-detail-actions">
              {inCart ? (
                <div className="qty-control detail-qty">
                  <button onClick={() => onUpdateCart(product, -1)} aria-label="Decrease quantity">−</button>
                  <span className="qty-value">{inCart.quantity} in cart</span>
                  <button onClick={() => onUpdateCart(product, 1)} aria-label="Increase quantity">+</button>
                </div>
              ) : (
                <button
                  className="btn-primary"
                  disabled={product.stock <= 0}
                  onClick={() => onUpdateCart(product, 1)}
                >
                  {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              )}

              <button
                className={`btn-outline wish-toggle-btn ${isWished ? 'wished' : ''}`}
                onClick={() => onToggleWishlist(product.id)}
              >
                <svg viewBox="0 0 24 24" fill={isWished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
                {isWished ? 'Saved in Wishlist' : 'Add to Wishlist'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

