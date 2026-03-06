import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Homepage from '../pages/Homepage/Homepage.jsx';
import Login from '../pages/Login/Login.jsx';
import Signup from '../pages/Sign up/Signup.jsx';
import Dashboard from '../pages/Dashboard/Dashboard.jsx';
import AIChat from '../pages/AIChat/AIChat.jsx';
import InputTesting from '../pages/InputTesting/InputTesting.jsx';
import Roadmap from '../pages/Roadmap/Roadmap.jsx';
import MyCourse from '../pages/MyCourse/MyCourse.jsx';
import Landingpage from '../pages/LandingPage/LandingPage.jsx';
import Resources from '../pages/Resources/Resource.jsx';
import BuildingRoadmap from '../pages/BuildingRoadMap/BuildingRoadMap.jsx';
import Schedule from "../pages/Schedule/Schedule.jsx";
import Onboarding from '../pages/Onboarding/Onboarding.jsx';
import Profile from '../pages/Profile/Profile.jsx';
import Logout from '../pages/Logout/Logout.jsx';
import LogoutSuccess from '../pages/Logout/LogoutSuccess.jsx';
import PracticeTest from '../pages/PracticeTest/PracticeTest.jsx';


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/landing" element={<Landingpage />} />
      <Route path="/building-roadmap" element={<BuildingRoadmap />} />
      <Route path="/roadmap" element={<Roadmap />} />
      <Route path="/resources" element={<Resources />} />
      <Route path="/mycourse" element={<MyCourse />} />
      <Route path="/assistant" element={<AIChat />} />
      <Route path="/input-testing" element={<InputTesting />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/user/generate-plan" element={<Onboarding />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/logout/success" element={<LogoutSuccess />} />
      <Route path="/practice-test" element={<PracticeTest />} />

    </Routes>
  );
}