import React, { useCallback, useMemo, useEffect } from "react";
import { GitHubCalendar } from "react-github-calendar";
import { Mail, Phone, MapPin, User, Globe } from "lucide-react";

// Lucide에서 Github 아이콘을 찾을 수 없는 경우를 위한 수동 정의
const GithubIcon = ({ size = 14, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const ResumePreview = React.memo(React.forwardRef((props, ref) => {
  const { 
    formData, 
    isDarkMode, 
    paneWidth = 50, 
    focusedPage, 
    setFocusedPage,
    setTotalPages,
    containerHeight = 0,
    scale = 1.0,
    marginTop = 0,
    printMode = false 
  } = props;

  const getGithubUsername = useCallback((url) => {
    if (!url) return null;
    let username = url.trim();
    if (username.includes("github.com/")) {
      const splitUrl = username.split("github.com/")[1];
      username = splitUrl.split("/")[0];
    }
    return username;
  }, []);

  const githubUsername = useMemo(() => getGithubUsername(formData.githubUrl), [formData.githubUrl, getGithubUsername]);

  const theme = useMemo(() => ({
    container: isDarkMode ? "bg-zinc-800 text-zinc-100" : "bg-white text-zinc-900",
    name: isDarkMode ? "text-white" : "text-zinc-900",
    bio: isDarkMode ? "text-zinc-400" : "text-zinc-500",
    divider: isDarkMode ? "border-zinc-700" : "border-zinc-200",
    sectionTitle: isDarkMode ? "text-zinc-200 border-zinc-700" : "text-zinc-800 border-zinc-800",
    textMain: isDarkMode ? "text-zinc-200" : "text-zinc-800",
    textSub: isDarkMode ? "text-zinc-400" : "text-zinc-600",
    infoIcon: isDarkMode ? "text-zinc-500" : "text-zinc-400",
    skillBg: isDarkMode ? "bg-zinc-700 text-zinc-200" : "bg-zinc-100 text-zinc-700",
    boxBg: isDarkMode ? "bg-zinc-900/50 border-zinc-700" : "bg-gray-50 border-zinc-200",
    timelineLine: isDarkMode ? "border-zinc-700" : "border-zinc-300",
    link: isDarkMode ? "text-blue-400" : "text-blue-600",
  }), [isDarkMode]);

  const calendarTheme = useMemo(() => ({
    light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  }), []);

  const handlePageClick = useCallback((pageNumber) => {
    const cols = paneWidth > 75 ? 4 : (paneWidth > 55 ? 3 : (paneWidth > 30 ? 2 : 1));
    if (focusedPage === pageNumber) setFocusedPage(null);
    else if (cols > 1) setFocusedPage(pageNumber);
  }, [focusedPage, paneWidth, setFocusedPage]);

  const handleLinkClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  // --- 섹션별 렌더링 함수들 ---
  const renderEdu = useCallback(() => (
    <section key="edu" className="mb-10">
      <h3 className={`text-base uppercase tracking-widest font-black mb-6 border-b-2 pb-1 inline-block ${theme.sectionTitle}`}>학력 사항</h3>
      <div className="flex justify-between items-start mt-2">
        <div>
          <p className={`text-3xl font-black ${theme.textMain}`}>{formData.school || "학교 정보 없음"}</p>
          <p className={`text-xl font-bold mt-1.5 ${theme.textSub}`}>{formData.major}</p>
        </div>
        {formData.gpa && (
          <div className={`px-5 py-2.5 rounded-xl border-2 font-black text-blue-600 ${isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
            학점: {formData.gpa}
          </div>
        )}
      </div>
    </section>
  ), [formData.school, formData.major, formData.gpa, theme, isDarkMode]);

  const renderSkills = useCallback(() => (
    <section key="skills" className="mb-10">
      <h3 className={`text-base uppercase tracking-widest font-black mb-6 border-b-2 pb-1 inline-block ${theme.sectionTitle}`}>보유 기술</h3>
      <div className="flex flex-wrap gap-3 mt-2">
        {formData.skills ? formData.skills.split(",").map((s, i) => (
          <span key={i} className={`px-5 py-2 rounded-xl text-base font-black transition-all ${theme.skillBg} hover:scale-105`}>{s.trim()}</span>
        )) : <p className="text-base opacity-40">기술 스택을 입력해주세요.</p>}
      </div>
    </section>
  ), [formData.skills, theme]);

  const renderCerts = useCallback(() => formData.certifications?.length > 0 && (
    <section key="certs" className="mb-10">
      <h3 className={`text-base uppercase tracking-widest font-black mb-6 border-b-2 pb-1 inline-block ${theme.sectionTitle}`}>자격 / 어학 / 수상</h3>
      <div className="grid grid-cols-2 gap-x-10 gap-y-5">
        {formData.certifications.slice(0, 6).map((cert, i) => (
          <div key={i} className={`flex justify-between items-end border-b pb-2.5 border-dashed ${theme.divider}`}>
            <div>
              <p className={`font-black text-base ${theme.textMain}`}>{cert.name}</p>
              <p className={`text-xs font-bold mt-1 ${theme.textSub}`}>{cert.issuer} | {cert.date}</p>
            </div>
            {cert.score && <span className={`text-xs font-black ${theme.link}`}>{cert.score}</span>}
          </div>
        ))}
      </div>
    </section>
  ), [formData.certifications, theme]);

  const renderWorkItem = useCallback((work, index, isFirstInSection) => (
    <div key={`work-${index}`} className="mb-12 last:mb-0">
      {isFirstInSection && (
        <h3 className={`text-base uppercase tracking-widest font-black mb-10 border-b-2 pb-1 inline-block ${theme.sectionTitle}`}>경력 사항</h3>
      )}
      <div className={`relative pl-8 border-l-2 ${theme.timelineLine}`}>
        <div className="absolute w-4 h-4 rounded-full -left-[9px] top-1.5 bg-blue-600 ring-4 ring-white dark:ring-zinc-800"></div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className={`text-3xl font-black ${theme.textMain}`}>{work.companyName}</h4>
            <p className={`text-base font-bold mt-1 text-blue-500`}>
              {work.department} 
              {work.position && ` | ${work.position}`} 
              {work.role && ` | ${work.role}`}
            </p>
          </div>
          {work.period && (
            <div className={`text-xs font-black px-5 py-2 rounded-full border ${theme.boxBg}`}>
              {work.period} {work.isCurrent ? <span className="text-blue-500 ml-1">(재직중)</span> : ''}
            </div>
          )}
        </div>
        <p className={`text-[15px] whitespace-pre-wrap leading-relaxed font-medium ${theme.textSub}`}>{work.jobDescription}</p>
      </div>
    </div>
  ), [theme]);

  const renderProjectItem = useCallback((project, index, isFirstInSection, isGitHubSection) => (
    <div key={isGitHubSection ? 'github' : `proj-${index}`} className="mb-12 last:mb-0">
      {isFirstInSection && (
        <h3 className={`text-base uppercase tracking-widest font-black mb-10 border-b-2 pb-1 inline-block ${theme.sectionTitle}`}>
          {isGitHubSection ? "GitHub 활동" : "주요 프로젝트"}
        </h3>
      )}
      
      {isGitHubSection ? (
        <div className={`flex justify-center p-8 border rounded-3xl ${theme.boxBg}`}>
          <GitHubCalendar 
            username={githubUsername} 
            blockSize={printMode ? 9 : 11} 
            blockMargin={4} 
            fontSize={11} 
            colorScheme={printMode ? "light" : (isDarkMode ? "dark" : "light")} 
            theme={calendarTheme} 
          />
        </div>
      ) : (
        <div className={`relative pl-8 border-l-2 ${theme.timelineLine}`}>
          <div className="absolute w-4 h-4 rounded-full -left-[9px] top-1.5 bg-blue-600 ring-4 ring-white dark:ring-zinc-800"></div>
          <div className="flex justify-between items-start mb-4">
            <h4 className={`text-2xl font-black ${theme.textMain}`}>{project.name}</h4>
            {project.period && <span className={`text-xs font-black px-5 py-2 rounded-full border ${theme.boxBg}`}>{project.period}</span>}
          </div>
          <p className={`text-base mb-4 text-blue-500 font-bold`}>{project.role ? `${project.role} | ` : ''}{project.techStack}</p>
          <p className={`text-[15px] whitespace-pre-wrap leading-relaxed font-medium ${theme.textSub}`}>{project.description}</p>
        </div>
      )}
    </div>
  ), [theme, githubUsername, printMode, isDarkMode, calendarTheme]);

  const renderExtra = useCallback(() => (formData.selfIntroGrowth || formData.selfIntroCharacter || formData.selfIntroMotivation) && (
    <section key="extra" className="mb-10 space-y-12">
      <h3 className={`text-base uppercase tracking-widest font-black mb-6 border-b-2 pb-1 inline-block ${theme.sectionTitle}`}>자기소개서</h3>
      
      {formData.selfIntroGrowth && (
        <div>
          <h4 className={`text-lg font-black mb-4 flex items-center gap-3 ${theme.textMain}`}>
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
            성장과정
          </h4>
          <p className={`text-[15px] leading-[1.9] whitespace-pre-wrap font-medium ${theme.textSub}`}>{formData.selfIntroGrowth}</p>
        </div>
      )}
      {formData.selfIntroCharacter && (
        <div>
          <h4 className={`text-lg font-black mb-4 flex items-center gap-3 ${theme.textMain}`}>
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
            성격의 장단점
          </h4>
          <p className={`text-[15px] leading-[1.9] whitespace-pre-wrap font-medium ${theme.textSub}`}>{formData.selfIntroCharacter}</p>
        </div>
      )}
      {formData.selfIntroMotivation && (
        <div>
          <h4 className={`text-lg font-black mb-4 flex items-center gap-3 ${theme.textMain}`}>
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">3</span>
            지원동기 및 포부
          </h4>
          <p className={`text-[15px] leading-[1.9] whitespace-pre-wrap font-medium ${theme.textSub}`}>{formData.selfIntroMotivation}</p>
        </div>
      )}
    </section>
  ), [formData.selfIntroGrowth, formData.selfIntroCharacter, formData.selfIntroMotivation, theme]);

  // --- 메인 페이지 구성 (순서 적용) ---
  
  // 1. 기본 인적사항 헤더 (항상 최상단)
  const header = useMemo(() => (
    <div key="header-root">
      <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
      <div className={`border-b-2 pb-10 mb-10 ${theme.divider}`}>
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1">
            <h2 className={`text-5xl font-black mb-3 tracking-tighter ${theme.name}`}>{formData.username || "이름 없음"}</h2>
            <p className={`text-xl font-bold mb-6 ${theme.bio}`}>{formData.bio || "한 줄 소개가 없습니다."}</p>
            
            <div className="grid grid-cols-2 gap-x-12 gap-y-5">
              {formData.email && (
                <div className="flex items-center gap-4">
                  <Mail size={19} className={theme.infoIcon} />
                  <span className={`text-[17px] font-bold ${theme.textMain}`}>{formData.email}</span>
                </div>
              )}
              {formData.phone && (
                <div className="flex items-center gap-4">
                  <Phone size={19} className={theme.infoIcon} />
                  <span className={`text-[17px] font-bold ${theme.textMain}`}>{formData.phone}</span>
                </div>
              )}
              {formData.address && (
                <div className="flex items-center gap-4 col-span-2">
                  <MapPin size={19} className={theme.infoIcon} />
                  <span className={`text-[17px] font-bold ${theme.textMain}`}>
                    {formData.address}
                    {formData.addressDetail && ` ${formData.addressDetail}`}
                  </span>
                </div>
              )}
              {(formData.age || formData.gender) && (
                <div className="flex items-center gap-4">
                  <User size={19} className={theme.infoIcon} />
                  <span className={`text-[17px] font-bold ${theme.textMain}`}>
                    {formData.age ? (formData.useInternationalAge ? `만 ${formData.age}세` : `${formData.age}세`) : ""}
                    {formData.gender && ` (${formData.gender === 'male' ? '남' : '여'})`}
                  </span>
                </div>
              )}
              {formData.militaryStatus && (
                <div className="flex items-center gap-4 col-span-2">
                  <span className={`text-[12px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg ${theme.skillBg}`}>병역 사항</span>
                  <span className={`text-[17px] font-bold ${theme.textMain}`}>
                    {formData.militaryStatus}
                    {formData.militaryStatus === '면제' ? (
                      formData.militaryExemption && ` (${formData.militaryExemption})`
                    ) : (
                      <>
                        {formData.militaryBranch && ` | ${formData.militaryBranch}`}
                        {formData.militaryRank && ` ${formData.militaryRank}`}
                        {(formData.militaryStartDate || formData.militaryEndDate) && (
                          ` | ${formData.militaryStartDate || ''} ~ ${formData.militaryEndDate || ''}`
                        )}
                      </>
                    )}
                  </span>
                </div>
              )}
              {formData.githubUrl && (
                <div className="flex items-center gap-4">
                  <GithubIcon size={19} className={theme.infoIcon} />
                  <a href={formData.githubUrl} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick} className={`text-[17px] font-bold hover:underline ${theme.link}`}>GitHub</a>
                </div>
              )}
              {formData.blogUrl && (
                <div className="flex items-center gap-4">
                  <Globe size={19} className={theme.infoIcon} />
                  <a href={formData.blogUrl} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick} className={`text-[17px] font-bold hover:underline ${theme.link}`}>Blog</a>
                </div>
              )}
            </div>
          </div>
          {formData.profileImageUrl && (
            <div className="ml-10 shrink-0">
              <img src={formData.profileImageUrl} alt="프로필" className="w-40 h-52 object-cover rounded-2xl shadow-2xl border-2 border-zinc-100" />
            </div>
          )}
        </div>
      </div>
    </div>
  ), [formData, theme, handleLinkClick]);

  const getItemHeight = useCallback((item) => {
    switch(item.type) {
      case 'edu': return formData.school ? 150 : 0;
      case 'skills': {
        if (!formData.skills) return 0;
        const skillCount = formData.skills.split(',').length;
        return 120 + Math.ceil(skillCount / 5) * 45;
      }
      case 'certs': {
        if (!formData.certifications?.length) return 0;
        return (formData.certifications.length) * 65 + 100;
      }
      case 'experience': {
        if (!item.data) return 0;
        const w = item.data;
        return 160 + (w.jobDescription?.length || 0) / 45 * 22;
      }
      case 'projects': {
        if (!item.data) return 0;
        if (item.data.github) return 320;
        const p = item.data;
        return 220 + (p.description?.length || 0) / 45 * 22;
      }
      case 'extra': {
        if (!formData.selfIntroGrowth && !formData.selfIntroCharacter && !formData.selfIntroMotivation) return 0;
        let h = 100;
        if (formData.selfIntroGrowth) h += 120 + (formData.selfIntroGrowth.length / 45) * 22;
        if (formData.selfIntroCharacter) h += 120 + (formData.selfIntroCharacter.length / 45) * 22;
        if (formData.selfIntroMotivation) h += 120 + (formData.selfIntroMotivation.length / 45) * 22;
        return h;
      }
      default: return 0;
    }
  }, [formData]);

  const renderItem = useCallback((item) => {
    switch(item.type) {
      case 'edu': return renderEdu();
      case 'skills': return renderSkills();
      case 'certs': return renderCerts();
      case 'experience': return renderWorkItem(item.data, item.index, item.isFirst);
      case 'projects': return renderProjectItem(item.data, item.index, item.isFirst, item.data.github);
      case 'extra': return renderExtra();
      default: return null;
    }
  }, [renderEdu, renderSkills, renderCerts, renderWorkItem, renderProjectItem, renderExtra]);

  const pages = useMemo(() => {
    const pagesList = [];
    let currentPageNum = 1;
    const sectionsArr = (formData.sectionOrder || "edu,skills,experience,projects,certs,extra").split(',');
    
    const flatItems = [];
    sectionsArr.forEach(sec => {
      if (sec === 'experience' && formData.workExperiences?.length > 0) {
        formData.workExperiences.forEach((work, i) => {
          flatItems.push({ type: 'experience', data: work, index: i, isFirst: i === 0 });
        });
      } else if (sec === 'projects') {
        if (githubUsername) {
          flatItems.push({ type: 'projects', data: { github: true }, index: -1, isFirst: true });
        }
        if (formData.projects?.length > 0) {
          formData.projects.forEach((proj, i) => {
            flatItems.push({ type: 'projects', data: proj, index: i, isFirst: !githubUsername && i === 0 });
          });
        }
      } else {
        flatItems.push({ type: sec, data: null, index: 0, isFirst: true });
      }
    });

    const MAX_PAGE_HEIGHT = 920;
    const initialHeaderHeight = 380;

    let currentPageItems = [];
    let currentHeight = initialHeaderHeight;

    flatItems.forEach((item) => {
      const itemHeight = getItemHeight(item);
      if (itemHeight === 0) return;

      if (currentHeight + itemHeight > MAX_PAGE_HEIGHT && currentPageItems.length > 0) {
        pagesList.push({
          id: currentPageNum,
          content: (
            <div className="flex flex-col h-full pb-16">
              {currentPageNum === 1 && header}
              {currentPageItems.map((it, i) => <React.Fragment key={i}>{renderItem(it)}</React.Fragment>)}
              <div className="absolute bottom-8 right-10 text-[11px] opacity-30 font-bold tracking-tighter italic">{String(currentPageNum++).padStart(2, '0')} 페이지</div>
            </div>
          )
        });
        currentPageItems = [item];
        currentHeight = itemHeight;
      } else {
        currentPageItems.push(item);
        currentHeight += itemHeight;
      }
    });

    if (currentPageItems.length > 0) {
      pagesList.push({
        id: currentPageNum,
        content: (
          <div className="flex flex-col h-full pb-16">
            {currentPageNum === 1 && header}
            {currentPageItems.map((it, i) => <React.Fragment key={i}>{renderItem(it)}</React.Fragment>)}
            <div className="absolute bottom-8 right-10 text-[11px] opacity-30 font-bold tracking-tighter italic">{String(currentPageNum++).padStart(2, '0')} 페이지</div>
          </div>
        )
      });
      currentPageNum++;
    }

    return pagesList;
  }, [formData, githubUsername, theme, getItemHeight, renderItem, header, handleLinkClick]);

  useEffect(() => {
    const cols = paneWidth > 75 ? 4 : (paneWidth > 55 ? 3 : (paneWidth > 30 ? 2 : 1));
    if (cols === 1 && focusedPage !== null) {
      setFocusedPage(null);
    }
  }, [paneWidth, focusedPage, setFocusedPage]);

  useEffect(() => {
    if (setTotalPages) {
      setTotalPages(pages.length);
    }
  }, [pages.length, setTotalPages]);

  if (printMode) {
    return (
      <div ref={ref} className="bg-white">
        {pages.map((page) => (
          <div 
            key={page.id} 
            data-print-page="true" 
            className="w-[210mm] h-[297mm] p-[20mm] bg-white text-zinc-900 flex flex-col relative overflow-hidden shrink-0"
            style={{ 
              fontFamily: "'Noto Sans KR', sans-serif",
              boxSizing: 'border-box',
              display: 'block',
              pageBreakAfter: 'always',
              pageBreakInside: 'avoid'
            }}
          >
            {page.content}
          </div>
        ))}
      </div>
    );
  }

  const gap = 8;
  const pageW = 210;
  const pageH = 297;
  const cols = paneWidth > 75 ? 4 : (paneWidth > 55 ? 3 : (paneWidth > 30 ? 2 : 1));
  const rows = Math.ceil(pages.length / cols);
  const canvasW = `${cols * pageW + (cols - 1) * gap}mm`;
  const canvasH = `${rows * pageH + (rows - 1) * gap}mm`;

  let translateX = "0px";
  let translateY = "0px";
  let zoomScale = 1;

  if (focusedPage) {
    const pageIndex = pages.findIndex(p => p.id === focusedPage);
    if (pageIndex !== -1) {
      const col = pageIndex % cols;
      const row = Math.floor(pageIndex / cols);
      const tx = (col * (pageW + gap)) + (pageW / 2);
      const ty = (row * (pageH + gap)) + (pageH / 2);
      const canvasCenterX = (cols * pageW + (cols - 1) * gap) / 2;
      translateX = `${canvasCenterX - tx}mm`;
      const factor = 3.7795275591;
      const viewportCenterInMm = (containerHeight / 2) / (scale * factor);
      const topMarginInMm = marginTop / (scale * factor);
      translateY = `${viewportCenterInMm - ty - topMarginInMm}mm`; 
      zoomScale = 1.0; 
    }
  }

  return (
    <div ref={ref} className="relative flex items-center justify-center transition-all duration-700 ease-in-out" style={{ width: canvasW, height: canvasH }}>
      <div 
        className="relative w-full h-full transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{ transform: `translate(${translateX}, ${translateY}) scale(${zoomScale})` }}
      >
        {pages.map((page, index) => {
          const isFocused = focusedPage === page.id;
          const isAnyFocused = typeof focusedPage === 'number';
          const col = index % cols;
          const row = Math.floor(index / cols);
          const left = `${col * (pageW + gap)}mm`;
          const top = `${row * (pageH + gap)}mm`;

          return (
            <div 
              key={page.id} 
              className={`absolute w-[210mm] h-[297mm] p-[20mm] shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer rounded-[2mm] flex flex-col ${theme.container} ${
                isFocused 
                  ? 'z-[100] opacity-100 scale-100' 
                  : isAnyFocused 
                    ? 'opacity-30 scale-95' 
                    : 'opacity-100 hover:scale-[1.02] hover:z-50'
              }`}
              style={{ left, top }}
              onClick={() => handlePageClick(page.id)}
            >
              {page.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}));

ResumePreview.displayName = 'ResumePreview';

export default ResumePreview;