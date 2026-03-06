import React, { useMemo, useState } from 'react';
import '../Roadmap/Roadmap.css';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';

// --- ICONS ---
// All icon components are defined here for simplicity.
const iconProps = {
  className: "icon",
  strokeWidth: 1.5,
  width: 20,
  height: 20
};

const EvmIcon = () => <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>;
const AcademyIcon = () => <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.07a2.25 2.25 0 01-2.25 2.25H5.625a2.25 2.25 0 01-2.25-2.25v-4.07m16.5-8.24v-1.12a2.25 2.25 0 00-2.25-2.25H5.625a2.25 2.25 0 00-2.25 2.25v1.12m16.5 0L12 17.25 3.75 5.91m16.5 0V4.5A2.25 2.25 0 0018 2.25h-1.5a2.25 2.25 0 00-2.25 2.25v1.41m-6 0v-1.12a2.25 2.25 0 00-2.25-2.25H7.5A2.25 2.25 0 005.25 4.5v1.41m6 0h.01" /></svg>;
const IndexingIcon = () => <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068M15.75 21a9 9 0 100-18h-3.75a9 9 0 00-9 9v3.75a9 9 0 009 9h3.75z" /></svg>;
const EnterpriseIcon = () => <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>;
const ProgramIcon = () => <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>;
const NetworkIcon = () => <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>;
const SdkIcon = () => <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" /></svg>;
const ClusterIcon = () => <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75l7.5-7.5 7.5 7.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75l7.5-7.5 7.5 7.5" /></svg>;
const ImproveIcon = () => <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LaunchIcon = () => <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a6 6 0 016.38 5.84h-4.82m-7.78 0a6 6 0 01-7.38-5.84h4.82m2.56 0a6 6 0 015.84-7.38v4.82m-5.84 2.56a6 6 0 01-5.84-7.38m7.78 0a6 6 0 017.38 5.84m-4.82 0h4.82" /></svg>;
const ExplorerIcon = () => <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const PointInTimeIcon = () => <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ContractIcon = () => <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TokenIcon = () => <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9A2.25 2.25 0 0018.75 6.75h-1.5a3 3 0 00-6 0h-1.5A2.25 2.25 0 003 9v3m18 0h-6.232a4.502 4.502 0 01-4.486 0H3" /></svg>;

// --- IELTS skill icons ---
const ListeningIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v2" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 6v2" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 6v2" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 20h16a1 1 0 001-1v-4a8 8 0 00-8-8H11a8 8 0 00-8 8v4a1 1 0 001 1z" stroke="#2563EB" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const SpeakingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 01-2 2H8l-5 3V5a2 2 0 012-2h11a2 2 0 012 2v10z" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const ReadingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7h18M7 21V7" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 21V7" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const WritingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21v-4.2l11-11 4.2 4.2-11 11H3z" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 7l3 3" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="11" width="18" height="10" rx="2" stroke="#9CA3AF" strokeWidth="1.2"/><path d="M7 11V8a5 5 0 0110 0v3" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="#10B981" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
);


// --- ROADMAP DATA (IELTS-focused) ---
// Each milestone contains top-level highlights (items) and nested lessons (subLessons).
const roadmapData = [
  {
    id: 1,
    title: 'Foundation',
    date: 'Now',
    items: [
      { title: 'Overview of IELTS format', skill: 'overview' },
      { title: 'Set realistic band goals', skill: 'overview' }
    ],
    subLessons: [
      { id: 'f-1', title: 'Introduction to IELTS (format & timing)', skill: 'overview', completed: true },
      { id: 'f-2', title: 'Basic grammar & sentence structure', skill: 'writing', completed: false },
      { id: 'f-3', title: 'Core vocabulary for daily topics', skill: 'speaking', completed: false },
      { id: 'f-4', title: 'Pronunciation basics', skill: 'speaking', completed: false }
    ]
  },
  {
    id: 2,
    title: 'Band 4–5: Building Foundations',
    date: 'Short term',
    items: [
      { title: 'Listening strategies', skill: 'listening' },
      { title: 'Basic speaking fluency', skill: 'speaking' }
    ],
    subLessons: [
      { id: 'b45-1', title: 'Listening: identifying main ideas', skill: 'listening', completed: true },
      { id: 'b45-2', title: 'Speaking: answering short questions', skill: 'speaking', completed: false },
      { id: 'b45-3', title: 'Writing: task 1 basics', skill: 'writing', completed: false },
      { id: 'b45-4', title: 'Reading: short texts & matching', skill: 'reading', completed: false }
    ]
  },
  {
    id: 3,
    title: 'Band 6: Expand Accuracy',
    date: 'Medium term',
    items: [
      { title: 'Complex sentence practice', skill: 'writing' },
      { title: 'Band-targeted vocabulary', skill: 'reading' }
    ],
    subLessons: [
      { id: 'b6-1', title: 'Speaking: structured Part 2 answers', skill: 'speaking', completed: false },
      { id: 'b6-2', title: 'Writing: Task 2 opinion essays', skill: 'writing', completed: false },
      { id: 'b6-3', title: 'Reading: skimming & scanning techniques', skill: 'reading', completed: false },
      { id: 'b6-4', title: 'Listening: detail & inference', skill: 'listening', completed: false }
    ]
  },
  {
    id: 4,
    title: 'Band 7+: Polished Performance',
    date: 'Long term',
    items: [
      { title: 'Fluency & coherence mastery', skill: 'speaking' },
      { title: 'Lexical resource refinement', skill: 'writing' }
    ],
    subLessons: [
      { id: 'b7-1', title: 'Speaking: advanced discourse & idioms', skill: 'speaking', completed: false },
      { id: 'b7-2', title: 'Writing: cohesive high-scoring essays', skill: 'writing', completed: false },
      { id: 'b7-3', title: 'Listening: handling distractors', skill: 'listening', completed: false },
      { id: 'b7-4', title: 'Reading: critical reading & paraphrase', skill: 'reading', completed: false }
    ]
  }
];

// --- MILESTONE COMPONENT ---
// Render milestone with IELTS skill icons for items and a full list of lessons.
const Milestone = ({ milestone, position, completedLessons }) => {
  const isLeft = position === 'left';
  const alignmentClass = isLeft ? 'milestone-left' : 'milestone-right';
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`milestone-content-container ${alignmentClass}`}>
      {/* Do not fade milestone cards - always fully visible */}
      <div className={`milestone-card`}>
        <p className="milestone-date">{milestone.date}</p>
        <h3 className="milestone-title">{milestone.title}</h3>

        <ul className="milestone-items-list">
          {milestone.items.map((item, index) => {
            // choose a skill icon for the milestone item
            let ItemIcon = null;
            if (item.skill === 'listening') ItemIcon = ListeningIcon;
            else if (item.skill === 'speaking') ItemIcon = SpeakingIcon;
            else if (item.skill === 'reading') ItemIcon = ReadingIcon;
            else if (item.skill === 'writing') ItemIcon = WritingIcon;
            else ItemIcon = ExplorerIcon;

            return (
              <li key={index} className="milestone-item">
                <span className="milestone-item-icon">{ItemIcon && <ItemIcon />}</span>
                <span>{item.title}</span>
              </li>
            );
          })}
        </ul>

        {/* Toggle button for showing/hiding sub-lessons */}
        {milestone.subLessons && (
          <div className="milestone-lessons">
            <button
              className="details-toggle-button"
              onClick={() => setExpanded(e => !e)}
              aria-expanded={expanded}
            >
              {expanded ? 'Hide lessons' : 'Show lessons'}
            </button>

            <ul className={`sub-lessons-list ${!expanded ? 'sub-lessons-collapsed' : ''}`}>
              {milestone.subLessons.map(lesson => {
                const done = completedLessons.includes(lesson.id);
                const className = done ? 'sub-lesson-completed' : 'sub-lesson-locked';
                return (
                  <li key={lesson.id} className={`sub-lesson-item ${className}`}>
                    <span className="lesson-icon">{done ? <CheckIcon /> : <LockIcon />}</span>
                    <span className="sub-lesson-title">{lesson.title}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// --- ROADMAP COMPONENT ---
const RoadmapComponent = ({ data = roadmapData }) => {
  // Determine completed lessons from the data (demo). In a real app this comes from user profile/state.
  const initialCompleted = React.useMemo(() => {
    return data.flatMap(m => (m.subLessons || []).filter(s => s.completed).map(s => s.id));
  }, [data]);
  const [completedLessons, setCompletedLessons] = React.useState(initialCompleted);

  // derive milestone status from completed lessons per milestone
  const processedData = useMemo(() => {
    return data.map(milestone => {
      const total = milestone.subLessons ? milestone.subLessons.length : 0;
      const doneCount = milestone.subLessons ? milestone.subLessons.filter(l => completedLessons.includes(l.id)).length : 0;
      let status = 'locked';
      if (doneCount === total && total > 0) status = 'completed';
      else if (doneCount > 0) status = 'current';
      else status = 'locked';
      return { ...milestone, status };
    });
  }, [data, completedLessons]);

  // No expand/toggle state: lessons are always visible per user's request.

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-content">
        <Sidebar />
        <main className="dashboard-main">
          <header className="app-header">
            <h1>Learning Roadmap</h1>
            <p>Track your IELTS progress by milestone — lessons are shown for every milestone. Completed lessons are bold; locked lessons appear faded.</p>
          </header>

          <div className="app-main">
            <div className="roadmap-container">
              <div className="timeline-line"></div>
              <div className="milestones-wrapper">
                {processedData.map((milestone, index) => {
                  const isLeft = index % 2 === 0;
                  const position = isLeft ? 'left' : 'right';
                  const rowClass = isLeft ? 'milestone-row-left' : 'milestone-row-right';

                  return (
                    <div key={milestone.id} className={`milestone-row ${rowClass}`}>
                      <Milestone
                        milestone={milestone}
                        position={position}
                        completedLessons={completedLessons}
                      />

                      <div className="timeline-connector">
                        <div className={`timeline-circle ${milestone.status}`}></div>
                        <div className="timeline-branch"></div>
                      </div>
                      <div className="milestone-spacer"></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RoadmapComponent;
