// src/components/WritingTestComponent.jsx (ví dụ)

import React from 'react';

const WritingTestComponent = ({ testContent, userAnswer, onAnswerChange, score, onSubmit }) => {

    
    // Đếm số từ
    const wordCount = userAnswer ? userAnswer.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
    const requiredWords = testContent.points;
    const renderScore = () => {
        if (!score) return null;
        
        // Backend returns: { overall, task_response, coherence_cohesion, lexical_resource, grammar, feedback, suggestions }
        const bandScore = score.overall || score.band_score || score.score;
        
        return (
            <div className="score-box writing-score">
                <h3>Kết quả chấm bài ✍️</h3>
                {bandScore !== undefined ? (
                    <>
                        <p className="band-score">
                            Band Score ước tính: <strong>{bandScore.toFixed(1)}</strong>
                        </p>
                        
                        {/* Detailed scores */}
                        {(score.task_response !== undefined || score.coherence_cohesion !== undefined) && (
                            <div className="detailed-scores">
                                <h4>Chi tiết điểm số:</h4>
                                <ul>
                                    {score.task_response !== undefined && (
                                        <li>Task Response: <strong>{score.task_response.toFixed(1)}</strong></li>
                                    )}
                                    {score.coherence_cohesion !== undefined && (
                                        <li>Coherence & Cohesion: <strong>{score.coherence_cohesion.toFixed(1)}</strong></li>
                                    )}
                                    {score.lexical_resource !== undefined && (
                                        <li>Lexical Resource: <strong>{score.lexical_resource.toFixed(1)}</strong></li>
                                    )}
                                    {score.grammar !== undefined && (
                                        <li>Grammar: <strong>{score.grammar.toFixed(1)}</strong></li>
                                    )}
                                </ul>
                            </div>
                        )}
                        
                        {score.feedback && (
                            <>
                                <p><strong>Nhận xét AI:</strong></p>
                                <div className="feedback-area">
                                    <p>{score.feedback}</p>
                                </div>
                            </>
                        )}
                        
                        {score.suggestions && Array.isArray(score.suggestions) && score.suggestions.length > 0 && (
                            <div className="suggestions">
                                <h4>Gợi ý cải thiện:</h4>
                                <ul>
                                    {score.suggestions.map((suggestion, idx) => (
                                        <li key={idx}>{suggestion}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
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
                Yêu cầu: Viết tối thiểu <strong>{testContent.points || 250} từ</strong>
            </p>

            <div className="writing-prompt-box">
                <h3 className="prompt-header">
                    Đề bài (Task {testContent.task_type === 'task1' ? '1' : testContent.question_number || '2'})
                </h3>
                {/* Task 1: hiển thị hình ảnh chart/graph */}
                {testContent.image_url && (
                    <div className="task1-image">
                        <img src={testContent.image_url} alt="Task 1 chart" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 12 }} />
                    </div>
                )}
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