import React, { useState, useRef } from "react";
import "./ListeningTestLayout.css";

/**
 * ListeningTestLayout
 * - Sticky audio player at top
 * - Questions below, grouped by section
 * - Supports TABLE_COMPLETION, MCQ, fill-in types
 *
 * Props:
 *  testContent: { name, sections: [{ title, audio_url, image_url, questions: [...] }] }
 *  userAnswers: { [public_id]: value }
 *  onAnswer: (public_id, value) => void
 *  score: null | { correct, total, detail }
 *  onSubmit: () => void
 *  loading: bool
 */
const ListeningTestLayout = ({ testContent, userAnswers, onAnswer, score, onSubmit, loading }) => {
  const [activeSection, setActiveSection] = useState(0);
  const audioRef = useRef(null);

  if (!testContent) return null;
  const sections = testContent.sections || [];
  const section = sections[activeSection] || sections[0];
  if (!section) return null;

  const audioUrl = section.audio_url || section.media?.audio;
  const imageUrl = section.image_url || section.media?.image;
  const questions = section.questions || [];

  const answeredCount = questions.filter(q => {
    const key = q.public_id || q.question_no;
    const a = userAnswers[key] ?? userAnswers[q.question_no];
    return a !== "" && a !== undefined && a !== null;
  }).length;

  // Total across all sections
  const totalAnswered = sections.reduce((sum, s) => {
    return sum + (s.questions || []).filter(q => {
      const key = q.public_id || q.question_no;
      const a = userAnswers[key] ?? userAnswers[q.question_no];
      return a !== "" && a !== undefined && a !== null;
    }).length;
  }, 0);
  const totalQuestions = sections.reduce((sum, s) => sum + (s.questions || []).length, 0);

  const renderQuestion = (q, idx) => {
    const key = q.__answerKey || q.public_id || `${activeSection}-${idx}`;
    const answer = userAnswers[key] ?? userAnswers[q.question_no] ?? "";
    const isAnswered = answer !== "" && answer !== undefined && answer !== null;

    const detailRow = score?.detail?.find?.(
      (d) => d.public_id === key || d.question_no === q.question_no
    );
    const isOk =
      detailRow !== undefined ? (detailRow.is_correct ?? detailRow.correct) : undefined;
    let resultClass = "";
    if (detailRow && typeof isOk === "boolean") {
      resultClass = isOk ? "answer-correct" : "answer-wrong";
    }

    const qType = (q.question_type || "").toUpperCase();

    return (
      <div key={key} className={`listening-question ${isAnswered ? "answered" : ""} ${resultClass}`}>
        <div className="question-row">
          <span className="question-num">Q{q.question_no}.</span>
          <span className="question-text">
            {q.prompt || ""}
            {score && typeof isOk === "boolean" && (
              <span className={`result-pill ${isOk ? "result-pill--ok" : "result-pill--bad"}`}>
                {isOk ? "Đúng" : "Sai"}
              </span>
            )}
          </span>
        </div>

        {/* MCQ */}
        {q.options && Array.isArray(q.options) && q.options.length > 0 && (
          <div className="options-list">
            {q.options.map((opt, i) => (
              <label key={i} className={`option-label ${answer === i || answer === opt ? "selected" : ""}`}>
                <input
                  type="radio"
                  name={`lq-${key}`}
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

        {/* Fill-in (TABLE_COMPLETION, SHORT_ANSWER, etc.) */}
        {(!q.options || q.options.length === 0) && (
          <input
            type="text"
            className="fill-input"
            placeholder="Type your answer..."
            disabled={!!score}
            value={answer}
            onChange={(e) => onAnswer(key, e.target.value)}
          />
        )}

        {score && q.correct_answer && (
          <p className="correct-answer-hint">✅ Correct: <strong>{q.correct_answer}</strong></p>
        )}
      </div>
    );
  };

  return (
    <div className="listening-layout">
      {/* Sticky audio player */}
      <div className="audio-player-bar">
        <div className="audio-section-info">
          <span className="audio-section-label">{section.title || `Section ${section.section_no}`}</span>
          <span className="audio-progress">{answeredCount}/{questions.length} answered</span>
        </div>
        {audioUrl ? (
          <audio
            ref={audioRef}
            controls
            src={audioUrl}
            className="audio-element"
            key={audioUrl} // re-mount when section changes
          />
        ) : (
          <p className="no-audio">No audio for this section</p>
        )}
      </div>

      {/* Section tabs */}
      {sections.length > 1 && (
        <div className="section-tabs">
          {sections.map((s, i) => {
            const sAnswered = (s.questions || []).filter(q => {
              const key = q.public_id || q.question_no;
              const a = userAnswers[key] ?? userAnswers[q.question_no];
              return a !== "" && a !== undefined && a !== null;
            }).length;
            return (
              <button
                key={i}
                className={`section-tab ${activeSection === i ? "active" : ""}`}
                onClick={() => setActiveSection(i)}
              >
                {s.title || `Section ${i + 1}`}
                {sAnswered > 0 && (
                  <span className="tab-badge">{sAnswered}/{(s.questions || []).length}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Image (if any) */}
      {imageUrl && (
        <div className="listening-image-wrap">
          <img src={imageUrl} alt="Listening reference" className="listening-image" />
        </div>
      )}

      {/* Questions */}
      <div className="listening-questions">
        <div className="questions-list">
          {questions.map((q, idx) => renderQuestion(q, idx))}
        </div>
      </div>

      {/* Submit */}
      <div className="listening-footer">
        <span className="total-progress">{totalAnswered}/{totalQuestions} total answered</span>
        {!score ? (
          <button
            className="submit-btn listening-submit"
            onClick={onSubmit}
            disabled={loading || totalAnswered === 0}
          >
            {loading ? "Grading..." : "Submit Test"}
          </button>
        ) : (
          <div className="listening-score-box">
            <span>
              {score.correct === score.total ? "🎉" : score.correct > score.total / 2 ? "👍" : "📚"}{" "}
              <strong>{score.correct}/{score.total}</strong> correct
            </span>
            {score.score !== undefined && <span> · Band: <strong>{score.score}</strong></span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListeningTestLayout;
