-- ============================================================
-- E-MASTER DATABASE SCHEMA (MySQL 8.0)
-- Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================

CREATE DATABASE IF NOT EXISTS `e-master`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `e-master`;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`                   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `username`             VARCHAR(100)    NOT NULL,
  `email`                VARCHAR(255)    NOT NULL,
  `password`             VARCHAR(255)    DEFAULT NULL,
  `google_id`            VARCHAR(255)    DEFAULT NULL,
  `role`                 VARCHAR(20)     NOT NULL DEFAULT 'student'  COMMENT 'student | admin',
  `goal`                 VARCHAR(255)    DEFAULT NULL,
  `band_target`          VARCHAR(50)     DEFAULT NULL               COMMENT 'e.g. Band 7.0',
  `current_band`         VARCHAR(50)     DEFAULT NULL               COMMENT 'set after placement test',
  `study_hours_per_day`  TINYINT UNSIGNED DEFAULT NULL,
  `reason`               VARCHAR(255)    DEFAULT NULL,
  `ai_recommendation`    TEXT            DEFAULT NULL,
  `onboarding_completed` TINYINT(1)      NOT NULL DEFAULT 0,
  `created_at`           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. TOKEN BLOCKLIST  (JWT logout)
-- ============================================================
CREATE TABLE IF NOT EXISTS `token_blocklist` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `token`      TEXT         NOT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. PLACEMENT TESTS
-- Bài test đầu vào để AI xác định band hiện tại của user
-- ============================================================
CREATE TABLE IF NOT EXISTS `placement_tests` (
  `id`                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`               INT UNSIGNED NOT NULL,
  `title`                 VARCHAR(255) DEFAULT NULL,
  `description`           TEXT         DEFAULT NULL,
  `answers`               JSON         DEFAULT NULL  COMMENT '[{question_id, answer}]',
  `scores`                JSON         DEFAULT NULL  COMMENT '{reading,listening,writing,speaking}',
  `assessed_band`         VARCHAR(50)  DEFAULT NULL  COMMENT 'e.g. Band 5.5',
  `assessed_level`        VARCHAR(50)  DEFAULT NULL  COMMENT 'Beginner|Intermediate|...',
  `ai_analysis`           TEXT         DEFAULT NULL,
  `weak_skills`           JSON         DEFAULT NULL  COMMENT '["writing","speaking"]',
  `strong_skills`         JSON         DEFAULT NULL,
  `recommended_program`   VARCHAR(255) DEFAULT NULL,
  `study_recommendations` JSON         DEFAULT NULL,
  `is_completed`          TINYINT(1)   NOT NULL DEFAULT 0,
  `completed_at`          DATETIME     DEFAULT NULL,
  `created_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pt_user_id`      (`user_id`),
  KEY `idx_pt_is_completed`  (`is_completed`),
  CONSTRAINT `fk_pt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. LEARNING PATHS
-- Lộ trình học được AI gen dựa trên current_band → target_band
-- ============================================================
CREATE TABLE IF NOT EXISTS `learning_paths` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`           INT UNSIGNED NOT NULL,
  `title`             VARCHAR(255) NOT NULL,
  `current_band`      VARCHAR(50)  DEFAULT NULL,
  `target_band`       VARCHAR(50)  DEFAULT NULL,
  `estimated_weeks`   SMALLINT UNSIGNED DEFAULT NULL,
  `ai_generated_plan` JSON         DEFAULT NULL  COMMENT 'Full plan JSON từ AI',
  `status`            VARCHAR(20)  NOT NULL DEFAULT 'active' COMMENT 'active|completed|paused',
  `generated_at`      DATETIME     DEFAULT NULL,
  `created_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lp_user_id` (`user_id`),
  KEY `idx_lp_status`  (`status`),
  CONSTRAINT `fk_lp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. LEARNING PATH WEEKS
-- Kế hoạch từng tuần trong lộ trình
-- ============================================================
CREATE TABLE IF NOT EXISTS `learning_path_weeks` (
  `id`                  INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `learning_path_id`    INT UNSIGNED   NOT NULL,
  `week_number`         SMALLINT UNSIGNED NOT NULL,
  `focus_skills`        JSON           DEFAULT NULL  COMMENT '["writing","speaking"]',
  `goals`               JSON           DEFAULT NULL  COMMENT 'string[] mục tiêu tuần',
  `resource_ids`        JSON           DEFAULT NULL  COMMENT 'number[] FK resources',
  `test_ids`            JSON           DEFAULT NULL  COMMENT 'number[] FK tests',
  `min_completion_rate` DECIMAL(4,2)   NOT NULL DEFAULT 0.70 COMMENT '0.70 = 70%',
  `created_at`          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_lpw_path_week` (`learning_path_id`, `week_number`),
  CONSTRAINT `fk_lpw_path` FOREIGN KEY (`learning_path_id`) REFERENCES `learning_paths` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. WEEKLY PROGRESS
-- Tiến độ thực tế từng tuần của user (thay thế bảng progress cũ)
-- ============================================================
CREATE TABLE IF NOT EXISTS `weekly_progress` (
  `id`               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `user_id`          INT UNSIGNED  NOT NULL,
  `learning_path_id` INT UNSIGNED  DEFAULT NULL,
  `week_number`      SMALLINT UNSIGNED NOT NULL,
  `week_start_date`  DATE          NOT NULL,
  `tasks_total`      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `tasks_completed`  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `tests_done`       JSON          DEFAULT NULL COMMENT '[{test_id,attempt_id,score}]',
  `resources_viewed` JSON          DEFAULT NULL COMMENT '[resource_id,...]',
  `completion_rate`  DECIMAL(4,2)  NOT NULL DEFAULT 0.00,
  `reminder_sent`    TINYINT(1)    NOT NULL DEFAULT 0,
  `reminder_sent_at` DATETIME      DEFAULT NULL,
  `created_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wp_user_week` (`user_id`, `week_number`),
  KEY `idx_wp_lp`         (`learning_path_id`),
  KEY `idx_wp_week_start` (`week_start_date`),
  CONSTRAINT `fk_wp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wp_lp`   FOREIGN KEY (`learning_path_id`) REFERENCES `learning_paths` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. GOALS
-- Mục tiêu học tập cá nhân của user
-- ============================================================
CREATE TABLE IF NOT EXISTS `goals` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED DEFAULT NULL,
  `title`       VARCHAR(255) NOT NULL,
  `description` TEXT         DEFAULT NULL,
  `target_date` DATE         DEFAULT NULL,
  `progress`    TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0-100',
  `status`      VARCHAR(50)  NOT NULL DEFAULT 'pending' COMMENT 'pending|in_progress|completed|cancelled',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_goals_user_id` (`user_id`),
  KEY `idx_goals_status`  (`status`),
  CONSTRAINT `fk_goals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. RESOURCES
-- Tài liệu học tập (articles, videos, tips, grammar, vocab...)
-- AI dùng để gợi ý theo lộ trình
-- ============================================================
CREATE TABLE IF NOT EXISTS `resources` (
  `id`              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `title`           VARCHAR(500)  NOT NULL,
  `content`         LONGTEXT      NOT NULL  COMMENT 'Nội dung đầy đủ, chatbot tham khảo',
  `summary`         TEXT          DEFAULT NULL,
  `resource_type`   VARCHAR(50)   NOT NULL  COMMENT 'video|tip|grammar_rule|vocabulary|template|example|article',
  `skill`           VARCHAR(30)   NOT NULL  COMMENT 'reading|listening|writing|speaking|vocabulary|grammar|general',
  `level`           VARCHAR(50)   DEFAULT NULL COMMENT 'Band 4-5 | Band 6-7 | Beginner | ...',
  `difficulty`      TINYINT UNSIGNED DEFAULT 3 COMMENT '1-5',
  `tags`            JSON          DEFAULT NULL,
  `keywords`        JSON          DEFAULT NULL,
  `url`             VARCHAR(1000) DEFAULT NULL,
  `source`          VARCHAR(255)  DEFAULT NULL,
  `image_url`       VARCHAR(500)  DEFAULT NULL,
  `video_url`       VARCHAR(500)  DEFAULT NULL,
  `video_duration`  INT UNSIGNED  DEFAULT NULL COMMENT 'seconds',
  `view_count`      INT UNSIGNED  NOT NULL DEFAULT 0,
  `helpful_count`   INT UNSIGNED  NOT NULL DEFAULT 0,
  `unhelpful_count` INT UNSIGNED  NOT NULL DEFAULT 0,
  `average_rating`  DECIMAL(3,2)  DEFAULT NULL,
  `is_active`       TINYINT(1)    NOT NULL DEFAULT 1,
  `is_featured`     TINYINT(1)    NOT NULL DEFAULT 0,
  `metadata`        JSON          DEFAULT NULL,
  `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_res_skill`       (`skill`),
  KEY `idx_res_type`        (`resource_type`),
  KEY `idx_res_level`       (`level`),
  KEY `idx_res_is_active`   (`is_active`),
  KEY `idx_res_is_featured` (`is_featured`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. TESTS  (metadata của đề thi)
-- Hỗ trợ 4 kỹ năng, mọi dạng bài, có thể upload PDF
-- ============================================================
CREATE TABLE IF NOT EXISTS `tests` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`             VARCHAR(80)  NOT NULL  COMMENT 'unique code, e.g. IELTS-R-001',
  `name`             VARCHAR(255) NOT NULL,
  `test_type`        VARCHAR(20)  NOT NULL  COMMENT 'listening|reading|writing|speaking',
  `task_type`        VARCHAR(20)  DEFAULT NULL COMMENT 'task1|task2 (writing); part1|part2|part3 (speaking)',
  `description`      TEXT         DEFAULT NULL,
  `duration_minutes` SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  `level`            VARCHAR(50)  NOT NULL DEFAULT 'IELTS',
  `audio_url`        VARCHAR(500) DEFAULT NULL COMMENT 'URL audio chính cho listening test',
  `pdf_url`          VARCHAR(500) DEFAULT NULL COMMENT 'File PDF gốc do admin upload',
  `pdf_parsed`       TINYINT(1)   NOT NULL DEFAULT 0,
  `source`           VARCHAR(20)  NOT NULL DEFAULT 'db' COMMENT 'db|pdf|static',
  `is_active`        TINYINT(1)   NOT NULL DEFAULT 1,
  `tags`             JSON         DEFAULT NULL,
  `metadata`         JSON         DEFAULT NULL,
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tests_code` (`code`),
  KEY `idx_tests_type`      (`test_type`),
  KEY `idx_tests_is_active` (`is_active`),
  KEY `idx_tests_source`    (`source`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. TEST SECTIONS
-- Mỗi test có nhiều section (passage, part, task...)
-- Reading: 3 passages | Listening: 4 parts | Writing: task1+task2 | Speaking: part1-3
-- ============================================================
CREATE TABLE IF NOT EXISTS `test_sections` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `test_id`      INT UNSIGNED NOT NULL,
  `section_no`   TINYINT UNSIGNED NOT NULL,
  `title`        VARCHAR(255) DEFAULT NULL,
  `passage_text` LONGTEXT     DEFAULT NULL COMMENT 'Nội dung bài đọc (reading)',
  `audio_url`    VARCHAR(500) DEFAULT NULL COMMENT 'Audio riêng từng part (listening)',
  `image_url`    VARCHAR(500) DEFAULT NULL COMMENT 'Hình ảnh (writing task1: chart/graph)',
  `prompt`       TEXT         DEFAULT NULL COMMENT 'Đề bài (writing/speaking)',
  `content`      JSON         DEFAULT NULL COMMENT 'Structured content linh hoạt',
  `media`        JSON         DEFAULT NULL COMMENT 'Extra media files',
  `metadata`     JSON         DEFAULT NULL,
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ts_test_section` (`test_id`, `section_no`),
  KEY `idx_ts_test_id` (`test_id`),
  CONSTRAINT `fk_ts_test` FOREIGN KEY (`test_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. TEST QUESTIONS
-- Câu hỏi trong từng section
-- question_type: multiple_choice | fill_blank | true_false |
--                matching | short_answer | essay | map_labelling |
--                sentence_completion | summary_completion
-- ============================================================
CREATE TABLE IF NOT EXISTS `test_questions` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `test_id`        INT UNSIGNED NOT NULL,
  `section_id`     INT UNSIGNED DEFAULT NULL,
  `public_id`      VARCHAR(150) NOT NULL  COMMENT 'Stable ID dùng để map answers, e.g. r001-s1-q1',
  `question_no`    SMALLINT UNSIGNED NOT NULL,
  `question_type`  VARCHAR(50)  NOT NULL  COMMENT 'multiple_choice|fill_blank|true_false|matching|short_answer|essay|map_labelling|sentence_completion|summary_completion',
  `prompt`         TEXT         DEFAULT NULL COMMENT 'Nội dung câu hỏi',
  `options`        JSON         DEFAULT NULL COMMENT '["A. ...", "B. ...", "C. ...", "D. ..."]',
  `correct_answer` TEXT         DEFAULT NULL COMMENT 'NULL cho writing/speaking (AI grade)',
  `points`         TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `metadata`       JSON         DEFAULT NULL COMMENT '{hint, explanation, topic, ...}',
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tq_public_id` (`public_id`),
  UNIQUE KEY `uq_tq_test_section_no` (`test_id`, `section_id`, `question_no`),
  KEY `idx_tq_test_id`    (`test_id`),
  KEY `idx_tq_section_id` (`section_id`),
  KEY `idx_tq_type`       (`question_type`),
  CONSTRAINT `fk_tq_test`    FOREIGN KEY (`test_id`)    REFERENCES `tests`         (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tq_section` FOREIGN KEY (`section_id`) REFERENCES `test_sections` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. TEST ATTEMPTS
-- Mỗi lần user nộp bài thi
-- ============================================================
CREATE TABLE IF NOT EXISTS `test_attempts` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`       INT UNSIGNED NOT NULL,
  `test_id`       INT UNSIGNED NOT NULL,
  `test_type`     VARCHAR(20)  NOT NULL,
  `status`        VARCHAR(20)  NOT NULL DEFAULT 'submitted' COMMENT 'submitted|grading|graded|error',
  `answers`       JSON         NOT NULL COMMENT '{public_id: answer, ...}',
  `answer_hash`   VARCHAR(64)  NOT NULL COMMENT 'SHA256 để detect duplicate',
  `result_json`   JSON         DEFAULT NULL COMMENT 'Full grading result',
  `score_numeric` DOUBLE       DEFAULT NULL COMMENT 'Band score hoặc % đúng',
  `correct_count` SMALLINT UNSIGNED DEFAULT NULL,
  `total_count`   SMALLINT UNSIGNED DEFAULT NULL,
  `cache_hit`     TINYINT(1)   NOT NULL DEFAULT 0,
  `error_message` TEXT         DEFAULT NULL,
  `submitted_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `graded_at`     DATETIME     DEFAULT NULL,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ta_user_id`     (`user_id`),
  KEY `idx_ta_test_id`     (`test_id`),
  KEY `idx_ta_status`      (`status`),
  KEY `idx_ta_answer_hash` (`answer_hash`),
  CONSTRAINT `fk_ta_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ta_test` FOREIGN KEY (`test_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. GRADING CACHE
-- Cache kết quả AI grading để tránh gọi lại API
-- ============================================================
CREATE TABLE IF NOT EXISTS `grading_cache` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `cache_key`   VARCHAR(200) NOT NULL,
  `test_type`   VARCHAR(20)  NOT NULL,
  `answer_hash` VARCHAR(64)  NOT NULL,
  `rubric_ver`  VARCHAR(30)  NOT NULL DEFAULT 'v1',
  `ai_provider` VARCHAR(30)  NOT NULL DEFAULT 'gemini',
  `result_json` JSON         NOT NULL,
  `hit_count`   INT UNSIGNED NOT NULL DEFAULT 0,
  `expires_at`  DATETIME     DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_gc_cache_key`  (`cache_key`),
  KEY `idx_gc_answer_hash` (`answer_hash`),
  KEY `idx_gc_expires_at`  (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. PRACTICE MATERIALS
-- Tài liệu luyện tập (khác với test chính thức)
-- ============================================================
CREATE TABLE IF NOT EXISTS `practice_materials` (
  `id`               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `title`            VARCHAR(500)  NOT NULL,
  `skill`            VARCHAR(20)   NOT NULL  COMMENT 'reading|listening|writing|speaking',
  `material_type`    VARCHAR(50)   NOT NULL  COMMENT 'reading_passage|writing_prompt|speaking_topic|listening_audio|mixed',
  `difficulty_level` VARCHAR(20)   DEFAULT NULL COMMENT 'easy|medium|hard',
  `exam_type`        VARCHAR(50)   NOT NULL DEFAULT 'IELTS',
  `test_number`      SMALLINT UNSIGNED DEFAULT NULL,
  `topic`            VARCHAR(100)  DEFAULT NULL,
  `estimated_band`   DECIMAL(2,1)  DEFAULT NULL,
  `word_count`       SMALLINT UNSIGNED DEFAULT NULL,
  `duration_minutes` SMALLINT UNSIGNED DEFAULT NULL,
  `source_file`      VARCHAR(255)  DEFAULT NULL,
  `tags`             JSON          DEFAULT NULL,
  `keywords`         JSON          DEFAULT NULL,
  `metadata`         JSON          DEFAULT NULL,
  `is_active`        TINYINT(1)    NOT NULL DEFAULT 1,
  `is_featured`      TINYINT(1)    NOT NULL DEFAULT 0,
  `view_count`       INT UNSIGNED  NOT NULL DEFAULT 0,
  `attempt_count`    INT UNSIGNED  NOT NULL DEFAULT 0,
  `average_score`    DECIMAL(3,1)  DEFAULT NULL,
  `created_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pm_skill`       (`skill`),
  KEY `idx_pm_difficulty`  (`difficulty_level`),
  KEY `idx_pm_is_active`   (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. PRACTICE PASSAGES
-- Nội dung bài đọc / audio transcript tách riêng để tối ưu query
-- ============================================================
CREATE TABLE IF NOT EXISTS `practice_passages` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `material_id`    INT UNSIGNED NOT NULL,
  `passage_number` TINYINT UNSIGNED NOT NULL,
  `passage_title`  VARCHAR(500) DEFAULT NULL,
  `content`        LONGTEXT     NOT NULL,
  `audio_url`      VARCHAR(500) DEFAULT NULL COMMENT 'Audio cho listening passage',
  `image_url`      VARCHAR(500) DEFAULT NULL COMMENT 'Hình ảnh đi kèm',
  `summary`        TEXT         DEFAULT NULL,
  `word_count`     SMALLINT UNSIGNED DEFAULT NULL,
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pp_material_passage` (`material_id`, `passage_number`),
  KEY `idx_pp_material_id` (`material_id`),
  CONSTRAINT `fk_pp_material` FOREIGN KEY (`material_id`) REFERENCES `practice_materials` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. PRACTICE QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS `practice_questions` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `material_id`     INT UNSIGNED NOT NULL,
  `passage_id`      INT UNSIGNED DEFAULT NULL,
  `question_number` SMALLINT UNSIGNED NOT NULL,
  `question_text`   TEXT         NOT NULL,
  `question_type`   VARCHAR(50)  DEFAULT NULL,
  `options`         JSON         DEFAULT NULL,
  `correct_answer`  TEXT         DEFAULT NULL,
  `explanation`     TEXT         DEFAULT NULL,
  `points`          TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `difficulty`      VARCHAR(20)  DEFAULT NULL,
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pq_material_qno` (`material_id`, `question_number`),
  KEY `idx_pq_material_id` (`material_id`),
  KEY `idx_pq_passage_id`  (`passage_id`),
  CONSTRAINT `fk_pq_material` FOREIGN KEY (`material_id`) REFERENCES `practice_materials` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pq_passage`  FOREIGN KEY (`passage_id`)  REFERENCES `practice_passages`  (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 17. PRACTICE ANSWERS  (answer key cho từng material)
-- ============================================================
CREATE TABLE IF NOT EXISTS `practice_answers` (
  `id`                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `material_id`          INT UNSIGNED NOT NULL,
  `answer_key`           JSON         NOT NULL COMMENT '{1:"A", 2:"B", ...}',
  `detailed_explanation` TEXT         DEFAULT NULL,
  `scoring_guide`        JSON         DEFAULT NULL,
  `created_at`           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pa_material_id` (`material_id`),
  CONSTRAINT `fk_pa_material` FOREIGN KEY (`material_id`) REFERENCES `practice_materials` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 18. USER PRACTICE ATTEMPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS `user_practice_attempts` (
  `id`                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `user_id`             INT UNSIGNED  NOT NULL,
  `material_id`         INT UNSIGNED  NOT NULL,
  `answers`             JSON          NOT NULL,
  `score`               DECIMAL(3,1)  DEFAULT NULL,
  `time_spent_minutes`  SMALLINT UNSIGNED DEFAULT NULL,
  `correct_count`       SMALLINT UNSIGNED DEFAULT NULL,
  `incorrect_count`     SMALLINT UNSIGNED DEFAULT NULL,
  `skipped_count`       SMALLINT UNSIGNED DEFAULT NULL,
  `accuracy_rate`       DECIMAL(5,2)  DEFAULT NULL,
  `ai_feedback`         TEXT          DEFAULT NULL,
  `weak_areas`          JSON          DEFAULT NULL,
  `strong_areas`        JSON          DEFAULT NULL,
  `recommendations`     JSON          DEFAULT NULL,
  `started_at`          DATETIME      DEFAULT NULL,
  `submitted_at`        DATETIME      DEFAULT CURRENT_TIMESTAMP,
  `created_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_upa_user_id`     (`user_id`),
  KEY `idx_upa_material_id` (`material_id`),
  KEY `idx_upa_submitted`   (`submitted_at`),
  CONSTRAINT `fk_upa_user`     FOREIGN KEY (`user_id`)     REFERENCES `users`              (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_upa_material` FOREIGN KEY (`material_id`) REFERENCES `practice_materials` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 19. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED DEFAULT NULL,
  `title`      VARCHAR(255) DEFAULT NULL,
  `message`    TEXT         DEFAULT NULL,
  `type`       VARCHAR(50)  NOT NULL DEFAULT 'info' COMMENT 'info|warning|reminder|congrats',
  `is_read`    TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user_id`   (`user_id`),
  KEY `idx_notif_is_read`   (`is_read`),
  KEY `idx_notif_created`   (`created_at`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 20. AI RECOMMENDATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS `ai_recommendations` (
  `id`                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`             INT UNSIGNED DEFAULT NULL,
  `recommendation_type` VARCHAR(100) DEFAULT NULL COMMENT 'study_plan|resource|practice_test|...',
  `content`             TEXT         DEFAULT NULL,
  `score`               DOUBLE       DEFAULT NULL COMMENT '0.0-1.0 relevance score',
  `created_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_air_user_id` (`user_id`),
  KEY `idx_air_type`    (`recommendation_type`),
  CONSTRAINT `fk_air_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 21. CONVERSATIONS  (AI chat history)
-- ============================================================
CREATE TABLE IF NOT EXISTS `conversations` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED DEFAULT NULL,
  `topic`      VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_conv_user_id` (`user_id`),
  CONSTRAINT `fk_conv_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 22. MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS `messages` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` INT UNSIGNED DEFAULT NULL,
  `role`            VARCHAR(20)  NOT NULL DEFAULT 'user' COMMENT 'user|assistant',
  `content`         TEXT         NOT NULL,
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_msg_conv_id` (`conversation_id`),
  CONSTRAINT `fk_msg_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 23. PROGRAMS  (chương trình học)
-- ============================================================
CREATE TABLE IF NOT EXISTS `programs` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(255) NOT NULL,
  `description` TEXT         DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 24. USER ENROLLMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS `user_enrollments` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED DEFAULT NULL,
  `program_id`  INT UNSIGNED DEFAULT NULL,
  `enrolled_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ue_user_id`    (`user_id`),
  KEY `idx_ue_program_id` (`program_id`),
  CONSTRAINT `fk_ue_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`    (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ue_program` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- DONE — 24 tables created
-- Run: mysql -u root -pmoon123 e-master < schema.sql
-- ============================================================
