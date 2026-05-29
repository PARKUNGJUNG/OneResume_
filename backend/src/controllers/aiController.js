const axios = require("axios");
const prisma = require("../config/prisma");

// [보안] 클라이언트용 안전한 에러 메시지 반환 함수
const handleAiError = (error, res, customMessage = "AI 분석 서버에 일시적인 문제가 발생했습니다.") => {
  console.error("Gemini API Error Details:", error.response?.data || error.message);
  
  // 429 Quota Exceeded 대응
  if (error.response?.status === 429 || error.message.includes("429")) {
    return res.status(429).json({
      message: "현재 AI 사용량이 많아 잠시 휴식이 필요합니다. 약 1분 후 다시 시도해 주세요.",
      error: "Quota Exceeded"
    });
  }

  // 그 외 일반적인 에러 (500)
  res.status(500).json({ 
    message: customMessage + " 잠시 후 다시 시도해 주세요.",
    error: "Internal Server Error"
  });
};

exports.auditResumeContent = async (req, res) => {
  try {
    const { fieldName, content, context } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ message: "서버에 API 키가 설정되지 않았습니다." });
    }

    if (!content || content.trim().length < 5) {
      return res.status(400).json({ 
        message: "분석할 내용이 너무 짧습니다. 최소 5자 이상 입력해 주세요." 
      });
    }

    // [서버 부하 우회] latest 별칭 대신 가장 안정적인 명시적 버전 사용
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
      당신은 세계 최고의 커리어 코치이자 이력서 첨삭 전문가입니다. 
      사용자가 작성한 이력서의 특정 항목을 분석하여 실시간으로 피드백을 주세요.

      [분석 대상 항목]: ${fieldName}
      [현재 작성된 내용]: 
      <<< USER_INPUT_START >>>
      "${content}"
      <<< USER_INPUT_END >>>

      [추가 컨텍스트]: ${context || "없음"}

      [첨삭 가이드라인]:
      1. [한 줄 소개(Bio)] 항목인 경우, 반드시 50자 이내의 강렬한 '한 줄' 문장으로 제안하세요. (에세이 금지)
      2. 사용자가 입력하지 않은 정보(예: [00]%, [성과])를 대괄호나 빈칸 형식으로 억지로 넣지 마세요. 
      3. 구체적인 수치가 없다면 전문적인 어휘(예: '최적화', '효율화', '기여')를 사용하여 문장의 품격을 높이세요.
      4. STAR 기법을 활용하되, 결과(Result)를 문장의 앞부분에 배치하여 임팩트를 주는 방식도 고려하세요.
      5. 답변은 정중하면서도 자신감을 주는 전문가의 톤앤매너를 유지하세요.

      [답변 형식 (반드시 JSON으로만 답변하세요)]:
      {
        "feedback": "전체적인 피드백 요약",
        "suggestions": ["구체적인 문장 수정 제안 1", "수정 제안 2"],
        "questions": ["보완을 위한 핵심 질문 1", "질문 2"],
        "refinedText": "가장 추천하는 완성형 문장 예시"
      }
    `;

    const response = await axios.post(apiUrl, {
      contents: [{
        parts: [{ text: prompt }]
      }]
    }, {
      timeout: 20000 // 20초 타임아웃으로 조정
    });

    // 응답 데이터에서 텍스트 추출
    const responseText = response.data.candidates[0].content.parts[0].text;
    
    // JSON 데이터만 추출
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI의 응답에서 유효한 데이터를 찾을 수 없습니다.");
    }

    const auditResult = JSON.parse(jsonMatch[0]);
    res.json(auditResult);

  } catch (error) {
    handleAiError(error, res);
  }
};

// [신규] 채용 공고(JD) 매칭 및 점수화 API
exports.matchJD = async (req, res) => {
  try {
    const { jdText } = req.body;
    const userId = req.user.id;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!jdText || jdText.trim().length < 10) {
      return res.status(400).json({ message: "분석을 위해 공고 URL 또는 내용을 입력해 주세요." });
    }

    // 1. 유저의 마스터 이력서 데이터 조회
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
      return res.status(404).json({ message: "분석할 이력서 데이터가 없습니다. 먼저 이력서를 작성해 주세요." });
    }

    const resume = user.resumes[0];

    // 2. 이력서 데이터를 텍스트로 직렬화
    const resumeText = `
      [이름/기본정보]: ${user.username}, ${user.bio || "없음"}
      [학력]: ${resume.education || "없음"}
      [보유 기술]: ${resume.skills || "없음"}
      [경력 사항]: ${resume.workExperiences.map(w => `${w.companyName} (${w.role}, ${w.period}): ${w.jobDescription}`).join("\n")}
      [프로젝트]: ${resume.projects.map(p => `${p.name} (${p.role}): ${p.description} (기술: ${p.techStack})`).join("\n")}
      [자격증/수상]: ${resume.certifications.map(c => `${c.name} (${c.issuer}, ${c.date})`).join("\n")}
      [자기소개]: ${resume.selfIntroGrowth || ""} ${resume.selfIntroCharacter || ""} ${resume.selfIntroMotivation || ""}
    `;

    // 3. Gemini 프롬프트 구성 (URL 대응 강화)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const prompt = `
      당신은 기업의 채용 담당자이자 AI 매칭 전문가입니다. 
      사용자의 [이력서]와 제공된 [채용 정보]를 비교 분석하여 정밀한 리포트를 작성하세요.

      [채용 정보 (텍스트 또는 URL)]:
      "${jdText}"

      [사용자 이력서]:
      "${resumeText}"

      [분석 가이드라인]:
      1. 입력된 내용이 URL인 경우, 해당 플랫폼(사람인, 잡코리아, 원티드 등)과 주소의 구조를 바탕으로 기업명과 직무를 유추하여 당신의 지식 내에서 분석을 시도하세요.
      2. 만약 제공된 정보가 너무 부족하여 분석이 불가능하다면, improvementTips에 "텍스트로 전체 내용을 붙여넣어 달라"는 안내를 포함시키고 점수는 0점으로 주세요.
      3. score: 0점에서 100점 사이의 숫자로 매칭 점수를 산출하세요. JD의 필수 역량과 이력서의 경험이 얼마나 일치하는지가 기준입니다.
      4. coreCompetencies: JD에서 요구하는 핵심 역량 및 기술 스택 3~5개를 추출하세요.
      5. matchedKeywords: 사용자의 이력서에서 JD와 일치하거나 관련 있는 키워드/경험을 추출하세요.
      6. missingKeywords: JD에는 있으나 사용자의 이력서에는 부족하거나 보완이 필요한 키워드/역량을 추출하세요.
      7. improvementTips: 이 공고에 합격하기 위해 이력서의 어느 부분을 어떻게 수정하면 좋을지 구체적인 조언을 3개 이상 제공하세요.

      [답변 형식 (반드시 JSON으로만 답변하세요)]:
      {
        "score": 85,
        "coreCompetencies": ["React", "TypeScript", "상태 관리 라이브러리 경험"],
        "matchedKeywords": ["React 숙련도", "포트폴리오 프로젝트 경험"],
        "missingKeywords": ["Next.js", "CI/CD 파이프라인 구축 경험"],
        "improvementTips": [
          "프로젝트 경험 섹션에 Next.js 사용 여부를 구체적으로 명시하세요.",
          "경력 사항에서 협업 도구(Jira, Confluence) 활용 사례를 추가하면 좋습니다.",
          "자기소개서 지원동기에 해당 기업의 비즈니스 모델에 대한 이해도를 녹여내세요."
        ]
      }
    `;

    const response = await axios.post(apiUrl, {
      contents: [{
        parts: [{ text: prompt }]
      }]
    }, {
      timeout: 30000 // 30초 타임아웃 설정
    });

    const responseText = response.data.candidates[0].content.parts[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("AI 분석 결과 형식이 올바르지 않습니다.");
    }

    const result = JSON.parse(jsonMatch[0]);
    res.json(result);

  } catch (error) {
    console.error("JD Matching Error:", error.message);
    res.status(500).json({ 
      message: "AI 매칭 분석 중 오류가 발생했습니다.",
      error: error.message 
    });
  }
};

// [신규] 공고 맞춤형 자소서 생성 API
exports.generateCoverLetter = async (req, res) => {
  try {
    const { jdText } = req.body;
    const userId = req.user.id;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!jdText || jdText.trim().length < 10) {
      return res.status(400).json({ message: "채용 공고 내용을 입력해 주세요." });
    }

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
      return res.status(404).json({ message: "이력서 데이터가 없습니다. 먼저 이력서를 작성해 주세요." });
    }

    const resume = user.resumes[0];

    const resumeText = `
      [이름]: ${user.username}
      [보유 기술]: ${resume.skills || "없음"}
      [경력 사항]: ${resume.workExperiences.map(w => `${w.companyName} (${w.role}, ${w.period}): ${w.jobDescription}`).join("\n")}
      [프로젝트]: ${resume.projects.map(p => `${p.name} (${p.role}): ${p.description} (기술: ${p.techStack})`).join("\n")}
      [자격증/수상]: ${resume.certifications.map(c => `${c.name} (${c.issuer}, ${c.date})`).join("\n")}
      [기존 자기소개서 - 성장과정]: ${resume.selfIntroGrowth || ""}
      [기존 자기소개서 - 성격의 장단점]: ${resume.selfIntroCharacter || ""}
      [기존 자기소개서 - 지원동기 및 포부]: ${resume.selfIntroMotivation || ""}
    `;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const prompt = `
      당신은 수많은 합격자를 배출한 취업 전문 컨설턴트입니다.
      사용자의 [기존 이력서 정보]와 제공된 [채용 공고(JD)]를 분석하여, 이 공고에 완벽하게 맞춤화된 자기소개서 초안을 작성해주세요.

      [채용 공고]:
      <<< USER_INPUT_START >>>
      "${jdText}"
      <<< USER_INPUT_END >>>

      [사용자 이력서 정보]:
      "${resumeText}"

      [작성 가이드라인]:
      1. 지원동기, 직무 역량, 성장과정/성격 등 3가지 필수 문항으로 나누어 작성하세요.
      2. 공고(JD)에서 요구하는 핵심 키워드나 기술 스택이 사용자의 경험(프로젝트, 경력)에 있다면 그 경험을 강력하게 어필하세요.
      3. STAR 기법(Situation, Task, Action, Result)을 활용하여 구체적이고 전문적인 어휘를 사용하세요.
      4. 문체는 정중하고 자신감 있는 '~습니다/합니다' 체를 사용하세요.
      5. 각 항목은 300~500자 분량으로 작성하세요.

      [답변 형식 (반드시 JSON으로만 답변하세요)]:
      {
        "motivation": "해당 기업/직무 지원동기 초안",
        "competency": "해당 직무에 부합하는 본인의 핵심 역량과 경험 어필 초안",
        "character": "성장과정 또는 성격의 장단점을 활용한 조직 적합성 어필 초안",
        "summary": "이 자소서 초안의 작성 전략 요약 (어떤 부분을 강조했는지 1~2줄 설명)"
      }
    `;

    const response = await axios.post(apiUrl, {
      contents: [{
        parts: [{ text: prompt }]
      }]
    }, {
      timeout: 20000 // 20초 타임아웃으로 조정
    });

    const responseText = response.data.candidates[0].content.parts[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("AI 분석 결과 형식이 올바르지 않습니다.");
    }

    const result = JSON.parse(jsonMatch[0]);
    res.json(result);

  } catch (error) {
    handleAiError(error, res, "맞춤형 자소서 생성 중 오류가 발생했습니다.");
  }
};

