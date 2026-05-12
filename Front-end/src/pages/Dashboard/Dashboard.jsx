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
  const [dailyPlan, setDailyPlan] = useState(null);
  const [streak, setStreak] = useState({ current_streak: 0, best_streak: 0 });
  const [lpSummary, setLpSummary] = useState(null);
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
        // Fetch daily plan + streak (authoritative for "Daily streak")
        try {
          const [planRes, streakRes] = await Promise.all([
            api.dailyPlan.getToday(),
            api.dailyPlan.getStreak(),
          ]);
          setDailyPlan(planRes.data?.data || planRes.data);
          const s = streakRes.data?.data || streakRes.data;
          setStreak({
            current_streak: s?.current_streak || 0,
            best_streak: s?.best_streak || 0,
          });
        } catch (e) {
          // daily plan is optional; keep dashboard usable
          setDailyPlan(null);
          setStreak({ current_streak: 0, best_streak: 0 });
        }

        // Fetch progress data (legacy shape in FE; backend currently returns weekly rows)
        // Keep as best-effort: use weekly completion_rate as overallProgress approximation.
        try {
          const response = await api.progress.getProgress();
          const progressRows = response.data?.data || response.data || [];
          const first = Array.isArray(progressRows) ? progressRows[0] : null;
          const overallProgress = first?.progress || 0;
          setDashboardData((prev) => ({
            ...prev,
            overallProgress,
            dailyStreak: streak?.current_streak || 0,
          }));
        } catch {
          setDashboardData((prev) => ({ ...prev, overallProgress: 0, dailyStreak: streak?.current_streak || 0 }));
        }

        // Fetch learning path summary (next milestone)
        try {
          const lpRes = await api.learningPath.get();
          const payload = lpRes.data?.data || lpRes.data;
          const lp = payload?.learning_path?.learning_path || payload?.learning_path;
          const milestones = lp?.milestones || [];
          const idx = Number(payload?.progress?.current_milestone_index || 0);
          const next = milestones[idx] || null;
          setLpSummary({ next, idx, total: milestones.length });
        } catch {
          setLpSummary(null);
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

  const completedTaskIds = new Set(dailyPlan?.completed_task_ids || []);
  const onCompleteDailyTask = async (task) => {
    try {
      const res = await api.dailyPlan.completeTask(task.id, dailyPlan?.plan_date);
      setDailyPlan(res.data?.data || res.data);
      const streakRes = await api.dailyPlan.getStreak();
      const s = streakRes.data?.data || streakRes.data;
      setStreak({ current_streak: s?.current_streak || 0, best_streak: s?.best_streak || 0 });
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to complete task');
    }
  };

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
              <span className="streak-number">{streak.current_streak}</span>
              <div style={{ marginTop: 6, color: '#6b7280', fontSize: 12 }}>
                Best: {streak.best_streak}
              </div>
            </div>
          </section>

          {dailyPlan?.tasks && Array.isArray(dailyPlan.tasks) && (
            <section className="daily-plan">
              <div className="daily-plan-header">
                <h2>Today’s plan</h2>
                <span className="daily-plan-date">{dailyPlan.plan_date}</span>
              </div>
              <div className="daily-plan-list">
                {dailyPlan.tasks.map((t) => {
                  const done = completedTaskIds.has(t.id);
                  return (
                    <div key={t.id} className={`daily-task ${done ? 'daily-task--done' : ''}`}>
                      <div className="daily-task-main">
                        <div className="daily-task-title">{t.title}</div>
                        <div className="daily-task-meta">
                          {t.est_minutes ? `${t.est_minutes} min` : null}
                          {t.skill ? ` • ${t.skill}` : null}
                        </div>
                        {t.note && <div className="daily-task-note">{t.note}</div>}
                        {t.prompt_suggestion && (
                          <div className="daily-task-note">
                            Suggestion: <em>{t.prompt_suggestion}</em>
                          </div>
                        )}
                      </div>
                      <button
                        className="daily-task-btn"
                        onClick={() => onCompleteDailyTask(t)}
                        disabled={done}
                      >
                        {done ? 'Done' : 'Mark done'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {lpSummary?.next && (
            <section className="daily-plan">
              <div className="daily-plan-header">
                <h2>Next milestone</h2>
                <span className="daily-plan-date">
                  {lpSummary.idx + 1}/{lpSummary.total}
                </span>
              </div>
              <div className="daily-task">
                <div className="daily-task-main">
                  <div className="daily-task-title">{lpSummary.next.band || 'Milestone'}</div>
                  <div className="daily-task-meta">
                    {(lpSummary.next.focus_skills || []).slice(0, 4).join(', ')}
                  </div>
                </div>
                <button className="daily-task-btn" onClick={() => navigate('/roadmap')}>
                  View roadmap
                </button>
              </div>
            </section>
          )}
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
