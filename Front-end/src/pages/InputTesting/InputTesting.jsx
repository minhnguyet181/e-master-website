import React, { useState, useEffect } from "react";
import "./InputTesting.css";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { FaRegSmileBeam, FaRegThumbsUp, FaRegSadTear } from "react-icons/fa";
import api from "../../api/api.js";
import WritingTestComponent from "./WritingTestComponent";
import ReadingTestLayout from "./ReadingTestLayout";
import ListeningTestLayout from "./ListeningTestLayout";

const InputTesting = () => {
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testContent, setTestContent] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visibleExtra, setVisibleExtra] = useState(6);
  const [testList, setTestList] = useState([]);

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
    if (skill === "full") {
      setError("Full test feature coming soon!");
      return;
    }
    setSelectedSkill(skill);
    setTestContent(null);
    setUserAnswers({});
    setScore(null);
    setVisibleExtra(6);
    try {
      const response = await api.test.getTestsBySkill(skill);
      // Backend returns: { success: true, data: [...] }
      const tests = Array.isArray(response.data?.data) ? response.data.data : [];
      setTestList(tests);
    } catch (err) {
      console.error("❌ Error loading tests:", err);
      setError("Cannot load tests for this skill.");
      setTestList([]);
    }
    window.history.pushState({}, "", `#${skill}`);
  };

  // ✅ Khi chọn test
  const handleStartTest = async (testId) => {
    // testId có thể là number hoặc object với .id
    const id = typeof testId === 'object' ? testId.id : testId;
    setSelectedTest({ id, ...(typeof testId === 'object' ? testId : {}) });
    setLoading(true);
    setError("");
    setScore(null);
    setUserAnswers({});
    try {
      const res = await api.test.getTest(id);
      // Backend returns: { success: true, data: { id, name, test_type, sections: [...], questions: [...] } }
      const testData = res.data?.data || res.data;
      setTestContent(testData);
    } catch (err) {
      console.error("❌ Error loading test:", err);
      setError("Cannot load test content.");
      setTestContent(null);
    } finally {
      setLoading(false);
    }
  };

  // Flatten questions from sections for easier access
  const getAllQuestions = () => {
    if (!testContent) return [];
    const questions = [];
    // Questions in sections
    if (testContent.sections && Array.isArray(testContent.sections)) {
      testContent.sections.forEach((section) => {
        if (section.questions && Array.isArray(section.questions)) {
          questions.push(...section.questions);
        }
      });
    }
    // Questions without section (direct on test)
    if (testContent.questions && Array.isArray(testContent.questions)) {
      questions.push(...testContent.questions);
    }
    return questions.sort((a, b) => {
      const sa = a.section_id || 0;
      const sb = b.section_id || 0;
      if (sa !== sb) return sa - sb;
      return (a.question_no || 0) - (b.question_no || 0);
    });
  };

  const handleAnswerSelect = (questionPublicId, answer) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionPublicId]: answer,
    }));
  };

  const handleAnswerSelectByIndex = (questionIndex, optionIndex) => {
    const questions = getAllQuestions();
    if (questions[questionIndex]?.public_id) {
      handleAnswerSelect(questions[questionIndex].public_id, optionIndex);
    } else {
      // Fallback: use index
      setUserAnswers((prev) => ({
        ...prev,
        [questionIndex]: optionIndex,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!testContent || !selectedTest) return;
    
    const testId = selectedTest.id || selectedTest;
    if (!testId) { setError("Test ID is missing"); return; }

    setLoading(true);
    setError("");

    try {
      // Normalize answers per test type
      let answers = userAnswers;
      if (testContent.test_type === "writing") {
        const text = typeof userAnswers === "string" ? userAnswers : userAnswers.essay || userAnswers.text || "";
        answers = { essay: text };
      } else if (testContent.test_type === "speaking") {
        const text = typeof userAnswers === "string" ? userAnswers : userAnswers.transcript || userAnswers.text || "";
        answers = { transcript: text };
      }

      const res = await api.test.gradeTest({ testId, answers });
      const result = res.data?.data?.result || res.data?.data || res.data;

      if (result.correct !== undefined && result.total !== undefined) {
        setScore({ correct: result.correct, total: result.total, score: result.score, ...result });
      } else if (result.overall !== undefined) {
        setScore({ overall: result.overall, band_score: result.overall, ...result });
      } else {
        setScore(result);
      }
    } catch (err) {
      console.error("❌ Error grading test:", err);
      setError(err.response?.data?.message || "Cannot grade test");
    } finally {
      setLoading(false);
    }
  };


  const handleLoadMore = () => {
    setVisibleExtra((prev) => prev + 3);
  };

  // Render test content based on test_type
  const renderTestContent = () => {
    if (!testContent) return null;

    const testType = testContent.test_type;
    const questions = getAllQuestions();

    // Writing test - use WritingTestComponent
    if (testType === "writing") {
      const firstSection = testContent.sections?.[0];
      const firstQuestion = questions[0];
      // Lấy prompt từ section.prompt (mới) hoặc section.content (cũ)
      const writingPrompt =
        firstSection?.prompt ||
        firstSection?.content?.question ||
        firstSection?.content ||
        testContent.description ||
        "";
      // Lấy image nếu là Task 1
      const taskImage = firstSection?.image_url || firstSection?.media?.image || null;
      const userAnswer =
        typeof userAnswers === "string"
          ? userAnswers
          : userAnswers.essay || userAnswers.text || userAnswers.answer || "";

      return (
        <WritingTestComponent
          testContent={{
            name: testContent.name,
            task_type: testContent.task_type, // task1 | task2
            duration_minutes: testContent.duration_minutes,
            points: firstQuestion?.points || 250,
            content: typeof writingPrompt === "object" ? JSON.stringify(writingPrompt) : writingPrompt,
            image_url: taskImage,
            question_number: testContent.task_type || firstSection?.title || "2",
            hint: firstQuestion?.metadata?.sample_answer || null,
            info: { name: testContent.name },
          }}
          userAnswer={userAnswer}
          onAnswerChange={(text) => setUserAnswers(text)}
          score={score}
          onSubmit={handleSubmit}
        />
      );
    }

    // Speaking test
    if (testType === "speaking") {
      const userTranscript =
        typeof userAnswers === "string"
          ? userAnswers
          : userAnswers.transcript || userAnswers.text || userAnswers.answer || "";

      return (
        <div className="speaking-test-content">
          {testContent.sections?.map((section, sIdx) => (
            <div key={sIdx} className="speaking-section">
              <h4>{section.title || `Part ${section.section_no}`}</h4>
              {section.prompt && <p className="speaking-prompt">{section.prompt}</p>}
              {section.content?.topic && <p className="topic"><strong>Topic:</strong> {section.content.topic}</p>}
              {section.questions?.map((q, qIdx) => (
                <div key={qIdx} className="speaking-question">
                  <p><strong>Question {q.question_no}:</strong> {q.prompt}</p>
                </div>
              ))}
            </div>
          ))}

          <div className="speaking-answer-box">
            <h3>Nhập transcript câu trả lời của bạn:</h3>
            <p className="speaking-hint">
              Nói to câu trả lời, sau đó gõ lại nội dung bạn đã nói vào ô bên dưới để AI chấm điểm.
            </p>
            <textarea
              className="writing-input"
              rows="10"
              placeholder="Nhập transcript câu trả lời của bạn tại đây..."
              value={userTranscript}
              onChange={(e) => setUserAnswers(e.target.value)}
              disabled={!!score}
            />
            {userTranscript.trim().length > 0 && (
              <p className="word-count-info">
                Số từ: <strong>{userTranscript.trim().split(/\s+/).filter(Boolean).length}</strong>
              </p>
            )}
          </div>

          {score && (
            <div className="score-box speaking-score">
              <h3>Kết quả chấm bài 🎤</h3>
              {score.overall !== undefined && (
                <p className="band-score">Band Score: <strong>{Number(score.overall).toFixed(1)}</strong></p>
              )}
              {score.fluency_and_coherence !== undefined && (
                <div className="detailed-scores">
                  <h4>Chi tiết:</h4>
                  <ul>
                    <li>Fluency & Coherence: <strong>{Number(score.fluency_and_coherence).toFixed(1)}</strong></li>
                    <li>Pronunciation: <strong>{Number(score.pronunciation).toFixed(1)}</strong></li>
                    <li>Lexical Resource: <strong>{Number(score.lexical_resource).toFixed(1)}</strong></li>
                    <li>Grammar: <strong>{Number(score.grammar).toFixed(1)}</strong></li>
                  </ul>
                </div>
              )}
              {score.feedback && <p><strong>Nhận xét:</strong> {score.feedback}</p>}
              {score.suggestions?.map((s, i) => <p key={i}>💡 {s}</p>)}
            </div>
          )}
        </div>
      );
    }

    // Reading — split-screen layout
    if (testType === "reading") {
      return (
        <ReadingTestLayout
          testContent={testContent}
          userAnswers={userAnswers}
          onAnswer={handleAnswerSelect}
          score={score}
          onSubmit={handleSubmit}
          loading={loading}
        />
      );
    }

    // Listening — sticky audio layout
    if (testType === "listening") {
      return (
        <ListeningTestLayout
          testContent={testContent}
          userAnswers={userAnswers}
          onAnswer={handleAnswerSelect}
          score={score}
          onSubmit={handleSubmit}
          loading={loading}
        />
      );
    }

    // Fallback for unknown types
    return (
      <div className="objective-test-content">
        {questions.map((q, index) => {
          const questionKey = q.public_id || index;
          const userAnswer = userAnswers[questionKey] ?? userAnswers[index];
          return (
            <div key={questionKey} className="question-item">
              <p><strong>Question {q.question_no || index + 1}:</strong> {q.prompt}</p>
              {q.options?.length > 0 ? (
                <form className="options-form">
                  {q.options.map((opt, optIdx) => (
                    <label key={optIdx} className={`option-item ${userAnswer === optIdx ? "selected-answer" : ""}`}>
                      <input type="radio" name={`question-${questionKey}`} checked={userAnswer === optIdx}
                        onChange={() => handleAnswerSelect(questionKey, optIdx)} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </form>
              ) : (
                <input type="text" className="text-answer-input" placeholder="Type your answer..."
                  value={userAnswer || ""} onChange={(e) => handleAnswerSelect(questionKey, e.target.value)} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (testContent) {
    return (
      <div className="input-testing-page input-testing-page--exam">
        <Navbar />
        <div className="main-layout">
          <Sidebar />
          <main className="test-content">
            <h2>
              {testContent.test_type?.toUpperCase()} - {testContent.name || selectedTest?.name}
            </h2>

            <button
              className="back-btn"
              onClick={() => {
                setTestContent(null);
                setSelectedTest(null);
                setUserAnswers({});
                setScore(null);
                window.history.back();
              }}
            >
              ← Back to {selectedSkill}
            </button>

            {error && <p className="error">{error}</p>}
            {loading && !score && <p>Loading...</p>}

            {renderTestContent()}

            {testContent.test_type !== "writing" &&
              testContent.test_type !== "speaking" &&
              testContent.test_type !== "reading" &&
              testContent.test_type !== "listening" && (
              <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
                Submit Test
              </button>
            )}

            {testContent.test_type === "speaking" && !score && (
              <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={loading || !(typeof userAnswers === 'string' ? userAnswers : userAnswers.transcript || '').trim()}
              >
                {loading ? "Đang chấm..." : "Nộp bài & Chấm điểm AI"}
              </button>
            )}

            {score && testContent.test_type !== "writing" &&
              testContent.test_type !== "reading" &&
              testContent.test_type !== "listening" && (
              <div className="score-box">
                <h3>
                  {score.correct !== undefined && score.total !== undefined ? (
                    score.correct === score.total ? (
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
                    )
                  ) : (
                    <>
                      <FaRegThumbsUp className="score-icon success" />
                      Test completed!
                    </>
                  )}
                </h3>
                {score.correct !== undefined && (
                  <p>
                    {score.correct === score.total
                      ? "Excellent!"
                      : score.correct > score.total / 2
                      ? "Good job!"
                      : "Keep practicing!"}
                  </p>
                )}
                {score.detail && (
                  <details>
                    <summary>View detailed results</summary>
                    <pre>{JSON.stringify(score.detail, null, 2)}</pre>
                  </details>
                )}
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

              {testList.length === 0 ? (
                <p className="info">No tests available for this skill.</p>
              ) : (
                <>
                  <div className="test-grid">
                    {testList.slice(0, visibleExtra).map((t) => (
                      <div key={t.id} className="test-card">
                        <h3>{t.name}</h3>
                        <p>{t.description || t.desc || "Practice test"}</p>
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

                  {visibleExtra < testList.length && (
                    <div className="center">
                      <button className="view-btn" onClick={handleLoadMore}>
                        Load More
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default InputTesting;
