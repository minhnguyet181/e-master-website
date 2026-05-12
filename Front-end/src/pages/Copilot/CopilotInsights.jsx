import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import api from '../../api/api';
import './CopilotInsights.css';

function RiskBadge({ risk }) {
  const level = String(risk || 'unknown').toLowerCase();
  return <span className={`risk-badge risk-${level}`}>{level.toUpperCase()}</span>;
}

export default function CopilotInsights() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchInsights = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.copilot.getInsights();
        setInsights(response.data || response);
      } catch (err) {
        const status = err.response?.status;
        const serverMessage = String(err.response?.data?.message || '');
        const shouldForceLogin =
          status === 401 ||
          (status === 403 && /invalid|expired|token/i.test(serverMessage));

        if (shouldForceLogin) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        setError(serverMessage || 'Unable to load Copilot insights.');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [navigate]);

  const forecast = insights?.forecast || {};
  const skillSummary = insights?.skill_summary || [];
  const nextActions = insights?.next_actions || [];
  const engagement = insights?.engagement || {};

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-content">
        <Sidebar />
        <main className="dashboard-main">
          <div className="copilot-card">
            <section className="copilot-header">
              <div>
                <h1>Study Copilot Insights</h1>
                <p>Forecast your band growth and get your highest-priority next actions.</p>
              </div>
              <RiskBadge risk={forecast.risk_level} />
            </section>

            {loading ? (
              <div className="copilot-state">Loading insights...</div>
            ) : error ? (
              <div className="copilot-error">{error}</div>
            ) : (
              <>
                <section className="copilot-grid">
                  <article className="copilot-metric">
                    <h3>Estimated Overall Band</h3>
                    <p>{forecast.estimated_overall_band ?? 0}</p>
                  </article>
                  <article className="copilot-metric">
                    <h3>Projected Band (4 weeks)</h3>
                    <p>{forecast.projected_band_4w ?? 0}</p>
                  </article>
                  <article className="copilot-metric">
                    <h3>Projected Band (8 weeks)</h3>
                    <p>{forecast.projected_band_8w ?? 0}</p>
                  </article>
                  <article className="copilot-metric">
                    <h3>4-week Completion</h3>
                    <p>{engagement.completion_rate_4w ?? 0}%</p>
                  </article>
                </section>

                <section className="copilot-section">
                  <h2>Skill Summary</h2>
                  <div className="copilot-table">
                    <div className="copilot-row copilot-head">
                      <span>Skill</span>
                      <span>Attempts</span>
                      <span>Estimated Band</span>
                      <span>Trend</span>
                    </div>
                    {skillSummary.map((skill) => (
                      <div className="copilot-row" key={skill.skill}>
                        <span>{skill.skill}</span>
                        <span>{skill.attempts}</span>
                        <span>{skill.estimated_band}</span>
                        <span>{skill.trend}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="copilot-section">
                  <h2>Next Best Actions</h2>
                  <div className="action-list">
                    {nextActions.map((action, idx) => (
                      <article className="action-card" key={`${action.type}-${idx}`}>
                        <div className="action-top">
                          <strong>{action.type}</strong>
                          <span className={`priority-${action.priority || 'medium'}`}>
                            {(action.priority || 'medium').toUpperCase()}
                          </span>
                        </div>
                        <p>{action.message}</p>
                        {Array.isArray(action.resources) && action.resources.length > 0 && (
                          <ul>
                            {action.resources.map((resource) => (
                              <li key={resource.id}>{resource.title}</li>
                            ))}
                          </ul>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
