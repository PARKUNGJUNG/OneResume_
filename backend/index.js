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

// 2. [Security] Helmet 적용 (디버깅을 위해 잠시 주석 처리)
// app.use(helmet({
//   crossOriginResourcePolicy: { policy: "cross-origin" },
//   crossOriginOpenerPolicy: false,
//   originAgentCluster: false,
//   contentSecurityPolicy: false,
// }));

const getSafeAllowedOrigin = (req) => {
    const origin = req.headers.origin;
    if (origin && (allowedOrigins.includes(origin) || origin.endsWith('amazonaws.com'))) {
        return origin;
    }
    return allowedOrigins[0];
};

// 3. [Security] Rate Limiting 설정
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 100, // 개발 편의를 위해 횟수 대폭 상향 (기존 20 -> 100)
  handler: (req, res) => {
    const origin = getSafeAllowedOrigin(req);
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(429).json({
      message: "너무 많은 요청이 감지되었습니다. 잠시 후 다시 시도해주세요."
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

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