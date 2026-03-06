// src/components/WritingTestComponent.jsx (ví dụ)

import React from 'react';

const WritingTestComponent = ({ testContent, userAnswer, onAnswerChange, score, onSubmit }) => {

    
    // Đếm số từ
    const wordCount = userAnswer ? userAnswer.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
    const requiredWords = testContent.points;
    const renderScore = () => {
        if (!score) return null;
        
        // Giả định API trả về { band_score: 7.5, feedback: "..." }
        return (
            <div className="score-box writing-score">
                <h3>Kết quả chấm bài ✍️</h3>
                {score.band_score ? (
                    <>
                        <p className="band-score">Band Score ước tính: <strong>{score.band_score}</strong></p>
                        <p>Nhận xét AI:</p>
                        <div className="feedback-area">
                            <pre>{score.feedback}</pre>
                        </div>
                    </>
                ) : (
                    <p>Đã nộp bài. Đang chờ kết quả chấm điểm chi tiết.</p>
                )}
                
                {/* Hiển thị Sample Answer nếu có */}
                {testContent.hint && (
                    <details>
                        <summary>Xem Bài viết Mẫu (Sample Answer)</summary>
                        <pre className="sample-answer">{testContent.hint}</pre>
                    </details>
                )}
            </div>
        );
    };

    return (
        <div className="writing-test-layout">
            
            <h2 className="test-title">
                {testContent.info?.name || 'Bài kiểm tra Viết'}
            </h2>
            <p className="test-info">
                Thời gian: ⏱ {testContent.duration_minutes || 'N/A'} phút | 
                Yêu cầu: Viết tối thiểu **{testContent.points || 250} từ**
            </p>
            
 
            <div className="writing-prompt-box">
                <h3 className="prompt-header">Đề bài (Task {testContent.question_number || 'N/A'})</h3>
                <div className="prompt-content">
                    <p>{testContent.content}</p>
                </div>
            </div>

            <div className="writing-answer-box">
                <h3 className="answer-header">Bài làm của bạn:</h3>
                <textarea
                    className="writing-input"
                    rows="20"
                    placeholder="Bắt đầu viết bài luận của bạn tại đây..."
                    value={userAnswer}
                    onChange={(e) => onAnswerChange(e.target.value)}
                    disabled={!!score} // Khóa khung nhập liệu sau khi nộp bài
                />
                <div className="word-count-info">
                    Số từ: <strong>{wordCount}</strong> / {requiredWords}
                    {wordCount < requiredWords && (
                         <span style={{color: 'red', marginLeft: '10px'}}> (Chưa đạt yêu cầu tối thiểu)</span>
                    )}
                </div>
            </div>

            {!score && (
                <button 
                    className="submit-btn writing-submit" 
                    onClick={onSubmit} 
                    disabled={wordCount < requiredWords} 
                >
                    Nộp Bài & Chấm Điểm AI
                </button>
            )}

            {renderScore()}
        </div>
    );
};

export default WritingTestComponent;