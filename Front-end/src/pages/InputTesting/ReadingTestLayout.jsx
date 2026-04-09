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
  const paragraphLabels =
    passageText && typeof passageText === "object" ? Object.keys(passageText) : [];
  const sortedQuestionNos = questions
    .map((q) => Number(q.question_no))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  const questionStart = sortedQuestionNos[0] || 1;
  const questionEnd = sortedQuestionNos[sortedQuestionNos.length - 1] || questions.length;

  const getGroupType = (qTypeRaw) => {
    const qType = (qTypeRaw || "").toUpperCase();
    if (qType === "TRUE_FALSE_NOT_GIVEN" || qType === "TFNG") return "TFNG";
    if (qType === "YES_NO_NOT_GIVEN" || qType === "YNNG") return "YNNG";
    if (qType === "PARAGRAPH_MATCH" || qType === "MATCHING_PARAGRAPHS") return "PARAGRAPH_MATCH";
    if (qType === "MULTIPLE_CHOICE" || qType === "MCQ") return "MCQ";
    if (qType === "SUMMARY_COMPLETION") return "SUMMARY";
    return "SHORT";
  };

  const getTaskMeta = (groupType, firstQ, lastQ) => {
    const range = `Questions ${firstQ}-${lastQ}`;
    if (groupType === "TFNG") {
      return {
        range,
        title: "Do the following statements agree with the information in the passage?",
        instruction: "Choose TRUE, FALSE or NOT GIVEN for each question.",
      };
    }
    if (groupType === "YNNG") {
      return {
        range,
        title: "Do the following statements agree with the writer's views?",
        instruction: "Choose YES, NO or NOT GIVEN for each question.",
      };
    }
    if (groupType === "PARAGRAPH_MATCH") {
      return {
        range,
        title: "Which paragraph contains the following information?",
        instruction: "Write the correct letter, A-H, in boxes on your answer sheet.",
      };
    }
    if (groupType === "MCQ") {
      return {
        range,
        title: "Choose the correct letter, A, B, C or D.",
        instruction: "Select the best answer for each question.",
      };
    }
    if (groupType === "SUMMARY") {
      return {
        range,
        title: "Complete the summary below.",
        instruction: "Choose NO MORE THAN TWO WORDS from the passage for each answer.",
      };
    }
    return {
      range,
      title: "Answer the questions below.",
      instruction: "Write your answers in the boxes provided.",
    };
  };

  // Split into IELTS-like task blocks: contiguous question ranges by question type
  const taskBlocks = [];
  let currentBlock = null;
  for (const q of questions) {
    const type = getGroupType(q.question_type);
    const no = Number(q.question_no);
    if (
      !currentBlock ||
      currentBlock.groupType !== type ||
      no !== currentBlock.lastNo + 1
    ) {
      if (currentBlock) taskBlocks.push(currentBlock);
      currentBlock = { groupType: type, list: [q], firstNo: no, lastNo: no };
    } else {
      currentBlock.list.push(q);
      currentBlock.lastNo = no;
    }
  }
  if (currentBlock) taskBlocks.push(currentBlock);

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

    const detailRow = score?.detail?.find?.(
      (d) => d.public_id === key || d.question_no === q.question_no
    );
    const isOk =
      detailRow !== undefined ? (detailRow.is_correct ?? detailRow.correct) : undefined;
    let resultClass = "";
    if (detailRow && typeof isOk === "boolean") {
      resultClass = isOk ? "answer-correct" : "answer-wrong";
    }

    const tfngOptions = ["TRUE", "FALSE", "NOT GIVEN"];
    const ynngOptions = ["YES", "NO", "NOT GIVEN"];

    const qType = (q.question_type || "").toUpperCase();
    const groupType = getGroupType(q.question_type);
    const generatedPrompt =
      groupType === "PARAGRAPH_MATCH"
        ? `Which paragraph contains the information for question ${q.question_no}?`
        : groupType === "MCQ"
        ? `Choose the correct option for question ${q.question_no}.`
        : groupType === "SUMMARY"
        ? `Complete the gap for question ${q.question_no} using words from the passage.`
        : `Answer question ${q.question_no}.`;
    const promptText = q.prompt || generatedPrompt;

    return (
      <div key={key} className={`reading-question ${isAnswered ? "answered" : ""} ${resultClass}`}>
        <p className="question-text">
          <span className="question-num">Q{q.question_no}.</span>{" "}
          {promptText}
          {score && typeof isOk === "boolean" && (
            <span className={`result-pill ${isOk ? "result-pill--ok" : "result-pill--bad"}`}>
              {isOk ? "Đúng" : "Sai"}
            </span>
          )}
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

        {/* Paragraph matching */}
        {!q.options && groupType === "PARAGRAPH_MATCH" && (
          <div className="options-list paragraph-match">
            {paragraphLabels.length > 0 ? (
              paragraphLabels.map((label) => (
                <label
                  key={label}
                  className={`option-label ${answer === label ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name={`q-${key}`}
                    disabled={!!score}
                    checked={answer === label}
                    onChange={() => onAnswer(key, label)}
                  />
                  <span>Paragraph {label}</span>
                </label>
              ))
            ) : (
              <input
                type="text"
                className="fill-input"
                placeholder="Paragraph letter (e.g. A)"
                disabled={!!score}
                value={answer}
                onChange={(e) => onAnswer(key, e.target.value.toUpperCase())}
              />
            )}
          </div>
        )}

        {/* Fill-in / Short answer / Summary completion */}
        {!q.options &&
          groupType !== "TFNG" &&
          groupType !== "YNNG" &&
          groupType !== "PARAGRAPH_MATCH" && (
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
            <span>Questions {questionStart}-{questionEnd}</span>
            <span className="progress-badge">{answeredCount}/{questions.length} answered</span>
          </div>

          <div className="questions-list">
            {taskBlocks.map((block, blockIdx) => {
              const first = block.list[0];
              const last = block.list[block.list.length - 1];
              const meta = getTaskMeta(block.groupType, first?.question_no, last?.question_no);
              return (
                <div key={`${block.groupType}-${blockIdx}`} className="question-group">
                  <h4 className="question-group-title">
                    {meta.range}
                  </h4>
                  <p className="question-group-heading">{meta.title}</p>
                  <p className="question-group-instruction">{meta.instruction}</p>
                  {block.list.map((q, idx) => renderQuestion(q, idx))}
                </div>
              );
            })}
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
