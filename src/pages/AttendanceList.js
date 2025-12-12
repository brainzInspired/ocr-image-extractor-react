import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { employeesAPI, attendanceAPI } from '../services/api';

const AttendanceList = () => {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    from_date: '',
    to_date: '',
    employee_id: '',
    status: '',
  });

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await employeesAPI.getAll({});
      setEmployees(response.data.employees || []);
    } catch (error) {
      console.error('Failed to fetch employees');
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.from_date) params.from_date = filters.from_date;
      if (filters.to_date) params.to_date = filters.to_date;
      if (filters.employee_id) params.employee_id = filters.employee_id;
      if (filters.status) params.status = filters.status;

      const response = await attendanceAPI.getAll(params);
      setAttendance(response.data.attendance || []);
    } catch (error) {
      toast.error('Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    fetchAttendance();
  };

  const handleExport = () => {
    attendanceAPI.export(filters);
    toast.success('Export started');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      await attendanceAPI.delete(id);
      toast.success('Attendance record deleted');
      fetchAttendance();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find((e) => e.id === empId);
    return emp?.fullname || empId;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDayName = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { weekday: 'short' });
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      Present: 'present',
      Absent: 'absent',
      Late: 'late',
      Leave: 'leave',
      'Half-Day': 'half-day',
    };
    return statusMap[status] || '';
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Attendance Records</h1>
        <p className="page-subtitle">View and export monthly attendance data</p>
      </div>

      {/* Filters */}
      <div className="attendance-toolbar">
        <div className="filter-row">
          <div className="filter-item">
            <label>From Date</label>
            <input
              type="date"
              name="from_date"
              value={filters.from_date}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-item">
            <label>To Date</label>
            <input
              type="date"
              name="to_date"
              value={filters.to_date}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-item">
            <label>Employee</label>
            <select name="employee_id" value={filters.employee_id} onChange={handleFilterChange}>
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullname}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label>Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All Status</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Half-Day">Half-Day</option>
              <option value="Leave">Leave</option>
              <option value="Late">Late</option>
            </select>
          </div>
        </div>
        <div className="filter-actions">
          <button className="btn-filter" onClick={handleSearch}>
            <span>🔍</span> Search
          </button>
          <button className="btn-export" onClick={handleExport}>
            <span>📥</span> Download Excel
          </button>
        </div>
      </div>

      {/* Count */}
      <div className="attendance-count">
        {loading ? 'Loading...' : `${attendance.length} records found`}
      </div>

      {/* Attendance Table */}
      <div className="attendance-table-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading attendance records...</p>
          </div>
        ) : (
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    {filters.from_date || filters.to_date
                      ? 'No records found for the selected filters'
                      : 'Select date range and click Search to view records'}
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record.id}>
                    <td>{formatDate(record.date)}</td>
                    <td>{getDayName(record.date)}</td>
                    <td>{record.employee_id}</td>
                    <td>{getEmployeeName(record.employee_id)}</td>
                    <td>{record.check_in || '-'}</td>
                    <td>{record.check_out || '-'}</td>
                    <td>{record.hours || '-'}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="att-action-btn delete"
                        onClick={() => handleDelete(record.id)}
                        title="Delete"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AttendanceList;
