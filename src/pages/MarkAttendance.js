import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { employeesAPI, attendanceAPI } from '../services/api';

const MarkAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const response = await employeesAPI.getAll({ status: 'active' });
      const emps = response.data.employees || [];
      setEmployees(emps);

      // Initialize attendance state
      const attObj = {};
      emps.forEach((emp) => {
        attObj[emp.id] = null;
      });
      setAttendance(attObj);
    } catch (error) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleStatusChange = (empId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [empId]: prev[empId] === status ? null : status,
    }));
  };

  const markAllEmployees = (status) => {
    const newAttendance = {};
    employees.forEach((emp) => {
      newAttendance[emp.id] = status;
    });
    setAttendance(newAttendance);
  };

  const handleSave = async () => {
    const records = Object.entries(attendance)
      .filter(([, status]) => status !== null)
      .map(([empId, status]) => ({
        employee_id: empId,
        date,
        status,
      }));

    if (records.length === 0) {
      toast.warning('Please mark attendance for at least one employee');
      return;
    }

    setSaving(true);
    try {
      await attendanceAPI.bulkCreate({ records });
      toast.success(`Attendance saved for ${records.length} employees`);
    } catch (error) {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
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

  const presentCount = Object.values(attendance).filter((s) => s === 'Present').length;
  const absentCount = Object.values(attendance).filter((s) => s === 'Absent').length;
  const unmarkedCount = employees.length - presentCount - absentCount;

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Mark Attendance</h1>
        <p className="page-subtitle">Mark daily attendance for all employees</p>
      </div>

      <div className="quick-attendance-container">
        {/* Header with Date and Actions */}
        <div className="quick-att-header">
          <div className="quick-att-date">
            <label>Select Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="quick-att-actions">
            <button className="btn-mark-all present" onClick={() => markAllEmployees('Present')}>
              <span>✅</span> Mark All Present
            </button>
            <button className="btn-mark-all absent" onClick={() => markAllEmployees('Absent')}>
              <span>❌</span> Mark All Absent
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="quick-att-summary">
          <div className="summary-card total">
            <span className="summary-value">{employees.length}</span>
            <span className="summary-label">Total Employees</span>
          </div>
          <div className="summary-card present">
            <span className="summary-value">{presentCount}</span>
            <span className="summary-label">Present</span>
          </div>
          <div className="summary-card absent">
            <span className="summary-value">{absentCount}</span>
            <span className="summary-label">Absent</span>
          </div>
          <div className="summary-card unmarked">
            <span className="summary-value">{unmarkedCount}</span>
            <span className="summary-label">Unmarked</span>
          </div>
        </div>

        {/* Employee List */}
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading employees...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="no-employees-msg">
            <div className="icon">👥</div>
            <p>No active employees found</p>
          </div>
        ) : (
          <div className="employee-att-list">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className={`employee-att-card ${
                  attendance[emp.id] === 'Present'
                    ? 'marked-present'
                    : attendance[emp.id] === 'Absent'
                    ? 'marked-absent'
                    : ''
                }`}
              >
                <div className="emp-att-info">
                  <div className="emp-att-avatar">{getInitials(emp.fullname)}</div>
                  <div className="emp-att-details">
                    <h4>{emp.fullname}</h4>
                    <p>
                      {emp.id} • {emp.department || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="emp-att-status">
                  <button
                    className={`status-toggle present-btn ${
                      attendance[emp.id] === 'Present' ? 'active' : ''
                    }`}
                    onClick={() => handleStatusChange(emp.id, 'Present')}
                  >
                    Present
                  </button>
                  <button
                    className={`status-toggle absent-btn ${
                      attendance[emp.id] === 'Absent' ? 'active' : ''
                    }`}
                    onClick={() => handleStatusChange(emp.id, 'Absent')}
                  >
                    Absent
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Save Button */}
        <button
          className="btn-save-attendance"
          onClick={handleSave}
          disabled={saving || presentCount + absentCount === 0}
        >
          <span>💾</span> {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>
    </div>
  );
};

export default MarkAttendance;
