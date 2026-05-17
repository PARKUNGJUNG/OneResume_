// 남들이 내 서브도메인으로 들어왔을 때 보여줄 결과 화면
import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import ResumePreview from "../components/ResumePreview";
import { API_BASE_URL } from "../config";
import toast from "react-hot-toast";
import ThemeToggle from "../components/ThemeToggle";
import logo from "../logo.svg";

function UserResumePage({ subdomain }) {
  const resumeRef = useRef();
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [formData, setFormData] = useState(null);
  
  const [focusedPage, setFocusedPage] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [windowSize, setWindowSize] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });

  // useResume.js의 최신 매핑 로직과 완벽하게 동기화
  const mapUserDataToFields = useCallback((user) => {
    const resume = user.resumes?.[0] || {};
    const eduParts = resume.education ? resume.education.split(" | ") : ["", "", ""];
    
    return {
      username: user.username || "",
      email: user.email || "",
      subdomain: user.subdomain || "",
      bio: user.bio || "",
      profileImageUrl: user.profileImageUrl || "",
      githubUrl: user.githubUrl || "",
      blogUrl: user.blogUrl || "",
      age: user.age || "",
      phone: user.phone || "",
      address: user.address || "",
      addressDetail: user.addressDetail || "",
      gender: user.gender || "",
      useInternationalAge: user.useInternationalAge || false,
      resumeTitle: resume.title || "개발자 이력서",
      school: eduParts[0] || "",
      major: eduParts[1] || "",
      gpa: eduParts[2] || "",
      skills: resume.skills || "",

      // 병역 사항 매핑
      militaryStatus: resume.militaryStatus || "",
      militaryBranch: resume.militaryBranch || "",
      militaryRank: resume.militaryRank || "",
      militaryStartDate: resume.militaryStartDate || "",
      militaryEndDate: resume.militaryEndDate || "",
      militaryExemption: resume.militaryExemption || "",

      selfIntroGrowth: resume.selfIntroGrowth || "",
      selfIntroCharacter: resume.selfIntroCharacter || "",
      selfIntroMotivation: resume.selfIntroMotivation || "",
      sectionOrder: resume.sectionOrder || "edu,skills,experience,projects,certs,extra",
      
      workExperiences: resume.workExperiences?.length > 0 
        ? resume.workExperiences.map((w, i) => ({ 
            ...w, 
            id: `db-we-${w.id || i}`, 
            companyName: w.companyName || "", 
            department: w.department || "", 
            role: w.role || "", 
            position: w.position || "", 
            jobDescription: w.jobDescription || "", 
            period: w.period || "", 
            isCurrent: w.isCurrent || false 
          }))
        : [],
        
      certifications: resume.certifications?.length > 0
        ? resume.certifications.map((c, i) => ({ 
            ...c, 
            id: `db-cert-${c.id || i}`, 
            type: c.type || "CERT", 
            name: c.name || "", 
            issuer: c.issuer || "", 
            date: c.date || "", 
            score: c.score || "" 
          }))
        : [],

      projects:
        resume.projects?.length > 0
          ? resume.projects.map((p, i) => ({ ...p, id: `db-prj-${p.id || i}` }))
          : [],
    };
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/resume/user/${subdomain}`);
        if (response.data) {
          setFormData(mapUserDataToFields(response.data));
        }
      } catch (err) {
        console.error("데이터 로드 에러:", err);
        toast.error("이력서를 찾을 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    
    const savedTheme = localStorage.getItem("oneresume-theme");
    if (savedTheme) setIsDarkMode(savedTheme === "true");
  }, [subdomain, mapUserDataToFields]);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleDarkMode = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("oneresume-theme", newTheme.toString());
  };

  const downloadPDF = () => {
    toast.success("PDF 출력을 준비합니다.");
    setTimeout(() => window.print(), 500); // EditPage와 동일하게 500ms로 최적화
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => toast.success("링크 복사 완료!"));
  };

  const handlePrevPage = (e) => {
    e.stopPropagation();
    setFocusedPage(prev => (prev === 1 ? totalPages : prev - 1));
  };

  const handleNextPage = (e) => {
    e.stopPropagation();
    setFocusedPage(prev => (prev === totalPages ? 1 : prev + 1));
  };

  const getScale = () => {
    const a4HeightPx = 1122.52;
    const a4WidthPx = 793.7;
    
    if (focusedPage) return (windowSize.height - 120) / a4HeightPx;
    
    // 화면 너비에 따른 동적 스케일 계산 (좌우 여백 고려)
    const padding = windowSize.width < 640 ? 32 : 80;
    const availableWidth = windowSize.width - padding;
    const dynamicScale = availableWidth / a4WidthPx;
    
    // 최대/최소 배율 제한 (PC에서는 너무 커지지 않게, 모바일에서는 너무 작아지지 않게)
    if (windowSize.width < 640) return Math.min(0.45, Math.max(0.35, dynamicScale));
    if (windowSize.width < 1024) return Math.min(0.55, dynamicScale);
    return Math.min(0.65, dynamicScale);
  };

  const baseScale = getScale();

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-lg animate-pulse">이력서를 불러오는 중...</p>
      </div>
    </div>
  );

  if (!formData) return <div className="text-center py-20 text-xl font-bold">존재하지 않는 페이지입니다.</div>;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${isDarkMode ? 'bg-[#09090b]' : 'bg-[#f4f4f5]'}`}>
      <header className={`fixed top-0 left-0 right-0 h-14 md:h-16 flex items-center justify-between px-4 md:px-6 z-[200] backdrop-blur-xl border-b print:hidden transition-all duration-300 shadow-sm ${
        isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-zinc-200'
      }`}>
        <div className="flex items-end gap-2 md:gap-2.5">
          <div 
            onClick={() => window.location.reload()}
            className="flex items-end gap-2 md:gap-2.5 cursor-pointer group"
            title="페이지 새로고침"
          >
            <img src={logo} alt="OneResume Logo" className="w-7 h-7 md:w-8 md:h-8 object-contain transition-transform group-hover:scale-110" />
            <h1 className={`text-[1rem] md:text-[1.2rem] font-black tracking-tighter transition-colors ${isDarkMode ? 'text-white group-hover:text-blue-400' : 'text-zinc-800 group-hover:text-blue-600'}`}>OneResume</h1>
          </div>
          <div className="flex items-end gap-1.5">
            <span className={`text-[1rem] md:text-[1.1rem] font-extralight mb-0.5 ${isDarkMode ? 'text-zinc-800' : 'text-zinc-200'}`}>|</span>
            <span className={`text-[0.9rem] md:text-[1.1rem] font-black tracking-tighter ${
              isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
            }`}>
              {subdomain ? `${subdomain.charAt(0).toUpperCase() + subdomain.slice(1)} Resume` : 'Resume'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 overflow-x-auto hide-scrollbar whitespace-nowrap pl-2 md:pl-0 flex-shrink-0">
          <div className="hidden md:block flex-shrink-0">
            <ThemeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
          </div>
          <button 
            onClick={copyShareLink} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 md:px-4 h-8 md:h-9 rounded-lg md:rounded-xl text-[10px] md:text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            링크 복사
          </button>
          <button 
            onClick={downloadPDF} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 md:px-4 h-8 md:h-9 rounded-lg md:rounded-xl text-[10px] md:text-xs shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF 저장
          </button>
        </div>
      </header>

      <main className={`pt-20 md:pt-24 pb-12 md:pb-20 px-4 flex flex-col items-center justify-start min-h-screen relative z-10 print:hidden ${focusedPage ? 'overflow-hidden' : ''}`}>
        {focusedPage && (
          <div className="fixed inset-0 z-[150] pointer-events-none flex flex-col items-center justify-between p-6 animate-fade-in print:hidden">
            <div className="w-full flex justify-end pointer-events-auto">
              <button onClick={() => setFocusedPage(null)} className="w-12 h-12 bg-black/60 hover:bg-black/80 backdrop-blur-2xl text-white rounded-2xl flex items-center justify-center transition-all shadow-2xl active:scale-90 border border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="w-full flex justify-between items-center px-2">
              <button onClick={handlePrevPage} className="pointer-events-auto w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-90 border border-white/10 group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={handleNextPage} className="pointer-events-auto w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-90 border border-white/10 group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            <div className="pointer-events-auto flex items-center gap-4 bg-black/60 backdrop-blur-2xl px-8 py-4 rounded-[32px] border border-white/10 shadow-2xl mb-4">
              <button onClick={() => setFocusedPage(null)} className="flex items-center gap-2 text-white font-black text-xs pr-6 border-r border-white/20 hover:text-blue-400 transition-colors uppercase tracking-widest">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                Grid View
              </button>
              <span className="text-white/80 font-black text-xs italic tracking-widest pl-2">
                PAGE {String(focusedPage).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}

        <div className={`w-full flex justify-center items-start transition-all duration-700 ${focusedPage ? 'z-[140]' : ''}`}>
          <div 
            className="transform-gpu flex items-center justify-center shrink-0 transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)]" 
            style={{ 
              transform: `scale(${baseScale})`, 
              transformOrigin: 'top center',
              marginTop: focusedPage ? '0px' : '20px',
              backfaceVisibility: 'hidden',
              WebkitFontSmoothing: 'antialiased'
            }}
          >
            <ResumePreview 
              formData={formData} 
              ref={resumeRef} 
              isDarkMode={isDarkMode} 
              paneWidth={windowSize.width < 1024 ? 20 : 50} 
              focusedPage={focusedPage} 
              setFocusedPage={setFocusedPage} 
              setTotalPages={setTotalPages} 
              containerHeight={windowSize.height - 120} 
              scale={baseScale} 
              marginTop={0} 
            />
          </div>
        </div>

        {!focusedPage && (
          <div className={`mt-20 text-center animate-bounce opacity-40 print:hidden ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            <p className="text-sm font-bold tracking-widest uppercase">Click a page to zoom</p>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          </div>
        )}
      </main>

      {/* 인쇄 전용 레이아웃 (Hidden Print Portal) */}
      <div className="hidden print:block bg-white relative">
        <ResumePreview formData={formData} isDarkMode={false} printMode={true} />
      </div>

      <footer className="py-12 text-center opacity-30 font-bold tracking-tighter text-sm print:hidden">
        <p>&copy; 2026 OneResume. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default UserResumePage;