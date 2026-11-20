import { useState } from 'react';

export default function ProductCard({
  product,
  catName,
  inCart,
  wishlist,
  onUpdateCart,
  onToggleWishlist,
  onViewDetail
}) {
  const [imgError, setImgError] = useState(false);
  const isWished = wishlist.includes(product.id);

  return (
    <div className="product-card">
      <button
        className={`wish-btn ${isWished ? 'wished' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleWishlist(product.id);
        }}
        aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
        type="button"
      >
        <svg viewBox="0 0 24 24" fill={isWished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="17" height="17">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      </button>

      <div className="product-card-clickable" onClick={() => onViewDetail && onViewDetail(product)}>
        {product.image && !imgError ? (
          <img
            src={product.image}
            alt={product.name}
            className="product-img"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="product-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40" opacity="0.35">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}

        <div className="product-card-meta">
          <span className="cat-label">{catName}</span>
          {product.unit && <span className="unit-label">{product.unit}</span>}
        </div>

        <h3 className="product-name">{product.name}</h3>

        <div className="stock-info">
          {product.stock > 5 ? (
            <span className="stock-ok">In stock</span>
          ) : product.stock > 0 ? (
            <span className="stock-low">Only {product.stock} left</span>
          ) : (
            <span className="stock-out">Out of stock</span>
          )}
        </div>
      </div>

      <div className="card-footer">
        <div className="price-wrap">
          <span className="price">₹{product.price}</span>
        </div>
        {inCart ? (
          <div className="qty-control" onClick={e => e.stopPropagation()}>
            <button onClick={() => onUpdateCart(product, -1)} aria-label="Decrease quantity">−</button>
            <span>{inCart.quantity}</span>
            <button onClick={() => onUpdateCart(product, 1)} aria-label="Increase quantity">+</button>
          </div>
        ) : (
          <button
            className="btn-add"
            disabled={product.stock <= 0}
            onClick={(e) => {
              e.stopPropagation();
              onUpdateCart(product, 1);
            }}
          >
            {product.stock > 0 ? 'Add' : 'Sold out'}
          </button>
        )}
      </div>
    </div>
  );
}
