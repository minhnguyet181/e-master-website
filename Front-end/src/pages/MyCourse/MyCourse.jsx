import React, { useState, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import './MyCourse.css';
// --- MOCK DATA ---
// This detailed data structure powers the entire component.
const coursesData = [
  {
    id: 1,
    title: 'Pronunciation Mastery',
    description: 'Refine your accent, stress, and intonation to sound clear and natural.',
    modules: [
      {
        id: 'm1',
        title: 'Module 1: The Sound Foundations',
        lessons: [
          { id: 'l1-1', title: 'Introduction to Phonetics', type: 'video', content: 'https://www.youtube.com/embed/2_92zKCi5yE', completed: true },
          { id: 'l1-2', title: 'Vowel Sounds Practice', type: 'exercise', content: 'Practice the vowel sounds from the video.', completed: true },
          { id: 'l1-3', title: 'Consonant Sounds Deep Dive', type: 'reading', content: 'Read about the different consonant sounds and their placements.', completed: false },
        ],
      },
      {
        id: 'm2',
        title: 'Module 2: Stress and Intonation',
        lessons: [
          { id: 'l2-1', title: 'Understanding Word Stress', type: 'video', content: 'https://www.youtube.com/embed/PrAe0j_H-iY', completed: false },
          { id: 'l2-2', title: 'Quiz: Word Stress', type: 'quiz', content: { questions: [{ q: 'Where is the stress in "beautiful"?', a: ['BEAU-ti-ful', 'beau-TI-ful', 'beau-ti-FUL'], correct: 0 }] }, completed: false },
          { id: 'l2-3', title: 'The Music of English: Intonation', type: 'reading', content: 'Learn how intonation conveys meaning.', completed: false },
        ],
      },
    ],
  },
  // FIX: Added modules array to other courses to prevent crash
  { id: 2, title: 'IELTS Writing Task 2', description: 'Master the art of essay writing for a higher band score.', progress: 25, modules: [] },
  { id: 3, title: 'Advanced Grammar', description: 'Tackle complex grammar structures with confidence.', progress: 80, modules: [] },
  { id: 4, title: 'Business English Essentials', description: 'Communicate effectively in a professional environment.', progress: 10, modules: [] },
  { id: 5, title: 'Listening for Main Ideas', description: 'Improve your comprehension of spoken English.', progress: 95, modules: [] },
];

// --- ICONS ---
const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ChevronDownIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9l6 6 6-6" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const VideoIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23 7l-7 5 7 5V7z" fill="#a5b4fc"/><path d="M14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z" fill="#6366f1"/></svg>;
const ReadingIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16M4 12h16M4 18h10" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const QuizIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ExerciseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const CheckCircleIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const CircleIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="#d1d5db" strokeWidth="2"/></svg>;
const BackArrowIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 19l-7-7 7-7" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;


// --- SUB-COMPONENTS ---

const CourseCard = ({ course, onContinue }) => {
  const progress = useMemo(() => {
    if (!course.modules || course.modules.length === 0) return course.progress || 0;
    const allLessons = course.modules.flatMap(m => m.lessons);
    if (allLessons.length === 0) return 0;
    const completedLessons = allLessons.filter(l => l.completed).length;
    return Math.round((completedLessons / allLessons.length) * 100);
  }, [course]);

  return (
    <div className="course-card">
      <span className="course-card-tag">COURSE</span>
      <h3 className="course-card-title">{course.title}</h3>
      <p className="course-card-description">{course.description}</p>
            <div className="course-card-progress">
                <span className="progress-percentage">{progress}%</span>
                <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
      <button className="course-card-button" onClick={() => onContinue(course)}>
        Continue
      </button>
    </div>
  );
};

const CourseGrid = ({ courses, onCourseSelect }) => (
    <>
        <header className="courses-header">
            <h2 className="courses-count">{courses.length} Courses</h2>
            <div className="courses-controls">
                <div className="search-bar">
                    <SearchIcon />
                    <input type="text" placeholder="Search" />
                </div>
                <div className="filter-dropdown">
                    <span>All</span>
                    <ChevronDownIcon />
                </div>
            </div>
        </header>
        <div className="course-grid">
            {courses.map(course => (
                <CourseCard key={course.id} course={course} onContinue={onCourseSelect} />
            ))}
        </div>
    </>
);

const CourseDetail = ({ course, onBack }) => {
    // Defensive check for modules
    const modules = course.modules || [];
    const allInitialLessons = modules.flatMap(m => m.lessons);

    const [lessonStates, setLessonStates] = useState(
      allInitialLessons.reduce((acc, lesson) => {
        acc[lesson.id] = lesson.completed;
        return acc;
      }, {})
    );

    const firstLesson = allInitialLessons[0];
    const [currentLesson, setCurrentLesson] = useState(firstLesson);

    const allLessons = useMemo(() => modules.flatMap(m => m.lessons), [modules]);
    const currentLessonIndex = useMemo(() => allLessons.findIndex(l => l.id === currentLesson?.id), [allLessons, currentLesson]);

    if (!currentLesson) {
         return (
             <div className="course-detail-view">
                <header className="detail-header">
                    <button onClick={onBack} className="back-button">
                        <BackArrowIcon />
                        <span>Back to Courses</span>
                    </button>
                    <h2>{course.title}</h2>
                </header>
                <p>This course has no lessons yet. Check back soon!</p>
            </div>
         )
    }

    const handleMarkComplete = () => {
        setLessonStates(prev => ({ ...prev, [currentLesson.id]: !prev[currentLesson.id] }));
    };

    const handleNav = (direction) => {
        const newIndex = currentLessonIndex + direction;
        if (newIndex >= 0 && newIndex < allLessons.length) {
            setCurrentLesson(allLessons[newIndex]);
        }
    };

    const getLessonIcon = (type) => {
        switch (type) {
            case 'video': return <VideoIcon />;
            case 'reading': return <ReadingIcon />;
            case 'quiz': return <QuizIcon />;
            case 'exercise': return <ExerciseIcon />;
            default: return null;
        }
    };

    const renderLessonContent = () => {
        switch (currentLesson.type) {
            case 'video':
                return (
                    <div className="lesson-video-container">
                        <iframe
                            src={currentLesson.content}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen>
                        </iframe>
                    </div>
                );
            case 'reading':
                return <div className="lesson-reading-content"><p>{currentLesson.content}</p></div>;
            case 'quiz':
                return (
                    <div className="lesson-quiz-content">
                        <h4>Quiz Time!</h4>
                        {currentLesson.content.questions.map((q, index) => (
                            <div key={index} className="quiz-question">
                                <p>{q.q}</p>
                                <div className="quiz-answers">
                                    {q.a.map((ans, i) => <button key={i}>{ans}</button>)}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'exercise':
                 return <div className="lesson-exercise-content"><p>{currentLesson.content}</p></div>
            default:
                return <p>Lesson content coming soon.</p>;
        }
    };

    return (
        <div className="course-detail-view">
            <header className="detail-header">
                <button onClick={onBack} className="back-button">
                    <BackArrowIcon />
                    <span>Back to Courses</span>
                </button>
                <h2>{course.title}</h2>
            </header>
            <div className="detail-content-wrapper">
                <main className="lesson-content-area">
                    <h3>{currentLesson.title}</h3>
                    {renderLessonContent()}
                    <div className="lesson-navigation">
                        <button onClick={() => handleNav(-1)} disabled={currentLessonIndex === 0}>Previous Lesson</button>
                        <button onClick={handleMarkComplete} className="mark-complete-btn">
                            {lessonStates[currentLesson.id] ? 'Mark as Incomplete' : 'Mark as Complete'}
                        </button>
                        <button onClick={() => handleNav(1)} disabled={currentLessonIndex === allLessons.length - 1}>Next Lesson</button>
                    </div>
                </main>
                <aside className="lesson-playlist-sidebar">
                    <h4>Course Content</h4>
                    {modules.map(module => (
                        <div key={module.id} className="module-section">
                            <h5>{module.title}</h5>
                            <ul>
                                {module.lessons.map(lesson => (
                                    <li
                                        key={lesson.id}
                                        className={`playlist-item ${currentLesson.id === lesson.id ? 'active' : ''}`}
                                        onClick={() => setCurrentLesson(lesson)}
                                    >
                                        <div className="playlist-item-status">
                                            {lessonStates[lesson.id] ? <CheckCircleIcon /> : <CircleIcon />}
                                        </div>
                                        <div className="playlist-item-info">
                                            <span>{lesson.title}</span>
                                            <span className="playlist-item-type-icon">{getLessonIcon(lesson.type)}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </aside>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---

const MyCourseComponent = () => {
    const [selectedCourse, setSelectedCourse] = useState(null);

    // Render inside dashboard chrome so Navbar and Sidebar are visible
    if (selectedCourse) {
        return (
            <div className="dashboard-layout">
                <Navbar />
                <div className="dashboard-content">
                    <Sidebar />
                    <main className="dashboard-main">
                        <CourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} />
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Navbar />
            <div className="dashboard-content">
                <Sidebar />
                <main className="dashboard-main">
                    <div className="my-course-container">
                        <CourseGrid courses={coursesData} onCourseSelect={setSelectedCourse} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MyCourseComponent;