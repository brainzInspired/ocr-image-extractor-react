import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { employeesAPI } from '../services/api';
import Modal from '../components/Modal';

const Employees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewModal, setViewModal] = useState({ open: false, employee: null });

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (deptFilter) params.department = deptFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await employeesAPI.getAll(params);
      setEmployees(response.data.employees || []);
    } catch (error) {
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, deptFilter, statusFilter]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete employee "${name}"?`)) return;

    try {
      await employeesAPI.delete(id);
      toast.success('Employee deleted successfully');
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to delete employee');
    }
  };

  const handleView = async (id) => {
    try {
      const response = await employeesAPI.getById(id);
      setViewModal({ open: true, employee: response.data });
    } catch (error) {
      toast.error('Failed to load employee details');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'NA';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">All Employees</h1>
        <p className="page-subtitle">View and manage all employees</p>
      </div>

      {/* Toolbar */}
      <div className="employee-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, ID, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            <option value="Washing">Washing</option>
            <option value="Ironing">Ironing</option>
            <option value="Packing">Packing</option>
            <option value="Delivery">Delivery</option>
            <option value="Reception">Reception</option>
            <option value="Management">Management</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button className="btn-add-employee" onClick={() => navigate('/add-employee')}>
          <span>+</span> Add Employee
        </button>
      </div>

      {/* Employee Count */}
      <div className="employee-count">
        {loading ? 'Loading employees...' : `${employees.length} employees found`}
      </div>

      {/* Employee List */}
      <div className="employee-list-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading employees...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="no-employees">
            <div className="no-employees-icon">👥</div>
            <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>No employees found</p>
            <p style={{ fontSize: '0.9rem' }}>Add your first employee to get started</p>
          </div>
        ) : (
          employees.map((emp) => (
            <div key={emp.id} className="employee-card">
              <div className="emp-avatar">{getInitials(emp.fullname)}</div>
              <div className="emp-info">
                <div className="emp-name">
                  {emp.fullname}
                  <span className={`emp-status ${emp.status || 'active'}`}>
                    {(emp.status || 'active').toUpperCase()}
                  </span>
                </div>
                <div className="emp-details">
                  <span className="emp-detail-item">
                    <span>🆔</span> {emp.id}
                  </span>
                  <span className="emp-detail-item">
                    <span>📞</span> {emp.mobile || 'N/A'}
                  </span>
                  <span className="emp-detail-item">
                    <span>🏢</span> {emp.department || 'N/A'}
                  </span>
                  <span className="emp-detail-item">
                    <span>👔</span> {emp.job_role || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="emp-actions">
                <button className="emp-action-btn view" onClick={() => handleView(emp.id)} title="View Details">
                  👁
                </button>
                <button className="emp-action-btn edit" onClick={() => navigate(`/edit-employee/${emp.id}`)} title="Edit">
                  ✏️
                </button>
                <button className="emp-action-btn delete" onClick={() => handleDelete(emp.id, emp.fullname)} title="Delete">
                  🗑
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Employee Modal */}
      <Modal
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, employee: null })}
        title="Employee Details"
      >
        {viewModal.employee && (
          <div>
            {/* Basic Info */}
            <div className="detail-section">
              <div className="detail-section-title">Basic Information</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Employee ID</span>
                  <span className="detail-value">{viewModal.employee.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{viewModal.employee.fullname}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Gender</span>
                  <span className="detail-value">{viewModal.employee.gender || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date of Birth</span>
                  <span className="detail-value">{viewModal.employee.dob || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Mobile</span>
                  <span className="detail-value">{viewModal.employee.mobile || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{viewModal.employee.email || '-'}</span>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="detail-section">
              <div className="detail-section-title">Job Details</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Job Role</span>
                  <span className="detail-value">{viewModal.employee.job_role || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Department</span>
                  <span className="detail-value">{viewModal.employee.department || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Work Shift</span>
                  <span className="detail-value">{viewModal.employee.shift || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date of Joining</span>
                  <span className="detail-value">{viewModal.employee.doj || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Experience</span>
                  <span className="detail-value">{viewModal.employee.experience ? `${viewModal.employee.experience} years` : '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Employee Type</span>
                  <span className="detail-value">{viewModal.employee.employee_type || '-'}</span>
                </div>
              </div>
            </div>

            {/* Salary Details */}
            <div className="detail-section">
              <div className="detail-section-title">Salary & Bank Details</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Salary</span>
                  <span className="detail-value">
                    {viewModal.employee.salary ? `₹${Number(viewModal.employee.salary).toLocaleString()}` : '-'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Payment Mode</span>
                  <span className="detail-value">{viewModal.employee.payment_mode || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Bank Name</span>
                  <span className="detail-value">{viewModal.employee.bank_name || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Account No</span>
                  <span className="detail-value">{viewModal.employee.account_no || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Employees;
