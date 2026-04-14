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
import AdminUpload from '../pages/AdminUpload/AdminUpload.jsx';
import AdminDashboard from '../pages/Admin/AdminDashboard.jsx';
import AdminStudyMaterials from '../pages/Admin/AdminStudyMaterials.jsx';
import AdminTips from '../pages/Admin/AdminTips.jsx';
import AdminTests from '../pages/Admin/AdminTests.jsx';
import AdminPractice from '../pages/Admin/AdminPractice.jsx';
import AdminBookImport from '../pages/Admin/AdminBookImport.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Homepage />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/landing" element={<Landingpage />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/logout/success" element={<LogoutSuccess />} />

      {/* User routes */}
      <Route path="/dashboard" element={<ProtectedRoute forbidAdmin><Dashboard /></ProtectedRoute>} />
      <Route path="/building-roadmap" element={<ProtectedRoute forbidAdmin><BuildingRoadmap /></ProtectedRoute>} />
      <Route path="/roadmap" element={<ProtectedRoute forbidAdmin><Roadmap /></ProtectedRoute>} />
      <Route path="/resources" element={<ProtectedRoute forbidAdmin><Resources /></ProtectedRoute>} />
      <Route path="/mycourse" element={<ProtectedRoute forbidAdmin><MyCourse /></ProtectedRoute>} />
      <Route path="/assistant" element={<ProtectedRoute forbidAdmin><AIChat /></ProtectedRoute>} />
      <Route path="/input-testing" element={<ProtectedRoute forbidAdmin><InputTesting /></ProtectedRoute>} />
      <Route path="/practice-test" element={<ProtectedRoute forbidAdmin><InputTesting /></ProtectedRoute>} />
      <Route path="/schedule" element={<ProtectedRoute forbidAdmin><Schedule /></ProtectedRoute>} />
      <Route path="/user/generate-plan" element={<ProtectedRoute forbidAdmin><Onboarding /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute forbidAdmin><Profile /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/upload" element={<ProtectedRoute requireAdmin><AdminUpload /></ProtectedRoute>} />
      <Route path="/admin/resources" element={<ProtectedRoute requireAdmin><AdminStudyMaterials /></ProtectedRoute>} />
      <Route path="/admin/tips" element={<ProtectedRoute requireAdmin><AdminTips /></ProtectedRoute>} />
      <Route path="/admin/tests" element={<ProtectedRoute requireAdmin><AdminTests /></ProtectedRoute>} />
      <Route path="/admin/practice" element={<ProtectedRoute requireAdmin><AdminPractice /></ProtectedRoute>} />
      <Route path="/admin/import-book" element={<ProtectedRoute requireAdmin><AdminBookImport /></ProtectedRoute>} />
    </Routes>
  );
}