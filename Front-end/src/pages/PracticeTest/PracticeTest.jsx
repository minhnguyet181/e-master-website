import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import "./PracticeTest.css";

const skillData = [
  { id: "listening", title: "Listening", desc: "Sharpen your ears, master the meaning", img: "/assets/images/listening.jpg"},
  { id: "reading", title: "Reading", desc: "Develop reading comprehension skills",  img: "/assets/images/reading.jpg"},
  { id: "writing", title: "Writing", desc: "Write clearly, express confidently.", img: "/assets/images/writing.jpg" },
  { id: "speaking", title: "Speaking", desc: "Speak fluently, connect globally", img: "/assets/images/speaking.jpg" },
];

export default function PracticeTesting() {
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testsData, setTestsData] = useState({});
  const [testContent, setTestContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visibleExtra, setVisibleExtra] = useState(6);

  // Load tests.json
  useEffect(() => {
    const loadTests = async () => {
      try {
        const res = await fetch("/practicedata/practicetests.json");
        if (!res.ok) throw new Error("Failed to load practicetests.json");
        const data = await res.json();
        setTestsData(data);
      } catch (err) {
        console.error(err);
        setError("Cannot load test list.");
      }
    };
    loadTests();
  }, []);

  // Back button handling
  useEffect(() => {
    const handlePopState = () => {
      if (testContent) setTestContent(null);
      else if (selectedTest) setSelectedTest(null);
      else if (selectedSkill) setSelectedSkill(null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedSkill, selectedTest, testContent]);

  const handleSkillClick = (skill) => {
    setSelectedSkill(skill);
    setSelectedTest(null);
    setTestContent(null);
    setVisibleExtra(6);
    window.history.pushState({}, "", `#${skill}`);
  };

  const handleStartTest = async (test) => {
    setSelectedTest(test);
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/data/${test.file}`);
      if (!res.ok) throw new Error("Cannot load this test file.");
      const data = await res.json();
      setTestContent(data);
      window.history.pushState({}, "", `#${selectedSkill}-test-${test.id}`);
    } catch (err) {
      console.error(err);
      setError("Cannot load test content.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setVisibleExtra(prev => prev + 3);
  };

  return (
    <div className="practice-page">
      <Navbar />
      <Sidebar />

      <div className="practice-container">
        {/* --- Skill selection --- */}
        {!selectedSkill && !testContent && (
          <>
            <h1 className="practice-title">Practice Your IELTS Skills</h1>
            <div className="skill-grid">
              {skillData.map(s => (
                <div key={s.id} className="skill-card">
                  <img src={s.img} alt={s.title} className="skill-img" />
                  <h2>{s.title}</h2>
                  <p>{s.desc}</p>
                  <button className="view-btn" onClick={() => handleSkillClick(s.id)}>
                    Detail
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* --- Test list --- */}
        {selectedSkill && !testContent && (
          <>
            <h2 className="skill-header">{selectedSkill.toUpperCase()} TESTS</h2>
            {error && <p className="error">{error}</p>}

            <div className="test-grid">
              {testsData[selectedSkill]?.slice(0, visibleExtra).map(t => (
                <div key={t.id} className="test-card">
                  <h3>{t.name}</h3>
                  <p>{t.desc}</p>
                  <p className="duration">⏱ {t.duration || 60} minutes</p>
                  <button className="start-btn" onClick={() => handleStartTest(t)}>
                    Start Test
                  </button>
                </div>
              ))}
            </div>

            {visibleExtra < (testsData[selectedSkill]?.length || 0) && (
              <div className="center">
                <button className="view-btn" onClick={handleLoadMore}>
                  Load More
                </button>
              </div>
            )}
          </>
        )}

        {/* --- Test area --- */}
        {testContent && (
          <div className="test-area">
            <h2>{selectedTest.name}</h2>
            {loading ? <p>Loading test...</p> :
              error ? <p className="error">{error}</p> :
                <>
                  {testContent.questions?.map((q, index) => (
                    <div key={index} className="question-item">
                      <p><strong>Question {index + 1}:</strong> {q.question}</p>
                      <ul>
                        {q.options.map((opt, i) => (
                          <li key={i}>{opt}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </>
            }
            <button className="back-btn" onClick={() => setTestContent(null)}>
              ← Back to {selectedSkill}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
