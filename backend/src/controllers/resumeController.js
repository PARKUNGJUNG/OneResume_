const axios = require('axios');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { XMLParser } = require('fast-xml-parser');
const prisma = require('../config/prisma');
const s3 = require('../config/s3');

const parser = new XMLParser();

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

// [0-2] 워크넷 학과 정보 검색 프록시 API
exports.searchWorknetDept = async (req, res) => {
    try {
        const { keyword } = req.query;
        console.log(`🔍 [Worknet Dept Search] Keyword: ${keyword}`);

        if (!keyword || keyword.length < 2) {
            return res.status(400).json({ message: "검색어는 2자 이상 입력해주세요." });
        }

        if (!WORKNET_DEPT_KEY) {
            return res.status(500).json({ message: "워크넷 학과 API 키가 설정되지 않았습니다." });
        }

        // 워크넷 API 명세: 학과 정보 검색 (univSrch)
        // target=UNIV_DEPT_LIST (학과 리스트 조회) 필수
        const url = `http://openapi.work.go.kr/opi/opi/opia/univSrch.do?authKey=${WORKNET_DEPT_KEY}&returnType=XML&target=UNIV_DEPT_LIST&srchType=univNm&keyword=${encodeURIComponent(keyword)}&display=20`;
        
        console.log(`🔗 Request URL: ${url}`);
        const response = await axios.get(url);
        
        // XML -> JSON 변환
        const jsonObj = parser.parse(response.data);
        const items = jsonObj.univDeptList?.item || [];

        res.status(200).json({ univSrch: items });
    } catch (error) {
        console.error("❌ 워크넷 학과 API 에러:", error.response?.data || error.message);
        res.status(500).json({ message: "워크넷 학과 서버와 통신 중 오류가 발생했습니다." });
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
            await prisma.resume.update({
                where: { id: existingResume.id },
                data: {
                    ...resumeData,
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
        
        // 구체적인 에러 로깅
        if (error.code) console.error("Error Code:", error.code);
        if (error.meta) console.error("Error Meta:", error.meta);

        if (error.code === 'P2002') {
            return res.status(400).json({ 
                message: "이미 사용 중인 이메일이거나 개인 도메인입니다. 다른 값을 입력해주세요." 
            });
        }
        res.status(500).json({ message: "서버 저장 중 오류가 발생했습니다. 상세: " + error.message });
    }
};