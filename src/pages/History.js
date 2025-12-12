import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useApp } from '../context/AppContext';
import { historyAPI } from '../services/api';
import { ImageModal, DataModal } from '../components/Modal';

const History = () => {
  const { hotels } = useApp();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    hotel_id: '',
    from_date: '',
    to_date: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [imageModal, setImageModal] = useState({ open: false, src: '' });
  const [dataModal, setDataModal] = useState({ open: false, data: null });

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...filters,
      };
      const response = await historyAPI.getAll(params);
      if (response.data) {
        setHistory(response.data.history || []);
        setPagination({
          ...pagination,
          page: response.data.page || page,
          total: response.data.total || 0,
          totalPages: response.data.total_pages || 0,
        });
      }
    } catch (error) {
      toast.error('Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    fetchHistory(1);
  };

  const clearFilters = () => {
    setFilters({ hotel_id: '', from_date: '', to_date: '' });
    fetchHistory(1);
  };

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchHistory(newPage);
    }
  };

  const handleView = async (item) => {
    try {
      const response = await historyAPI.getById(item.id);
      if (response.data) {
        setDataModal({ open: true, data: response.data });
      }
    } catch (error) {
      toast.error('Failed to load details');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this extraction?')) return;
    try {
      await historyAPI.delete(id);
      toast.success('Extraction deleted');
      fetchHistory(pagination.page);
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleDownloadExcel = async (id) => {
    try {
      const response = await historyAPI.getExcel(id);
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extraction_${id}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel downloaded');
    } catch (error) {
      toast.error('Failed to download Excel');
    }
  };

  const getHotelName = (hotelId) => {
    const hotel = hotels.find((h) => h.id === hotelId);
    return hotel?.name || hotelId;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Extraction History</h1>
        <p className="page-subtitle">View and manage all extraction records</p>
      </div>

      <div className="card">
        <h3 className="card-title">Extraction History - List View</h3>

        <div className="history-filters">
          <div className="filter-group">
            <label>Hotel:</label>
            <select name="hotel_id" value={filters.hotel_id} onChange={handleFilterChange}>
              <option value="">All Hotels</option>
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>From:</label>
            <input
              type="date"
              name="from_date"
              value={filters.from_date}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <label>To:</label>
            <input
              type="date"
              name="to_date"
              value={filters.to_date}
              onChange={handleFilterChange}
            />
          </div>
          <button className="filter-btn" onClick={applyFilters}>
            Apply Filter
          </button>
          <button className="clear-filter-btn" onClick={clearFilters}>
            Clear
          </button>
          <span style={{ color: '#6b7280', marginLeft: 'auto' }}>
            {pagination.total} records
          </span>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="no-history">
            <div className="no-history-icon">📋</div>
            <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>No extraction history yet</p>
            <p style={{ fontSize: '0.9rem' }}>Upload images to see them here</p>
          </div>
        ) : (
          <>
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="history-list-item">
                  <img
                    src={item.image_url || '/placeholder-image.png'}
                    alt="Extracted"
                    className="history-item-image"
                    onClick={() => setImageModal({ open: true, src: item.image_url })}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="70"><rect fill="%23f3f4f6" width="100" height="70"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af">No Image</text></svg>';
                    }}
                  />
                  <div className="history-item-info">
                    <div className="history-item-hotel">{getHotelName(item.hotel_id)}</div>
                    <div className="history-item-id">{item.id}</div>
                    <div className="history-item-filename">{item.filename || 'N/A'}</div>
                    <div className="history-item-datetime">
                      <span className="date-icon">📅</span>
                      <span className="datetime-badge">{formatDate(item.created_at)}</span>
                    </div>
                    <div className="history-item-stats">
                      <span className="history-item-stat">
                        Linen: <strong>{item.linen_count || 0}</strong>
                      </span>
                      <span className="history-item-stat">
                        Uniform: <strong>{item.uniform_count || 0}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="history-item-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleView(item)}>
                      View
                    </button>
                    <button className="btn btn-orange btn-sm" onClick={() => handleDownloadExcel(item.id)}>
                      Excel
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => changePage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </button>
                <div className="pagination-pages">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      const current = pagination.page;
                      return p === 1 || p === pagination.totalPages || (p >= current - 2 && p <= current + 2);
                    })
                    .map((p, idx, arr) => (
                      <React.Fragment key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ padding: '0 5px' }}>...</span>}
                        <button
                          className={`page-btn ${p === pagination.page ? 'active' : ''}`}
                          onClick={() => changePage(p)}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    ))}
                </div>
                <button
                  className="pagination-btn"
                  onClick={() => changePage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ImageModal
        isOpen={imageModal.open}
        onClose={() => setImageModal({ open: false, src: '' })}
        imageSrc={imageModal.src}
      />

      <DataModal
        isOpen={dataModal.open}
        onClose={() => setDataModal({ open: false, data: null })}
        title="Extracted Data"
        driveStored={dataModal.data?.drive_stored}
      >
        {dataModal.data && (
          <>
            {dataModal.data.header && (
              <div className="header-info">
                {Object.entries(dataModal.data.header).map(([key, value]) => (
                  <div className="header-info-item" key={key}>
                    <span className="header-info-label">{key.replace(/_/g, ' ')}</span>
                    <span className="header-info-value">{value || '-'}</span>
                  </div>
                ))}
              </div>
            )}

            {dataModal.data.linen_items?.length > 0 && (
              <div className="inventory-section">
                <h4>Linen Items ({dataModal.data.linen_items.length})</h4>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Sr No</th>
                        <th>Item</th>
                        <th>Opening</th>
                        <th>Clean</th>
                        <th>Total</th>
                        <th>Soil</th>
                        <th>Closing</th>
                        <th>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataModal.data.linen_items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.sr_no || idx + 1}</td>
                          <td>{item.item}</td>
                          <td>{item.opening_balance}</td>
                          <td>{item.clean_received}</td>
                          <td>{item.total}</td>
                          <td>{item.soil_sent}</td>
                          <td>{item.closing_balance}</td>
                          <td>{item.remark || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {dataModal.data.uniform_items?.length > 0 && (
              <div className="inventory-section">
                <h4>Uniform Items ({dataModal.data.uniform_items.length})</h4>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Sr No</th>
                        <th>Item</th>
                        <th>Opening</th>
                        <th>Clean</th>
                        <th>Total</th>
                        <th>Soil</th>
                        <th>Closing</th>
                        <th>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataModal.data.uniform_items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.sr_no || idx + 1}</td>
                          <td>{item.item}</td>
                          <td>{item.opening_balance}</td>
                          <td>{item.clean_received}</td>
                          <td>{item.total}</td>
                          <td>{item.soil_sent}</td>
                          <td>{item.closing_balance}</td>
                          <td>{item.remark || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </DataModal>
    </div>
  );
};

export default History;
