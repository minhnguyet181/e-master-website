// File: src/components/Sidebar.jsx
import React from "react";
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faBook,
  faBookOpen,
  faSpinner,
  faClock,
  faFolderOpen,
} from "@fortawesome/free-solid-svg-icons";
import { faAirbnb } from "@fortawesome/free-brands-svg-icons";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <ul>
        <li>
          <Link to="/dashboard"><FontAwesomeIcon icon={faHouse} /> <span>Dashboard</span></Link>
        </li>
        <li>
          <Link to="/mycourse"><FontAwesomeIcon icon={faBook} /> <span>My Courses</span></Link>
        </li>
        <li>
          <Link to="/roadmap"><FontAwesomeIcon icon={faBookOpen} /> <span>Roadmap</span></Link>
        </li>
        <li>
          <Link to="/schedule"><FontAwesomeIcon icon={faClock} /> <span>Schedule</span></Link>
        </li>
        <li>
          <Link to="/resources"><FontAwesomeIcon icon={faFolderOpen} /> <span>Resources</span></Link>
        </li>
        <li>
          <Link to="/assistant"><FontAwesomeIcon icon={faAirbnb} /> <span>AI Assistant</span></Link>
        </li>
        
      
      </ul>
    </aside>
  );
};

export default Sidebar;
