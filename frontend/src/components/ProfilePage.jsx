import { useState, useEffect } from 'react';

export default function ProfilePage({
  user,
  addresses,
  onUpdateProfile,
  onAddAddress,
  onDeleteAddress,
  onSetDefaultAddress,
  notify,
  handleLogout,
  setPage
}) {
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Address form states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newPostalCode, setNewPostalCode] = useState('');
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await onUpdateProfile({ first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim() });
      notify('Personal information updated successfully.');
    } catch {
      notify('Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!newFullName.trim() || !newPhone.trim() || !newStreet.trim() || !newCity.trim() || !newPostalCode.trim()) {
      notify('Please fill in all required address fields.');
      return;
    }

    setSavingAddress(true);
    try {
      await onAddAddress({
        full_name: newFullName.trim(),
        phone: newPhone.trim(),
        street_address: newStreet.trim(),
        city: newCity.trim(),
        state: newState.trim(),
        postal_code: newPostalCode.trim(),
        is_default: newIsDefault || (addresses && addresses.length === 0)
      });
      notify('New delivery address saved.');
      // Reset form
      setNewFullName('');
      setNewPhone('');
      setNewStreet('');
      setNewCity('');
      setNewState('');
      setNewPostalCode('');
      setNewIsDefault(false);
      setShowAddressForm(false);
    } catch {
      notify('Failed to save address.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = (id) => {
    if (window.confirm('Delete this saved delivery address?')) {
      onDeleteAddress(id);
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h2>Account & Addresses</h2>
          <p className="text-secondary">Manage your contact details and delivery locations</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Left Column: Personal info */}
        <div className="panel profile-info-panel">
          <h3>Personal Details</h3>
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input value={user?.username || ''} disabled className="input-disabled" />
              <small className="field-hint">Your unique FreshMart username cannot be changed.</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="prof_fname">First Name</label>
                <input
                  id="prof_fname"
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="prof_lname">Last Name</label>
                <input
                  id="prof_lname"
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="prof_email">Email Address</label>
              <input
                id="prof_email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <button className="btn-primary" type="submit" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Update Details'}
            </button>
          </form>

          <hr className="section-divider" />

          <h3>Quick Navigation</h3>
          <div className="quick-nav-buttons">
            <button className="btn-outline full" onClick={() => setPage('orders')}>
              View Orders
            </button>
            <button className="btn-outline full" onClick={() => setPage('wishlist')}>
              View Saved Wishlist
            </button>
            <button
              className="btn-danger-outline full"
              onClick={() => {
                if (window.confirm('Are you sure you want to sign out?')) {
                  handleLogout();
                }
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Right Column: Address Management */}
        <div className="panel profile-address-panel">
          <div className="panel-header-inline">
            <h3>Saved Addresses</h3>
            {!showAddressForm && (
              <button className="btn-outline" onClick={() => setShowAddressForm(true)}>
                + Add Address
              </button>
            )}
          </div>

          {showAddressForm && (
            <form onSubmit={handleAddressSubmit} className="add-address-card">
              <h4>New Delivery Address</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="addr_name">Recipient Name *</label>
                  <input
                    id="addr_name"
                    type="text"
                    placeholder="Full Name"
                    value={newFullName}
                    onChange={e => setNewFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="addr_phone">Phone Number *</label>
                  <input
                    id="addr_phone"
                    type="tel"
                    placeholder="10-digit number"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="addr_street">Street Address *</label>
                <input
                  id="addr_street"
                  type="text"
                  placeholder="House/Flat No, Apartment, Street"
                  value={newStreet}
                  onChange={e => setNewStreet(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="addr_city">City *</label>
                  <input
                    id="addr_city"
                    type="text"
                    placeholder="City"
                    value={newCity}
                    onChange={e => setNewCity(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="addr_state">State</label>
                  <input
                    id="addr_state"
                    type="text"
                    placeholder="State"
                    value={newState}
                    onChange={e => setNewState(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="addr_pin">PIN Code *</label>
                  <input
                    id="addr_pin"
                    type="text"
                    placeholder="PIN Code"
                    value={newPostalCode}
                    onChange={e => setNewPostalCode(e.target.value)}
                    required
                  />
                </div>
              </div>

              <label className="checkbox-label" style={{ marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  checked={newIsDefault}
                  onChange={e => setNewIsDefault(e.target.checked)}
                />
                <span>Set as default delivery address</span>
              </label>

              <div className="form-action-buttons">
                <button className="btn-primary" type="submit" disabled={savingAddress}>
                  {savingAddress ? 'Saving...' : 'Save Address'}
                </button>
                <button
                  className="btn-outline"
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {(!addresses || addresses.length === 0) ? (
            <div className="empty-substate">
              <p className="text-secondary">No saved addresses found. Add a delivery address for quicker checkout.</p>
            </div>
          ) : (
            <div className="address-card-list">
              {addresses.map(addr => (
                <div key={addr.id} className="address-card">
                  <div className="address-card-header">
                    <strong>{addr.full_name}</strong>
                    {addr.is_default && <span className="default-pill">Default Address</span>}
                  </div>
                  <p className="address-text">{addr.street_address}</p>
                  <p className="address-subtext">{addr.city}{addr.state ? `, ${addr.state}` : ''} - {addr.postal_code}</p>
                  <p className="address-phone"><span className="text-secondary">Phone:</span> {addr.phone}</p>

                  <div className="address-card-actions">
                    {!addr.is_default && (
                      <button
                        className="btn-text"
                        onClick={() => onSetDefaultAddress(addr.id)}
                      >
                        Make Default
                      </button>
                    )}
                    <button
                      className="btn-text-danger"
                      onClick={() => handleDeleteAddress(addr.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
