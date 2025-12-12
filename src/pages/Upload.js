import React, { useState, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useApp } from '../context/AppContext';
import { extractAPI, historyAPI, usageAPI } from '../services/api';

// Image compression function - compresses to target size (default 900KB)
const compressImage = (file, maxSizeKB = 900) => {
  return new Promise((resolve, reject) => {
    const maxSizeBytes = maxSizeKB * 1024;

    // If file is already small enough, return it as-is
    if (file.size <= maxSizeBytes) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate scale factor based on file size ratio
        const scaleFactor = Math.sqrt(maxSizeBytes / file.size);
        width = Math.floor(width * scaleFactor);
        height = Math.floor(height * scaleFactor);

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Start with quality 0.8 and reduce if needed
        let quality = 0.8;

        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (blob.size <= maxSizeBytes || quality <= 0.1) {
                // Create a new File from the blob
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                // Reduce quality and try again
                quality -= 0.1;
                tryCompress();
              }
            },
            'image/jpeg',
            quality
          );
        };

        tryCompress();
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

const Upload = () => {
  const { hotels, usage, fetchUsage } = useApp();
  const [selectedHotel, setSelectedHotel] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [rawText, setRawText] = useState('');
  const [activeTab, setActiveTab] = useState('structured');
  const [isDragOver, setIsDragOver] = useState(false);
  const [originalSize, setOriginalSize] = useState(null);
  const [compressedSize, setCompressedSize] = useState(null);
  const fileInputRef = useRef(null);

  const selectedHotelData = hotels.find((h) => h.id === selectedHotel);

  const handleFileSelect = async (file) => {
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload an image.');
        return;
      }

      setError('');
      setExtractedData(null);
      setRawText('');
      setOriginalSize(file.size);

      // Check if compression is needed (file > 900KB)
      const maxSize = 900 * 1024; // 900KB
      if (file.size > maxSize) {
        setCompressing(true);
        toast.info(`Compressing image from ${(file.size / 1024).toFixed(0)}KB...`);

        try {
          const compressedFile = await compressImage(file, 900);
          setCompressedSize(compressedFile.size);
          setSelectedFile(compressedFile);
          setPreviewUrl(URL.createObjectURL(compressedFile));
          toast.success(`Image compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`);
        } catch (err) {
          toast.error('Failed to compress image. Please try a smaller image.');
          setCompressing(false);
          return;
        }
        setCompressing(false);
      } else {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setCompressedSize(null);
      }
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleExtract = async () => {
    if (!selectedHotel) {
      toast.error('Please select a hotel first');
      return;
    }
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('hotel_id', selectedHotel);

      const response = await extractAPI.extract(formData);

      if (response.data.success) {
        setExtractedData(response.data.data);
        setRawText(response.data.raw_text || '');

        // Update usage stats
        await usageAPI.increment();
        fetchUsage();

        // Save to history
        await historyAPI.save({
          hotel_id: selectedHotel,
          hotel_name: selectedHotelData?.name,
          filename: selectedFile.name,
          ...response.data.data,
          linen_count: response.data.data.linen_items?.length || 0,
          uniform_count: response.data.data.uniform_items?.length || 0,
          raw_text: response.data.raw_text,
        });

        toast.success('Data extracted successfully using OCR.space!');
      } else {
        setError(response.data.error || 'Extraction failed');
        toast.error('Extraction failed');
      }
    } catch (err) {
      const errorMsg = err.message || err.response?.data?.error || 'Failed to extract data';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCellEdit = (type, index, field, value) => {
    setExtractedData((prev) => {
      const newData = { ...prev };
      if (type === 'header') {
        newData.header = { ...newData.header, [field]: value };
      } else if (type === 'linen') {
        newData.linen_items = [...newData.linen_items];
        newData.linen_items[index] = { ...newData.linen_items[index], [field]: value };
      } else if (type === 'uniform') {
        newData.uniform_items = [...newData.uniform_items];
        newData.uniform_items[index] = { ...newData.uniform_items[index], [field]: value };
      }
      return newData;
    });
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(extractedData, null, 2));
    toast.success('JSON copied to clipboard!');
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(extractedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extraction_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await extractAPI.exportExcel({
        data: extractedData,
        hotel_id: selectedHotel,
        hotel_name: selectedHotelData?.name,
      });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extraction_${selectedHotelData?.name || 'data'}_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded!');
    } catch (err) {
      toast.error('Failed to download file');
    }
  };

  const getUsageBadge = (used, limit) => {
    const percent = (used / limit) * 100;
    if (percent >= 90) return { text: 'CRITICAL', class: 'danger' };
    if (percent >= 70) return { text: 'WARNING', class: 'warning' };
    return { text: 'OK', class: '' };
  };

  return (
    <div className="container">
      {/* Usage Dashboard */}
      <div className="usage-dashboard">
        <h3 className="usage-title">API Usage Dashboard (OCR.space)</h3>
        <div className="usage-grid">
          <div className="usage-card">
            <div className="usage-card-header">
              <span className="usage-card-title">Today</span>
              <span className={`usage-card-badge ${getUsageBadge(usage.daily.used, usage.daily.limit).class}`}>
                {getUsageBadge(usage.daily.used, usage.daily.limit).text}
              </span>
            </div>
            <div className="usage-numbers">
              <span className="usage-used">{usage.daily.used.toLocaleString()}</span>
              <span className="usage-limit">/ {usage.daily.limit.toLocaleString()}</span>
            </div>
            <div className="usage-bar-container">
              <div
                className={`usage-bar ${getUsageBadge(usage.daily.used, usage.daily.limit).class}`}
                style={{ width: `${Math.min((usage.daily.used / usage.daily.limit) * 100, 100)}%` }}
              />
            </div>
            <div className="usage-remaining">
              {(usage.daily.limit - usage.daily.used).toLocaleString()} remaining
            </div>
          </div>

          <div className="usage-card">
            <div className="usage-card-header">
              <span className="usage-card-title">This Month</span>
              <span className={`usage-card-badge ${getUsageBadge(usage.monthly.used, usage.monthly.limit).class}`}>
                {getUsageBadge(usage.monthly.used, usage.monthly.limit).text}
              </span>
            </div>
            <div className="usage-numbers">
              <span className="usage-used">{usage.monthly.used.toLocaleString()}</span>
              <span className="usage-limit">/ {usage.monthly.limit.toLocaleString()}</span>
            </div>
            <div className="usage-bar-container">
              <div
                className={`usage-bar ${getUsageBadge(usage.monthly.used, usage.monthly.limit).class}`}
                style={{ width: `${Math.min((usage.monthly.used / usage.monthly.limit) * 100, 100)}%` }}
              />
            </div>
            <div className="usage-remaining">
              {(usage.monthly.limit - usage.monthly.used).toLocaleString()} remaining
            </div>
          </div>

          <div className="usage-card">
            <div className="usage-card-header">
              <span className="usage-card-title">This Year</span>
              <span className={`usage-card-badge ${getUsageBadge(usage.yearly.used, usage.yearly.limit).class}`}>
                {getUsageBadge(usage.yearly.used, usage.yearly.limit).text}
              </span>
            </div>
            <div className="usage-numbers">
              <span className="usage-used">{usage.yearly.used.toLocaleString()}</span>
              <span className="usage-limit">/ {usage.yearly.limit.toLocaleString()}</span>
            </div>
            <div className="usage-bar-container">
              <div
                className={`usage-bar ${getUsageBadge(usage.yearly.used, usage.yearly.limit).class}`}
                style={{ width: `${Math.min((usage.yearly.used / usage.yearly.limit) * 100, 100)}%` }}
              />
            </div>
            <div className="usage-remaining">
              {(usage.yearly.limit - usage.yearly.used).toLocaleString()} remaining
            </div>
          </div>

          <div className="usage-card">
            <div className="usage-card-header">
              <span className="usage-card-title">All Time</span>
              <span className="usage-card-badge" style={{ background: '#6366f1' }}>TOTAL</span>
            </div>
            <div className="usage-numbers">
              <span className="usage-used">{usage.total.toLocaleString()}</span>
              <span className="usage-limit">extractions</span>
            </div>
            <div className="usage-bar-container">
              <div className="usage-bar" style={{ width: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
            </div>
            <div className="usage-remaining">Since launch</div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="card">
        <h3 className="card-title">Upload Image for OCR Extraction</h3>

        <div className="upload-container">
          <div>
            {/* Hotel Selector */}
            <div className="hotel-selector">
              <label>Select Hotel (Required)</label>
              <select
                value={selectedHotel}
                onChange={(e) => setSelectedHotel(e.target.value)}
              >
                <option value="">-- Select a Hotel --</option>
                {hotels.map((hotel) => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </option>
                ))}
              </select>
              {selectedHotelData && (
                <div className="selected-hotel-info">
                  <div className="hotel-name">{selectedHotelData.name}</div>
                  <div className="hotel-id-display">{selectedHotelData.id}</div>
                </div>
              )}
            </div>

            {/* Upload Area */}
            <div
              className={`upload-area ${isDragOver ? 'dragover' : ''} ${compressing ? 'compressing' : ''}`}
              onClick={() => !compressing && fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {compressing ? (
                <>
                  <div className="upload-icon">⏳</div>
                  <p className="upload-text">Compressing image...</p>
                  <p className="upload-subtext">Please wait</p>
                </>
              ) : (
                <>
                  <div className="upload-icon">📄</div>
                  <p className="upload-text">Drag & Drop your image here</p>
                  <p className="upload-subtext">or click to browse (PNG, JPG, JPEG, BMP, WEBP)</p>
                  <p className="upload-subtext" style={{ color: '#10b981', fontWeight: 500 }}>
                    Auto-compresses to 900KB if larger
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
            </div>

            {previewUrl && (
              <div className="preview-container">
                <img src={previewUrl} alt="Preview" className="preview-image" />
                {/* File size info */}
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  background: compressedSize ? '#d1fae5' : '#f3f4f6',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  textAlign: 'center'
                }}>
                  {compressedSize ? (
                    <span style={{ color: '#059669' }}>
                      <strong>Compressed:</strong> {(originalSize / 1024).toFixed(0)}KB → {(compressedSize / 1024).toFixed(0)}KB
                      <span style={{ marginLeft: '10px', color: '#10b981' }}>
                        (saved {((1 - compressedSize / originalSize) * 100).toFixed(0)}%)
                      </span>
                    </span>
                  ) : (
                    <span style={{ color: '#6b7280' }}>
                      <strong>File size:</strong> {(originalSize / 1024).toFixed(0)}KB
                      {originalSize <= 900 * 1024 && <span style={{ color: '#10b981', marginLeft: '10px' }}>(No compression needed)</span>}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                className="btn"
                onClick={handleExtract}
                disabled={!selectedHotel || !selectedFile || loading || compressing}
              >
                {compressing ? 'Compressing...' : loading ? 'Extracting with OCR...' : 'Extract Data with OCR'}
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>

          <div>
            {/* Quick Instructions */}
            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '20px', border: '1px solid #bbf7d0' }}>
              <h4 style={{ color: '#166534', marginBottom: '15px' }}>Quick Instructions</h4>
              <ol style={{ color: '#374151', lineHeight: '1.8', paddingLeft: '20px' }}>
                <li>First, add your hotels in "Manage Hotels" tab</li>
                <li>Select the hotel from dropdown</li>
                <li>Upload the linen/inventory sheet image (max 1MB)</li>
                <li>Click "Extract Data with OCR"</li>
                <li>Edit extracted data if needed</li>
                <li>Download CSV with your changes</li>
              </ol>
              <div style={{ marginTop: '15px', padding: '10px', background: '#dbeafe', borderRadius: '8px', fontSize: '0.85rem', color: '#1e40af' }}>
                <strong>Powered by OCR.space API</strong><br/>
                Free tier: 25,000 requests/month
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p style={{ color: '#374151', fontWeight: 500 }}>Extracting text with OCR.space...</p>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '5px' }}>This may take a few seconds</p>
        </div>
      )}

      {/* Results Section */}
      {extractedData && (
        <div className="card results-section">
          <div className="stats-bar">
            <div className="stat-item">
              <div className="stat-value">{extractedData.linen_items?.length || 0}</div>
              <div className="stat-label">Linen Items</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{extractedData.uniform_items?.length || 0}</div>
              <div className="stat-label">Uniform Items</div>
            </div>
          </div>

          <div className="tabs">
            <button
              className={`tab ${activeTab === 'structured' ? 'active' : ''}`}
              onClick={() => setActiveTab('structured')}
            >
              Structured Data
            </button>
            <button
              className={`tab ${activeTab === 'json' ? 'active' : ''}`}
              onClick={() => setActiveTab('json')}
            >
              JSON Output
            </button>
            <button
              className={`tab ${activeTab === 'raw' ? 'active' : ''}`}
              onClick={() => setActiveTab('raw')}
            >
              Raw OCR Text
            </button>
          </div>

          {activeTab === 'structured' && (
            <div className="tab-content active">
              <h3 className="card-title">Extracted Data</h3>

              {/* Header Info */}
              {extractedData.header && (
                <div className="header-info">
                  {Object.entries(extractedData.header).map(([key, value]) => (
                    <div className="header-info-item" key={key}>
                      <span className="header-info-label">{key.replace(/_/g, ' ')}</span>
                      <span
                        className="header-info-value"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleCellEdit('header', null, key, e.target.textContent)}
                      >
                        {value || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="edit-indicator">
                <span>Click any cell to edit</span> - Changes will be included in CSV download
              </div>

              {/* Linen Items Table */}
              {extractedData.linen_items?.length > 0 && (
                <div className="inventory-section">
                  <h4>Linen Items</h4>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Sr No</th>
                          <th>Item</th>
                          <th>Opening Balance</th>
                          <th>Clean Received</th>
                          <th>Total</th>
                          <th>Soil Sent</th>
                          <th>Closing Balance</th>
                          <th>Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extractedData.linen_items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.sr_no || idx + 1}</td>
                            <td
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => handleCellEdit('linen', idx, 'item', e.target.textContent)}
                            >
                              {item.item}
                            </td>
                            <td
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => handleCellEdit('linen', idx, 'opening_balance', e.target.textContent)}
                            >
                              {item.opening_balance}
                            </td>
                            <td
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => handleCellEdit('linen', idx, 'clean_received', e.target.textContent)}
                            >
                              {item.clean_received}
                            </td>
                            <td
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => handleCellEdit('linen', idx, 'total', e.target.textContent)}
                            >
                              {item.total}
                            </td>
                            <td
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => handleCellEdit('linen', idx, 'soil_sent', e.target.textContent)}
                            >
                              {item.soil_sent}
                            </td>
                            <td
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => handleCellEdit('linen', idx, 'closing_balance', e.target.textContent)}
                            >
                              {item.closing_balance}
                            </td>
                            <td
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => handleCellEdit('linen', idx, 'remark', e.target.textContent)}
                            >
                              {item.remark}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Uniform Items Table */}
              {extractedData.uniform_items?.length > 0 && (
                <div className="inventory-section">
                  <h4>Uniform Items</h4>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Sr No</th>
                          <th>Item</th>
                          <th>Opening Balance</th>
                          <th>Clean Received</th>
                          <th>Total</th>
                          <th>Soil Sent</th>
                          <th>Closing Balance</th>
                          <th>Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extractedData.uniform_items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.sr_no || idx + 1}</td>
                            <td
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => handleCellEdit('uniform', idx, 'item', e.target.textContent)}
                            >
                              {item.item}
                            </td>
                            <td
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => handleCellEdit('uniform', idx, 'opening_balance', e.target.textContent)}
                            >
                              {item.opening_balance}
                            </td>
                            <td
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => handleCellEdit('uniform', idx, 'clean_received', e.target.textContent)}
                            >
                              {item.clean_received}
                            </td>
                            <td
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => handleCellEdit('uniform', idx, 'total', e.target.textContent)}
                            >
                              {item.total}
                            </td>
                            <td
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => handleCellEdit('uniform', idx, 'soil_sent', e.target.textContent)}
                            >
                              {item.soil_sent}
                            </td>
                            <td
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => handleCellEdit('uniform', idx, 'closing_balance', e.target.textContent)}
                            >
                              {item.closing_balance}
                            </td>
                            <td
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => handleCellEdit('uniform', idx, 'remark', e.target.textContent)}
                            >
                              {item.remark}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* No items message */}
              {(!extractedData.linen_items?.length && !extractedData.uniform_items?.length) && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <p>No linen/uniform items detected. Check the "Raw OCR Text" tab to see what was extracted.</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '10px' }}>You can manually add items or try with a clearer image.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'json' && (
            <div className="tab-content active">
              <h3 className="card-title">JSON Output</h3>
              <div style={{ marginBottom: '15px' }}>
                <button className="btn btn-secondary btn-sm" onClick={handleCopyJSON}>
                  Copy JSON
                </button>
                <button className="btn btn-sm" style={{ marginLeft: '10px' }} onClick={handleDownloadJSON}>
                  Download JSON
                </button>
                <button className="btn btn-orange btn-sm" style={{ marginLeft: '10px' }} onClick={handleDownloadExcel}>
                  Download CSV
                </button>
              </div>
              <pre className="json-output">{JSON.stringify(extractedData, null, 2)}</pre>
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="tab-content active">
              <h3 className="card-title">Raw OCR Text</h3>
              <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '15px' }}>
                This is the raw text extracted from the image by OCR.space
              </p>
              <pre className="json-output" style={{ whiteSpace: 'pre-wrap', color: '#e5e7eb' }}>
                {rawText || 'No text extracted'}
              </pre>
            </div>
          )}

          {activeTab === 'structured' && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button className="btn btn-orange" onClick={handleDownloadExcel}>
                Download CSV
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Upload;
