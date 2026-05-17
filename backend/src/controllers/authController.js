const prisma = require('../config/prisma');
const transporter = require('../config/mailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// 비밀번호 보안 정책 정규식 (8자 이상, 대문자, 숫자, 특수문자 포함)
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// 임시 인증 데이터 저장소 (서버 메모리 사용)
// 유저가 인증에 성공했는지 잠시 기억해두는 장부.
const verificationStore = new Map();

// [1] 인증번호 발송
exports.sendCode = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "이메일을 입력해주세요." });

        // 6자리 랜덤 숫자 생성
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // 장부에 '미인증' 상태로 저장 (5분 뒤 만료 등으로 확장 가능)
        verificationStore.set(email, { code, isVerified: false });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: '[OneResume] 회원가입 인증번호입니다.',
            text: `안녕하세요! OneResume입니다. 인증번호 6자리는 [${code}] 입니다.`,
        };

        await transporter.sendMail(mailOptions);
        console.log(`[메일발송 성공] ${email} : ${code}`);
        res.status(200).json({ message: "인증번호가 발송되었습니다." });
    } catch (error) {
        console.error("메일 발송 에러:", error);
        res.status(500).json({ message: "메일 발송 중 서버 오류가 발생했습니다." });
    }
};

// [2] 인증번호 검증
exports.verifyCode = async (req, res) => {
    const { email, code } = req.body;
    const storedData = verificationStore.get(email);

    if (storedData && storedData.code === code) {
        // 번호가 맞으면 장부에 '인증 완료'라고 표시
        verificationStore.set(email, { ...storedData, isVerified: true });
        return res.status(200).json({ message: "이메일 인증에 성공했습니다!" });
    }

    res.status(400).json({ message: "인증번호가 틀렸거나 만료되었습니다." });
};

// [3] 최종 회원가입 (비밀번호 암호화 저장)
exports.signup = async (req, res) => {
    try {
        const { email, password, subdomain } = req.body;

								// 서버측 비밀번호 유효성 검사
								if (!PWD_REGEX.test(password)) {
									return res.status(400).json({
										message: "비밀번호 보안 정책을 충족하지 않습니다. (8자 이상, 대문자/숫자/특수문자 포함)"
									});
								}

        // 장부에서 이 사람이 인증을 마쳤는지 확인
        const storedData = verificationStore.get(email);
        if (!storedData || !storedData.isVerified) {
            return res.status(400).json({ message: "이메일 인증을 먼저 완료해주세요." });
        }

        // 서브도메인 예약어(금지어) 차단 로직
        const forbiddenWords = ['admin', 'api', 'www', 'mail', 'master', 'root', 'help', 'login', 'dev', 'test', 'support'];
        if (forbiddenWords.includes(subdomain.toLowerCase())) {
            return res.status(400).json({
                message: `'${subdomain}'은(는) 시스템 예약어로 사용할 수 없습니다.`
            });
        }

        // 중복 체크
        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { subdomain }] }
        });
        if (existingUser) {
            return res.status(409).json({ message: "이미 사용 중인 이메일 또는 도메인입니다." });
        }

        // 비밀번호 암호화
        const hashedPassword = await bcrypt.hash(password, 10);
        const tempUsername = email.split('@')[0]; // 이메일 앞부분을 임시 사용자 이름으로 사용 (실제 서비스에서는 별도 입력 받는 것이 좋음)

        // DB 저장
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                subdomain,
                username: tempUsername,
                isVerified: true,
                provider: "LOCAL"
            }
        });

        // 가입 완료 후 임시 장부에서 삭제
        verificationStore.delete(email);

        // 가입 즉시 로그인이 되도록 토큰 발급
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        console.log(`✅ [가입완료] ${email}`);
        res.status(201).json({ 
            message: "OneResume 회원이 되신 것을 축하합니다!", 
            token,
            user: { email: newUser.email, subdomain: newUser.subdomain, username: newUser.username }
        });
    } catch (error) {
        console.error("가입 에러:", error);
        res.status(500).json({ message: "가입 처리 중 오류가 발생했습니다." });
    }
};

// [4] 로그인 API (JWT 발급)
exports.login = async (req, res) => {
    try {
        const {email, password} = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                resumes: {
                    include: { 
                        projects: true,
                        workExperiences: true,
                        certifications: true
                    }
                }
            }
        });

        if (!user) return res.status(401).json({ message: "존재하지 않는 계정입니다." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "비밀번호가 틀렸습니다." });

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        const { password: _, ...userWithoutPassword } = user;
        console.log(`✅ [로그인 성공] ${email}`);
        res.status(200).json({
            message: "로그인 성공!",
            token,
            user: userWithoutPassword // 비밀번호 포함 없이 DB 데이터 전송
        });
    } catch (error) {
        console.error("로그인 에러:", error);
        res.status(500).json({ message: "로그인 처리 중 오류가 발생했습니다." });
    }
};

// [5] 비밀번호 찾기 요청
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } }); // DB에서 유저 확인
        // 보안을 위해 존재하지 않는 이메일이라도 "발송되었다"고 응답해 해커의 이메일 수집 방어
        if (!user) {
            return res.status(200).json({ message: "재설정 메일이 발송되었습니다"});
        }
        // 1. 임시 토큰 생성 (암호화된 난수)
        const resetToken = crypto.randomBytes(20).toString('hex');
        // 2. DB에 토큰과 만료시간(1시간 뒤) 저장
        await prisma.user.update({
            where: { email },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpires: new Date(Date.now() + 3600000) // 현재시간 + 1시간
            }
        });

								// 3. 재설정 링크가 포함된 메일 발송
								// 로컬과 배포 환경 모두 대응하도록 환경 변수 적용
								const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
								const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email, // 해커가 입력한 이메일이 아닌, DB에 등록된 진짜 주인의 이메일로 발송
            subject: '[OneResume] 비밀번호 재설정 안내',
												html: `
              <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #333;">비밀번호 재설정</h2>
                <p>요청하신 비밀번호 재설정 링크를 안내해 드립니다.</p>
                <p>아래 링크를 클릭하여 새로운 비밀번호를 설정해 주세요.</p>
                <div style="margin: 30px 0;">
                  <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">비밀번호 재설정하기</a>
                </div>
                <p style="color: #666; font-size: 12px;">이 링크는 1시간 동안만 유효합니다. 본인이 요청하지 않았다면 이 메일을 무시해 주세요.</p>
              </div>
            `
        };
        await transporter.sendMail(mailOptions);
        console.log(`✅ [비밀번호 재설정 메일 발송] ${email}`);
        res.status(200).json({ message: "재설정 메일이 발송되었습니다." });
    } catch (error) {
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

// [6] 새 비밀번호 저장 (토큰 검증 및 비밀번호 업데이트)
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

								// 서버측 비밀번호 유효성 검사
								if (!PWD_REGEX.test(newPassword)) {
									return res.status(400).json({
										message: "비밀번호 보안 정책을 충족하지 않습니다."
									});
								};
								
        // 토큰 및 유저 확인
        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: { gt: new Date() } // gt = greater than (현재 시간 이후)
            }
        });
        if (!user) {
            return res.status(400).json({ message: "유효하지 않거나 만료된 링크입니다. 다시 시도해주세요." });
        }
        // 새 비밀번호 암호화
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        // 비밀번호 업데이트 및 사용이 끝난 임시 토큰 초기화(보안)
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        });

// 비밀번호 변경 완료 알림 메일 발송
const mailOptions = {
	from: process.env.EMAIL_USER,
	to: user.email,
	subject: '[OneResume] 비밀번호가 성공적으로 변경되었습니다.',
	html: `
	<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
	<h2 style="color: #10b981;">비밀번호 변경 완료</h2>
	<p>안녕하세요, <strong>${user.username || '회원'}</strong>님!</p>
	<p>OneResume 계정의 비밀번호가 성공적으로 변경되었음을 알려드립니다.</p>
 <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
  <p style="margin: 0; font-size: 14px; color: #64748b;">변경 일시: ${new Date().toLocaleString('ko-KR')}</p>
	</div>
	<p style="color: #ef4444; font-size: 13px; font-weight: bold;">
  만약 본인이 비밀번호를 변경하지 않았다면, 즉시 고객센터...는 없고 문의하거나 계정 보안을 점검해 주세요.
 </p>
 <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
 <p style="font-size: 12px; color: #94a3b8;">본 메일은 시스템에 의해 자동으로 발송되었습니다.</p>
	</div>
`
};

// 메일 발송 (비동기로 실행하여 응답 속도에 영향을 주지 않도록 함)
  transporter.sendMail(mailOptions).catch(err => console.error("알림 메일 발송 실패:", err));
		console.log(`✅ [비밀번호 변경 완료 및 알림 발송] ${user.email}`);
        res.status(200).json({ message: "비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요!" });
    } catch (error) {
        console.error("비밀번호 업데이트 에러:", error);
        res.status(500).json({ message: "비밀번호 변경 중 오류가 발생했습니다." });
}
};

// [8] 간단 프로필 설정 (Onboarding) - S3 이미지 업로드 포함
exports.setupProfile = async (req, res) => {
	try {
		const userId = req.user.id; // authMiddleware에서 넣어준 유저 정보
		const { username, email, age, phone, useInternationalAge, job } = req.body;

		const updateData = {
			username: username,
			email: email || undefined, // 이메일이 제공된 경우 업데이트
			age: age ? parseInt(age) : null,
			phone: phone || null,
			useInternationalAge: useInternationalAge === true || useInternationalAge === 'true',
			job: job || null, // 직무 정보 추가
			isProfileComplete: true, // 프로필 설정 완료!
			updatedAt: new Date(),
	};
	// S3에 파일이 업로드되었다면 URL 저장
	if (req.file) {
		updateData.profileImageUrl = req.file.location; // S3 실제 URL
	}
	const updatedUser = await prisma.user.update({
		where: { id: userId },
		data: updateData
		});
		res.status(200).json({
			message: "프로필 설정이 완료되었습니다.",
			user: updatedUser
		});
} catch (error) {
	console.error("프로필 설정 에러:", error);
	res.status(500).json({message: "프로필 저장 중 오류가 발생했습니다." });
}
};
// [7] 내 정보 조회 (토큰 검증 및 새로고침 유지용)
exports.getMe = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ message: "토큰이 없습니다." });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                resumes: {
                    include: { 
                        projects: true,
                        workExperiences: true,
                        certifications: true
                    }
                }
            } 
        });

        if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

        const { password: _, ...safeUser } = user;
        res.status(200).json({ user: safeUser });
    } catch (error) {
        console.error("토큰 검증 에러:", error);
        res.status(403).json({ message: "유효하지 않거나 만료된 토큰입니다." });
    }
};