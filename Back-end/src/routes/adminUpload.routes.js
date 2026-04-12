// src/routes/adminUpload.routes.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const adminUploadController = require('../controllers/adminUpload.controller');

// Store PDF in memory (no disk write needed — we pass buffer directly to pdf-parse)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter(req, file, cb) {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

router.get('/admin/categories', adminUploadController.getCategories);
router.post('/admin/upload-pdf', upload.single('file'), adminUploadController.uploadPdf);
router.post('/admin/import-resource', adminUploadController.importResource);

module.exports = router;
