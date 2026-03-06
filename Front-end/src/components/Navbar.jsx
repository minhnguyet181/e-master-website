// File: src/components/Navbar.jsx
import React from "react";
import { FaBell, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { Link } from 'react-router-dom';
import "./Navbar.css";


const Navbar = () => {
  return (
    <header className="navbar">
      {/* Logo và thương hiệu */}
      <div className="navbar-left">
        <Link to="/landing" className="navbar-home-link">
          {/* apply both sets of classes so homepage/landing styles (logo-img/logo-text) and navbar styles both apply */}
          <img src="/assets/images/Logo.png" alt="Logo" className="logo-img navbar-logo" />
          <span className="logo-text navbar-brand">E-Master</span>
        </Link>
      </div>

      {/* Menu giữa */}
      <div className="navbar-center">
        <select className="exam-select">
          <option>IELTS</option>
          <option>TOEIC</option>
        </select>
       <Link to="/building-roadmap" className="nav-link">Building a road map</Link>
        {/* <Link to="/input-testing" className="nav-link">Input Testing</Link> */}
        <Link to="/input-testing" className="nav-link">Input Testing</Link>
        <Link to="/practice-test" className="nav-link">PracticeTest</Link>
      </div>

      {/* Nút bên phải */}
      <div className="navbar-right">
        <FaBell className="icon bell" />
        {/* Click vào avatar trong header sẽ điều hướng tới /profile */}
        <Link to="/profile" className="nav-avatar-link" aria-label="Open profile">
          <FaUserCircle className="icon user" />
        </Link>
        <Link to="/logout" className="nav-logout-link" aria-label="Logout">
          <FaSignOutAlt className="icon menu" />
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
