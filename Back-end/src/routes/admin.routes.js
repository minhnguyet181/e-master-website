// src/routes/admin.routes.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const auth = require('./middlewares/auth.middleware');
const requireAdmin = require('./middlewares/admin.middleware');
const ctrl = require('../controllers/admin.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB (audio files can be large)
  fileFilter(req, file, cb) {
    const ok = file.mimetype === 'application/pdf'
      || file.originalname.endsWith('.pdf')
      || file.mimetype.startsWith('audio/');
    cb(ok ? null : new Error('Only PDF or audio files allowed'), ok);
  },
});

router.use(auth, requireAdmin);

router.get('/admin/stats', ctrl.getStats);
router.get('/admin/resources', ctrl.listResources);
router.get('/admin/resources/:id', ctrl.getResource);
router.post('/admin/parse-pdf', upload.single('file'), ctrl.parsePdf);
router.post('/admin/batch-import-pdfs', upload.array('files', 25), ctrl.batchImportPdfs);
router.post('/admin/import-resource', ctrl.importResource);
router.put('/admin/resources/:id', ctrl.updateResource);
router.delete('/admin/resources/:id', ctrl.deleteResource);
router.post('/admin/resources/:id/feature', ctrl.toggleFeatured);

module.exports = router;
