import React, { useState } from "react";
import "./ReadingTestLayout.css";

/**
 * ReadingTestLayout — split-screen layout
 * Left: scrollable passage
 * Right: questions grouped by type
 *
 * Props:
 *  testContent: { name, sections: [{ title, content: { passageTitle, passageText }, questions: [...] }] }
 *  userAnswers: { [public_id]: value }
 *  onAnswer: (public_id, value) => void
 *  score: null | { correct, total, detail }
 *  onSubmit: () => void
 *  loading: bool
 */
const ReadingTestLayout = ({ testContent, userAnswers, onAnswer, score, onSubmit, loading }) => {
  const [activeSection, setActiveSection] = useState(0);

  if (!testContent) return null;
  const sections = testContent.sections || [];
  const section = sections[activeSection] || sections[0];
  if (!section) return null;

  const passageTitle = section.content?.passageTitle || section.title || "Reading Passage";
  // passageText can be object {A: "...", B: "..."} or string
  const passageText = section.content?.passageText || section.passage_text;
  const questions = section.questions || [];

  const renderPassage = () => {
    if (!passageText) return <p className="no-passage">No passage available.</p>;
    if (typeof passageText === "object") {
      return Object.entries(passageText).map(([key, val]) => (
        <div key={key} className="passage-paragraph">
          <span className="paragraph-label">{key}</span>
          <span>{val}</span>
        </div>
      ));
    }
    // Try parse if stored as JSON string
    try {
      const parsed = JSON.parse(passageText);
      if (typeof parsed === "object") {
        return Object.entries(parsed).map(([key, val]) => (
          <div key={key} className="passage-paragraph">
            <span className="paragraph-label">{key}</span>
            <span>{val}</span>
          </div>
        ));
      }
    } catch (_) {}
    return <p>{passageText}</p>;
  };

  const renderQuestion = (q, idx) => {
    const key = q.public_id || `${activeSection}-${idx}`;
    const answer = userAnswers[key] ?? userAnswers[q.question_no] ?? "";
    const isAnswered = answer !== "" && answer !== undefined && answer !== null;

    // Determine correct/wrong after submit
    let resultClass = "";
    if (score?.detail) {
      const detail = score.detail.find?.(d => d.public_id === key || d.question_no === q.question_no);
      if (detail) resultClass = detail.correct ? "answer-correct" : "answer-wrong";
    }

    const tfngOptions = ["TRUE", "FALSE", "NOT GIVEN"];
    const ynngOptions = ["YES", "NO", "NOT GIVEN"];

    const qType = (q.question_type || "").toUpperCase();

    return (
      <div key={key} className={`reading-question ${isAnswered ? "answered" : ""} ${resultClass}`}>
        <p className="question-text">
          <span className="question-num">Q{q.question_no}.</span>{" "}
          {q.prompt || ""}
        </p>

        {/* MCQ */}
        {q.options && Array.isArray(q.options) && q.options.length > 0 && (
          <div className="options-list">
            {q.options.map((opt, i) => (
              <label key={i} className={`option-label ${answer === i || answer === opt ? "selected" : ""}`}>
                <input
                  type="radio"
                  name={`q-${key}`}
                  disabled={!!score}
                  checked={answer === i || answer === opt}
                  onChange={() => onAnswer(key, i)}
                />
                <span className="option-letter">{String.fromCharCode(65 + i)}.</span>
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )}

        {/* TRUE/FALSE/NOT GIVEN */}
        {!q.options && (qType === "TRUE_FALSE_NOT_GIVEN" || qType === "TFNG") && (
          <div className="options-list tfng">
            {tfngOptions.map((opt) => (
              <label key={opt} className={`option-label ${answer === opt ? "selected" : ""}`}>
                <input
                  type="radio"
                  name={`q-${key}`}
                  disabled={!!score}
                  checked={answer === opt}
                  onChange={() => onAnswer(key, opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )}

        {/* YES/NO/NOT GIVEN */}
        {!q.options && (qType === "YES_NO_NOT_GIVEN" || qType === "YNNG") && (
          <div className="options-list tfng">
            {ynngOptions.map((opt) => (
              <label key={opt} className={`option-label ${answer === opt ? "selected" : ""}`}>
                <input
                  type="radio"
                  name={`q-${key}`}
                  disabled={!!score}
                  checked={answer === opt}
                  onChange={() => onAnswer(key, opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )}

        {/* Fill-in / Short answer / Summary completion */}
        {!q.options &&
          qType !== "TRUE_FALSE_NOT_GIVEN" &&
          qType !== "TFNG" &&
          qType !== "YES_NO_NOT_GIVEN" &&
          qType !== "YNNG" && (
            <input
              type="text"
              className="fill-input"
              placeholder="Your answer..."
              disabled={!!score}
              value={answer}
              onChange={(e) => onAnswer(key, e.target.value)}
            />
          )}

        {/* Show correct answer after submit */}
        {score && q.correct_answer && (
          <p className="correct-answer-hint">
            ✅ Correct: <strong>{q.correct_answer}</strong>
          </p>
        )}
      </div>
    );
  };

  const answeredCount = questions.filter(q => {
    const key = q.public_id || q.question_no;
    const a = userAnswers[key] ?? userAnswers[q.question_no];
    return a !== "" && a !== undefined && a !== null;
  }).length;

  return (
    <div className="reading-layout">
      {/* Section tabs if multiple sections */}
      {sections.length > 1 && (
        <div className="section-tabs">
          {sections.map((s, i) => (
            <button
              key={i}
              className={`section-tab ${activeSection === i ? "active" : ""}`}
              onClick={() => setActiveSection(i)}
            >
              {s.title || `Passage ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      <div className="reading-split">
        {/* LEFT: Passage */}
        <div className="passage-panel">
          <h3 className="passage-title">{passageTitle}</h3>
          <div className="passage-body">{renderPassage()}</div>
        </div>

        {/* RIGHT: Questions */}
        <div className="questions-panel">
          <div className="questions-header">
            <span>Questions 1–{questions.length}</span>
            <span className="progress-badge">{answeredCount}/{questions.length} answered</span>
          </div>

          <div className="questions-list">
            {questions.map((q, idx) => renderQuestion(q, idx))}
          </div>

          {!score && (
            <button
              className="submit-btn reading-submit"
              onClick={onSubmit}
              disabled={loading || answeredCount === 0}
            >
              {loading ? "Grading..." : `Submit (${answeredCount}/${questions.length})`}
            </button>
          )}

          {score && (
            <div className="reading-score-box">
              <h3>
                {score.correct === score.total ? "🎉" : score.correct > score.total / 2 ? "👍" : "📚"}{" "}
                {score.correct}/{score.total} correct
              </h3>
              <p>
                {score.correct === score.total
                  ? "Perfect score!"
                  : score.correct > score.total / 2
                  ? "Good job! Keep it up."
                  : "Keep practicing!"}
              </p>
              {score.score !== undefined && (
                <p>Band estimate: <strong>{score.score}</strong></p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReadingTestLayout;
