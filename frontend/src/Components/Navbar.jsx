import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../CSS/Navbar.css";
import { FaUserCircle } from "react-icons/fa";

const Navbar = ({ isAuthenticated, setIsAuthenticated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

const handleLogout = () => {
  setIsAuthenticated(false);
  navigate("/"); // ✅ Logout hone ke baad bas Home pe bhej do
};


  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header>
      <Link to="/" className="logo">Pitch Pilot</Link>
      <button className="mobile-menu-btn">☰</button>

      <nav>
        <ul>
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
      </nav>

      <div className="header-actions" ref={menuRef}>
        {isAuthenticated && (
          <Link to="/canvas" className="header-btn get-started-header">
            Pitch Deploy
          </Link>
        )}

        {/* 🔹 Account Menu */}
        <div className="user-menu">
          <FaUserCircle
            className="user-icon"
            onClick={() => setIsOpen(!isOpen)}
          />
          {isOpen && (
            <div className="dropdown-menu">
              {!isAuthenticated ? (
                <>
                  <Link to="/login">Sign In</Link>
                  <Link to="/signup">Sign Up</Link>
                </>
              ) : (
                <>
                  <Link to="/profile">Profile</Link>
                  <button className="logout-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
