import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ResumeForm from "../components/ResumeForm";
import ResumePreview from "../components/ResumePreview";
import toast from "react-hot-toast";
import useResume from "../hooks/useResume";
import PageLayout from "../components/PageLayout";
import ThemeToggle from "../components/ThemeToggle";
import JDMatchModal from "../components/JDMatchModal";
import ConnectModal from "../components/ConnectModal";
import logo from "../logo.svg";

function EditPage({ isDarkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const resumeRef = useRef();
  const menuRef = useRef();
  
  const [leftWidth, setLeftWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [focusedPage, setFocusedPage] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [isJDModalOpen, setIsJDModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('edit'); // 'edit' or 'preview'

  // --- 메뉴 외부 클릭 감지 ---
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 확장 프로그램 실시간 감지 로직 ---
  useEffect(() => {
    const handlePong = () => {
      setIsExtensionInstalled(true);
    };

    window.addEventListener('ONERESUME_PONG', handlePong);

    const pingInterval = setInterval(() => {
      if (!isExtensionInstalled) {
        window.dispatchEvent(new CustomEvent('ONERESUME_PING'));
      }
    }, 1000);

    return () => {
      window.removeEventListener('ONERESUME_PONG', handlePong);
      clearInterval(pingInterval);
    };
  }, [isExtensionInstalled]);

  const [windowSize, setWindowSize] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });

  // --- 새로고침 및 이탈 방지 경고 ---
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ""; 
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // --- 윈도우 리사이즈 핸들러 ---
  useEffect(() => {
    let animationFrameId;
    const handleResize = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      });
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth > 20 && newWidth < 85) setLeftWidth(newWidth);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const {
    formData, loading, handleChange, handleProjectChange, handleImageUpload, handleGithubSync,
    addProject, removeProject, handleWorkChange, addWork, removeWork, handleCertChange,
    addCert, removeCert, handleDragEnd, auditContent, handleSubmit
  } = useResume();

  const handleLogout = () => {
    localStorage.removeItem("oneresume-token"); 
    sessionStorage.removeItem("oneresume-token");
    localStorage.removeItem("oneresume-profile-image");
    toast.success("정상적으로 로그아웃되었습니다.");
    navigate("/");
  };

  const handlePrevPage = (e) => {
    e.stopPropagation();
    setFocusedPage(prev => (prev === 1 ? totalPages : prev - 1));
  };

  const handleNextPage = (e) => {
    e.stopPropagation();
    setFocusedPage(prev => (prev === totalPages ? 1 : prev + 1));
  };

  const copyShareLink = () => {
    const currentSubdomain = formData.subdomain?.trim();
    if (!currentSubdomain) { toast.error("서브도메인을 먼저 설정해주세요"); return; }
    const shareUrl = `${window.location.protocol}//${currentSubdomain}.${window.location.hostname}`;
    navigator.clipboard.writeText(shareUrl).then(() => toast.success("링크 복사 완료!"));
  };

  const downloadPDF = () => {
    toast.success("PDF 출력을 준비합니다.");
    setTimeout(() => window.print(), 500);
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEndWithState = useCallback((result) => {
    setIsDragging(false);
    handleDragEnd(result);
  }, [handleDragEnd]);

  // --- 동적 스케일 계산 ---
  const isMobile = windowSize.width < 1024;
  const effectiveLeftWidth = isMobile ? 100 : leftWidth;
  const leftPanePixelWidth = (effectiveLeftWidth / 100) * windowSize.width;
  
  const dynamicFormZoom = isMobile ? 1.0 : Math.min(1.2, Math.max(0.7, leftPanePixelWidth / 900));
  
  const [activeZoom, setActiveZoom] = useState(dynamicFormZoom);
  useEffect(() => {
    if (!isDragging) setActiveZoom(dynamicFormZoom);
  }, [dynamicFormZoom, isDragging]);

  if (loading) return <PageLayout isDarkMode={isDarkMode}><div className="h-full flex items-center justify-center animate-pulse text-slate-500 font-bold text-xl">데이터 로딩 중...</div></PageLayout>;

  const getScale = () => {
    const a4HeightPx = 1122.52;
    const a4WidthPx = 793.7;
    const headerHeight = 56;
    const margin = isMobile ? 40 : 80;

    if (focusedPage) return (windowSize.height - 76) / a4HeightPx;

    // 모바일/싱글뷰 모드에서의 배율
    if (isMobile) {
      const padding = 32;
      const availableWidth = windowSize.width - padding;
      return Math.min(0.5, availableWidth / a4WidthPx);
    }

    const previewPaneWidth = (windowSize.width * (100 - leftWidth)) / 100 - 40;
    const scaleByHeight = (windowSize.height - headerHeight - margin) / a4HeightPx;
    const scaleByWidth = previewPaneWidth / a4WidthPx;
    const targetBaseScale = windowSize.height < 950 ? 0.38 : 0.44;
    
    return Math.max(0.1, Math.min(targetBaseScale, scaleByHeight, scaleByWidth));
  };

  const baseScale = getScale();
  const transitionClass = isResizing 
    ? "transition-none" 
    : "transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]";

  return (
    <PageLayout isDarkMode={isDarkMode} noPadding={true}>
      <header className={`h-14 px-4 md:px-6 border-b flex items-center justify-between z-40 print:hidden ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-zinc-200'}`}>
        <div className="flex items-center gap-3 md:gap-4 flex-shrink-0 mr-4">
          <div className="flex items-center gap-2 md:gap-2.5 flex-shrink-0">
            <img 
              src={logo} 
              alt="OneResume Logo" 
              onClick={() => window.location.reload()}
              className="w-7 h-7 md:w-8 md:h-8 object-contain flex-shrink-0 cursor-pointer transition-transform hover:scale-110 active:scale-95" 
              title="편집 페이지 새로고침"
            />
            <div className="flex items-end gap-1.5 whitespace-nowrap">
              <h1 
                onClick={() => window.location.reload()}
                className={`text-[1rem] md:text-[1.2rem] font-black tracking-tighter cursor-pointer transition-colors ${isDarkMode ? 'text-white hover:text-blue-400' : 'text-zinc-800 hover:text-blue-600'}`}
                title="편집 페이지 새로고침"
              >
                OneResume
              </h1>
              <button 
                onClick={() => navigate('/setup-profile', { state: { step: 2 } })}
                className={`text-[0.9rem] md:text-[1.1rem] font-black tracking-tighter transition-all hover:scale-105 active:scale-95 hover:underline underline-offset-4 cursor-pointer ${(() => {
                  const colorMap = {
                    developer: isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700',
                    it: isDarkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700',
                    admin: isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700',
                    sales: isDarkMode ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700',
                    design: isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700',
                    finance: isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700',
                    hr: isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700',
                    service: isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700',
                    marketing_pr: isDarkMode ? 'text-rose-400 hover:text-rose-300' : 'text-rose-600 hover:text-rose-700',
                    education: isDarkMode ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700',
                    medical: isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700',
                    legal: isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-700'
                  };
                  return colorMap[formData.job] || (isDarkMode ? 'text-indigo-400' : 'text-indigo-600');
                })()}`}
                title="직무 변경하기"
              >
                {(() => {
                  const jobMap = {
                    developer: 'Developer',
                    it: 'IT Engineer',
                    admin: 'General Affairs',
                    sales: 'Sales',
                    design: 'Designer',
                    finance: 'Finance',
                    hr: 'HR',
                    service: 'CS',
                    marketing_pr: 'Marketer',
                    education: 'Educator',
                    medical: 'Medical',
                    legal: 'Legal Affairs'
                  };
                  return jobMap[formData.job] || 'Not Set';
                })()}
              </button>
            </div>
          </div>

                  {isExtensionInstalled && (
            <div className="hidden lg:flex items-end gap-3 animate-in fade-in slide-in-from-left-3 duration-700 flex-shrink-0 border-l border-zinc-500/20 pl-3">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                  <span className={`text-[10px] md:text-xs font-black uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    Extension Active
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 justify-end">
          <div className="flex items-center gap-2 md:gap-3 hide-scrollbar whitespace-nowrap pl-2 md:pl-0 flex-shrink-0" ref={menuRef}>
            
            {/* 공용 컨트롤 영역 (Theme) */}
            <ThemeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
            
            {/* 데스크탑 전용 사이드바 토글 버튼 (<) */}
            {!isMobile && (
              <button 
                onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                className={`group flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-500 border-2 shadow-sm active:scale-95 flex-shrink-0 ${
                  isHeaderCollapsed 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20' 
                    : (isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600' : 'bg-white border-zinc-200 text-zinc-500 hover:text-blue-600 hover:border-blue-200')
                }`}
                title={isHeaderCollapsed ? "메뉴 펼치기" : "메뉴 접기"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-500 ease-in-out ${isHeaderCollapsed ? 'rotate-180' : 'group-hover:-translate-x-0.5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* 기능 버튼들 (데스크탑 펼침 상태일 때만 나열) - Collapsed 시 공간 차지 0으로 최적화 */}
            <div className={`hidden lg:flex items-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden ${
              isHeaderCollapsed ? 'max-w-0 opacity-0 pointer-events-none -ml-2 md:-ml-3' : 'max-w-[1000px] opacity-100'
            }`}>
              <div className="flex items-center gap-2 md:gap-3">
                <button 
                  onClick={() => setIsConnectModalOpen(true)} 
                  className="bg-purple-600 hover:bg-purple-700 text-white font-black px-4 h-9 rounded-xl text-[10px] md:text-xs flex items-center gap-1.5 border-2 border-purple-500/20 shadow-lg shadow-purple-600/20 transition-all active:scale-95 flex-shrink-0"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 10V3L4 14H11V21L20 10H13Z" />
                  </svg>
                  확장 프로그램 연동
                </button>
                <button 
                  onClick={() => setIsJDModalOpen(true)} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 h-9 rounded-xl text-[10px] md:text-xs flex items-center gap-1.5 border-2 border-indigo-500/20 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex-shrink-0"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 flex-shrink-0 fill-white">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                  </svg>
                  AI 공고 매칭
                </button>
                <button 
                  onClick={copyShareLink} 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4 h-9 rounded-xl text-[10px] md:text-xs flex items-center gap-1.5 border-2 border-blue-500/20 shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                  링크 복사
                </button>
                <button 
                  onClick={downloadPDF} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 h-9 rounded-xl text-[10px] md:text-xs flex items-center gap-1.5 border-2 border-emerald-500/20 shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF 저장
                </button>
              </div>
            </div>

            {/* 프로필 토글 버튼 (완벽한 수평 정렬을 위한 픽셀 튜닝) */}
            <div className="relative flex-shrink-0 flex items-center h-9">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`group flex items-center h-9 gap-2.5 px-3 rounded-xl border-2 transition-all active:scale-95 shadow-sm antialiased ${
                  isMenuOpen 
                    ? 'border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/10' 
                    : (isDarkMode ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/80' : 'bg-white border-zinc-200 hover:border-blue-300 hover:bg-zinc-50')
                }`}
              >
                {/* 아바타 영역 (24px로 고정하여 h-9 내에서 완벽한 수직 중앙 정렬) */}
                <div className={`w-6 h-6 rounded-full overflow-hidden border shadow-inner flex-shrink-0 ${isDarkMode ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-100 bg-zinc-50'}`}>
                  {formData.profileImageUrl ? (
                    <img src={formData.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                  )}
                </div>

                {/* 이름 및 소셜 로고 영역 */}
                <div className="flex items-center gap-2 h-full">
                  <span className={`text-[12px] font-black tracking-tighter leading-none ${isDarkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>
                    {formData.username || '사용자'}
                  </span>
                  
                  {/* 소셜 로그인 로고 뱃지 */}
                  {formData.provider && formData.provider !== 'LOCAL' && (
                    <div className="flex items-center h-full">
                      {formData.provider === 'KAKAO' && (
                        <div className="w-3.5 h-3.5 bg-[#FEE500] rounded-[3px] flex items-center justify-center shadow-[0_0.5px_2px_rgba(0,0,0,0.1)]">
                          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-[#3C1E1E]" fill="currentColor">
                            <path d="M12 3C7.029 3 3 6.129 3 10.129c0 2.59 1.676 4.88 4.232 6.13l-1.077 3.96c-.083.303.326.541.53.37l4.67-3.111c.532.062 1.078.093 1.645.093 4.971 0 9-3.129 9-7.129C21 6.129 16.971 3 12 3z" />
                          </svg>
                        </div>
                      )}
                      {formData.provider === 'NAVER' && (
                        <div className="w-3.5 h-3.5 bg-[#03C75A] rounded-[3px] flex items-center justify-center shadow-[0_0.5px_2px_rgba(0,0,0,0.1)]">
                          <span className="text-[7.5px] font-[1000] text-white leading-none transform -translate-y-[0.5px]">N</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 드롭다운 표시 아이콘 */}
                <div className="flex items-center h-full">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`w-3.5 h-3.5 transition-all duration-300 ${isMenuOpen ? 'rotate-180 text-blue-500' : 'text-zinc-400 group-hover:text-zinc-500'}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* 드롭다운 메뉴 (UX 기반 정보 재배치: 계정 정보 -> 빠른 도구 -> 로그아웃) */}
              {isMenuOpen && (
                <div className={`absolute top-full right-0 mt-3 w-64 p-1.5 rounded-2xl border shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-[110] ${
                  isDarkMode ? 'bg-zinc-900 border-zinc-700 shadow-black/50' : 'bg-white border-zinc-100 shadow-zinc-200/50'
                }`}>
                  
                  {/* 1. 계정 정보 (최상단 Identity 섹션) */}
                  <div className="px-4 py-3 border-b border-zinc-500/10 mb-1">
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>계정 정보</p>
                    <p className={`text-sm font-black truncate ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>{formData.username || '사용자'}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <p className={`text-[10px] font-bold ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {formData.provider === 'KAKAO' ? '카카오 계정으로 로그인됨' : 
                         formData.provider === 'NAVER' ? '네이버 계정으로 로그인됨' : 
                         'OneResume 이메일로 로그인됨'}
                      </p>
                      <div className="flex items-center">
                        {formData.provider === 'KAKAO' && (
                          <div className="w-3.5 h-3.5 bg-[#FEE500] rounded-[2px] flex items-center justify-center shadow-sm">
                            <svg viewBox="0 0 24 24" className="w-2 h-2 text-[#3C1E1E]" fill="currentColor">
                              <path d="M12 3C7.029 3 3 6.129 3 10.129c0 2.59 1.676 4.88 4.232 6.13l-1.077 3.96c-.083.303.326.541.53.37l4.67-3.111c.532.062 1.078.093 1.645.093 4.971 0 9-3.129 9-7.129C21 6.129 16.971 3 12 3z" />
                            </svg>
                          </div>
                        )}
                        {formData.provider === 'NAVER' && (
                          <div className="w-3.5 h-3.5 bg-[#03C75A] rounded-[2px] flex items-center justify-center shadow-sm">
                            <span className="text-[7px] font-[1000] text-white leading-none">N</span>
                          </div>
                        )}
                        {( !formData.provider || formData.provider === 'LOCAL') && (
                          <img src={logo} alt="OneResume" className="w-4 h-4 object-contain opacity-80" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. 빠른 도구 (중간 Utility 섹션 - 모바일/축소 상태) */}
                  {(isMobile || isHeaderCollapsed) && (
                    <div className="border-b border-zinc-500/10 mb-1 pb-1">
                      <div className="px-4 py-2">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>빠른 도구</p>
                      </div>
                      <button onClick={() => { setIsConnectModalOpen(true); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black rounded-xl transition-all ${isDarkMode ? 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-blue-600'}`}>
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 flex-shrink-0">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0 fill-current" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13 10V3L4 14H11V21L20 10H13Z" />
                          </svg>
                        </div>
                        확장 프로그램 연동
                      </button>
                      <button onClick={() => { setIsJDModalOpen(true); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black rounded-xl transition-all ${isDarkMode ? 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-indigo-600'}`}>
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 flex-shrink-0">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                          </svg>
                        </div>
                        AI 공고 매칭
                      </button>
                      <button onClick={() => { copyShareLink(); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black rounded-xl transition-all ${isDarkMode ? 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-blue-600'}`}>
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                          </svg>
                        </div>
                        링크 복사
                      </button>
                      <button onClick={() => { downloadPDF(); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black rounded-xl transition-all ${isDarkMode ? 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-emerald-600'}`}>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        PDF 저장
                      </button>
                    </div>
                  )}

                  {/* 3. 로그아웃 (최하단 Destructive 섹션) */}
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-red-500 rounded-xl hover:bg-red-500/5 transition-all group/logout">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover/logout:bg-red-500/20 transition-colors flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </div>
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-56px)] flex overflow-hidden w-full relative print:hidden">
        {/* 편집 폼 영역 */}
        {( !isMobile || activeView === 'edit') && (
          <div 
            style={{ width: isMobile ? '100%' : `${effectiveLeftWidth}%` }} 
            className={`h-full overflow-y-auto custom-scrollbar relative ${transitionClass} ${
              !isMobile ? 'border-r' : ''
            } ${
              isDarkMode ? 'border-zinc-800 bg-zinc-900/30' : 'border-zinc-200 bg-gray-50/30'
            }`}
          >
            <div 
              className="w-full relative origin-top-left" 
              style={{ 
                zoom: activeZoom,
                padding: isMobile ? '24px 20px 100px 20px' : '24px',
                minHeight: '100%'
              }}
            >
              <ResumeForm
                formData={formData} handleChange={handleChange} handleProjectChange={handleProjectChange}
                addProject={addProject} removeProject={removeProject} handleWorkChange={handleWorkChange}
                addWork={addWork} removeWork={removeWork} handleCertChange={handleCertChange}
                addCert={addCert} removeCert={removeCert} handleSubmit={handleSubmit}
                handleGithubSync={handleGithubSync} handleDragEnd={handleDragEndWithState}
                onDragStart={handleDragStart}
                handleImageUpload={handleImageUpload} auditContent={auditContent}
                isDarkMode={isDarkMode} paneWidth={leftPanePixelWidth}
              />
            </div>

            <button 
              onClick={() => setIsLayoutOpen(!isLayoutOpen)}
              className={`fixed z-[60] w-14 h-14 md:w-16 md:h-16 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-500 active:scale-90 border-2 ${
                isResizing ? 'transition-none' : 'transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]'
              } ${
                isLayoutOpen 
                  ? (isDarkMode ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900 border-zinc-700 text-white')
                  : (isDarkMode ? 'bg-zinc-800 border-zinc-700 text-blue-400 hover:border-blue-500' : 'bg-white border-blue-100 text-blue-600 hover:border-blue-500')
              } ${isMobile ? 'bottom-32' : 'bottom-8'}`}
              style={{ 
                left: isMobile ? 'auto' : `calc(${leftWidth}% - 80px)`, 
                right: isMobile ? '24px' : 'auto',
                display: activeView === 'edit' || !isMobile ? 'flex' : 'none'
              }}
            >
              {isLayoutOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7 animate-in spin-in-90 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 11a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM4 17a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z" /></svg>
              )}
            </button>

            {isLayoutOpen && (
              <div 
                className={`fixed z-[60] w-[calc(100%-48px)] md:w-80 p-6 rounded-[32px] shadow-2xl border-2 animate-in slide-in-from-bottom-8 fade-in zoom-in-95 duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  isResizing ? 'transition-none' : 'transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]'
                } ${
                  isDarkMode ? 'bg-zinc-900 border-zinc-700 shadow-blue-900/20' : 'bg-white border-blue-50'
                } ${isMobile ? 'bottom-48' : 'bottom-28'}`}
                style={{ 
                  left: isMobile ? '24px' : `calc(${leftWidth}% - 340px)`,
                  maxHeight: isMobile ? '60vh' : 'none'
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1.5 h-5 bg-blue-600 rounded-full shadow-lg shadow-blue-500/50" />
                  <h4 className={`font-black text-sm uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>섹션 순서 배치</h4>
                </div>
                
                <div className="space-y-2">
                  <div className={`p-4 rounded-2xl border-2 border-dashed mb-4 ${isDarkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-[11px] font-bold leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      드래그하여 섹션 순서를 바꾸면<br/>{isMobile ? '이력서 레이아웃' : '오른쪽 미리보기'}에 즉시 반영됩니다.
                    </p>
                  </div>

                  <div className="custom-scrollbar max-h-[300px] md:max-h-[400px] overflow-y-auto pr-1">
                    <ResumeForm
                      formData={formData} handleDragEnd={handleDragEndWithState}
                      onDragStart={handleDragStart} isDarkMode={isDarkMode}
                      onlyLayout={true}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 미리보기 영역 */}
        {( !isMobile || activeView === 'preview') && (
          <>
            {!isMobile && (
              <div onMouseDown={startResizing} className="relative w-1 cursor-col-resize z-50 flex-shrink-0 group">
                <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/30 transition-colors" />
              </div>
            )}

            <div 
              style={{ width: isMobile ? '100%' : `${100 - leftWidth}%` }} 
              className={`${isMobile ? 'flex' : 'hidden lg:flex'} h-full overflow-hidden relative items-center justify-center ${transitionClass} ${
                isDarkMode ? 'bg-[#09090b]' : 'bg-[#f4f4f5]'
              }`}
            >
              {focusedPage && (
                <div className="absolute inset-0 z-[100] pointer-events-none flex flex-col items-center justify-between p-6 animate-fade-in">
                  <div className="w-full flex justify-end pointer-events-auto">
                    <button onClick={() => setFocusedPage(null)} className="w-12 h-12 bg-black/60 hover:bg-black/80 backdrop-blur-2xl text-white rounded-xl flex items-center justify-center transition-all shadow-2xl active:scale-90 border border-white/10">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  <div className="w-full flex justify-between items-center px-2">
                    <button onClick={handlePrevPage} className="pointer-events-auto w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-90 border border-white/10">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={handleNextPage} className="pointer-events-auto w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-90 border border-white/10">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>

                  <div className="pointer-events-auto flex items-center gap-4 bg-black/60 backdrop-blur-2xl px-6 py-3 rounded-[24px] border border-white/10 shadow-2xl mb-20 md:mb-4 transition-all duration-500 opacity-0 translate-y-4 hover:opacity-100 hover:translate-y-0 group/controls">
                    <button onClick={() => setFocusedPage(null)} className="flex items-center gap-2 text-white font-black text-xs pr-4 border-r border-white/20 hover:text-blue-400 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                      전체 보기
                    </button>
                    <span className="text-white/80 font-black text-xs italic tracking-widest pl-2">
                      PAGE {String(focusedPage).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              )}

              <div className={`w-full h-full flex justify-center items-start custom-scrollbar ${focusedPage ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'}`}>
                <div 
                  className={`${transitionClass} transform-gpu flex items-center justify-center shrink-0 ${isDragging ? 'opacity-30 grayscale' : 'opacity-100'}`} 
                  style={{ 
                    transform: `scale(${baseScale})`, 
                    transformOrigin: 'top center', 
                    marginTop: isMobile ? '20px' : '40px', 
                    marginBottom: isMobile ? '120px' : '80px' 
                  }}
                >
                  <ResumePreview formData={formData} ref={resumeRef} isDarkMode={isDarkMode} paneWidth={isMobile ? 20 : (100 - leftWidth)} focusedPage={focusedPage} setFocusedPage={setFocusedPage} setTotalPages={setTotalPages} containerHeight={windowSize.height - 56} scale={baseScale} marginTop={40} />
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* 모바일 하단 네비게이션 탭 */}
      {isMobile && (
        <div className={`fixed bottom-0 left-0 right-0 h-16 border-t z-[100] flex items-center px-6 gap-4 backdrop-blur-xl ${
          isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-zinc-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'
        }`}>
          <button 
            onClick={() => setActiveView('edit')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 h-12 rounded-xl transition-all ${
              activeView === 'edit' 
                ? 'text-blue-600 bg-blue-500/5' 
                : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-tighter">편집하기</span>
          </button>
          <div className="w-[1px] h-6 bg-zinc-500/10" />
          <button 
            onClick={() => setActiveView('preview')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 h-12 rounded-xl transition-all ${
              activeView === 'preview' 
                ? 'text-blue-600 bg-blue-500/5' 
                : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-tighter">미리보기</span>
          </button>
        </div>
      )}

      <div className="hidden print:block bg-white relative"><ResumePreview formData={formData} isDarkMode={false} printMode={true} /></div>

      <JDMatchModal 
        isOpen={isJDModalOpen} 
        onClose={() => setIsJDModalOpen(false)} 
        isDarkMode={isDarkMode} 
      />
      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        isDarkMode={isDarkMode}
        isExtensionInstalled={isExtensionInstalled}
      />
    </PageLayout>
  );
}

export default EditPage;