const STEPS = ['Pending', 'Packed', 'Out for Delivery', 'Delivered'];

export default function OrdersPage({ orders, onCancel, setPage }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="56" height="56" opacity="0.35">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <h3>No Orders Placed Yet</h3>
        <p className="text-secondary">When you order groceries, your order status and receipts will show up here.</p>
        <button className="btn-primary" onClick={() => setPage('shop')}>Browse Groceries</button>
      </div>
    );
  }

  const handleCancelClick = (orderId) => {
    if (window.confirm(`Are you sure you want to cancel Order #${orderId}? This cannot be undone.`)) {
      onCancel(orderId);
    }
  };

  return (
    <div className="orders-page">
      <div className="page-header">
        <div>
          <h2>Order History & Tracking</h2>
          <p className="text-secondary">{orders.length} {orders.length === 1 ? 'order' : 'orders'} placed</p>
        </div>
        <button className="btn-outline" onClick={() => setPage('shop')}>Order More</button>
      </div>

      <div className="orders-list">
        {orders.map(order => {
          const isCancelled = order.status === 'Cancelled';
          const currentStep = STEPS.indexOf(order.status);

          return (
            <div key={order.id} className="panel order-panel">
              <div className="order-header">
                <div className="order-identity">
                  <h3>Order #{order.id}</h3>
                  <span className="text-secondary">
                    Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <div className="order-header-actions">
                  <span className={`status-pill status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {order.status}
                  </span>
                  {order.status === 'Pending' && (
                    <button
                      className="btn-danger-outline"
                      onClick={() => handleCancelClick(order.id)}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Stepper */}
              {isCancelled ? (
                <div className="order-cancelled-notice">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span>This order was cancelled. Items have been restocked.</span>
                </div>
              ) : (
                <div className="order-stepper-container">
                  <div className="order-stepper">
                    {STEPS.map((step, idx) => {
                      const isCompleted = idx <= currentStep;
                      const isCurrent = idx === currentStep;
                      return (
                        <div key={step} className={`step-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                          <div className="step-circle">
                            {isCompleted ? '✓' : idx + 1}
                          </div>
                          <span className="step-text">{step}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order Meta details */}
              <div className="order-meta-grid">
                <div className="order-meta-col">
                  <span className="meta-label">Delivery Address</span>
                  <p className="meta-value">{order.address || 'Standard Address'}</p>
                  {order.phone && <small className="text-secondary">Contact: {order.phone}</small>}
                </div>
                <div className="order-meta-col">
                  <span className="meta-label">Payment Method</span>
                  <p className="meta-value">{order.payment_method || 'Cash on Delivery'}</p>
                </div>
                <div className="order-meta-col">
                  <span className="meta-label">Total Amount</span>
                  <p className="meta-value total-val">₹{Number(order.total).toFixed(2)}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="order-items-table">
                <h4>Items Ordered</h4>
                <div className="order-items-grid">
                  {order.items && order.items.map(item => (
                    <div key={item.id} className="order-item-pill">
                      <span className="item-qty">{item.quantity}x</span>
                      <span className="item-name">{item.product_name}</span>
                      {item.product_unit && <span className="item-unit">({item.product_unit})</span>}
                      <span className="item-price">₹{(Number(item.product_price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
