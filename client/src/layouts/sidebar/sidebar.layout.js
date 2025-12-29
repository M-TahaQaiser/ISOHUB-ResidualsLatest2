import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './sidebar.layout.css';
import { FaHome, FaFileAlt, FaChevronDown, FaCog, FaUserTie } from 'react-icons/fa';
import { AiFillDashboard } from "react-icons/ai";

const Sidebar = ({ username, isAdmin, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false); // State for reports dropdown
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  
  const location = useLocation(); // Get the current location

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'dark' : 'dark'));
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleReportsDropdown = () => {
    setIsReportsOpen(!isReportsOpen);
  };

  // Close the mobile menu when the location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <>
      <div className={`sidebar bg-zinc-900 shadow-lg  border-r border-yellow-400/20 overflow-hidden  ${isMobileMenuOpen ? 'open' : ''} ${isHovered ? 'hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="logo p-6 border-b border-yellow-400/20">
          <Link className='text-yellow-400' to="/" onClick={toggleMobileMenu}>
            Tracer
          </Link>
        </div>
        <nav className="nav px-4 py-6">
          <Link to="/admin-dashboard" onClick={toggleMobileMenu} className='group flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:text-yellow-400 hover:border-l-4 hover:border-yellow-400 relative'>
            <AiFillDashboard className="nav-icon lucide lucide-file-text h-5 w-5  text-gray-400 group-hover:text-yellow-400" />
            <span className="nav-text">Dash</span>
          </Link>
          {/* Add Agents Nav Item 
          <Link to="/merchants" onClick={toggleMobileMenu}>
            <FaUserTie className="nav-icon" />
            <span className="nav-text">Merchants</span>
          </Link>*/}
          {/* Add Merchants Nav Item */}
          <Link to="/agents" onClick={toggleMobileMenu} className='group flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:text-yellow-400 hover:border-l-4 hover:border-yellow-400 relative'>
            <FaUserTie className="nav-icon lucide lucide-file-text h-5 w-5  text-gray-400 group-hover:text-yellow-400" />
            <span className="nav-text">Agents</span>
          </Link>
          <Link to="/reports/all" onClick={toggleMobileMenu} className='group flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:text-yellow-400 hover:border-l-4 hover:border-yellow-400 relative'>
            <FaFileAlt className="nav-icon lucide lucide-file-text h-5 w-5  text-gray-400 group-hover:text-yellow-400" />
            <span className="nav-text">Reports</span>
          </Link>
          {/*}
          <div className="dropdown" onClick={toggleReportsDropdown}>
            <div className="dropdown-toggle">
              <FaFileAlt className="nav-icon" />
              <span className="nav-text">Reports</span>
              <FaChevronDown className={`chevron ${isReportsOpen ? 'open' : ''}`} />
            </div>
            {isReportsOpen && (
              <div className="dropdown-menu">
                <Link to="/reports/billing" className="dropdown-item">
                  Billing Reports
                </Link>
                <Link to="/reports/ar" className="dropdown-item">
                  AR Reports
                </Link>
                <Link to="/reports/processor" className="dropdown-item">
                  Processor Reports
                </Link>
              </div>
            )}
          </div>
              */}
        </nav>
        <div className="sidebar-footer">
          {username ? (
            <>
              <div className="profile-section">
                <Link to={`/user-settings/${username}`} className="connected profile-link text-sm font-medium text-gray-300">
                  <div className="wallet-info">
                    <FaCog className="settings-icon text-gray-400" />
                    <span >{username}</span>
                  </div>
                </Link>
              </div>
              <button onClick={onLogout} className="logout-button  w-[90%] bg-yellow-400 rounded py-3 font-semibold uppercase flex items-center justify-center hover:bg-yellow-600 gap-2 text-black">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="pill-button">
              Login
            </Link>
          )}
         {/* <div className="theme-toggle-container">
            <label className="switch">
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={toggleTheme}
              />
              <span className="slider round"></span>
            </label>
            <span className="theme-label">Dark Mode</span>
          </div>*/}
        </div>
        
        {isMobileMenuOpen && <div className="overlay show" onClick={toggleMobileMenu}></div>}
      </div>
      <div className="hamburger" onClick={toggleMobileMenu}>
        <div className="line"></div>
        <div className="line"></div>
        <div className="line"></div>
      </div>
    </>
  );
};

export default Sidebar;
