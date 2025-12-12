import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Sidebar = () => {
  const { user, logout } = useApp();

  const menuItems = [
    {
      section: 'OCR & Extraction',
      items: [
        { path: '/upload', icon: '📤', label: 'Upload & Extract' },
        { path: '/history', icon: '📋', label: 'List View' },
        { path: '/hotels', icon: '🏨', label: 'Manage Hotels' },
      ],
    },
    {
      section: 'Employee Management',
      items: [
        { path: '/add-employee', icon: '👤', label: 'Add Employee' },
        { path: '/employees', icon: '👥', label: 'All Employees' },
        { path: '/mark-attendance', icon: '📅', label: 'Mark Attendance' },
        { path: '/attendance-list', icon: '📋', label: 'All Attendance' },
        { path: '/salary', icon: '💰', label: 'Salary Generate' },
      ],
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2><span>🧺</span> Laundry MS</h2>
      </div>
      <nav className="sidebar-menu">
        {menuItems.map((section, idx) => (
          <div className="sidebar-section" key={idx}>
            <div className="sidebar-section-title">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                <span className="sidebar-item-text">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="user-info">
        <span>Welcome, {user?.username || 'User'}</span>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
