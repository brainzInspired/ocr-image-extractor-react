import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useApp } from '../context/AppContext';
import { hotelsAPI } from '../services/api';

const Hotels = () => {
  const { hotels, fetchHotels, hotelsLoading } = useApp();
  const [newHotelName, setNewHotelName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddHotel = async () => {
    if (!newHotelName.trim()) {
      toast.error('Please enter a hotel name');
      return;
    }

    setLoading(true);
    try {
      await hotelsAPI.create({ name: newHotelName.trim() });
      toast.success('Hotel added successfully');
      setNewHotelName('');
      fetchHotels();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add hotel');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHotel = async (id) => {
    if (!editName.trim()) {
      toast.error('Please enter a hotel name');
      return;
    }

    setLoading(true);
    try {
      await hotelsAPI.update(id, { name: editName.trim() });
      toast.success('Hotel updated successfully');
      setEditingId(null);
      setEditName('');
      fetchHotels();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update hotel');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHotel = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? All extraction history for this hotel will also be deleted.`)) {
      return;
    }

    setLoading(true);
    try {
      await hotelsAPI.delete(id);
      toast.success('Hotel deleted successfully');
      fetchHotels();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete hotel');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (hotel) => {
    setEditingId(hotel.id);
    setEditName(hotel.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Manage Hotels</h1>
        <p className="page-subtitle">Add and manage hotels for extraction</p>
      </div>

      <div className="card">
        <h3 className="card-title">Manage Hotels</h3>

        <div className="hotel-form">
          <input
            type="text"
            placeholder="Enter hotel name..."
            value={newHotelName}
            onChange={(e) => setNewHotelName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddHotel()}
          />
          <button className="btn" onClick={handleAddHotel} disabled={loading}>
            {loading ? 'Adding...' : 'Add Hotel'}
          </button>
        </div>

        {hotelsLoading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading hotels...</p>
          </div>
        ) : hotels.length === 0 ? (
          <div className="no-history">
            <div className="no-history-icon">🏨</div>
            <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>No hotels added yet</p>
            <p style={{ fontSize: '0.9rem' }}>Add a hotel above to get started</p>
          </div>
        ) : (
          <table className="hotels-table">
            <thead>
              <tr>
                <th>Hotel ID</th>
                <th>Hotel Name</th>
                <th>Created</th>
                <th>Extractions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hotels.map((hotel) => (
                <tr key={hotel.id}>
                  <td>
                    <span className="hotel-id">{hotel.id}</span>
                  </td>
                  <td>
                    {editingId === hotel.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleUpdateHotel(hotel.id)}
                        style={{
                          padding: '8px 12px',
                          border: '2px solid #22c55e',
                          borderRadius: '6px',
                          fontSize: '0.95rem',
                          width: '200px',
                        }}
                        autoFocus
                      />
                    ) : (
                      hotel.name
                    )}
                  </td>
                  <td>{formatDate(hotel.created_at)}</td>
                  <td>{hotel.extraction_count || 0}</td>
                  <td>
                    <div className="hotel-actions">
                      {editingId === hotel.id ? (
                        <>
                          <button
                            className="btn btn-sm"
                            onClick={() => handleUpdateHotel(hotel.id)}
                            disabled={loading}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={cancelEditing}
                            disabled={loading}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => startEditing(hotel)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteHotel(hotel.id, hotel.name)}
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Hotels;
