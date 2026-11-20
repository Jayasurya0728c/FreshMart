import { useState, useEffect } from 'react';

export default function CartPage({
  cart,
  token,
  addresses,
  promoOffer,
  onUpdateCart,
  removeFromCart,
  onCheckout,
  onSaveAddress,
  setPage,
  notify
}) {
  const [selectedAddressId, setSelectedAddressId] = useState('new');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [coupon, setCoupon] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [placing, setPlacing] = useState(false);

  // Default to user's default address if available
  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
      setSelectedAddressId(String(defaultAddr.id));
    } else {
      setSelectedAddressId('new');
    }
  }, [addresses]);

  const freeThreshold = Number(promoOffer?.free_delivery_threshold) || 500;
  const validCode = (promoOffer?.coupon_code || 'FRESH20').trim().toUpperCase();
  const offerPercent = (promoOffer?.discount_percent ?? 20) / 100;

  const subtotal = cart.reduce((sum, i) => sum + (Number(i.price) * i.quantity), 0);
  const discountAmount = Math.round(subtotal * discountPercent);
  const deliveryFee = subtotal >= freeThreshold || subtotal === 0 ? 0 : 40;
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  const applyCoupon = () => {
    if (!coupon.trim()) return;
    if (coupon.trim().toUpperCase() === validCode) {
      setDiscountPercent(offerPercent);
      notify(`Coupon ${validCode} applied! ${(offerPercent * 100).toFixed(0)}% discount granted.`);
    } else {
      setDiscountPercent(0);
      notify(`Invalid coupon code. Try ${validCode} for discount.`);
    }
  };

  const removeCoupon = () => {
    setCoupon('');
    setDiscountPercent(0);
    notify('Coupon removed.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      notify('Your cart is empty.');
      return;
    }

    let finalAddress = '';
    let finalPhone = '';

    if (selectedAddressId !== 'new') {
      const addrObj = addresses.find(a => String(a.id) === selectedAddressId);
      if (addrObj) {
        finalAddress = `${addrObj.full_name}, ${addrObj.street_address}, ${addrObj.city} - ${addrObj.postal_code}`;
        finalPhone = addrObj.phone;
      }
    } else {
      if (!fullName.trim() || !phone.trim() || !streetAddress.trim() || !city.trim() || !postalCode.trim()) {
        notify('Please fill in all delivery address fields.');
        return;
      }
      finalAddress = `${fullName.trim()}, ${streetAddress.trim()}, ${city.trim()} - ${postalCode.trim()}`;
      finalPhone = phone.trim();

      if (saveAddressToProfile && onSaveAddress) {
        try {
          await onSaveAddress({
            full_name: fullName.trim(),
            phone: phone.trim(),
            street_address: streetAddress.trim(),
            city: city.trim(),
            postal_code: postalCode.trim(),
            is_default: addresses.length === 0
          });
        } catch {
          // Address save failure shouldn't block the order
        }
      }
    }

    setPlacing(true);
    try {
      await onCheckout({
        address: finalAddress,
        phone: finalPhone,
        payment_method: paymentMethod,
        delivery_fee: deliveryFee,
        discount: discountAmount,
        total: grandTotal,
        items: cart
      });
      notify('Order placed successfully! Track its status in Orders.');
      setPage('orders');
    } catch (err) {
      const errMsg = err?.response?.data?.error || err?.response?.data?.items || 'Failed to place order. Please check item stock.';
      notify(`Error: ${errMsg}`);
    } finally {
      setPlacing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="56" height="56" opacity="0.3">
          <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
        <h3>Your Shopping Basket is Empty</h3>
        <p className="text-secondary">Explore our fresh grocery selection and stock up on daily essentials.</p>
        <button className="btn-primary" onClick={() => setPage('shop')}>Start Shopping</button>
      </div>
    );
  }

  return (
    <div className="cart-checkout-layout">
      {/* Left Column: Cart items */}
      <div className="cart-items-section">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Shopping Basket</h2>
              <span className="text-secondary">{cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart</span>
            </div>
            <button className="btn-text" onClick={() => setPage('shop')}>+ Add more groceries</button>
          </div>

          <div className="cart-list">
            {cart.map(item => (
              <div key={item.product} className="cart-item-row">
                <div className="cart-item-details">
                  <span className="cart-item-name">{item.name}</span>
                  <div className="cart-item-submeta">
                    {item.unit && <span className="item-unit-tag">{item.unit}</span>}
                    <span className="text-secondary">₹{item.price} each</span>
                  </div>
                </div>

                <div className="cart-item-controls">
                  <div className="qty-control">
                    <button
                      onClick={() => onUpdateCart({ id: item.product, stock: item.stock }, -1)}
                      aria-label="Decrease quantity"
                    >−</button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => onUpdateCart({ id: item.product, stock: item.stock }, 1)}
                      aria-label="Increase quantity"
                    >+</button>
                  </div>

                  <span className="cart-item-line-total">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>

                  <button
                    className="btn-icon"
                    onClick={() => removeFromCart(item.product)}
                    aria-label={`Remove ${item.name} from cart`}
                    title="Remove item"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="delivery-perk-hint">
            {subtotal >= freeThreshold ? (
              <span className="text-success">✓ You have qualified for <strong>FREE Delivery</strong>!</span>
            ) : (
              <span className="text-secondary">Add items worth <strong>₹{(freeThreshold - subtotal).toFixed(2)}</strong> more for FREE delivery.</span>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Checkout & Summary */}
      <div className="cart-summary-section">
        <div className="panel">
          <h3>Order Summary</h3>

          {/* Promo code */}
          <div className="coupon-box">
            {discountPercent > 0 ? (
              <div className="coupon-applied-badge">
                <div>
                  <span className="coupon-title">{validCode} Applied</span>
                  <small>{(offerPercent * 100).toFixed(0)}% off item total (-₹{discountAmount})</small>
                </div>
                <button type="button" className="btn-text-danger" onClick={removeCoupon}>Remove</button>
              </div>
            ) : (
              <div className="coupon-input-group">
                <input
                  type="text"
                  placeholder={`Promo code (e.g. ${validCode})`}
                  value={coupon}
                  onChange={e => setCoupon(e.target.value.toUpperCase())}
                />
                <button type="button" className="btn-outline" onClick={applyCoupon}>Apply</button>
              </div>
            )}
          </div>

          {/* Pricing table */}
          <div className="bill-table">
            <div className="bill-row">
              <span>Item Total</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="bill-row discount-row">
                <span>Coupon Savings (20%)</span>
                <span>−₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="bill-row">
              <span>Delivery Charges</span>
              <span>{deliveryFee === 0 ? <strong className="text-success">FREE</strong> : `₹${deliveryFee.toFixed(2)}`}</span>
            </div>
            <div className="bill-divider" />
            <div className="bill-row bill-total-row">
              <span>To Pay</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Auth Check for Checkout */}
          {!token ? (
            <div className="checkout-auth-prompt">
              <p className="text-secondary">Sign in or create an account to enter your delivery address and complete checkout.</p>
              <button className="btn-primary full" onClick={() => setPage('login')}>
                Sign In to Place Order
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="checkout-form">
              <h4 className="checkout-subheading">Delivery Address</h4>

              {/* Saved Addresses Selector */}
              {addresses && addresses.length > 0 && (
                <div className="saved-addresses-list">
                  {addresses.map(addr => (
                    <label key={addr.id} className={`address-option-card ${selectedAddressId === String(addr.id) ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="delivery_address"
                        value={String(addr.id)}
                        checked={selectedAddressId === String(addr.id)}
                        onChange={e => setSelectedAddressId(e.target.value)}
                      />
                      <div className="address-option-content">
                        <strong>{addr.full_name} {addr.is_default && <span className="default-pill">Default</span>}</strong>
                        <p>{addr.street_address}, {addr.city} - {addr.postal_code}</p>
                        <small>Phone: {addr.phone}</small>
                      </div>
                    </label>
                  ))}

                  <label className={`address-option-card ${selectedAddressId === 'new' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="delivery_address"
                      value="new"
                      checked={selectedAddressId === 'new'}
                      onChange={e => setSelectedAddressId(e.target.value)}
                    />
                    <div className="address-option-content">
                      <strong>+ Deliver to a different address</strong>
                    </div>
                  </label>
                </div>
              )}

              {/* New Address Input Fields */}
              {selectedAddressId === 'new' && (
                <div className="new-address-fields">
                  <div className="form-group">
                    <label htmlFor="checkout_fullname">Recipient Full Name *</label>
                    <input
                      id="checkout_fullname"
                      type="text"
                      placeholder="e.g. John Doe"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="checkout_phone">10-Digit Mobile Number *</label>
                    <input
                      id="checkout_phone"
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="checkout_street">Street Address & Landmark *</label>
                    <input
                      id="checkout_street"
                      type="text"
                      placeholder="Flat/House No, Building, Street, Area"
                      value={streetAddress}
                      onChange={e => setStreetAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="checkout_city">City *</label>
                      <input
                        id="checkout_city"
                        type="text"
                        placeholder="e.g. Bangalore"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="checkout_pincode">Postal / PIN Code *</label>
                      <input
                        id="checkout_pincode"
                        type="text"
                        placeholder="e.g. 560001"
                        value={postalCode}
                        onChange={e => setPostalCode(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <label className="checkbox-label save-addr-checkbox">
                    <input
                      type="checkbox"
                      checked={saveAddressToProfile}
                      onChange={e => setSaveAddressToProfile(e.target.checked)}
                    />
                    <span>Save this address to my profile for future orders</span>
                  </label>
                </div>
              )}

              <h4 className="checkout-subheading">Payment Method</h4>
              <div className="payment-options">
                <label className={`payment-option ${paymentMethod === 'Cash on Delivery' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="Cash on Delivery"
                    checked={paymentMethod === 'Cash on Delivery'}
                    onChange={e => setPaymentMethod(e.target.value)}
                  />
                  <span>Cash on Delivery (COD)</span>
                </label>
                <label className={`payment-option ${paymentMethod === 'UPI / QR' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="UPI / QR"
                    checked={paymentMethod === 'UPI / QR'}
                    onChange={e => setPaymentMethod(e.target.value)}
                  />
                  <span>UPI (Google Pay / PhonePe / Paytm)</span>
                </label>
                <label className={`payment-option ${paymentMethod === 'Card' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="Card"
                    checked={paymentMethod === 'Card'}
                    onChange={e => setPaymentMethod(e.target.value)}
                  />
                  <span>Credit / Debit Card</span>
                </label>
              </div>

              <button className="btn-primary full place-order-btn" type="submit" disabled={placing}>
                {placing ? 'Placing Order...' : `Place Order · ₹${grandTotal.toFixed(2)}`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
