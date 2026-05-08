const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const aiController = require("../controllers/aiController");

// [Security] 로그인한 유저인지 확인하는 미들웨어
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "인증 토큰이 없습니다." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
  }
};

// AI 첨삭 엔드포인트
router.post("/audit", aiController.auditResumeContent);

// AI JD 매칭 엔드포인트 (신규)
router.post("/match-jd", authMiddleware, aiController.matchJD);

module.exports = router;
