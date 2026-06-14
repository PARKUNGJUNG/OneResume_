const axios = require('axios');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { XMLParser } = require('fast-xml-parser');
const prisma = require('../config/prisma');
const s3 = require('../config/s3');

const parser = new XMLParser();

// VR 기기 핀코드 임시 저장소 (Key: 6자리 핀코드, Value: { resumeText, job })
const pinCodeStore = new Map();

// 커리어넷/워크넷 API 키 (환경 변수에서 로드)
const CAREERNET_API_KEY = process.env.CAREERNET_API_KEY;
// 서비스별 전용 키 매핑 (워크넷은 서비스마다 키가 다름)
const WORKNET_RECRUIT_KEY = process.env.WORKNET_RECRUIT_KEY; // 채용정보
const WORKNET_DEPT_KEY = process.env.WORKNET_DEPT_KEY;       // 학과정보
const WORKNET_JOB_KEY = process.env.WORKNET_JOB_KEY;         // 직무정보
const WORKNET_OCCU_KEY = process.env.WORKNET_OCCU_KEY;       // 직업정보 (jobSrch용)
const WORKNET_CODE_KEY = process.env.WORKNET_CODE_KEY;       // 공통코드

// [0] 커리어넷 학교/전공 검색 프록시 API
exports.searchCareerNet = async (req, res) => {
    try {
        const { type, keyword } = req.query; // type: SCHOOL or MAJOR
        console.log(`🔍 [CareerNet Search] Type: ${type}, Keyword: ${keyword}`);

        if (!keyword || keyword.length < 2) {
            return res.status(400).json({ message: "검색어는 2자 이상 입력해주세요." });
        }

        // 커리어넷 API 명세: SCHOOL은 searchSchulNm, MAJOR는 searchTitle 사용
        const isSchool = type === 'SCHOOL';
        const searchParam = isSchool ? 'searchSchulNm' : 'searchTitle';
        const url = `https://www.career.go.kr/cnet/openapi/getOpenApi?apiKey=${CAREERNET_API_KEY}&svcType=api&svcCode=${type}&contentType=json&gubun=univ_list&${searchParam}=${encodeURIComponent(keyword)}`;
        
        console.log(`🔗 Request URL: ${url}`);
        const response = await axios.get(url);
        
        // 데이터 구조 로깅
        console.log("📦 Response Data Summary:", JSON.stringify(response.data).substring(0, 200) + "...");

        res.status(200).json(response.data);
    } catch (error) {
        console.error("❌ 커리어넷 API 호출 에러:", error.response?.data || error.message);
        res.status(500).json({ message: "커리어넷 서버와 통신 중 오류가 발생했습니다." });
    }
};

// [0-1] 워크넷 표준 직무 키워드 검색 프록시 API
exports.searchWorknet = async (req, res) => {
    try {
        const { keyword } = req.query;
        console.log(`🔍 [Worknet Search] Keyword: ${keyword}`);

        if (!keyword || keyword.length < 2) {
            return res.status(400).json({ message: "검색어는 2자 이상 입력해주세요." });
        }

        // jobSrch.do 서비스는 '직업정보' 키(OCCU)를 사용해야 함
        const authKey = WORKNET_OCCU_KEY || WORKNET_JOB_KEY;

        if (!authKey) {
            return res.status(500).json({ message: "워크넷 직업정보 API 키가 설정되지 않았습니다." });
        }

        // [고용24 신규 통합 API 엔드포인트 적용]
        const url = `https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212L01.do?authKey=${authKey}&returnType=XML&target=JOBCD&keyword=${encodeURIComponent(keyword)}&display=20`;
        
        console.log(`📡 [Goyong24 Official] URL: ${url}`);
        const response = await axios.get(url);
        
        // XML -> JSON 변환
        const jsonObj = parser.parse(response.data);
        
        // 데이터 구조 로깅
        console.log("📦 Goyong24 Official Parsed Data:", JSON.stringify(jsonObj));

        // 고용24 신규 응답 구조 대응 (로그 확인 결과 jobsList.jobList 에 데이터가 있음)
        const items = jsonObj.jobsList?.jobList || jsonObj.jobsList?.item || jsonObj.jobIndexList?.item || jsonObj.wantedRoot?.item || [];
        
        // 만약 단일 객체로 왔을 경우 배열로 변환
        const finalItems = Array.isArray(items) ? items : [items];

        res.status(200).json({ jobSrch: finalItems });
    } catch (error) {
        console.error("❌ 워크넷 API 호출 에러:", error.response?.data || error.message);
        res.status(500).json({ message: "워크넷 서버와 통신 중 오류가 발생했습니다." });
    }
};

// [0-2] 학과 정보 검색 프록시 API (커리어넷 기반 단일화)
exports.searchWorknetDept = async (req, res) => {
    const { keyword } = req.query;
    console.log(`🔍 [Major Search] Keyword: ${keyword}`);

    if (!keyword || keyword.length < 2) {
        return res.status(400).json({ message: "검색어는 2자 이상 입력해주세요." });
    }

    try {
        // [v1.8.7] 고용24 차단 문제로 인해 커리어넷 단독 시스템으로 전환 (배포 서버 가용성 확보)
        console.log("🚀 Calling CareerNet (Standard)...");
        const careerUrl = `https://www.career.go.kr/cnet/openapi/getOpenApi?apiKey=${CAREERNET_API_KEY}&svcType=api&svcCode=MAJOR&contentType=json&gubun=univ_list&searchTitle=${encodeURIComponent(keyword)}`;
        
        const response = await axios.get(careerUrl, { timeout: 6000 });
        const careerData = response.data?.dataSearch?.content || [];
        
        const tempResults = [];
        const seen = new Set();

        // 1. 뭉쳐있는 데이터 낱개로 쪼개기 (De-fragmentation)
        careerData.forEach(item => {
            const rawName = item.majorName || item.facilName || "";
            const splitNames = rawName.split(',').map(n => n.trim()).filter(n => n.length > 0);
            
            splitNames.forEach(name => {
                if (!seen.has(name)) {
                    seen.add(name);
                    tempResults.push({
                        majorName: name,
                        detailName: item.lClass || "대학교 전공"
                    });
                }
            });
        });

        // 2. 관련성 정렬 (Relevance Sorting): 키워드 시작 우선 + 짧은 이름 우선
        const normalized = tempResults.sort((a, b) => {
            const aStartsWith = a.majorName.startsWith(keyword);
            const bStartsWith = b.majorName.startsWith(keyword);
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            return a.majorName.length - b.majorName.length;
        }).slice(0, 25);

        console.log(`✅ CareerNet Search Success: ${normalized.length} items`);
        res.status(200).json({ univSrch: normalized });

    } catch (error) {
        console.error("❌ 학과 검색 최종 에러:", error.message);
        res.status(500).json({ message: "학과 검색 서비스 이용이 일시적으로 제한되었습니다." });
    }
};

// [1] 프로필 이미지 S3 직접 업로드 API
exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "파일이 전달되지 않았습니다." });
        }

        const encodedName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
        const fileName = `profiles/${Date.now()}_${encodedName}`;
        const bucketName = process.env.S3_BUCKET_NAME.trim();

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        });

        await s3.send(command);
        const fileUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;

        console.log("✅ 이미지 S3 직접 업로드 성공:", fileUrl);
        res.status(200).json({ imageUrl: fileUrl });

    } catch (error) {
        console.error("❌ S3 직접 업로드 에러:", error);
        res.status(500).json({ message: "S3 업로드 중 에러가 발생했습니다." });
    }
};

// [2] 서브도메인으로 사용자 데이터 조회 API
exports.getUserBySubdomain = async (req, res) => {
    try {
        const { subdomain } = req.params;
        const user = await prisma.user.findUnique({
            where: { subdomain },
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
        if (!user) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }
        console.log("DB에서 불러온 유저 정보:", user.username, user.profileImageUrl);
        const { password: _, ...safeUser } = user;
        res.status(200).json(safeUser);
    } catch (error) {
        console.error("데이터 로드 에러:", error);
        res.status(500).json({ message: "데이터를 불러오는 중 서버 오류가 발생했습니다." });
    }
};

// [3] 이력서 저장 API
/**
 * 표준 JSON 포맷으로 이력서 내보내기 (확장 프로그램 연동용)
 */
exports.exportResume = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        resumes: {
          take: 1,
          orderBy: { updatedAt: 'desc' },
          include: {
            projects: true,
            workExperiences: true,
            certifications: true
          }
        }
      }
    });

    if (!user || !user.resumes || user.resumes.length === 0) {
      return res.status(404).json({ message: "내보낼 이력서 데이터가 없습니다." });
    }

    const resume = user.resumes[0];
    const eduParts = resume.education ? resume.education.split(" | ") : ["", "", ""];

    // 표준 JSON Resume 스키마와 국내 채용 사이트의 공통 항목을 고려한 매핑
    const exportedData = {
      version: "1.1.0",
      generatedAt: new Date().toISOString(),
      basics: {
        name: user.username,
        label: user.bio,
        email: user.email,
        phone: user.phone,
        url: `https://${user.subdomain}.oneresume.kr`,
        summary: resume.bio || "",
        location: {
          address: user.address,
          addressDetail: user.addressDetail,
        },
        profiles: [
          { network: "GitHub", url: user.githubUrl },
          { network: "Blog", url: user.blogUrl }
        ],
        personalInfo: {
          age: user.age,
          gender: user.gender,
          military: {
            status: resume.militaryStatus,
            branch: resume.militaryBranch,
            rank: resume.militaryRank,
            startDate: resume.militaryStartDate,
            endDate: resume.militaryEndDate,
            exemptionReason: resume.militaryExemption
          }
        }
      },
      education: [
        {
          institution: eduParts[0] || "",
          area: eduParts[1] || "",
          gpa: eduParts[2] || "",
          studyType: "University", // 학교명 기반으로 추후 확장 가능
          score: eduParts[2] || ""
        }
      ],
      skills: resume.skills ? resume.skills.split(",").map(s => s.trim()) : [],
      work: resume.workExperiences.map(w => ({
        company: w.companyName,
        position: w.position || w.role,
        department: w.department,
        startDate: w.period?.split(" ~ ")[0] || "",
        endDate: w.isCurrent ? "Present" : (w.period?.split(" ~ ")[1] || ""),
        summary: w.jobDescription,
        highlights: []
      })),
      projects: resume.projects.map(p => ({
        name: p.name,
        description: p.description,
        startDate: p.period?.split(" ~ ")[0] || "",
        endDate: p.period?.split(" ~ ")[1] || "",
        url: p.githubUrl,
        roles: [p.role],
        keywords: p.techStack ? p.techStack.split(",").map(k => k.trim()) : []
      })),
      // 자격증/어학/수상 내역 분리
      certificates: resume.certifications
        .filter(c => c.type === "CERT")
        .map(c => ({
          name: c.name,
          date: c.date,
          issuer: c.issuer
        })),
      languages: resume.certifications
        .filter(c => c.type === "LANG")
        .map(c => ({
          language: c.name,
          fluency: c.score,
          issuer: c.issuer,
          date: c.date
        })),
      awards: resume.certifications
        .filter(c => c.type === "AWARD")
        .map(c => ({
          title: c.name,
          date: c.date,
          awarder: c.issuer,
          summary: c.score
        })),
      selfIntroduction: {
        growth: resume.selfIntroGrowth,
        character: resume.selfIntroCharacter,
        motivation: resume.selfIntroMotivation
      }
    };

    res.json(exportedData);
  } catch (error) {
    console.error("Export Error:", error.message);
    res.status(500).json({ message: "데이터 내보내기 중 오류가 발생했습니다." });
  }
};

exports.saveResume = async (req, res) => {
    try {
        const userId = req.user.id; 

        const {
            username, email, subdomain, bio, githubUrl, blogUrl, profileImageUrl,
            age, gender, phone, address, addressDetail, useInternationalAge,
            resumeTitle, school, major, gpa, skills, projects,
            militaryStatus, militaryBranch, militaryRank, militaryStartDate, militaryEndDate, militaryExemption,
            selfIntroGrowth, selfIntroCharacter, selfIntroMotivation,
            workExperiences, certifications, sectionOrder
        } = req.body;

        console.log(`📡 [Save Request] UserID: ${userId}, Subdomain: ${subdomain}`);

        const parsedAge = age ? parseInt(age, 10) : null;

        const forbiddenWords = ['admin', 'api', 'www', 'mail', 'master', 'root', 'help', 'login', '너임마청년']
        if (forbiddenWords && subdomain && forbiddenWords.includes(subdomain.toLowerCase())) {
            return res.status(400).json({
                message: "해당 도메인은 부적절합니다. 다른 도메인을 입력해주세요."
            });
        }

        const educationString = `${school || ""} | ${major || ""} | ${gpa || ""}`;

        const validProjects = Array.isArray(projects) 
            ? projects.filter(p => p.name || p.description).map(p => ({
                    name: p.name || "",
                    description: p.description || "",
                    role: p.role || "",
                    techStack: p.techStack || "",
                    period: p.period || "",
                    githubUrl: p.githubUrl || ""
                }))
            : [];

        const validWorkExperiences = Array.isArray(workExperiences)
            ? workExperiences.filter(w => w.companyName).map(w => ({
                    companyName: w.companyName || "",
                    department: w.department || "",
                    role: w.role || "", 
                    position: w.position || "", 
                    jobDescription: w.jobDescription || "",
                    period: w.period || "",
                    isCurrent: w.isCurrent === true || w.isCurrent === 'true'
                }))
            : [];

        const validCertifications = Array.isArray(certifications)
            ? certifications.filter(c => c.name).map(c => ({
                    type: c.type || "CERT",
                    name: c.name || "",
                    issuer: c.issuer || "",
                    date: c.date || "",
                    score: c.score || ""
                }))
            : [];

        console.log(`📦 [Data Processing] Projects: ${validProjects.length}, Work: ${validWorkExperiences.length}, Certs: ${validCertifications.length}`);

        // 1. 유저 정보 업데이트
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                username: username || "",
                subdomain: subdomain,
                bio: bio || "",
                profileImageUrl: profileImageUrl || "",
                githubUrl: githubUrl || "",
                blogUrl: blogUrl || "",
                age: parsedAge,
                gender: gender || null,
                phone: phone || null,
                address: address || null,
                addressDetail: addressDetail || null,
                useInternationalAge: useInternationalAge === true || useInternationalAge === 'true'
            }
        });

        const resumeData = {
            title: resumeTitle || "프론트엔드 개발자 이력서",
            education: educationString,
            skills: skills || "",
            militaryStatus: militaryStatus || null,
            militaryBranch: militaryBranch || null,
            militaryRank: militaryRank || null,
            militaryStartDate: militaryStartDate || null,
            militaryEndDate: militaryEndDate || null,
            militaryExemption: militaryExemption || null,
            selfIntroGrowth: selfIntroGrowth || null,
            selfIntroCharacter: selfIntroCharacter || null,
            selfIntroMotivation: selfIntroMotivation || null,
            sectionOrder: sectionOrder || "edu,skills,experience,projects,certs,extra",
        };

        const existingResume = await prisma.resume.findFirst({
            where: { userId: user.id }
        });

        if (existingResume) {
            console.log(`🔄 [Resume Update] ID: ${existingResume.id}`);
            // 업데이트 시에는 관계형 데이터를 deleteMany/create로 갱신
            await prisma.resume.update({
                where: { id: existingResume.id },
                data: {
                    title: resumeData.title,
                    education: resumeData.education,
                    skills: resumeData.skills,
                    militaryStatus: militaryStatus || null,
                    militaryBranch: militaryBranch || null,
                    militaryRank: militaryRank || null,
                    militaryStartDate: militaryStartDate || null,
                    militaryEndDate: militaryEndDate || null,
                    militaryExemption: militaryExemption || null,
                    selfIntroGrowth: selfIntroGrowth || null,
                    selfIntroCharacter: selfIntroCharacter || null,
                    selfIntroMotivation: selfIntroMotivation || null,
                    sectionOrder: resumeData.sectionOrder,
                    projects: {
                        deleteMany: {},
                        create: validProjects
                    },
                    workExperiences: {
                        deleteMany: {},
                        create: validWorkExperiences
                    },
                    certifications: {
                        deleteMany: {},
                        create: validCertifications
                    }
                }
            });
        } else {
            console.log(`✨ [Resume Create] for User: ${user.id}`);
            await prisma.resume.create({
                data: {
                    ...resumeData,
                    userId: user.id,
                    projects: { create: validProjects },
                    workExperiences: { create: validWorkExperiences },
                    certifications: { create: validCertifications }
                }
            });
        }

        console.log(`✅ [${username || user.email}]님의 데이터 DB 저장 성공!`);
        res.status(200).json({ message: "이력서가 성공적으로 저장되었습니다!" });

    } catch (error) {
        console.error("❌ 이력서 저장 중 에러 발생:", error);
        
        if (error.code === 'P2002') {
            return res.status(400).json({ 
                message: "이미 사용 중인 개인 도메인입니다. 다른 도메인을 입력해주세요." 
            });
        }
        res.status(500).json({ message: "서버 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." });
    }
};

// [VR 연동] 6자리 핀코드 발급 API (POST /api/resume/pin)
exports.generatePinCode = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. 유저와 이력서 정보 조회
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                resumes: {
                    take: 1,
                    orderBy: { updatedAt: 'desc' },
                    include: {
                        projects: true,
                        workExperiences: true,
                        certifications: true
                    }
                }
            }
        });

        if (!user || !user.resumes || user.resumes.length === 0) {
            return res.status(404).json({ message: "연동할 이력서가 존재하지 않습니다. 먼저 이력서를 저장해주세요." });
        }

        const resume = user.resumes[0];

        // 2. 이력서 텍스트 빌드 (Gemini AI가 이력서를 이해하기 쉽도록 구조화된 한국어 텍스트로 합침)
        let resumeText = `지원 직무: ${user.job || resume.title || '일반 지원자'}\n`;
        resumeText += `이름: ${user.username || '지원자'}\n`;
        if (user.bio) resumeText += `한줄 소개: ${user.bio}\n`;
        if (resume.skills) resumeText += `기술 스택: ${resume.skills}\n`;
        if (resume.education) resumeText += `학력: ${resume.education}\n`;

        if (resume.workExperiences && resume.workExperiences.length > 0) {
            resumeText += `\n[경력 사항]\n`;
            resume.workExperiences.forEach(w => {
                resumeText += `- 회사명: ${w.companyName}, 부서: ${w.department || ''}, 역할: ${w.role || ''}, 상세 직무: ${w.jobDescription || ''}, 근무 기간: ${w.period || ''}\n`;
            });
        }

        if (resume.projects && resume.projects.length > 0) {
            resumeText += `\n[프로젝트 경험]\n`;
            resume.projects.forEach(p => {
                resumeText += `- 프로젝트명: ${p.name}, 설명: ${p.description || ''}, 개발 스택: ${p.techStack || ''}, 담당 역할: ${p.role || ''}, 진행 기간: ${p.period || ''}\n`;
            });
        }

        if (resume.selfIntroGrowth || resume.selfIntroCharacter || resume.selfIntroMotivation) {
            resumeText += `\n[자기소개서]\n`;
            if (resume.selfIntroGrowth) resumeText += `- 성장 과정: ${resume.selfIntroGrowth}\n`;
            if (resume.selfIntroCharacter) resumeText += `- 성격의 장단점: ${resume.selfIntroCharacter}\n`;
            if (resume.selfIntroMotivation) resumeText += `- 지원 동기 및 포부: ${resume.selfIntroMotivation}\n`;
        }

        // 3. 6자리 중복되지 않는 난수 핀코드 생성
        let pinCode;
        let attempts = 0;
        do {
            pinCode = Math.floor(100000 + Math.random() * 900000).toString();
            attempts++;
            if (attempts > 15) break; 
        } while (pinCodeStore.has(pinCode));

        // 4. 메모리 저장소에 등록
        const jobTitle = user.job || resume.title || "지원자";
        pinCodeStore.set(pinCode, {
            resumeText: resumeText,
            job: jobTitle,
            name: user.username || "지원자"
        });

        // 3분(180,000ms) 만료 타이머 등록
        setTimeout(() => {
            if (pinCodeStore.has(pinCode)) {
                pinCodeStore.delete(pinCode);
                console.log(`⏰ [PinCode Expired] 핀코드가 만료되어 자동으로 삭제되었습니다: ${pinCode}`);
            }
        }, 180000);

        console.log(`🔑 [PinCode Generated] 발급 완료: ${pinCode} (직무: ${jobTitle}, 만료: 3분)`);
        
        return res.status(200).json({
            success: true,
            pinCode: pinCode,
            expiresIn: 180 // 180초
        });

    } catch (error) {
        console.error("❌ 핀코드 생성 에러:", error);
        return res.status(500).json({ message: "핀코드 생성 중 서버 오류가 발생했습니다." });
    }
};

// [VR 연동] 6자리 핀코드 검증 및 이력서 반환 API (GET /api/resume/pin)
exports.getResumeByPinCode = async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: "code 쿼리 파라미터가 누락되었습니다."
            });
        }

        // 핀코드 데이터 가져오기
        const data = pinCodeStore.get(code);

        if (data) {
            console.log(`✅ [PinCode Verified] 핀코드 인증 성공: ${code} (직무: ${data.job})`);
            
            // 일회용 코드이므로 즉시 폐기
            pinCodeStore.delete(code);
            
            return res.status(200).json({
                success: true,
                message: "인증에 성공했습니다.",
                job: data.job,
                name: data.name,
                resumeText: data.resumeText
            });
        } else {
            console.log(`❌ [PinCode Verification Failed] 만료되었거나 존재하지 않는 핀코드: ${code}`);
            return res.status(404).json({
                success: false,
                message: "만료되었거나 존재하지 않는 6자리 핀코드입니다."
            });
        }

    } catch (error) {
        console.error("❌ 핀코드 검증 에러:", error);
        return res.status(500).json({
            success: false,
            message: "서버 처리 중 오류가 발생했습니다."
        });
    }
};