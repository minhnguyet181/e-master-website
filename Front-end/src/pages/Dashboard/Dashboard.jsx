import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar'; 
import Sidebar from '../../components/Sidebar'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone
} from '@fortawesome/free-solid-svg-icons';
import api from '../../api/api';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    overallProgress: 0,
    dailyStreak: 0,
    skills: {
      listening: 0,
      reading: 0,
      writing: 0,
      speaking: 0
    }
  });
  const [page, setPage] = useState(1);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      setError('');
      try {
        // Fetch progress data
        const response = await api.progress.getProgress();
        const progressResult = response.data || response;
        
        if (progressResult && progressResult.data) {
          setDashboardData({
            overallProgress: progressResult.data.overallProgress || 0,
            dailyStreak: progressResult.data.dailyStreak || 0,
            skills: progressResult.data.skills || {
              listening: 0,
              reading: 0,
              writing: 0,
              speaking: 0
            }
          });
          
          // Set courses from progress data
          if (progressResult.data.courses && Array.isArray(progressResult.data.courses)) {
            setCourses(progressResult.data.courses);
          }
        } else {
          // Fallback to default data if endpoint not ready
          setDashboardData({
            overallProgress: 0,
            dailyStreak: 0,
            skills: { listening: 0, reading: 0, writing: 0, speaking: 0 }
          });
          setCourses([]);
          setError('Dashboard data unavailable. Make sure you are logged in.');
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        // Check if it's an authentication error
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          navigate('/login');
        } else if (err.response?.status === 404) {
          // Backend endpoint not implemented yet - use default data
          setError('Dashboard data not available yet.');
        } else {
          setError('Error loading dashboard. Please refresh the page.');
        }
        // Set default data so page doesn't break
        setDashboardData({
          overallProgress: 0,
          dailyStreak: 0,
          skills: { listening: 0, reading: 0, writing: 0, speaking: 0 }
        });
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const handleLoadMore = useCallback(() => {
    setPage(prev => prev + 1);
    // Backend sẽ handle pagination
  }, []);

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-content">
        <Sidebar />
        <main className="dashboard-main">
          <div className="dashboard-card">
          {/* Dashboard Header */}
          <section className="dashboard-header">
            <div className="header-left">
              <h1>Dashboard</h1>
              <p>Track your learning journey with detailed stats and insights.</p>
            </div>
            <div className="header-right">
              <div className="learn-circle">
                <span className="learn-btn">LEARN</span>
              </div>
            </div>
          </section>

          {error && <div style={{color: '#d32f2f', marginBottom: '1rem', padding: '1rem', backgroundColor: '#ffebee', borderRadius: '4px'}}>{error}</div>}
          
          {loading ? (
            <div style={{textAlign: 'center', padding: '2rem'}}>Loading dashboard...</div>
          ) : (
            <>
          {/* Progress Summary */}
          <section className="progress-summary">
            <div className="course-progress-card">
              <h3>Overall Progress</h3>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${dashboardData.overallProgress}%` }}></div>
              </div>
              <span className="progress-percent">{dashboardData.overallProgress}%</span>
            </div>
            <div className="daily-streak-card">
              <div className="streak-icon">⚡</div>
              <h3>Daily streak</h3>
              <span className="streak-number">{dashboardData.dailyStreak}</span>
            </div>
          </section>
          {/* Courses List */}
          <section className="courses-section">
            <div className="courses-list">
              {courses.length > 0 ? (
                courses.map(course => (
                  <div key={course.id} className={`course-card ${course.status === 'Complete' ? 'complete' : ''}`}>
                    <div className="course-info">
                      <div className="course-icon">
                        <FontAwesomeIcon icon={faMicrophone} />
                      </div>
                      <div className="course-details">
                        <h4>Course</h4>
                        <p>{course.title || course.name}</p>
                        <div className="course-progress-bar">
                          <div className="progress-fill" style={{ width: `${course.progress}%` }}></div>
                        </div>
                        <span className="course-percent">{course.progress}%</span>
                        {course.status && <span className="status complete">✓ Complete</span>}
                      </div>
                    </div>
                    <button className="continue-btn">Continue</button>
                  </div>
                ))
              ) : (
                <div style={{textAlign: 'center', padding: '2rem', color: '#999'}}>No courses assigned yet</div>
              )}
            </div>
            {courses.length > 0 && <button className="load-more-btn" onClick={handleLoadMore}>Load more</button>}
          </section>
          {/* Skills Breakdown */}
          <section className="skills-breakdown">
            <h2>Skills breakdown</h2>
            <div className="skills-grid">
              <div className="skill-item listening">
                <h3>LISTENING</h3>
                <div className="circular-progress" style={{ background: `conic-gradient(#EF4444 ${dashboardData.skills.listening}%, #e5e7eb 0)` }}>
                  <div className="progress-inner"></div>
                </div>
                <span className="skill-percent">{dashboardData.skills.listening}%</span>
              </div>
              <div className="skill-item speaking">
                <h3>SPEAKING</h3>
                <div className="circular-progress" style={{ background: `conic-gradient(#34D399 ${dashboardData.skills.speaking}%, #e5e7eb 0)` }}>
                  <div className="progress-inner"></div>
                </div>
                <span className="skill-percent">{dashboardData.skills.speaking}%</span>
              </div>
              <div className="skill-item reading">
                <h3>READING</h3>
                <div className="circular-progress" style={{ background: `conic-gradient(#3B82F6 ${dashboardData.skills.reading}%, #e5e7eb 0)` }}>
                  <div className="progress-inner"></div>
                </div>
                <span className="skill-percent">{dashboardData.skills.reading}%</span>
              </div>
              <div className="skill-item writing">
                <h3>WRITING</h3>
                <div className="circular-progress" style={{ background: `conic-gradient(#F59E0B ${dashboardData.skills.writing}%, #e5e7eb 0)` }}>
                  <div className="progress-inner"></div>
                </div>
                <span className="skill-percent">{dashboardData.skills.writing}%</span>
              </div>
            </div>
          </section>
            </>
          )}
        </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
