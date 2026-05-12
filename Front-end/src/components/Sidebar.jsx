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
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import { faAirbnb } from "@fortawesome/free-brands-svg-icons";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <ul>
        <li>
          <Link to="/dashboard" title="Dashboard"><FontAwesomeIcon icon={faHouse} /> <span>Dashboard</span></Link>
        </li>
        <li>
          <Link to="/mycourse" title="My Courses"><FontAwesomeIcon icon={faBook} /> <span>My Courses</span></Link>
        </li>
        <li>
          <Link to="/roadmap" title="Roadmap"><FontAwesomeIcon icon={faBookOpen} /> <span>Roadmap</span></Link>
        </li>
        <li>
          <Link to="/schedule" title="Schedule"><FontAwesomeIcon icon={faClock} /> <span>Schedule</span></Link>
        </li>
        <li>
          <Link to="/resources" title="Resources"><FontAwesomeIcon icon={faFolderOpen} /> <span>Resources</span></Link>
        </li>
        <li>
          <Link to="/assistant" title="AI Assistant"><FontAwesomeIcon icon={faAirbnb} /> <span>AI Assistant</span></Link>
        </li>
        <li>
          <Link to="/copilot" title="Study Copilot"><FontAwesomeIcon icon={faChartLine} /> <span>Study Copilot</span></Link>
        </li>
        
      
      </ul>
    </aside>
  );
};

export default Sidebar;
