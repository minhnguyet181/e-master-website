import React, { useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import "./Schedule.css";

export default function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const lessons = {
    "2025-11-03": { topic: "Reading Practice", time: "09:00 - 10:30" },
    "2025-11-06": { topic: "Listening Skills", time: "13:00 - 14:30" },
    "2025-11-12": { topic: "Writing Task 2", time: "15:00 - 16:30" },
    "2025-11-18": { topic: "Speaking Club", time: "14:00 - 15:30" },
    "2025-11-22": { topic: "Vocabulary Review", time: "10:00 - 11:30" },
    "2025-11-28": { topic: "Mock Test", time: "08:00 - 10:00" },
  };

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getDateKey = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // tạo ma trận lịch
  const calendar = [];
  let day = 1 - ((firstDay + 6) % 7); // bắt đầu từ thứ 2
  for (let i = 0; i < 6; i++) {
    const week = [];
    for (let j = 0; j < 7; j++) {
      week.push(new Date(year, month, day));
      day++;
    }
    calendar.push(week);
  }

  return (
    <div className="schedule-page">
      <Sidebar />
      <div className="schedule-main">
        <Navbar />

        <section className="calendar-section">
          <div className="calendar-header">
            <button onClick={prevMonth} className="month-btn">‹</button>
            <h2>{monthNames[month]} {year}</h2>
            <button onClick={nextMonth} className="month-btn">›</button>
          </div>

          <div className="calendar-grid">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="calendar-day">{d}</div>
            ))}

            {calendar.map((week, wi) =>
              week.map((date, di) => {
                const dateKey = getDateKey(date);
                const isCurrentMonth = date.getMonth() === month;
                const isToday = getDateKey(date) === getDateKey(today);
                const hasLesson = lessons[dateKey];

                return (
                  <div
                    key={`${wi}-${di}`}
                    className={`calendar-cell 
                      ${isCurrentMonth ? "" : "dimmed"} 
                      ${isToday ? "today" : ""} 
                      ${hasLesson ? "has-lesson" : ""}`}
                    onClick={() => {
                      if (isCurrentMonth) {
                        setSelectedDate(dateKey);
                        setShowPopup(true);
                      }
                    }}
                    onMouseEnter={() => setHoveredDate(dateKey)}
                    onMouseLeave={() => setHoveredDate(null)}
                  >
                    <div className="date-number">{date.getDate()}</div>
                    {hasLesson && <div className="dot"></div>}

                    {hoveredDate === dateKey && hasLesson && (
                      <div className="tooltip">
                        <strong>{lessons[dateKey].topic}</strong>
                        <div>{lessons[dateKey].time}</div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Popup hiển thị chi tiết */}
        {showPopup && (
          <div className="popup-overlay" onClick={() => setShowPopup(false)}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
              {lessons[selectedDate] ? (
                <>
                  <h3>Lesson on {selectedDate}</h3>
                  <p><strong>Topic:</strong> {lessons[selectedDate].topic}</p>
                  <p><strong>Time:</strong> {lessons[selectedDate].time}</p>
                </>
              ) : (
                <p>No lessons on this day.</p>
              )}
              <button className="close-btn" onClick={() => setShowPopup(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
