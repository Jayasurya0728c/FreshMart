import { useState, useEffect } from 'react';

export default function AdminPage({
  user,
  products,
  categories,
  orders,
  promoOffer,
  activeTab: controlledActiveTab,
  setActiveTab: setControlledActiveTab,
  onAddCategory,
  onDeleteCategory,
  onSaveProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onUpdatePromoOffer,
  notify
}) {
  const [internalActiveTab, setInternalActiveTab] = useState('inventory');
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const setActiveTab = setControlledActiveTab || setInternalActiveTab;

  // Promo Offer states
  const [promoTag, setPromoTag] = useState(promoOffer?.tag || 'Special Offer');
  const [promoText, setPromoText] = useState(promoOffer?.text || 'Get 20% off with coupon code FRESH20 at checkout. Free delivery on orders over ₹500.');
  const [promoCode, setPromoCode] = useState(promoOffer?.coupon_code || 'FRESH20');
  const [promoDiscount, setPromoDiscount] = useState(promoOffer?.discount_percent ?? 20);
  const [promoThreshold, setPromoThreshold] = useState(promoOffer?.free_delivery_threshold ?? 500);
  const [promoActive, setPromoActive] = useState(promoOffer?.is_active ?? true);
  const [savingPromo, setSavingPromo] = useState(false);

  // Product Form states
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodUnit, setProdUnit] = useState('1 unit');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState(null);

  // Edit Product Modal states
  const [editingProduct, setEditingProduct] = useState(null);

  // Category Form state
  const [newCatName, setNewCatName] = useState('');

  // Inventory Table search & filter
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCatFilter, setInventoryCatFilter] = useState('All');

  useEffect(() => {
    if (promoOffer) {
      setPromoTag(promoOffer.tag || 'Special Offer');
      setPromoText(promoOffer.text || 'Get 20% off with coupon code FRESH20 at checkout. Free delivery on orders over ₹500.');
      setPromoCode(promoOffer.coupon_code || 'FRESH20');
      setPromoDiscount(promoOffer.discount_percent ?? 20);
      setPromoThreshold(promoOffer.free_delivery_threshold ?? 500);
      setPromoActive(promoOffer.is_active ?? true);
    }
  }, [promoOffer]);

  if (!user?.is_staff) {
    return (
      <div className="empty-state">
        <h3>Admin Access Restricted</h3>
        <p className="text-secondary">You do not have staff permissions to view the store management dashboard.</p>
      </div>
    );
  }

  // KPIs
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock <= 5).length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((acc, o) => acc + (o.status !== 'Cancelled' ? Number(o.total || 0) : 0), 0);

  // Filtered inventory
  const filteredProducts = products.filter(p => {
    const matchCat = inventoryCatFilter === 'All' || String(p.category) === inventoryCatFilter;
    const matchSearch = !inventorySearch.trim() || p.name.toLowerCase().includes(inventorySearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!prodName.trim() || !prodCat || !prodPrice || prodStock === '') {
      notify('Please fill in all required product fields.');
      return;
    }

    const formData = new FormData();
    formData.append('name', prodName.trim());
    formData.append('category', prodCat);
    formData.append('price', prodPrice);
    formData.append('stock', prodStock);
    formData.append('unit', prodUnit.trim() || '1 unit');
    formData.append('description', prodDesc.trim());
    if (prodImage) {
      formData.append('image', prodImage);
    }

    try {
      await onSaveProduct(formData);
      notify(`Product "${prodName}" added successfully.`);
      // Reset form
      setProdName('');
      setProdCat('');
      setProdPrice('');
      setProdStock('');
      setProdUnit('1 unit');
      setProdDesc('');
      setProdImage(null);
      setShowAddProduct(false);
    } catch (err) {
      const data = err?.response?.data;
      let msg = 'Failed to save product.';
      if (typeof data === 'object' && data !== null) {
        const fieldErrors = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
        if (fieldErrors) msg = `Failed: ${fieldErrors}`;
      } else if (err?.message) {
        msg = `Failed: ${err.message}`;
      }
      notify(msg);
    }
  };

  const handleUpdateProductSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      await onUpdateProduct(editingProduct.id, {
        name: editingProduct.name,
        price: editingProduct.price,
        stock: editingProduct.stock,
        unit: editingProduct.unit,
        description: editingProduct.description,
        category: editingProduct.category
      });
      notify(`Product "${editingProduct.name}" updated.`);
      setEditingProduct(null);
    } catch (err) {
      const data = err?.response?.data;
      let msg = 'Failed to update product.';
      if (typeof data === 'object' && data !== null) {
        const fieldErrors = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
        if (fieldErrors) msg = `Failed: ${fieldErrors}`;
      } else if (err?.message) {
        msg = `Failed: ${err.message}`;
      }
      notify(msg);
    }
  };

  const handleDeleteProduct = (p) => {
    if (window.confirm(`Are you sure you want to delete "${p.name}"? This action cannot be undone.`)) {
      onDeleteProduct(p.id);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await onAddCategory(newCatName.trim());
      notify(`Category "${newCatName}" created.`);
      setNewCatName('');
    } catch {
      notify('Failed to create category.');
    }
  };

  const handleDeleteCategory = (c) => {
    if (window.confirm(`Delete category "${c.name}"? Any products assigned to it will also be deleted.`)) {
      onDeleteCategory(c.id);
    }
  };

  const handleSavePromoOffer = async (e) => {
    e.preventDefault();
    if (!onUpdatePromoOffer) return;
    setSavingPromo(true);
    try {
      await onUpdatePromoOffer({
        tag: promoTag.trim() || 'Special Offer',
        text: promoText.trim(),
        coupon_code: promoCode.trim().toUpperCase() || 'FRESH20',
        discount_percent: Number(promoDiscount) || 0,
        free_delivery_threshold: Number(promoThreshold) || 0,
        is_active: promoActive
      });
      notify('Special offer & promo banner updated successfully.');
    } catch {
      notify('Failed to save promo offer.');
    } finally {
      setSavingPromo(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2>Store Management</h2>
          <p className="text-secondary">Administrative console for catalog, inventory, offers, and order fulfillment</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="admin-kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Total Catalog Products</span>
          <h3 className="kpi-value">{totalProducts}</h3>
          <span className="kpi-subtext">Active items in catalog</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Low Stock Alerts</span>
          <h3 className={`kpi-value ${lowStockCount > 0 ? 'text-warning' : ''}`}>{lowStockCount}</h3>
          <span className="kpi-subtext">Items with 5 or fewer left</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Total Customer Orders</span>
          <h3 className="kpi-value">{totalOrders}</h3>
          <span className="kpi-subtext">Lifetime store orders</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Total Sales Volume</span>
          <h3 className="kpi-value text-success">₹{totalRevenue.toFixed(2)}</h3>
          <span className="kpi-subtext">From confirmed orders</span>
        </div>
      </div>

      {/* Storefront Offer & Promo Announcement Status Banner */}
      <div className="admin-offer-status-bar">
        <div className="admin-offer-status-left">
          <div className="admin-offer-pill-row">
            <span className={`status-pill ${promoActive ? 'in-stock' : 'out-stock'}`}>
              {promoActive ? '● Offer Banner Live' : '○ Banner Hidden'}
            </span>
            <span className="promo-tag-sm">{promoTag || 'SPECIAL OFFER'}</span>
            <span className="coupon-chip">Coupon: <strong>{promoCode}</strong> ({promoDiscount}% OFF)</span>
            <span className="text-secondary" style={{ fontSize: '0.82rem' }}>· Free delivery above ₹{promoThreshold}</span>
          </div>
          <p className="admin-offer-msg">
            "{promoText}"
          </p>
        </div>
        <button
          className={`btn-primary ${activeTab === 'offer' ? 'btn-active-editing' : ''}`}
          onClick={() => setActiveTab('offer')}
          type="button"
        >
          {activeTab === 'offer' ? 'Editing Offer Below ↓' : '✎ Edit Special Offer Banner'}
        </button>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="admin-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'inventory'}
          className={`admin-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
            <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          <span>Product Inventory ({totalProducts})</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'orders'}
          className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          <span>Order Fulfillment ({totalOrders})</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'categories'}
          className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <span>Categories ({categories.length})</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'offer'}
          className={`admin-tab-btn tab-offer-btn ${activeTab === 'offer' ? 'active' : ''}`}
          onClick={() => setActiveTab('offer')}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" />
          </svg>
          <span>Special Offer Banner</span>
          <span className={`tab-pill-badge ${promoActive ? 'live' : 'off'}`}>
            {promoActive ? 'Live' : 'Off'}
          </span>
        </button>
      </div>

      {/* Tab 1: Product Inventory */}
      {activeTab === 'inventory' && (
        <div className="panel admin-panel">
          <div className="panel-header-inline">
            <div>
              <h3>Products Catalog</h3>
              <span className="text-secondary">Manage grocery items, pack units, pricing, and stock levels</span>
            </div>
            <button className="btn-primary" onClick={() => setShowAddProduct(!showAddProduct)}>
              {showAddProduct ? 'Cancel' : '+ Add New Product'}
            </button>
          </div>

          {showAddProduct && (
            <form onSubmit={handleCreateProduct} className="add-product-form">
              <h4>Create New Grocery Product</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="p_name">Product Name *</label>
                  <input
                    id="p_name"
                    type="text"
                    placeholder="e.g. Organic Cavendish Bananas"
                    value={prodName}
                    onChange={e => setProdName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="p_cat">Category *</label>
                  <select
                    id="p_cat"
                    value={prodCat}
                    onChange={e => setProdCat(e.target.value)}
                    required
                  >
                    <option value="">Select a Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="p_price">Price (₹) *</label>
                  <input
                    id="p_price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="40.00"
                    value={prodPrice}
                    onChange={e => setProdPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="p_stock">Stock Available *</label>
                  <input
                    id="p_stock"
                    type="number"
                    min="0"
                    placeholder="50"
                    value={prodStock}
                    onChange={e => setProdStock(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="p_unit">Pack / Weight Unit *</label>
                  <input
                    id="p_unit"
                    type="text"
                    placeholder="e.g. 1 kg, 500 ml, 6 pcs"
                    value={prodUnit}
                    onChange={e => setProdUnit(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="p_desc">Product Description</label>
                <textarea
                  id="p_desc"
                  rows="2"
                  placeholder="Detailed description of the product, source, and nutritional details."
                  value={prodDesc}
                  onChange={e => setProdDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="p_img">Product Photo</label>
                <input
                  id="p_img"
                  type="file"
                  accept="image/*"
                  onChange={e => setProdImage(e.target.files[0])}
                />
              </div>

              <div className="form-action-buttons">
                <button className="btn-primary" type="submit">Save Product to Inventory</button>
                <button className="btn-outline" type="button" onClick={() => setShowAddProduct(false)}>Cancel</button>
              </div>
            </form>
          )}

          {/* Search & Filter Toolbar for Inventory */}
          <div className="inventory-filter-bar">
            <input
              type="text"
              placeholder="Filter products by name..."
              value={inventorySearch}
              onChange={e => setInventorySearch(e.target.value)}
              className="inventory-search-input"
            />
            <select
              aria-label="Filter inventory by category"
              value={inventoryCatFilter}
              onChange={e => setInventoryCatFilter(e.target.value)}
              className="inventory-cat-select"
            >
              <option value="All">All Categories ({products.length})</option>
              {categories.map(c => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Inventory Table */}
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const cat = categories.find(c => c.id === p.category);
                  return (
                    <tr key={p.id}>
                      <td className="product-col">
                        <strong>{p.name}</strong>
                      </td>
                      <td>{cat?.name || 'General'}</td>
                      <td><span className="unit-label">{p.unit || '1 unit'}</span></td>
                      <td><strong>₹{p.price}</strong></td>
                      <td>
                        <span className={`stock-pill ${p.stock > 5 ? 'in-stock' : p.stock > 0 ? 'low-stock' : 'out-stock'}`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions">
                          <button
                            className="btn-outline-sm"
                            onClick={() => setEditingProduct(p)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-danger-outline-sm"
                            onClick={() => handleDeleteProduct(p)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Order Fulfillment */}
      {activeTab === 'orders' && (
        <div className="panel admin-panel">
          <div className="panel-header-inline">
            <div>
              <h3>Customer Orders</h3>
              <span className="text-secondary">Update shipment tracking and manage order workflow</span>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="empty-substate">
              <p className="text-secondary">No customer orders have been received yet.</p>
            </div>
          ) : (
            <div className="admin-orders-list">
              {orders.map(o => (
                <div key={o.id} className="admin-order-card">
                  <div className="admin-order-header">
                    <div>
                      <strong>Order #{o.id}</strong>
                      <span className="text-secondary"> · Customer: <strong>{o.username}</strong></span>
                      <small className="text-secondary" style={{ display: 'block', marginTop: '2px' }}>
                        {new Date(o.created_at).toLocaleString('en-IN')}
                      </small>
                    </div>

                    <div className="status-update-control">
                      <label htmlFor={`status_${o.id}`} className="field-hint" style={{ marginRight: '6px' }}>Status:</label>
                      <select
                        id={`status_${o.id}`}
                        value={o.status}
                        onChange={e => onUpdateOrderStatus(o.id, e.target.value)}
                        className={`admin-status-select status-${o.status.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Packed">Packed</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="admin-order-details">
                    <p><span className="text-secondary">Deliver to:</span> {o.address} {o.phone && `(Phone: ${o.phone})`}</p>
                    <p><span className="text-secondary">Payment Method:</span> {o.payment_method || 'Cash on Delivery'}</p>
                    <p><span className="text-secondary">Order Total:</span> <strong>₹{Number(o.total).toFixed(2)}</strong></p>
                  </div>

                  <div className="admin-order-items">
                    <span className="text-secondary">Items: </span>
                    {o.items && o.items.map(i => (
                      <span key={i.id} className="item-chip">
                        {i.product_name} × {i.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Categories */}
      {activeTab === 'categories' && (
        <div className="panel admin-panel">
          <div className="panel-header-inline">
            <div>
              <h3>Grocery Categories</h3>
              <span className="text-secondary">Organize products into intuitive grocery departments</span>
            </div>
          </div>

          <form onSubmit={handleCreateCategory} className="add-category-row">
            <input
              type="text"
              placeholder="e.g. Organic Produce, Dairy & Eggs..."
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              required
            />
            <button className="btn-primary" type="submit">+ Add Department</button>
          </form>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Assigned Products</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(c => {
                  const count = products.filter(p => p.category === c.id).length;
                  return (
                    <tr key={c.id}>
                      <td><strong>{c.name}</strong></td>
                      <td>{count} {count === 1 ? 'item' : 'items'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-danger-outline-sm"
                          onClick={() => handleDeleteCategory(c)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Promo & Special Offer Banner */}
      {activeTab === 'offer' && (
        <div className="panel admin-panel">
          <div className="panel-header-inline">
            <div>
              <h3>Storefront Special Offer & Banner</h3>
              <span className="text-secondary">Customize the top promotional banner, active coupon discount, and free shipping threshold</span>
            </div>
          </div>

          <form onSubmit={handleSavePromoOffer} className="promo-editor-form">
            <div className="form-group">
              <label className="checkbox-label" style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                <input
                  type="checkbox"
                  checked={promoActive}
                  onChange={e => setPromoActive(e.target.checked)}
                />
                <span>Display Special Offer banner on storefront</span>
              </label>
              <small className="field-hint">When enabled, this banner will appear at the top of the grocery shopping page.</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="promo_tag">Badge Tag *</label>
                <input
                  id="promo_tag"
                  type="text"
                  placeholder="e.g. SPECIAL OFFER, FLASH DEAL"
                  value={promoTag}
                  onChange={e => setPromoTag(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="promo_code">Active Coupon Code *</label>
                <input
                  id="promo_code"
                  type="text"
                  placeholder="e.g. FRESH20"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="promo_discount">Discount Percentage (%) *</label>
                <input
                  id="promo_discount"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="20"
                  value={promoDiscount}
                  onChange={e => setPromoDiscount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="promo_threshold">Free Delivery Above (₹) *</label>
                <input
                  id="promo_threshold"
                  type="number"
                  min="0"
                  placeholder="500"
                  value={promoThreshold}
                  onChange={e => setPromoThreshold(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="promo_text">Banner Announcement Message *</label>
              <textarea
                id="promo_text"
                rows="2"
                placeholder="Announcement message displayed to shoppers..."
                value={promoText}
                onChange={e => setPromoText(e.target.value)}
                required
              />
            </div>

            {/* Live Preview Box */}
            <div className="promo-preview-section" style={{ margin: '16px 0', padding: '16px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ marginBottom: '8px', fontSize: '0.85rem', color: '#64748b' }}>Live Storefront Banner Preview:</h4>
              {promoActive ? (
                <div className="promo-banner" style={{ margin: 0 }}>
                  <div className="promo-inner">
                    <span className="promo-tag">{promoTag || 'SPECIAL OFFER'}</span>
                    <span className="promo-text">{promoText || 'Announcement text preview'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-secondary" style={{ fontStyle: 'italic', margin: 0 }}>Banner is currently hidden (toggle checkbox above to enable).</p>
              )}
            </div>

            <button className="btn-primary" type="submit" disabled={savingPromo}>
              {savingPromo ? 'Saving Changes...' : 'Save Offer Settings'}
            </button>
          </form>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="modal-backdrop" onClick={() => setEditingProduct(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Product: {editingProduct.name}</h3>
              <button className="modal-close-btn" onClick={() => setEditingProduct(null)}>✕</button>
            </div>

            <form onSubmit={handleUpdateProductSubmit} className="modal-body-form">
              <div className="form-group">
                <label htmlFor="edit_name">Product Name *</label>
                <input
                  id="edit_name"
                  type="text"
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit_price">Price (₹) *</label>
                  <input
                    id="edit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit_stock">Stock Available *</label>
                  <input
                    id="edit_stock"
                    type="number"
                    min="0"
                    value={editingProduct.stock}
                    onChange={e => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit_unit">Pack / Weight Unit</label>
                  <input
                    id="edit_unit"
                    type="text"
                    value={editingProduct.unit || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit_cat">Department</label>
                <select
                  id="edit_cat"
                  value={editingProduct.category}
                  onChange={e => setEditingProduct({ ...editingProduct, category: Number(e.target.value) })}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit_desc">Description</label>
                <textarea
                  id="edit_desc"
                  rows="3"
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                />
              </div>

              <div className="modal-footer-buttons">
                <button className="btn-primary" type="submit">Save Changes</button>
                <button className="btn-outline" type="button" onClick={() => setEditingProduct(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
