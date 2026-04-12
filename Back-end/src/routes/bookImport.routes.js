// src/routes/bookImport.routes.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const auth = require('./middlewares/auth.middleware');
const requireAdmin = require('./middlewares/admin.middleware');
const { importBook } = require('../controllers/bookImport.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ok = /\.(zip|pdf)$/i.test(file.originalname)
      || file.mimetype === 'application/zip'
      || file.mimetype === 'application/x-zip-compressed'
      || file.mimetype === 'application/pdf';
    cb(ok ? null : new Error('Only ZIP or PDF files allowed'), ok);
  },
});

// Accept: pdf (single PDF) + audioZip (ZIP of MP3s)
router.post('/admin/import-book', auth, requireAdmin,
  upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'audioZip', maxCount: 1 },
  ]),
  importBook
);

module.exports = router;
