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

app.set('trust proxy', 1);

// 1. CORS 설정 (가장 먼저 적용)
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // 허용 목록에 있거나 oneresume.kr의 서브도메인이거나 
    // 크롬 확장 프로그램(chrome-extension://) 또는 S3/AWS 관련 도메인들 허용
    const isAllowed = allowedOrigins.some(allowed => origin === allowed) || 
                     origin.endsWith('.oneresume.kr') ||
                     origin.startsWith('chrome-extension://') ||
                     origin.includes('s3-website') || 
                     origin.endsWith('amazonaws.com');
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS 차단됨:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. [Security] Helmet 적용 (보안 헤더 설정)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // 외부 이미지/리소스 허용
  crossOriginOpenerPolicy: false,
  originAgentCluster: false,
  contentSecurityPolicy: false, // 확장 프로그램 UI 주입을 위해 CSP는 유연하게 설정
}));

const getSafeAllowedOrigin = (req) => {
    const origin = req.headers.origin;
    if (origin && (allowedOrigins.includes(origin) || origin.endsWith('amazonaws.com') || origin.endsWith('.oneresume.kr'))) {
        return origin;
    }
    return allowedOrigins[0];
};

// 3. [Security] Rate Limiting 설정 (계층형 방어)

// [일반] 전체 API 요청 제한 (분당 60회)
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  handler: (req, res) => {
    const origin = getSafeAllowedOrigin(req);
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(429).json({
      message: "시스템 보안을 위해 잠시 요청을 제한합니다. 1분 후 다시 시도해주세요."
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// [강력] AI 분석 전용 요청 제한 (분당 10회 - 쿼터 보호용)
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  handler: (req, res) => {
    const origin = getSafeAllowedOrigin(req);
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(429).json({
      message: "AI 분석 사용량이 너무 많습니다. 1분만 휴식 후 다시 시도해주세요."
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 기본적으로 모든 요청에 일반 리미터 적용
app.use(generalLimiter);

// AI 관련 엔드포인트에는 더 강력한 리미터 추가 적용
app.use('/api/ai', aiLimiter);

// 미들웨어 설정
app.use(express.json());

// 분리한 라우터들을 메인 서버에 연결해주는 길 안내 표지판
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/external', externalRoutes);

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