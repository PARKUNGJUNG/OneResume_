const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const resumeController = require('../controllers/resumeController');

// 1. [Security] 로그인한 유저인지 확인하는 미들웨어 정의
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "인증 토큰이 없습니다." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = { id: decoded.userId }; // 컨트롤러에서 req.user.id로 쓸 수 있게 저장
    next();
  } catch (err) {
    return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
  }
};

// 파일 업로드 설정 (메모리 스토리지 사용)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 용량 제한
});

// [커리어넷 검색]
router.get('/search', resumeController.searchCareerNet);

// [워크넷 직무 검색]
router.get('/search-job', resumeController.searchWorknet);

// [워크넷 학과 검색]
router.get('/search-worknet-dept', resumeController.searchWorknetDept);

// [이미지 업로드]
router.post('/upload', upload.single('profileImage'), resumeController.uploadImage);

// [데이터 조회]
router.get('/user/:subdomain', resumeController.getUserBySubdomain);

// [이력서 저장]
router.post('/save', authMiddleware, resumeController.saveResume);

// [표준 JSON 데이터 내보내기]
router.get('/export', authMiddleware, resumeController.exportResume);

module.exports = router;