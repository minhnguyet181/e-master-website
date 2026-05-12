
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `e-master`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE `e-master`;

-- ── Drop (reverse dependency order) ───────────────────────────────────────
DROP TABLE IF EXISTS `user_enrollments`;
DROP TABLE IF EXISTS `user_submissions`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `conversations`;
DROP TABLE IF EXISTS `ai_recommendations`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `user_practice_attempts`;
DROP TABLE IF EXISTS `practice_answers`;
DROP TABLE IF EXISTS `practice_questions`;
DROP TABLE IF EXISTS `practice_passages`;
DROP TABLE IF EXISTS `practice_materials`;
DROP TABLE IF EXISTS `grading_cache`;
DROP TABLE IF EXISTS `test_attempts`;
DROP TABLE IF EXISTS `test_questions`;
DROP TABLE IF EXISTS `test_sections`;
DROP TABLE IF EXISTS `tests`;
DROP TABLE IF EXISTS `resources`;
DROP TABLE IF EXISTS `goals`;
DROP TABLE IF EXISTS `weekly_progress`;
DROP TABLE IF EXISTS `learning_path_weeks`;
DROP TABLE IF EXISTS `learning_paths`;
DROP TABLE IF EXISTS `placement_tests`;
DROP TABLE IF EXISTS `token_blocklist`;
DROP TABLE IF EXISTS `programs`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ── 1. users ────────────────────────────────────────────────────────────────
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NULL,
  `google_id` VARCHAR(255) NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'student',
  `goal` VARCHAR(255) NULL,
  `band_target` VARCHAR(50) NULL,
  `current_band` VARCHAR(50) NULL,
  `study_hours_per_day` TINYINT UNSIGNED NULL,
  `reason` VARCHAR(255) NULL,
  `ai_recommendation` TEXT NULL,
  `onboarding_completed` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email` (`email`),
  KEY `users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. token_blocklist ─────────────────────────────────────────────────────
CREATE TABLE `token_blocklist` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `token` TEXT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. placement_tests ──────────────────────────────────────────────────────
CREATE TABLE `placement_tests` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `answers` JSON NULL,
  `scores` JSON NULL,
  `assessed_band` VARCHAR(50) NULL,
  `assessed_level` VARCHAR(50) NULL,
  `ai_analysis` TEXT NULL,
  `weak_skills` JSON NULL,
  `strong_skills` JSON NULL,
  `recommended_program` VARCHAR(255) NULL,
  `study_recommendations` JSON NULL,
  `is_completed` TINYINT NOT NULL DEFAULT 0,
  `completed_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `placement_tests_user_id` (`user_id`),
  KEY `placement_tests_is_completed` (`is_completed`),
  CONSTRAINT `placement_tests_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. learning_paths ───────────────────────────────────────────────────────
CREATE TABLE `learning_paths` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `current_band` VARCHAR(50) NULL,
  `target_band` VARCHAR(50) NULL,
  `estimated_weeks` SMALLINT UNSIGNED NULL,
  `ai_generated_plan` JSON NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `generated_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `learning_paths_user_id` (`user_id`),
  KEY `learning_paths_status` (`status`),
  CONSTRAINT `learning_paths_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 5. learning_path_weeks ──────────────────────────────────────────────────
CREATE TABLE `learning_path_weeks` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `learning_path_id` INT UNSIGNED NOT NULL,
  `week_number` SMALLINT UNSIGNED NOT NULL,
  `focus_skills` JSON NULL,
  `goals` JSON NULL,
  `resource_ids` JSON NULL,
  `test_ids` JSON NULL,
  `min_completion_rate` DECIMAL(4,2) NOT NULL DEFAULT 0.70,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_lpw_path_week` (`learning_path_id`, `week_number`),
  KEY `learning_path_weeks_path` (`learning_path_id`),
  CONSTRAINT `lpw_path_fk` FOREIGN KEY (`learning_path_id`) REFERENCES `learning_paths` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 6. weekly_progress ────────────────────────────────────────────────────────
CREATE TABLE `weekly_progress` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `learning_path_id` INT UNSIGNED NULL,
  `week_number` SMALLINT UNSIGNED NOT NULL,
  `week_start_date` DATE NOT NULL,
  `tasks_total` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `tasks_completed` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `tests_done` JSON NULL,
  `resources_viewed` JSON NULL,
  `completion_rate` DECIMAL(4,2) NOT NULL DEFAULT 0,
  `reminder_sent` TINYINT NOT NULL DEFAULT 0,
  `reminder_sent_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wp_user_week` (`user_id`, `week_number`),
  KEY `weekly_progress_user` (`user_id`),
  KEY `weekly_progress_path` (`learning_path_id`),
  KEY `weekly_progress_week_start` (`week_start_date`),
  CONSTRAINT `wp_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `wp_path_fk` FOREIGN KEY (`learning_path_id`) REFERENCES `learning_paths` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 7. goals ────────────────────────────────────────────────────────────────
CREATE TABLE `goals` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `target_date` DATE NULL,
  `progress` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `goals_user` (`user_id`),
  KEY `goals_status` (`status`),
  CONSTRAINT `goals_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 8. resources ────────────────────────────────────────────────────────────
CREATE TABLE `resources` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(500) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `summary` TEXT NULL,
  `resource_type` VARCHAR(50) NOT NULL,
  `skill` VARCHAR(30) NOT NULL,
  `level` VARCHAR(50) NULL,
  `difficulty` TINYINT UNSIGNED NULL DEFAULT 3,
  `tags` JSON NULL,
  `keywords` JSON NULL,
  `url` VARCHAR(1000) NULL,
  `source` VARCHAR(255) NULL,
  `image_url` VARCHAR(500) NULL,
  `video_url` VARCHAR(500) NULL,
  `video_duration` INT UNSIGNED NULL,
  `view_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `helpful_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `unhelpful_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `average_rating` DECIMAL(3,2) NULL,
  `is_active` TINYINT NOT NULL DEFAULT 1,
  `is_featured` TINYINT NOT NULL DEFAULT 0,
  `metadata` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `resources_skill` (`skill`),
  KEY `resources_type` (`resource_type`),
  KEY `resources_active` (`is_active`),
  KEY `resources_featured` (`is_featured`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 9. tests ────────────────────────────────────────────────────────────────
CREATE TABLE `tests` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(80) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `test_type` VARCHAR(20) NOT NULL,
  `task_type` VARCHAR(20) NULL,
  `description` TEXT NULL,
  `duration_minutes` SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  `level` VARCHAR(50) NOT NULL DEFAULT 'IELTS',
  `audio_url` VARCHAR(500) NULL,
  `pdf_url` VARCHAR(500) NULL,
  `pdf_parsed` TINYINT NOT NULL DEFAULT 0,
  `source` VARCHAR(20) NOT NULL DEFAULT 'db',
  `is_active` TINYINT NOT NULL DEFAULT 1,
  `tags` JSON NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tests_code` (`code`),
  KEY `tests_type` (`test_type`),
  KEY `tests_active` (`is_active`),
  KEY `tests_source` (`source`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 10. test_sections ───────────────────────────────────────────────────────
CREATE TABLE `test_sections` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `test_id` INT UNSIGNED NOT NULL,
  `section_no` TINYINT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NULL,
  `passage_text` LONGTEXT NULL,
  `audio_url` VARCHAR(500) NULL,
  `image_url` VARCHAR(500) NULL,
  `prompt` TEXT NULL,
  `content` JSON NULL,
  `media` JSON NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ts_test_section` (`test_id`, `section_no`),
  KEY `test_sections_test` (`test_id`),
  CONSTRAINT `ts_test_fk` FOREIGN KEY (`test_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 11. test_questions ──────────────────────────────────────────────────────
CREATE TABLE `test_questions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `test_id` INT UNSIGNED NOT NULL,
  `section_id` INT UNSIGNED NULL,
  `public_id` VARCHAR(150) NOT NULL,
  `question_no` SMALLINT UNSIGNED NOT NULL,
  `question_type` VARCHAR(50) NOT NULL,
  `prompt` TEXT NULL,
  `options` JSON NULL,
  `correct_answer` TEXT NULL,
  `points` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `metadata` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `test_questions_public_id` (`public_id`),
  UNIQUE KEY `uq_tq_test_section_no` (`test_id`, `section_id`, `question_no`),
  KEY `tq_test` (`test_id`),
  KEY `tq_section` (`section_id`),
  KEY `tq_type` (`question_type`),
  CONSTRAINT `tq_test_fk` FOREIGN KEY (`test_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tq_section_fk` FOREIGN KEY (`section_id`) REFERENCES `test_sections` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 12. test_attempts ────────────────────────────────────────────────────────
CREATE TABLE `test_attempts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `test_id` INT UNSIGNED NOT NULL,
  `test_type` VARCHAR(20) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'submitted',
  `answers` JSON NOT NULL,
  `answer_hash` VARCHAR(64) NOT NULL,
  `result_json` JSON NULL,
  `score_numeric` DOUBLE NULL,
  `correct_count` SMALLINT UNSIGNED NULL,
  `total_count` SMALLINT UNSIGNED NULL,
  `cache_hit` TINYINT NOT NULL DEFAULT 0,
  `error_message` TEXT NULL,
  `submitted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `graded_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ta_user` (`user_id`),
  KEY `ta_test` (`test_id`),
  KEY `ta_status` (`status`),
  KEY `ta_hash` (`answer_hash`),
  CONSTRAINT `ta_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ta_test_fk` FOREIGN KEY (`test_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 12b. user_submissions (POST /reading,/listening,/writing,/speaking) ─────
CREATE TABLE `user_submissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `test_id` INT UNSIGNED NOT NULL,
  `answers` JSON NULL,
  `is_correct` TINYINT(1) NOT NULL DEFAULT 0,
  `score` FLOAT NULL,
  `ai_feedback` TEXT NULL,
  `submitted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `us_user` (`user_id`),
  KEY `us_test` (`test_id`),
  CONSTRAINT `us_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `us_test_fk` FOREIGN KEY (`test_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 13. grading_cache ───────────────────────────────────────────────────────
CREATE TABLE `grading_cache` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `cache_key` VARCHAR(200) NOT NULL,
  `test_type` VARCHAR(20) NOT NULL,
  `answer_hash` VARCHAR(64) NOT NULL,
  `rubric_ver` VARCHAR(30) NOT NULL DEFAULT 'v1',
  `ai_provider` VARCHAR(30) NOT NULL DEFAULT 'gemini',
  `result_json` JSON NOT NULL,
  `hit_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `expires_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `gc_key` (`cache_key`),
  KEY `gc_hash` (`answer_hash`),
  KEY `gc_exp` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 14–18. practice_* ──────────────────────────────────────────────────────
CREATE TABLE `practice_materials` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(500) NOT NULL,
  `skill` VARCHAR(20) NOT NULL,
  `material_type` VARCHAR(50) NOT NULL,
  `difficulty_level` VARCHAR(20) NULL,
  `exam_type` VARCHAR(50) NOT NULL DEFAULT 'IELTS',
  `test_number` SMALLINT UNSIGNED NULL,
  `topic` VARCHAR(100) NULL,
  `estimated_band` DECIMAL(2,1) NULL,
  `word_count` SMALLINT UNSIGNED NULL,
  `duration_minutes` SMALLINT UNSIGNED NULL,
  `source_file` VARCHAR(255) NULL,
  `tags` JSON NULL,
  `keywords` JSON NULL,
  `metadata` JSON NULL,
  `is_active` TINYINT NOT NULL DEFAULT 1,
  `is_featured` TINYINT NOT NULL DEFAULT 0,
  `view_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `attempt_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `average_score` DECIMAL(3,1) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `pm_skill` (`skill`),
  KEY `pm_diff` (`difficulty_level`),
  KEY `pm_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `practice_passages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `material_id` INT UNSIGNED NOT NULL,
  `passage_number` TINYINT UNSIGNED NOT NULL,
  `passage_title` VARCHAR(500) NULL,
  `content` LONGTEXT NOT NULL,
  `audio_url` VARCHAR(500) NULL,
  `image_url` VARCHAR(500) NULL,
  `summary` TEXT NULL,
  `word_count` SMALLINT UNSIGNED NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pp_material_passage` (`material_id`, `passage_number`),
  KEY `pp_material` (`material_id`),
  CONSTRAINT `pp_mat_fk` FOREIGN KEY (`material_id`) REFERENCES `practice_materials` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `practice_questions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `material_id` INT UNSIGNED NOT NULL,
  `passage_id` INT UNSIGNED NULL,
  `question_number` SMALLINT UNSIGNED NOT NULL,
  `question_text` TEXT NOT NULL,
  `question_type` VARCHAR(50) NULL,
  `options` JSON NULL,
  `correct_answer` TEXT NULL,
  `explanation` TEXT NULL,
  `points` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `difficulty` VARCHAR(20) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pq_material_qno` (`material_id`, `question_number`),
  KEY `pq_material` (`material_id`),
  KEY `pq_passage` (`passage_id`),
  CONSTRAINT `pq_mat_fk` FOREIGN KEY (`material_id`) REFERENCES `practice_materials` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `pq_pass_fk` FOREIGN KEY (`passage_id`) REFERENCES `practice_passages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `practice_answers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `material_id` INT UNSIGNED NOT NULL,
  `answer_key` JSON NOT NULL,
  `detailed_explanation` TEXT NULL,
  `scoring_guide` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pa_material` (`material_id`),
  CONSTRAINT `pa_mat_fk` FOREIGN KEY (`material_id`) REFERENCES `practice_materials` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_practice_attempts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `material_id` INT UNSIGNED NOT NULL,
  `answers` JSON NOT NULL,
  `score` DECIMAL(3,1) NULL,
  `time_spent_minutes` SMALLINT UNSIGNED NULL,
  `correct_count` SMALLINT UNSIGNED NULL,
  `incorrect_count` SMALLINT UNSIGNED NULL,
  `skipped_count` SMALLINT UNSIGNED NULL,
  `accuracy_rate` DECIMAL(5,2) NULL,
  `ai_feedback` TEXT NULL,
  `weak_areas` JSON NULL,
  `strong_areas` JSON NULL,
  `recommendations` JSON NULL,
  `started_at` DATETIME NULL,
  `submitted_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `upa_user` (`user_id`),
  KEY `upa_material` (`material_id`),
  KEY `upa_submitted` (`submitted_at`),
  CONSTRAINT `upa_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `upa_mat_fk` FOREIGN KEY (`material_id`) REFERENCES `practice_materials` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 19–22. notifications, ai, chat ──────────────────────────────────────────
CREATE TABLE `notifications` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL,
  `title` VARCHAR(255) NULL,
  `message` TEXT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'info',
  `is_read` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `notif_user` (`user_id`),
  KEY `notif_read` (`is_read`),
  KEY `notif_created` (`created_at`),
  CONSTRAINT `notif_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ai_recommendations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL,
  `recommendation_type` VARCHAR(100) NULL,
  `content` TEXT NULL,
  `score` DOUBLE NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `air_user` (`user_id`),
  CONSTRAINT `air_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `conversations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL,
  `topic` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `conv_user` (`user_id`),
  CONSTRAINT `conv_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `messages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` INT UNSIGNED NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'user',
  `content` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `msg_conv` (`conversation_id`),
  CONSTRAINT `msg_conv_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 23–24. programs & enrollments ───────────────────────────────────────────
CREATE TABLE `programs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_enrollments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL,
  `program_id` INT UNSIGNED NULL,
  `enrolled_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ue_user` (`user_id`),
  CONSTRAINT `ue_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ue_prog_fk` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SEED DATA
-- Password for demo@emaster.local = Demo123!  (bcrypt cost 10)
-- =============================================================================

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `onboarding_completed`, `current_band`, `band_target`)
VALUES
  (1, 'demo_student', 'demo@emaster.local', '$2b$10$QeeOYUxosR9MJSyKrEc7GOAjc9JIiXt8O9PYiHvaXffTc4Z7hwIPK', 'student', 1, '5.5', '7.0'),
  (2, 'admin_seed', 'admin@gmail.com', '$2b$10$QeeOYUxosR9MJSyKrEc7GOAjc9JIiXt8O9PYiHvaXffTc4Z7hwIPK', 'admin', 1, NULL, NULL);

INSERT INTO `programs` (`id`, `name`, `description`) VALUES
  (1, 'IELTS Academic Track', 'Lộ trình Academic: 4 kỹ năng + mock test'),
  (2, 'IELTS General Training', 'Lộ trình GT: tập trung đọc/viết thực dụng');

INSERT INTO `user_enrollments` (`user_id`, `program_id`) VALUES (1, 1);

INSERT INTO `learning_paths` (`id`, `user_id`, `title`, `current_band`, `target_band`, `estimated_weeks`, `status`, `ai_generated_plan`)
VALUES (
  1, 1, 'Band 5.5 → 7.0 (12 tuần)', '5.5', '7.0', 12, 'active',
  JSON_OBJECT('summary', 'Seed plan: ưu tiên Writing Task 2 và Listening Section 3', 'weeks', 12)
);

INSERT INTO `learning_path_weeks` (`learning_path_id`, `week_number`, `focus_skills`, `goals`, `resource_ids`, `test_ids`, `min_completion_rate`)
VALUES (
  1, 1,
  JSON_ARRAY('reading', 'writing'),
  JSON_ARRAY('Làm quen True/False/Not Given', 'Viết outline Task 2'),
  JSON_ARRAY(1, 2),
  JSON_ARRAY(1),
  0.70
);

INSERT INTO `resources` (`title`, `content`, `summary`, `resource_type`, `skill`, `level`, `is_featured`, `tags`)
VALUES
(
  'Skimming & scanning trong IELTS Reading',
  'Skimming giúp nắm main idea; scanning giúp tìm keyword. Luôn đọc câu hỏi trước khi đọc passage...',
  'Chiến lược đọc nhanh',
  'tip', 'reading', 'Band 5-6', 1,
  JSON_ARRAY('reading', 'ielts', 'strategy')
),
(
  'Cấu trúc bài Writing Task 2 (opinion essay)',
  'Introduction: paraphrase + opinion. Body 2 đoạn với topic sentence + giải thích + ví dụ. Conclusion: tóm ý...',
  'Khung bài opinion essay',
  'template', 'writing', 'Band 6-7', 1,
  JSON_ARRAY('writing', 'task2', 'essay')
),
(
  'Tín hiệu trong IELTS Listening (signposting)',
  'Chú ý các cụm: firstly, on the other hand, the main point is, however...',
  'Nghe từ khóa chuyển ý',
  'tip', 'listening', 'Band 5-6', 0,
  JSON_ARRAY('listening', 'signposting')
);

INSERT INTO `tests` (`id`, `code`, `name`, `test_type`, `description`, `duration_minutes`, `level`, `is_active`, `source`)
VALUES
  (1, 'READ-SEED-001', 'Demo Reading — Climate', 'reading', 'Bài đọc mẫu cho dev / chấm MCQ', 60, 'IELTS', 1, 'db'),
  (2, 'LISTEN-SEED-001', 'Demo Listening — Form', 'listening', 'Form completion mẫu (không audio trong seed)', 30, 'IELTS', 1, 'db');

INSERT INTO `test_sections` (`id`, `test_id`, `section_no`, `title`, `passage_text`)
VALUES (
  1, 1, 1,
  'Passage 1',
  'Climate change is one of the defining challenges of our time. Rising temperatures affect agriculture, coastlines, and health. Many governments now set net-zero targets for mid-century. Individuals can reduce emissions through transport choices and energy use at home.'
);

INSERT INTO `test_questions` (`test_id`, `section_id`, `public_id`, `question_no`, `question_type`, `prompt`, `options`, `correct_answer`, `points`)
VALUES
  (1, 1, 'READ-SEED-001-q1', 1, 'multiple_choice',
   'According to the passage, what is affected by rising temperatures?',
   JSON_ARRAY('Only cities', 'Agriculture, coastlines, and health', 'Only the economy', 'Nothing significant'),
   'agriculture, coastlines, and health', 1),
  (1, 1, 'READ-SEED-001-q2', 2, 'multiple_choice',
   'What do many governments set for mid-century?',
   JSON_ARRAY('Net-zero targets', 'Unlimited growth', 'No environmental laws', 'Higher taxes only'),
   'net-zero targets', 1),
  (1, 1, 'READ-SEED-001-q3', 3, 'multiple_choice',
   'How can individuals help, according to the text?',
   JSON_ARRAY('By ignoring the issue', 'Through transport and home energy choices', 'Only by voting', 'By moving to another planet'),
   'through transport and home energy choices', 1);

INSERT INTO `test_sections` (`test_id`, `section_no`, `title`, `passage_text`, `content`)
VALUES (
  2, 1, 'Part 1',
  NULL,
  JSON_OBJECT('instructions', 'Complete the notes. (Seed — no audio file.)')
);

INSERT INTO `test_questions` (`test_id`, `section_id`, `public_id`, `question_no`, `question_type`, `prompt`, `correct_answer`, `points`)
VALUES
  (2, 2, 'LISTEN-SEED-001-q1', 1, 'short_answer', 'Customer surname:', 'Smith', 1),
  (2, 2, 'LISTEN-SEED-001-q2', 2, 'short_answer', 'Appointment day:', 'Monday', 1);

INSERT INTO `practice_materials` (`id`, `title`, `skill`, `material_type`, `difficulty_level`, `exam_type`, `topic`, `is_active`)
VALUES
  (1, 'Mini practice: Reading TFNG', 'reading', 'exercise', 'intermediate', 'IELTS', 'environment', 1);

INSERT INTO `practice_passages` (`material_id`, `passage_number`, `passage_title`, `content`, `word_count`)
VALUES (
  1, 1,
  'Urban green spaces',
  'Parks improve air quality and mental well-being. Cities that invest in trees report lower stress among residents.',
  42
);

INSERT INTO `practice_questions` (`material_id`, `passage_id`, `question_number`, `question_text`, `question_type`, `correct_answer`, `points`)
VALUES
  (1, 1, 1, 'Urban green spaces always reduce traffic noise.', 'true_false_not_given', 'Not Given', 1),
  (1, 1, 2, 'Trees can help mental well-being.', 'true_false_not_given', 'True', 1);

INSERT INTO `practice_answers` (`material_id`, `answer_key`, `detailed_explanation`)
VALUES (
  1,
  JSON_OBJECT('1', 'Not Given', '2', 'True'),
  'Q1: passage does not mention traffic noise. Q2: text says mental well-being improves.'
);

INSERT INTO `goals` (`user_id`, `title`, `description`, `progress`, `status`)
VALUES (1, 'Hoàn thành 3 bài Reading tuần này', 'Ưu tiên TFNG', 0, 'pending');

-- Reset AUTO_INCREMENT (optional, keeps ids predictable on re-import)
ALTER TABLE `users` AUTO_INCREMENT = 3;
ALTER TABLE `tests` AUTO_INCREMENT = 3;
ALTER TABLE `test_sections` AUTO_INCREMENT = 3;
ALTER TABLE `learning_paths` AUTO_INCREMENT = 2;
ALTER TABLE `practice_materials` AUTO_INCREMENT = 2;
ALTER TABLE `programs` AUTO_INCREMENT = 3;
