# Implementation Plan: Learning Resource Library

## Overview

Triển khai theo thứ tự từ foundation đến integration: schema validation → DB migration → model update → pipeline scripts → service/controller mở rộng → AI chatbot integration → property-based tests.

## Tasks

- [ ] 1. Tạo module Schema Validation (`resource-schema.js`)
  - Tạo file `Back-end/src/utils/resource-schema.js`
  - Định nghĩa constants: `RESOURCE_TYPES`, `SKILLS`, `EXAM_TYPES`
  - Implement `validateResourceJSON(obj)` trả về `{ valid: true }` hoặc `{ valid: false, errors: string[] }`
  - Validate required fields: `title`, `resource_type`, `skill`, `content`, `language`
  - Validate enum values cho `resource_type`, `skill`, `exam_type`
  - Validate `content` structure: `{ en: non-empty string, vi: string|null }`
  - Validate `taxonomy.tags` tối đa 20 phần tử
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8_

  - [ ] 1.1 Viết property test P1: enum validation rejects invalid enums
    - **Property 1: Schema validation rejects invalid enums**
    - **Validates: Requirements 1.4, 1.5, 1.6, 1.8**
    - Dùng `fc.string().filter(s => !RESOURCE_TYPES.includes(s))` cho invalid `resource_type`
    - Tương tự cho `skill` và `exam_type`
    - File: `Back-end/src/tests/resource-schema.test.js`

  - [ ] 1.2 Viết property test P2: required fields validation
    - **Property 2: Schema validation rejects missing required fields**
    - **Validates: Requirements 1.1, 1.8**
    - Dùng `fc.record()` với từng trường bắt buộc bị bỏ qua
    - File: `Back-end/src/tests/resource-schema.test.js`

  - [ ] 1.3 Viết property test P3: content bilingual structure invariant
    - **Property 3: Content bilingual structure invariant**
    - **Validates: Requirements 1.2, 8.4**
    - Với mọi resource validate thành công, `content.en` phải là non-empty string
    - File: `Back-end/src/tests/resource-schema.test.js`

- [x] 2. Tạo DB Migration thêm taxonomy fields và FULLTEXT index
  - Tạo file `Back-end/migrations/20260401000001-add-resource-taxonomy-fields.js`
  - `addColumn('resources', 'exam_type', STRING(20), allowNull: true, after: 'resource_type')`
  - `addColumn('resources', 'topic', STRING(100), allowNull: true, after: 'exam_type')`
  - Thêm index thường: `idx_res_exam_type` (exam_type), `idx_res_topic` (topic)
  - Thêm FULLTEXT index bằng raw SQL: `ALTER TABLE resources ADD FULLTEXT INDEX ft_resources_search (title, content, summary, keywords)`
  - Implement `down()`: `removeColumn` và `removeIndex` tương ứng
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3. Cập nhật Resource Model
  - Mở file `Back-end/src/models/resource.model.js`
  - Thêm field `exam_type`: `DataTypes.STRING(20)`, allowNull: true
  - Thêm field `topic`: `DataTypes.STRING(100)`, allowNull: true
  - Đổi `resource_type` từ ENUM sang `DataTypes.STRING(50)` nếu chưa phải STRING
  - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.3_

- [x] 4. Tạo script `pdf-to-resource.js`
  - Tạo file `Back-end/scripts/pdf-to-resource.js` theo pattern của `pdf-to-test.js`
  - Implement `parseArgs()`, `callGemini()`, `callOpenAI()`, `callAI()` (tái sử dụng pattern)
  - Implement `buildResourcePrompt(pdfText, opts)` yêu cầu AI trả về Resource_JSON schema
  - Implement chunking: nếu PDF text > 28.000 ký tự, chia chunks và merge kết quả
  - Implement retry logic: 3 lần, delay 15s/30s/45s cho 429/503, fallback OpenAI
  - Validate output bằng `validateResourceJSON` trước khi ghi file
  - Ghi output ra `generated-resources/` mặc định hoặc `--out` path
  - Hỗ trợ `--dry` flag (print to stdout, no file write)
  - Hỗ trợ CLI args: `--pdf`, `--type`, `--skill`, `--exam`, `--out`, `--dry`
  - Báo lỗi và `process.exit(1)` nếu `content.en` rỗng sau parse
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 8.1, 8.4_

  - [x] 4.1 Viết property test P18: chunking threshold
    - **Property 18: Chunking threshold**
    - **Validates: Requirements 2.2**
    - Dùng `fc.string({ minLength: 28001 })` để generate text dài
    - Verify parser chia thành ít nhất 2 chunks
    - File: `Back-end/src/tests/pdf-to-resource.test.js`

- [x] 5. Tạo script `resource-import.js`
  - Tạo file `Back-end/scripts/resource-import.js` theo pattern của `pdf-import.js`
  - Implement `parseArgs()`, `validateResourceJSON` import từ `resource-schema.js`
  - Implement upsert với composite key: `title` + `resource_type` + `skill`
  - Map fields: `content` (object → JSON string), `taxonomy.*` → DB columns
  - Map `taxonomy.exam_type` → cột `exam_type`, `taxonomy.topic` → cột `topic`
  - Auto-generate `summary`: lấy 500 ký tự đầu của `content.en` nếu `summary` null
  - Hỗ trợ `--file` (single) và `--dir` (all *.json)
  - Hỗ trợ `--dry` flag (validate only, no DB write)
  - Skip file lỗi, log lỗi, tiếp tục file tiếp theo
  - In summary cuối: `created`, `updated`, `failed`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 8.3_

  - [x] 5.1 Viết property test P4: import idempotence
    - **Property 4: Import idempotence**
    - **Validates: Requirements 3.1, 3.2**
    - Import cùng Resource_JSON hai lần, verify chỉ có 1 bản ghi trong DB
    - File: `Back-end/src/tests/resource-import.test.js`

  - [x] 5.2 Viết property test P6: auto-summary length constraint
    - **Property 6: Auto-summary length constraint**
    - **Validates: Requirements 8.3**
    - Dùng `fc.string({ minLength: 1 })` cho `content.en`, verify `summary` ≤ 500 ký tự
    - File: `Back-end/src/tests/resource-import.test.js`

- [x] 6. Checkpoint — Đảm bảo schema validation và import scripts hoạt động
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Mở rộng Resource Service
  - Mở file `Back-end/src/services/resource.service.js`
  - Thêm `fulltextSearch(query, filters, pagination)`: dùng raw SQL MATCH...AGAINST IN BOOLEAN MODE, trả về `{ resources, total, page, limit }`
  - Thêm `filterResources(filters, pagination, sort)`: filter đa chiều theo `exam_type`, `skill`, `resource_type`, `level`, `topic`, `tags`, `is_active`, `is_featured`; sort: `newest`, `popular`, `rating`, `relevance`
  - Thêm `getTaxonomyValues()`: trả về distinct values của tất cả taxonomy fields từ active resources
  - Thêm `createResource(data)`: validate bằng `validateResourceJSON`, insert vào DB
  - Thêm `updateResource(id, data)`: update bản ghi, trả về 404 nếu không tồn tại
  - Thêm `softDeleteResource(id)`: set `is_active = false`
  - Thêm `toggleFeatured(id)`: flip `is_featured`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 6.8, 9.1, 9.2, 9.3, 9.4_

  - [ ] 7.1 Viết property test P7: filter correctness
    - **Property 7: Filter correctness**
    - **Validates: Requirements 6.1**
    - Với mọi filter params, tất cả resources trong response phải khớp filter
    - File: `Back-end/src/tests/resource-api.test.js`

  - [ ] 7.2 Viết property test P8: pagination consistency
    - **Property 8: Pagination consistency**
    - **Validates: Requirements 6.3**
    - Dùng `fc.integer({ min: 1, max: 100 })` cho limit, verify tổng = total, không duplicate
    - File: `Back-end/src/tests/resource-api.test.js`

  - [ ] 7.3 Viết property test P9: sort order correctness
    - **Property 9: Sort order correctness**
    - **Validates: Requirements 6.4**
    - Với `sort=popular`, verify `view_count[i] >= view_count[i+1]` cho mọi i
    - File: `Back-end/src/tests/resource-api.test.js`

  - [ ] 7.4 Viết property test P10: view count increment
    - **Property 10: View count increment**
    - **Validates: Requirements 6.7**
    - Mỗi lần gọi `getResourceById`, verify `view_count` tăng đúng 1
    - File: `Back-end/src/tests/resource-api.test.js`

  - [ ] 7.5 Viết property test P11: taxonomy endpoint completeness
    - **Property 11: Taxonomy endpoint completeness**
    - **Validates: Requirements 6.8**
    - Mọi giá trị taxonomy tồn tại trong DB phải xuất hiện trong `getTaxonomyValues()`
    - File: `Back-end/src/tests/resource-api.test.js`

- [ ] 8. Mở rộng Resource Controller và Routes
  - Mở file `Back-end/src/controllers/resource.controller.js`
  - Thêm `exports.listResources`: `GET /api/resources` — gọi `filterResources` hoặc `fulltextSearch` tùy có `q` hay không; response format `{ success, data, total, page, limit, pages }`
  - Thêm `exports.getTaxonomy`: `GET /api/resources/taxonomy`
  - Thêm `exports.createResource`: `POST /api/admin/resources` — validate, trả 400 nếu thiếu field
  - Thêm `exports.updateResource`: `PUT /api/admin/resources/:id`
  - Thêm `exports.deleteResource`: `DELETE /api/admin/resources/:id` — soft delete
  - Thêm `exports.toggleFeatured`: `POST /api/admin/resources/:id/feature`
  - Cập nhật route file (tìm trong `Back-end/src/routes/`) để đăng ký các endpoint mới
  - Thêm middleware kiểm tra `role === 'admin'` cho các admin endpoints (trả 403 nếu không phải admin)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ] 8.1 Viết property test P5: import-export round trip
    - **Property 5: Import-export round trip**
    - **Validates: Requirements 3.3, 3.4, 3.5, 8.1, 8.2**
    - Import Resource_JSON → GET /api/resources/:id → verify `title`, `skill`, `resource_type`, `exam_type`, `content.en` giống hệt
    - File: `Back-end/src/tests/resource-roundtrip.test.js`

  - [ ] 8.2 Viết property test P15: soft delete hides resource
    - **Property 15: Soft delete hides resource**
    - **Validates: Requirements 9.3**
    - Sau `softDeleteResource(id)`, resource không xuất hiện trong `listResources`, `is_active = false`
    - File: `Back-end/src/tests/resource-admin.test.js`

  - [ ] 8.3 Viết property test P16: feature toggle idempotence
    - **Property 16: Feature toggle idempotence (round-trip)**
    - **Validates: Requirements 9.4**
    - Gọi `toggleFeatured` hai lần, verify `is_featured` trở về giá trị ban đầu
    - File: `Back-end/src/tests/resource-admin.test.js`

  - [ ] 8.4 Viết property test P17: admin authorization enforcement
    - **Property 17: Admin authorization enforcement**
    - **Validates: Requirements 9.6**
    - Dùng `fc.string()` cho roles khác `admin`, verify response 403
    - File: `Back-end/src/tests/resource-admin.test.js`

- [ ] 9. Checkpoint — Đảm bảo API endpoints hoạt động đúng
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Tích hợp AI Chatbot với FULLTEXT Search
  - Mở file `Back-end/src/services/ai.service.js`
  - Mở rộng function `chatAssistant(message, options)`:
    - Bước 1: Extract keywords từ message (split words, loại stopwords)
    - Bước 2: Gọi `fulltextSearch` với timeout 2s (dùng `Promise.race`)
    - Bước 3: Build context từ top 5 resources: chỉ lấy `title`, `summary`, `content.en` (hoặc `content.vi` nếu message tiếng Việt)
    - Bước 4: Đếm token ước tính `Math.ceil(text.length / 4)`, dừng khi tổng > 4000
    - Bước 5: Gọi Gemini với context đã build
    - Bước 6: Return `{ response, resource_ids }` — `resource_ids` là mảng ID các resources đã dùng
  - Nếu search timeout hoặc không có kết quả, tiếp tục không có context, `resource_ids: []`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ] 10.1 Viết property test P12: chatbot context size limit
    - **Property 12: Chatbot context size limit**
    - **Validates: Requirements 7.4**
    - Dùng `fc.string()` cho messages, verify context gửi AI ≤ 4000 tokens
    - File: `Back-end/src/tests/ai-chatbot.test.js`

  - [ ] 10.2 Viết property test P13: chatbot resource count limit
    - **Property 13: Chatbot resource count limit**
    - **Validates: Requirements 7.2, 7.3**
    - Verify số resources trong context không vượt quá 5
    - File: `Back-end/src/tests/ai-chatbot.test.js`

  - [ ] 10.3 Viết property test P14: chatbot response includes resource_ids
    - **Property 14: Chatbot response includes resource_ids**
    - **Validates: Requirements 7.6**
    - Khi có ít nhất 1 resource match, response phải có `resource_ids` không rỗng
    - File: `Back-end/src/tests/ai-chatbot.test.js`

- [ ] 11. Final Checkpoint — Đảm bảo toàn bộ pipeline hoạt động
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks đánh dấu `*` là optional, có thể bỏ qua để MVP nhanh hơn
- Cài `fast-check` trước khi chạy property tests: `npm install --save-dev fast-check` (từ `Back-end/`)
- Chạy migration trước khi chạy import scripts: `npx sequelize-cli db:migrate`
- Tất cả scripts chạy từ `Back-end/` directory
- Property tests dùng comment tag: `// Feature: learning-resource-library, Property N: ...`
