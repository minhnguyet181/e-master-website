# Database Schema - IELTS Learning Platform

## 📊 TỔNG QUAN

Database được thiết kế cho nền tảng học IELTS với 22 bảng, chia thành 5 nhóm chính:

1. **User Management** (6 bảng) - Quản lý người dùng
2. **Practice Materials** (5 bảng) - Tài liệu luyện tập
3. **Learning Resources** (4 bảng) - Tài liệu học tập
4. **Assessment** (4 bảng) - Đánh giá & kiểm tra
5. **System** (3 bảng) - Hệ thống

---

## 1️⃣ USER MANAGEMENT (Quản lý người dùng)

### 1.1. `users`
Thông tin người dùng

```sql
CREATE TABLE users (
  id                    SERIAL PRIMARY KEY,
  username              VARCHAR(100) NOT NULL UNIQUE,
  email                 VARCHAR(255) NOT NULL UNIQUE,
  password              VARCHAR(255),
  googleId              VARCHAR(255),
  goal                  VARCHAR(255),
  band_target           VARCHAR(50),
  current_band          VARCHAR(50),
  study_hours_per_day   INTEGER,
  reason                VARCHAR(255),
  ai_recommendation     TEXT,
  createdAt             TIMESTAMP NOT NULL,
  updatedAt             TIMESTAMP NOT NULL
);
```

**Indexes:**
- `UNIQUE(username)`
- `UNIQUE(email)`

---

### 1.2. `goals`
Mục tiêu học tập của user

```sql
CREATE TABLE goals (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER REFERENCES users(id),
  title                 VARCHAR(255) NOT NULL,
  description           TEXT,
  target_date           DATE,
  progress              INTEGER DEFAULT 0,
  status                VARCHAR(50) DEFAULT 'pending',
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `INDEX(user_id)`
- `INDEX(status)`

---

### 1.3. `progress`
Tiến độ học tập theo kỹ năng

```sql
CREATE TABLE progress (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER NOT NULL REFERENCES users(id),
  type                  VARCHAR(50) NOT NULL,  -- reading, writing, speaking, listening
  total                 INTEGER NOT NULL DEFAULT 0,
  completed             INTEGER NOT NULL DEFAULT 0,
  createdAt             TIMESTAMP NOT NULL,
  updatedAt             TIMESTAMP NOT NULL
);
```

**Indexes:**
- `INDEX(user_id)`
- `INDEX(type)`

---

### 1.4. `user_progress`
Tiến độ học theo khóa học

```sql
CREATE TABLE user_progress (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER REFERENCES users(id),
  course_id             INTEGER,
  completed_lessons     INTEGER DEFAULT 0,
  total_lessons         INTEGER DEFAULT 0,
  completion_rate       DOUBLE PRECISION DEFAULT 0,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `INDEX(user_id)`
- `INDEX(course_id)`

---

### 1.5. `ai_recommendations`
Gợi ý từ AI cho user

```sql
CREATE TABLE ai_recommendations (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER REFERENCES users(id),
  recommendation_type   VARCHAR(100),
  content               TEXT,
  score                 DOUBLE PRECISION,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `INDEX(user_id)`
- `INDEX(recommendation_type)`

---

### 1.6. `notifications`
Thông báo cho user

```sql
CREATE TABLE notifications (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER REFERENCES users(id),
  title                 VARCHAR(255),
  message               TEXT,
  is_read               BOOLEAN DEFAULT false,
  created_at            TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `INDEX(user_id)`
- `INDEX(is_read)`
- `INDEX(created_at)`

---

## 2️⃣ PRACTICE MATERIALS (Tài liệu luyện tập)

### 2.1. `practice_materials`
Bảng chính - Metadata của practice materials

```sql
CREATE TABLE practice_materials (
  id                    SERIAL PRIMARY KEY,
  title                 VARCHAR(500) NOT NULL,
  skill                 VARCHAR(20) NOT NULL,      -- reading, writing, speaking, listening
  material_type         VARCHAR(50) NOT NULL,      -- reading_passage, writing_prompt, etc.
  difficulty_level      VARCHAR(20),               -- easy, medium, hard
  exam_type             VARCHAR(50) DEFAULT 'IELTS',
  test_number           INTEGER,
  topic                 VARCHAR(100),
  estimated_band        DECIMAL(2,1),              -- 5.0, 6.5, 7.0, etc.
  word_count            INTEGER,
  duration_minutes      INTEGER,
  source_file           VARCHAR(255),
  
  -- Metadata
  tags                  JSONB,
  keywords              JSONB,
  metadata              JSONB,
  
  -- Status
  is_active             BOOLEAN DEFAULT true,
  is_featured           BOOLEAN DEFAULT false,
  
  -- Tracking
  view_count            INTEGER DEFAULT 0,
  attempt_count         INTEGER DEFAULT 0,
  average_score         DECIMAL(3,1),
  
  -- Timestamps
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `INDEX(skill)`
- `INDEX(difficulty_level)`
- `INDEX(topic)`
- `INDEX(test_number)`
- `INDEX(is_active)`

---

### 2.2. `practice_passages`
Nội dung passages (tách riêng để optimize)

```sql
CREATE TABLE practice_passages (
  id                    SERIAL PRIMARY KEY,
  material_id           INTEGER NOT NULL REFERENCES practice_materials(id) ON DELETE CASCADE,
  passage_number        INTEGER NOT NULL,
  passage_title         VARCHAR(500),
  content               TEXT NOT NULL,
  summary               TEXT,
  word_count            INTEGER,
  created_at            TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_material_passage UNIQUE(material_id, passage_number)
);
```

**Indexes:**
- `INDEX(material_id)`

---

### 2.3. `practice_questions`
Câu hỏi cho practice materials

```sql
CREATE TABLE practice_questions (
  id                    SERIAL PRIMARY KEY,
  material_id           INTEGER NOT NULL REFERENCES practice_materials(id) ON DELETE CASCADE,
  passage_id            INTEGER REFERENCES practice_passages(id) ON DELETE SET NULL,
  question_number       INTEGER NOT NULL,
  question_text         TEXT NOT NULL,
  question_type         VARCHAR(50),               -- multiple_choice, true_false, etc.
  options               JSONB,
  correct_answer        TEXT,
  explanation           TEXT,
  points                INTEGER DEFAULT 1,
  difficulty            VARCHAR(20),
  created_at            TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_material_question UNIQUE(material_id, question_number)
);
```

**Indexes:**
- `INDEX(material_id)`
- `INDEX(passage_id)`
- `INDEX(question_type)`

---

### 2.4. `practice_answers`
Đáp án và giải thích

```sql
CREATE TABLE practice_answers (
  id                    SERIAL PRIMARY KEY,
  material_id           INTEGER NOT NULL REFERENCES practice_materials(id) ON DELETE CASCADE,
  answer_key            JSONB NOT NULL,
  detailed_explanation  TEXT,
  scoring_guide         JSONB,
  created_at            TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_material_answer UNIQUE(material_id)
);
```

**Indexes:**
- `INDEX(material_id)`

---

### 2.5. `user_practice_attempts`
Tracking user attempts

```sql
CREATE TABLE user_practice_attempts (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  material_id           INTEGER NOT NULL REFERENCES practice_materials(id) ON DELETE CASCADE,
  
  -- Submission
  answers               JSONB NOT NULL,
  score                 DECIMAL(3,1),
  time_spent_minutes    INTEGER,
  
  -- Analysis
  correct_count         INTEGER,
  incorrect_count       INTEGER,
  skipped_count         INTEGER,
  accuracy_rate         DECIMAL(5,2),
  
  -- AI Feedback
  ai_feedback           TEXT,
  weak_areas            JSONB,
  strong_areas          JSONB,
  recommendations       JSONB,
  
  -- Timestamps
  started_at            TIMESTAMP,
  submitted_at          TIMESTAMP DEFAULT NOW(),
  created_at            TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `INDEX(user_id)`
- `INDEX(material_id)`
- `INDEX(submitted_at)`

---

## 3️⃣ LEARNING RESOURCES (Tài liệu học tập)

### 3.1. `resources`
Tài liệu học tập (videos, tips, grammar)

```sql
CREATE TABLE resources (
  id                    SERIAL PRIMARY KEY,
  title                 VARCHAR(500) NOT NULL,
  content               TEXT NOT NULL,
  summary               TEXT,
  resource_type         VARCHAR(12) NOT NULL,      -- video, tip, grammar_rule, vocabulary, template, example
  skill                 VARCHAR(10) NOT NULL,      -- reading, listening, writing, speaking, vocabulary, grammar, general
  level                 VARCHAR(50),
  difficulty            INTEGER DEFAULT 3,
  tags                  JSONB,
  keywords              JSONB,
  url                   VARCHAR(1000),
  source                VARCHAR(255),
  image_url             VARCHAR(500),
  video_url             VARCHAR(500),
  video_duration        INTEGER,
  view_count            INTEGER DEFAULT 0,
  helpful_count         INTEGER DEFAULT 0,
  unhelpful_count       INTEGER DEFAULT 0,
  average_rating        NUMERIC(3,2),
  is_active             BOOLEAN DEFAULT true,
  is_featured           BOOLEAN DEFAULT false,
  metadata              JSONB,
  createdAt             TIMESTAMP NOT NULL,
  updatedAt             TIMESTAMP NOT NULL
);
```

**Indexes:**
- `INDEX(resource_type)`
- `INDEX(skill)`
- `INDEX(is_active)`
- `INDEX(is_featured)`

---

### 3.2. `learning_activities`
Các hoạt động học tập

```sql
CREATE TABLE learning_activities (
  id                    SERIAL PRIMARY KEY,
  name                  VARCHAR(255) NOT NULL,
  description           TEXT,
  createdAt             TIMESTAMP NOT NULL,
  updatedAt             TIMESTAMP NOT NULL
);
```

---

### 3.3. `learning_paths`
Lộ trình học tập

```sql
CREATE TABLE learning_paths (
  id                    SERIAL PRIMARY KEY,
  title                 VARCHAR(255) NOT NULL,
  createdAt             TIMESTAMP NOT NULL,
  updatedAt             TIMESTAMP NOT NULL
);
```

---

### 3.4. `user_courses`
Khóa học của user

```sql
CREATE TABLE user_courses (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER REFERENCES users(id),
  course_id             INTEGER,
  progress              INTEGER DEFAULT 0,
  status                VARCHAR(50) DEFAULT 'in_progress',
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `INDEX(user_id)`
- `INDEX(course_id)`
- `INDEX(status)`

---

## 4️⃣ ASSESSMENT (Đánh giá & Kiểm tra)

### 4.1. `tests`
Bài kiểm tra chính thức

```sql
CREATE TABLE tests (
  id                    SERIAL PRIMARY KEY,
  name                  VARCHAR(255) NOT NULL,
  test_type             VARCHAR(9) NOT NULL,       -- reading, writing, speaking, listening
  description           TEXT,
  duration_minutes      INTEGER DEFAULT 60,
  level                 VARCHAR(50) DEFAULT 'IELTS',
  createdAt             TIMESTAMP NOT NULL,
  updatedAt             TIMESTAMP NOT NULL
);
```

**Indexes:**
- `INDEX(test_type)`
- `INDEX(level)`

---

### 4.2. `questions`
Câu hỏi cho tests

```sql
CREATE TABLE questions (
  id                    SERIAL PRIMARY KEY,
  content               TEXT NOT NULL,
  options               JSONB,
  correct_answer        VARCHAR(255),
  points                INTEGER,
  hint                  TEXT,
  createdAt             TIMESTAMP NOT NULL,
  updatedAt             TIMESTAMP NOT NULL
);
```

---

### 4.3. `question_types`
Loại câu hỏi

```sql
CREATE TABLE question_types (
  id                    SERIAL PRIMARY KEY,
  name                  VARCHAR(100) NOT NULL,
  description           TEXT,
  createdAt             TIMESTAMP NOT NULL,
  updatedAt             TIMESTAMP NOT NULL
);
```

---

### 4.4. `user_submissions`
Bài làm của user

```sql
CREATE TABLE user_submissions (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER NOT NULL REFERENCES users(id),
  test_id               INTEGER NOT NULL REFERENCES tests(id),
  answers               JSONB,
  is_correct            BOOLEAN DEFAULT false,
  score                 DOUBLE PRECISION,
  ai_feedback           TEXT,
  submitted_at          TIMESTAMP,
  createdAt             TIMESTAMP NOT NULL,
  updatedAt             TIMESTAMP NOT NULL
);
```

**Indexes:**
- `INDEX(user_id)`
- `INDEX(test_id)`
- `INDEX(submitted_at)`

---

### 4.5. `placement_tests`
Bài kiểm tra đầu vào

```sql
CREATE TABLE placement_tests (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER NOT NULL REFERENCES users(id),
  title                 VARCHAR(255),
  description           TEXT,
  answers               JSONB,
  scores                JSONB,
  assessed_band         VARCHAR(50),
  assessed_level        VARCHAR(50),
  ai_analysis           TEXT,
  weak_skills           JSONB,
  strong_skills         JSONB,
  recommended_program   VARCHAR(255),
  study_recommendations JSONB,
  is_completed          BOOLEAN DEFAULT false,
  completed_at          TIMESTAMP,
  createdAt             TIMESTAMP NOT NULL,
  updatedAt             TIMESTAMP NOT NULL
);
```

**Indexes:**
- `INDEX(user_id)`
- `INDEX(is_completed)`

---

## 5️⃣ SYSTEM (Hệ thống)

### 5.1. `token_blocklist`
Danh sách token bị chặn

```sql
CREATE TABLE token_blocklist (
  id                    SERIAL PRIMARY KEY,
  token                 TEXT NOT NULL,
  createdAt             TIMESTAMP
);
```

**Indexes:**
- `INDEX(token)`

---

### 5.2. `messages`
Tin nhắn hệ thống

```sql
CREATE TABLE messages (
  id                    SERIAL PRIMARY KEY,
  content               TEXT NOT NULL,
  createdAt             TIMESTAMP NOT NULL,
  updatedAt             TIMESTAMP NOT NULL
);
```

---

## 📊 RELATIONSHIPS DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                               │
│                           │                                 │
│         ┌─────────────────┼─────────────────┐              │
│         │                 │                 │              │
│         ▼                 ▼                 ▼              │
│      goals          progress        notifications          │
│         │                 │                 │              │
│         │                 │                 │              │
│         ▼                 ▼                 ▼              │
│  ai_recommendations  user_progress  user_courses           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  PRACTICE MATERIALS                         │
│                                                             │
│              practice_materials (main)                      │
│                      │                                      │
│         ┌────────────┼────────────┐                        │
│         │            │            │                        │
│         ▼            ▼            ▼                        │
│  practice_passages  practice_questions  practice_answers   │
│                      │                                      │
│                      ▼                                      │
│            user_practice_attempts                           │
│                      │                                      │
│                      ▼                                      │
│                    users                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ASSESSMENT                               │
│                                                             │
│                     tests                                   │
│                      │                                      │
│         ┌────────────┼────────────┐                        │
│         │            │            │                        │
│         ▼            ▼            ▼                        │
│    questions   user_submissions  placement_tests           │
│                      │            │                        │
│                      └────────────┘                        │
│                           │                                │
│                           ▼                                │
│                         users                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  LEARNING RESOURCES                         │
│                                                             │
│                    resources                                │
│                                                             │
│              learning_activities                            │
│                                                             │
│               learning_paths                                │
│                                                             │
│                user_courses                                 │
│                      │                                      │
│                      ▼                                      │
│                    users                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 KEY DESIGN DECISIONS

### 1. **Separation of Concerns**
- `resources` → Learning materials (videos, tips, grammar)
- `practice_materials` → Practice tests & exercises
- `tests` → Formal assessments

### 2. **Content Optimization**
- `practice_passages` tách riêng để optimize performance
- Large content không lưu trong bảng chính

### 3. **Flexible Metadata**
- Sử dụng JSONB cho metadata, tags, keywords
- Dễ mở rộng không cần alter table

### 4. **User Tracking**
- `user_practice_attempts` track chi tiết attempts
- `progress` track tổng quan theo skill
- `user_progress` track theo course

### 5. **Scalability**
- Indexes trên các foreign keys
- Indexes trên các filter columns thường dùng
- ON DELETE CASCADE để maintain data integrity

---

## 📈 STATISTICS

| Category | Tables | Total Records (Sample) |
|----------|--------|------------------------|
| User Management | 6 | ~250 |
| Practice Materials | 5 | ~200 |
| Learning Resources | 4 | ~10 |
| Assessment | 5 | ~170 |
| System | 2 | ~0 |
| **TOTAL** | **22** | **~630** |

---

## 🚀 PERFORMANCE CONSIDERATIONS

### Indexes Created:
- **Primary Keys**: 22 indexes (auto)
- **Foreign Keys**: 15 indexes
- **Filter Columns**: 20 indexes
- **Unique Constraints**: 5 indexes

### Query Optimization:
- Content tách riêng (practice_passages)
- JSONB indexes cho metadata
- Composite indexes cho common queries

### Caching Strategy:
- Cache practice_materials metadata
- Cache user progress
- Cache frequently accessed resources

---

## 📝 NOTES

1. **Timestamps**: Một số bảng dùng `createdAt/updatedAt`, một số dùng `created_at/updated_at`
2. **JSONB**: Sử dụng rộng rãi cho flexibility
3. **Enums**: Một số bảng có enum constraints (resources.resource_type, resources.skill)
4. **Cascading**: ON DELETE CASCADE được sử dụng để maintain data integrity

---

## 🔄 MIGRATION HISTORY

1. **Initial Schema** - Tạo 17 bảng ban đầu
2. **Migration 001** - Thêm 5 bảng practice_materials (2025-11-17)
3. **Data Migration** - Migrate 198 records từ resources sang practice_materials

---

*Last Updated: 2025-11-17*
*Database Version: PostgreSQL 14+*
*Total Tables: 22*
