require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/auth');
const resumeRoutes = require('./src/routes/resume');
const aiRoutes = require('./src/routes/ai');
const externalRoutes = require('./src/routes/external');
const prisma = require('./src/config/prisma');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
  'https://oneresume.kr',
  'https://www.oneresume.kr',
  'https://api.oneresume.kr',
  // S3 static hosting 주소들 (점과 하이픈 모든 형식 허용)
  'http://oneresume-storage-parkungjung.s3-website.ap-northeast-2.amazonaws.com',
  'http://oneresume-storage-parkungjung.s3-website-ap-northeast-2.amazonaws.com',
  process.env.S3_BUCKET_NAME ? `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com` : null
].filter(Boolean);

const app = express();
const port = 5000;

// [v1.7.7] Cloudflare + Nginx 구조(2단계 프록시)이므로 홉 수를 2로 명시하여 보안 에러 해결
app.set('trust proxy', 2); 

// 1. 기본 미들웨어 (JSON 파싱 최상단 배치)
app.use(express.json());

// 2. [Security] Rate Limiting 설정
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 15, // 로그인/회원가입은 강력한 보안 유지 (분당 15회)
  handler: (req, res) => {
    res.status(429).json({ message: "인증 요청이 너무 많습니다.\n1분 후 다시 시도해주세요." });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100, // 검색, 데이터 조회 등 일반 기능은 넉넉하게 허용 (분당 100회)
  handler: (req, res) => {
    res.status(429).json({ message: "요청이 너무 많습니다.\n잠시 후 다시 시도해주세요." });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5, // AI 분석은 쿼터 보호를 위해 분당 5회 유지
  handler: (req, res) => {
    res.status(429).json({ message: "AI 분석 요청이 너무 많습니다.\n1분만 휴식 후 다시 시도해주세요." });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. CORS 설정
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(allowed => origin === allowed) || 
                     origin.endsWith('.oneresume.kr') ||
                     origin.startsWith('chrome-extension://') ||
                     origin.includes('s3-website') || 
                     origin.endsWith('amazonaws.com');
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 4. [Security] Helmet 적용
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: false,
  originAgentCluster: false,
  contentSecurityPolicy: false, 
}));

// [v1.7.5] 라우터별 리미터 할당 (중첩 방지 및 확실한 적용)
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/resume', generalLimiter, resumeRoutes);
app.use('/api/external', generalLimiter, externalRoutes);

// 서버 실행 및 데이터베이스 연결 확인
app.listen(port, '0.0.0.0',  async () => {
  console.log(`-----------------------------------------------`);
  console.log(`서버 실행 중: http://0.0.0.0:${port}`);
  
  try {
    // 명시적으로 연결 확인
    await prisma.$connect();
    console.log(`데이터베이스 연결 성공!`);
    console.log(`-----------------------------------------------`);
  } catch (e) {
    console.error(`데이터베이스 연결 실패`);
    console.error(`에러 내용:`, e.message);
    console.log(`-----------------------------------------------`);
  }
});