import React, { useState, useEffect } from "react";
import "./InputTesting.css";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { FaRegSmileBeam, FaRegThumbsUp, FaRegSadTear } from "react-icons/fa";
import api from "../../api/api.js";
const InputTesting = () => {
  const [testsData, setTestsData] = useState({});
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testContent, setTestContent] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visibleExtra, setVisibleExtra] = useState(6);
 const [testList, setTestList] = useState(null);
//  const[testId, setTest] = useState(null);
  useEffect(() => {
    const loadTestsData = async () => {
      try {
        const res = await api.test.listTests();
        if (!res) throw new Error("Không thể tải file tests.json");
        const data = await res.json();
        setTestsData(data);
      } catch (err) {
        console.error("❌ Lỗi khi tải tests.json:", err);
        setError("Cannot load test.");
      }
    };
    loadTestsData();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (testContent) {
        setTestContent(null);
      } else if (selectedTest) {
        setSelectedTest(null);
      } else if (selectedSkill) {
        setSelectedSkill(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedSkill, selectedTest, testContent]);

  const handleSkillClick = async (skill) => {
    setSelectedSkill(skill);
    setTestContent(null);
    setUserAnswers({});
    setScore(null);
    setVisibleExtra(6);
    const response = await api.test.getTestsBySkill(skill); 
    setTestList(Array.isArray(response.data.data) ? response.data.data : []);
    window.history.pushState({}, "", `#${skill}`);
  };

  // ✅ Khi chọn test
  const handleStartTest = async (id) => {
    setSelectedTest(id);
    setLoading(true);
    setError("");
    setScore(null);
    setUserAnswers({});
    try {
      const res = await api.test.getTest(id);
      setTestContent(res.data.data);
    } catch (err) {
      console.error("❌ Lỗi khi tải test:", err);
      setError("Không thể tải nội dung test.");
      setTestContent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

const handleSubmit = async () => {
  if (!testContent?.questions) return;

  try {
    const res = await api.test.gradeTest({
      testId: selectedTest.id,
      userAnswers, // {0: 1, 1: 3, ...}
    });

    const { correct, total, score } = res.data.data;
    setScore({ correct, total, score });
  } catch (err) {
    console.error(err);
    setError("Cannot grade test");
  }
};


  const handleLoadMore = () => {
    setVisibleExtra((prev) => prev + 3);
  };

  if (testContent) {
    return (
      <div className="input-testing-page">
        <Navbar />
        <div className="main-layout">
          <Sidebar />
          <main className="test-content">
            <h2>
              {selectedSkill?.toUpperCase()} - {selectedTest?.name}
            </h2>

            <button
              className="back-btn"
              onClick={() => {
                window.history.back();
              }}
            >
              ← Back to {selectedSkill}
            </button>

            {error && <p className="error">{error}</p>}
            {loading && <p>Loading...</p>}

            {testContent.questions?.map((q, index) => (
              <div key={index} className="question-item">
                <p>
                  <strong>Question {index + 1}:</strong> {q.question}
                </p>

                <form className="options-form">
                  {q.options.map((opt, i) => (
                    <label
                      key={i}
                      className={`option-item ${
                        userAnswers[index] === i ? "selected-answer" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={i}
                        checked={userAnswers[index] === i}
                        onChange={() => handleAnswerSelect(index, i)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </form>
              </div>
            ))}

            <button className="submit-btn" onClick={handleSubmit}>
              Submit Test
            </button>

            {score && (
              <div className="score-box">
                <h3>
                  {score.correct === score.total ? (
                    <>
                      <FaRegSmileBeam className="score-icon success" />
                      You got {score.correct}/{score.total} correct!
                    </>
                  ) : score.correct > score.total / 2 ? (
                    <>
                      <FaRegThumbsUp className="score-icon medium" />
                      You got {score.correct}/{score.total} correct!
                    </>
                  ) : (
                    <>
                      <FaRegSadTear className="score-icon fail" />
                      You got {score.correct}/{score.total} correct!
                    </>
                  )}
                </h3>
                <p>
                  {score.correct === score.total
                    ? "Excellent!"
                    : score.correct > score.total / 2
                    ? "Good job!"
                    : "Keep practicing!"}
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="input-testing-page">
      <Navbar />
      <div className="main-layout">
        <Sidebar />
        <main className="test-container">
          <h2 className="practice-title">Choose Your Placement Test</h2>

          {error && <p className="error">{error}</p>}
          {loading && <p>Loading...</p>}

          {/* --- Skill selection --- */}
          {!selectedSkill && (
            <div className="skill-grid">
              {["listening", "reading", "writing", "speaking", "full"].map(
                (skill) => (
                  <div key={skill} className="skill-card">
                    <img
                      src={`/assets/images/${skill}.jpg`}
                      alt={skill}
                      className="skill-img"
                    />
                    <h2>{skill.charAt(0).toUpperCase() + skill?.slice(1)}</h2>
                    <p>Practice your {skill} skill effectively.</p>
                    <button
                      className="view-btn"
                      onClick={() => handleSkillClick(skill)}
                    >
                      Detail
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          {/* --- Test list --- */}
          {selectedSkill && !testContent && (
            <>
              {/* <button className="back-btn" onClick={() => window.history.back()}>
                ← Back to Skill List
              </button> */}
              <h2 className="skill-header">
                {selectedSkill.toUpperCase()} TESTS
              </h2>

              <div className="test-grid">
                {testList?.slice(0, visibleExtra).map((t) => (
                  <div key={t.id} className="test-card">
                    <h3>{t.name}</h3>
                    <p>{t.desc}</p>
                    <p className="duration">⏱ {t.duration_minutes || 60} minutes</p>
                    <button
                      className="start-btn"
                      onClick={() => handleStartTest(t.id)}
                    >
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
        </main>
      </div>
    </div>
  );
};

export default InputTesting;
