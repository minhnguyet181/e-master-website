# Requirements Document

## Introduction

Learning Resource Library là tính năng mở rộng của nền tảng E-Master (luyện thi IELTS/TOEIC), cho phép quản lý một thư viện tài liệu học tập hỗ trợ tiếng Anh quy mô lớn (hàng trăm đến hàng nghìn tài liệu). Tính năng bao gồm: định nghĩa JSON schema chuẩn cho tài liệu học tập, pipeline PDF → parse → JSON → DB, hệ thống phân loại đa chiều (taxonomy), API query/filter, và tích hợp với AI chatbot thông qua MySQL FULLTEXT search. Tài liệu hỗ trợ song ngữ Anh + Việt.

Tính năng này tách biệt hoàn toàn với pipeline đề thi hiện có (`pdf-to-test.js` / `pdf-import.js`) và sử dụng bảng `resources` đã có trong DB, mở rộng thêm các cột cần thiết.

---

## Glossary

- **Resource**: Một tài liệu học tập trong thư viện (ngữ pháp, từ vựng, tips thi, bài viết tham khảo, v.v.)
- **Resource_JSON**: Định dạng JSON chuẩn đại diện cho một Resource sau khi parse từ PDF
- **Parser**: Script Node.js chịu trách nhiệm trích xuất nội dung từ file PDF và chuyển thành Resource_JSON
- **Importer**: Script Node.js chịu trách nhiệm đọc Resource_JSON và ghi vào bảng `resources` trong DB
- **Taxonomy**: Hệ thống phân loại đa chiều gồm: exam_type, skill, resource_type, level, topic, tags
- **Resource_Service**: Module Node.js/Express cung cấp logic nghiệp vụ cho việc query, filter, và tìm kiếm Resource
- **Resource_Controller**: Module Node.js/Express xử lý HTTP request/response cho Resource API
- **AI_Service**: Module hiện có (`ai.service.js`) tích hợp Gemini/OpenAI, sẽ được mở rộng để tham chiếu Resource
- **FULLTEXT_Index**: MySQL FULLTEXT index trên các cột `title`, `content`, `summary`, `keywords` của bảng `resources`
- **Chunk**: Đoạn văn bản nhỏ được tách ra từ nội dung PDF để AI xử lý trong giới hạn token
- **Bilingual_Content**: Nội dung song ngữ gồm phần tiếng Anh (`en`) và phần tiếng Việt (`vi`) lưu trong cùng một Resource

---

## Requirements

### Requirement 1: Định nghĩa Resource JSON Schema chuẩn

**User Story:** As an admin, I want a standardized JSON format for learning resources, so that all resources have consistent structure and can be reliably imported into the database.

#### Acceptance Criteria

1. THE Resource_JSON SHALL contain các trường bắt buộc: `title` (string), `resource_type` (enum), `skill` (enum), `content` (object), `language` (enum).
2. THE Resource_JSON SHALL contain trường `content` với cấu trúc song ngữ: `{ "en": "<nội dung tiếng Anh>", "vi": "<nội dung tiếng Việt hoặc null>" }`.
3. THE Resource_JSON SHALL contain trường `taxonomy` với cấu trúc: `{ "exam_type": enum, "skill": enum, "resource_type": enum, "level": string, "topic": string, "tags": string[] }`.
4. THE Resource_JSON SHALL hỗ trợ các giá trị `resource_type`: `grammar_rule`, `vocabulary`, `ielts_tip`, `toeic_tip`, `reference`, `example`, `template`, `article`.
5. THE Resource_JSON SHALL hỗ trợ các giá trị `skill`: `reading`, `listening`, `writing`, `speaking`, `vocabulary`, `grammar`, `general`.
6. THE Resource_JSON SHALL hỗ trợ các giá trị `exam_type`: `IELTS`, `TOEIC`, `general`.
7. THE Resource_JSON SHALL contain trường `metadata` tùy chọn để lưu thông tin bổ sung: `{ "source": string, "author": string, "word_count": number, "estimated_read_minutes": number }`.
8. WHEN Resource_JSON được validate, THE Parser SHALL báo lỗi cụ thể nếu thiếu trường bắt buộc hoặc giá trị enum không hợp lệ.

---

### Requirement 2: Pipeline PDF → Resource JSON

**User Story:** As an admin, I want to convert PDF learning materials into standardized Resource JSON files, so that I can efficiently process large volumes of documents.

#### Acceptance Criteria

1. WHEN một file PDF hợp lệ được cung cấp, THE Parser SHALL trích xuất toàn bộ văn bản và tạo ra một file Resource_JSON hợp lệ.
2. WHEN nội dung PDF vượt quá 28.000 ký tự, THE Parser SHALL chia nhỏ thành các Chunk và xử lý tuần tự, sau đó hợp nhất kết quả.
3. THE Parser SHALL gọi Gemini API (primary) để phân tích nội dung PDF và điền vào Resource_JSON schema.
4. IF Gemini API trả về lỗi 429 hoặc 503, THEN THE Parser SHALL thử lại tối đa 3 lần với khoảng cách tăng dần (15s, 30s, 45s).
5. IF Gemini API thất bại sau 3 lần thử, THEN THE Parser SHALL fallback sang OpenAI API nếu `OPENAI_API_KEY` được cấu hình.
6. THE Parser SHALL tự động phát hiện ngôn ngữ nội dung và điền trường `content.en` (tiếng Anh) và `content.vi` (tiếng Việt nếu có).
7. THE Parser SHALL tự động suy luận các trường taxonomy (`skill`, `resource_type`, `exam_type`, `topic`, `tags`) từ nội dung PDF nếu không được chỉ định qua CLI argument.
8. WHEN parse thành công, THE Parser SHALL ghi file Resource_JSON ra thư mục output được chỉ định hoặc `generated-resources/` mặc định.
9. THE Parser SHALL hỗ trợ flag `--dry` để in JSON ra stdout mà không ghi file.
10. THE Parser SHALL hỗ trợ các CLI argument: `--pdf <path>`, `--type <resource_type>`, `--skill <skill>`, `--exam <exam_type>`, `--out <path>`, `--dry`.

---

### Requirement 3: Pipeline Resource JSON → Database Import

**User Story:** As an admin, I want to import Resource JSON files into the database, so that resources are available for users and the AI chatbot.

#### Acceptance Criteria

1. WHEN một file Resource_JSON hợp lệ được cung cấp, THE Importer SHALL tạo hoặc cập nhật bản ghi tương ứng trong bảng `resources`.
2. THE Importer SHALL sử dụng `title` + `resource_type` + `skill` làm composite key để phát hiện bản ghi trùng lặp (upsert).
3. THE Importer SHALL map trường `content` (object song ngữ) vào cột `content` (LONGTEXT) của bảng `resources` dưới dạng JSON string.
4. THE Importer SHALL map các trường taxonomy vào các cột tương ứng: `skill`, `resource_type`, `level`, `tags`, `keywords`.
5. THE Importer SHALL lưu trường `taxonomy.exam_type` và `taxonomy.topic` vào cột `metadata` (JSON) của bảng `resources`.
6. THE Importer SHALL hỗ trợ import một file đơn (`--file`) hoặc toàn bộ thư mục (`--dir`).
7. THE Importer SHALL hỗ trợ flag `--dry` để validate JSON và in summary mà không ghi vào DB.
8. IF một file Resource_JSON thiếu trường bắt buộc, THEN THE Importer SHALL bỏ qua file đó, ghi log lỗi, và tiếp tục xử lý các file còn lại.
9. WHEN import hoàn tất, THE Importer SHALL in tổng kết: số bản ghi đã tạo mới, số bản ghi đã cập nhật, số bản ghi thất bại.

---

### Requirement 4: Mở rộng bảng `resources` và FULLTEXT Index

**User Story:** As a developer, I want the resources table to support the new taxonomy fields and full-text search, so that resources can be efficiently queried and searched.

#### Acceptance Criteria

1. THE Resource_Service SHALL đảm bảo bảng `resources` có cột `exam_type` (VARCHAR 20) để lưu `IELTS`, `TOEIC`, hoặc `general`.
2. THE Resource_Service SHALL đảm bảo bảng `resources` có cột `topic` (VARCHAR 100) để lưu chủ đề cụ thể (ví dụ: `present_perfect`, `collocations`, `task2_opinion`).
3. THE Resource_Service SHALL đảm bảo bảng `resources` có FULLTEXT index trên các cột `title`, `content`, `summary`, `keywords`.
4. THE Resource_Service SHALL cung cấp migration script để thêm các cột và index mới mà không ảnh hưởng dữ liệu hiện có.
5. WHEN migration được chạy trên DB đã có dữ liệu, THE Resource_Service SHALL không xóa hoặc thay đổi các bản ghi `resources` hiện có.

---

### Requirement 5: Taxonomy và Hệ thống Phân loại

**User Story:** As a student, I want resources to be organized by exam type, skill, type, level, and topic, so that I can find relevant materials quickly.

#### Acceptance Criteria

1. THE Resource_Service SHALL phân loại mỗi Resource theo đúng một `exam_type` trong tập: `IELTS`, `TOEIC`, `general`.
2. THE Resource_Service SHALL phân loại mỗi Resource theo đúng một `skill` trong tập: `reading`, `listening`, `writing`, `speaking`, `vocabulary`, `grammar`, `general`.
3. THE Resource_Service SHALL phân loại mỗi Resource theo đúng một `resource_type` trong tập: `grammar_rule`, `vocabulary`, `ielts_tip`, `toeic_tip`, `reference`, `example`, `template`, `article`.
4. THE Resource_Service SHALL hỗ trợ trường `level` với các giá trị: `Beginner`, `Intermediate`, `Advanced`, `Band 4-5`, `Band 5-6`, `Band 6-7`, `Band 7-8`, `Band 8-9`, `TOEIC 300-500`, `TOEIC 500-700`, `TOEIC 700-900`.
5. THE Resource_Service SHALL hỗ trợ trường `topic` là chuỗi tự do (ví dụ: `present_perfect`, `ielts_writing_task2`, `business_vocabulary`).
6. THE Resource_Service SHALL hỗ trợ trường `tags` là mảng chuỗi tự do tối đa 20 phần tử.

---

### Requirement 6: API Query và Filter tài liệu

**User Story:** As a student, I want to search and filter learning resources by multiple criteria, so that I can find the most relevant materials for my study needs.

#### Acceptance Criteria

1. THE Resource_Controller SHALL cung cấp endpoint `GET /api/resources` hỗ trợ filter theo: `exam_type`, `skill`, `resource_type`, `level`, `topic`, `tags`, `is_active`, `is_featured`.
2. THE Resource_Controller SHALL hỗ trợ tham số `q` (query string) để thực hiện FULLTEXT search trên `title`, `content`, `summary`, `keywords`.
3. THE Resource_Controller SHALL hỗ trợ phân trang với tham số `page` (mặc định: 1) và `limit` (mặc định: 20, tối đa: 100).
4. THE Resource_Controller SHALL hỗ trợ sắp xếp với tham số `sort` nhận các giá trị: `relevance` (khi có `q`), `newest`, `popular` (theo `view_count`), `rating`.
5. WHEN tham số `q` được cung cấp, THE Resource_Controller SHALL sử dụng MySQL FULLTEXT MATCH...AGAINST để tính relevance score và sắp xếp kết quả theo score giảm dần.
6. THE Resource_Controller SHALL cung cấp endpoint `GET /api/resources/:id` trả về chi tiết một Resource bao gồm cả `content` song ngữ đầy đủ.
7. WHEN `GET /api/resources/:id` được gọi, THE Resource_Controller SHALL tăng `view_count` của Resource đó thêm 1.
8. THE Resource_Controller SHALL cung cấp endpoint `GET /api/resources/taxonomy` trả về danh sách tất cả các giá trị phân loại hiện có (distinct values của `exam_type`, `skill`, `resource_type`, `level`, `topic`).
9. IF không có Resource nào khớp với filter, THEN THE Resource_Controller SHALL trả về HTTP 200 với `data: []` và `total: 0`.
10. IF `id` không tồn tại trong `GET /api/resources/:id`, THEN THE Resource_Controller SHALL trả về HTTP 404 với message mô tả.

---

### Requirement 7: Tích hợp AI Chatbot với FULLTEXT Search

**User Story:** As a student, I want the AI chatbot to reference relevant learning resources when answering my questions, so that I receive accurate and well-supported answers.

#### Acceptance Criteria

1. WHEN AI_Service nhận câu hỏi từ user, THE AI_Service SHALL thực hiện FULLTEXT search trên bảng `resources` với từ khóa trích xuất từ câu hỏi.
2. THE AI_Service SHALL giới hạn kết quả tìm kiếm tối đa 5 Resource có relevance score cao nhất.
3. THE AI_Service SHALL chỉ đưa trường `title`, `summary`, và `content.en` (hoặc `content.vi` nếu user hỏi bằng tiếng Việt) vào context gửi cho AI model.
4. THE AI_Service SHALL giới hạn tổng độ dài context từ Resource không vượt quá 4.000 token trước khi gửi cho AI model.
5. WHEN không có Resource nào có relevance score đủ cao (dưới ngưỡng), THE AI_Service SHALL trả lời dựa trên kiến thức nội tại của AI model mà không đính kèm context Resource.
6. THE AI_Service SHALL đính kèm danh sách `resource_ids` đã tham chiếu vào response metadata để frontend có thể hiển thị link tài liệu liên quan.
7. WHILE AI_Service đang tìm kiếm Resource, THE AI_Service SHALL không block response nếu FULLTEXT search mất hơn 2 giây, và tiếp tục trả lời không có context Resource.

---

### Requirement 8: Round-trip Integrity cho Resource JSON

**User Story:** As a developer, I want to ensure that parsing and importing resources produces consistent results, so that data integrity is maintained across the pipeline.

#### Acceptance Criteria

1. THE Parser SHALL tạo ra Resource_JSON có thể được parse lại bởi `JSON.parse()` mà không có lỗi (valid JSON).
2. FOR ALL Resource_JSON hợp lệ, khi THE Importer import vào DB rồi export lại qua `GET /api/resources/:id`, các trường `title`, `skill`, `resource_type`, `exam_type`, `content.en` SHALL giống hệt giá trị ban đầu trong Resource_JSON (round-trip property).
3. THE Importer SHALL tạo ra `summary` tự động (tối đa 500 ký tự) từ `content.en` nếu trường `summary` không có trong Resource_JSON.
4. THE Parser SHALL đảm bảo trường `content.en` không rỗng sau khi parse; IF nội dung tiếng Anh không trích xuất được, THEN THE Parser SHALL báo lỗi và không tạo file output.

---

### Requirement 9: Quản lý tài liệu (Admin)

**User Story:** As an admin, I want to manage learning resources through the API, so that I can keep the library up-to-date and relevant.

#### Acceptance Criteria

1. THE Resource_Controller SHALL cung cấp endpoint `POST /api/admin/resources` để tạo Resource mới với dữ liệu JSON trong request body.
2. THE Resource_Controller SHALL cung cấp endpoint `PUT /api/admin/resources/:id` để cập nhật Resource hiện có.
3. THE Resource_Controller SHALL cung cấp endpoint `DELETE /api/admin/resources/:id` để xóa mềm Resource (set `is_active = false`).
4. THE Resource_Controller SHALL cung cấp endpoint `POST /api/admin/resources/:id/feature` để toggle trạng thái `is_featured`.
5. WHEN `POST /api/admin/resources` được gọi thiếu trường bắt buộc, THEN THE Resource_Controller SHALL trả về HTTP 400 với danh sách các trường bị thiếu.
6. WHERE role của user là `admin`, THE Resource_Controller SHALL cho phép truy cập các endpoint admin; IF role không phải `admin`, THEN THE Resource_Controller SHALL trả về HTTP 403.
