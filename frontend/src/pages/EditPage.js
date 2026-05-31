import React, { useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
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
    const handlePong = (event) => {
      if (event.type === 'ONERESUME_PONG' || event.data?.type === 'ONERESUME_PONG') {
        setIsExtensionInstalled(true);
      }
    };
    window.addEventListener('ONERESUME_PONG', handlePong);
    window.addEventListener('message', handlePong);
    return () => {
      window.removeEventListener('ONERESUME_PONG', handlePong);
      window.removeEventListener('message', handlePong);
    };
  }, []);

  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // --- 새로고침 및 이탈 방지 경고 ---
  useEffect(() => {
    const handleBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ""; };
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
  const handleDragStart = useCallback(() => { setIsDragging(true); }, []);
  const handleDragEndWithState = useCallback((result) => { setIsDragging(false); handleDragEnd(result); }, [handleDragEnd]);

  const isMobile = windowSize.width < 1024;
  const effectiveLeftWidth = isMobile ? 100 : leftWidth;
  const leftPanePixelWidth = (effectiveLeftWidth / 100) * windowSize.width;
  const dynamicFormZoom = isMobile ? 1.0 : Math.min(1.2, Math.max(0.7, leftPanePixelWidth / 900));
  
  const [activeZoom, setActiveZoom] = useState(dynamicFormZoom);
  useEffect(() => { if (!isDragging) setActiveZoom(dynamicFormZoom); }, [dynamicFormZoom, isDragging]);

  const [showBottomBar, setShowBottomBar] = useState(true);
  const scrollAccumulator = useRef(0);
  const lastScrollTop = useRef(0);

  // --- 모바일 하단바 스크롤 숨김 로직 ---
  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = (e) => {
      // 캡처 단계에서 모든 스크롤을 감시하되, custom-scrollbar 클래스를 가진 요소만 처리
      if (!e.target.classList?.contains('custom-scrollbar')) return;

      const currentScroll = e.target.scrollTop;
      const delta = currentScroll - lastScrollTop.current;
      
      // 최상단 근처(80px)이거나 위로 스크롤 중이면 무조건 보여줌
      if (currentScroll < 80 || delta < -10) {
        setShowBottomBar(true);
        scrollAccumulator.current = 0;
      } else if (delta > 10) {
        // 스크롤 내리는 중 (숨기기)
        scrollAccumulator.current += delta;
        // 80px 이상 스크롤이 누적되면 숨김
        if (scrollAccumulator.current > 80) {
          setShowBottomBar(false);
        }
      }
      
      lastScrollTop.current = currentScroll;
    };

    // 뷰 전환 시 상태 초기화
    scrollAccumulator.current = 0;
    lastScrollTop.current = 0;
    setShowBottomBar(true);

    // window 레벨에서 캡처 모드로 리스닝 (가장 확실한 방법)
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isMobile, activeView]);

  if (loading) return <PageLayout isDarkMode={isDarkMode} allowScroll={false}><div className="h-full flex items-center justify-center animate-pulse text-slate-500 font-bold text-xl">데이터 로딩 중...</div></PageLayout>;

  const getScale = () => {
    const a4HeightPx = 1122.52;
    const a4WidthPx = 793.7;
    const headerHeight = 56;
    const margin = isMobile ? 40 : 80;
    if (focusedPage) return (windowSize.height - 76) / a4HeightPx;
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
  const a4WidthPx = 793.7;
  const a4HeightPx = 1122.52;
  const gapPx = 8 * 3.7795;
  const currentPaneWidth = isMobile ? 20 : (100 - leftWidth);
  const cols = currentPaneWidth > 75 ? 4 : (currentPaneWidth > 55 ? 3 : (currentPaneWidth > 30 ? 2 : 1));
  const rows = totalPages ? Math.ceil(totalPages / cols) : 1;
  const scaledWidth = Math.ceil((cols * a4WidthPx + (cols - 1) * gapPx) * baseScale);
  const scaledHeight = Math.ceil((rows * a4HeightPx + (rows - 1) * gapPx) * baseScale);

  const transitionClass = isResizing ? "transition-none" : "transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]";

  return (
    <>
      {/* 1. 웹 전용 레이아웃 (인쇄 시 숨김) */}
      <div className="print:hidden">
        <PageLayout isDarkMode={isDarkMode} noPadding={true}>
          <header 
            style={{ paddingTop: 'var(--safe-area-top)' }}
            className={`sticky top-0 h-auto min-h-[56px] pb-1.5 md:pb-0 px-3 md:px-6 border-b flex items-center justify-between z-50 backdrop-blur-md transition-all duration-300 ${isDarkMode ? 'bg-zinc-900/90 border-zinc-800 shadow-lg shadow-black/20' : 'bg-white/90 border-zinc-200 shadow-sm'}`}
          >
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 mr-2">
              <div className="flex items-center gap-1.5 md:gap-2.5 flex-shrink-0">
                <img src={logo} alt="OneResume Logo" onClick={() => window.location.reload()} className="w-6 h-6 md:w-8 md:h-8 object-contain flex-shrink-0 cursor-pointer transition-transform hover:scale-110 active:scale-95" />
                <div className="flex items-end gap-1 whitespace-nowrap">
                  <h1 onClick={() => window.location.reload()} className={`text-[0.9rem] md:text-[1.2rem] font-black tracking-tighter cursor-pointer transition-colors ${isDarkMode ? 'text-white hover:text-blue-400' : 'text-zinc-800 hover:text-blue-600'}`}>OneResume</h1>
                  <button onClick={() => navigate('/setup-profile', { state: { step: 2 } })} className={`text-[0.85rem] md:text-[1.1rem] font-black tracking-tighter transition-all hover:scale-105 active:scale-95 hover:underline underline-offset-4 cursor-pointer ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                    {(() => {
                      const jobMap = { developer: 'Developer', it: 'IT Engineer', admin: 'General Affairs', sales: 'Sales', design: 'Designer', finance: 'Finance', hr: 'HR', service: 'CS', marketing_pr: 'Marketer', education: 'Educator', medical: 'Medical', legal: 'Legal Affairs' };
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
                      <span className={`text-[10px] md:text-xs font-black uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Extension Active</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 justify-end">
              <div className="flex items-center gap-2 md:gap-3 whitespace-nowrap pl-2 md:pl-0 flex-shrink-0" ref={menuRef}>
                <div className="hidden lg:block"><ThemeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} /></div>
                {!isMobile && (
                  <button onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)} className={`group flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-500 border-2 shadow-sm active:scale-95 flex-shrink-0 ${isHeaderCollapsed ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20' : (isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600' : 'bg-white border-zinc-200 text-zinc-500 hover:text-blue-600 hover:border-blue-200')}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-500 ease-in-out ${isHeaderCollapsed ? 'rotate-180' : 'group-hover:-translate-x-0.5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                )}
                <div className={`hidden lg:flex items-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden ${isHeaderCollapsed ? 'max-w-0 opacity-0 pointer-events-none -ml-2 md:-ml-3' : 'max-w-[1000px] opacity-100'}`}>
                  <div className="flex items-center gap-2 md:gap-3">
                    <button onClick={() => setIsConnectModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-black px-4 h-9 rounded-xl text-[10px] md:text-xs flex items-center gap-1.5 border-2 border-purple-500/20 shadow-lg shadow-purple-600/20 transition-all active:scale-95 flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M13 10V3L4 14H11V21L20 10H13Z" /></svg>확장 프로그램 연동
                    </button>
                    <button onClick={() => setIsJDModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 h-9 rounded-xl text-[10px] md:text-xs flex items-center gap-1.5 border-2 border-indigo-500/20 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 flex-shrink-0 fill-white"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg>AI 공고 매칭
                    </button>
                    <button onClick={copyShareLink} className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4 h-9 rounded-xl text-[10px] md:text-xs flex items-center gap-1.5 border-2 border-blue-500/20 shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>링크 복사
                    </button>
                    <button onClick={downloadPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 h-9 rounded-xl text-[10px] md:text-xs flex items-center gap-1.5 border-2 border-emerald-500/20 shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>PDF 저장
                    </button>
                  </div>
                </div>
                <div className="relative flex-shrink-0 flex items-center">
                  <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`group flex items-center h-9 gap-2 px-2.5 rounded-full border-2 transition-all active:scale-95 shadow-sm ${isMenuOpen ? 'border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/10' : (isDarkMode ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-500' : 'bg-white border-zinc-200 hover:border-blue-300')}`}>
                    <div className="w-6 h-6 rounded-full overflow-hidden border shadow-inner flex-shrink-0 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
                      {formData.profileImageUrl ? <img src={formData.profileImageUrl} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-[12px] font-black tracking-tighter ${isDarkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>{formData.username || '사용자'}</span>
                      {formData.provider && formData.provider !== 'LOCAL' && (
                        <div className="flex items-center flex-shrink-0">
                          {formData.provider === 'KAKAO' && <div className="w-3.5 h-3.5 bg-[#FEE500] rounded-full flex items-center justify-center shadow-sm"><svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-[#3C1E1E]" fill="currentColor"><path d="M12 3C7.029 3 3 6.129 3 10.129c0 2.59 1.676 4.88 4.232 6.13l-1.077 3.96c-.083.303.326.541.53.37l4.67-3.111c.532.062 1.078.093 1.645.093 4.971 0 9-3.129 9-7.129C21 6.129 16.971 3 12 3z" /></svg></div>}
                          {formData.provider === 'NAVER' && <div className="w-3.5 h-3.5 bg-[#03C75A] rounded-full flex items-center justify-center shadow-sm"><span className="text-[7.5px] font-[1000] text-white leading-none">N</span></div>}
                        </div>
                      )}
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 flex-shrink-0 ${isMenuOpen ? 'rotate-180 text-blue-600' : (isDarkMode ? 'text-zinc-500' : 'text-zinc-400')}`} />
                  </button>
                  {isMenuOpen && createPortal(
                    <div
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{ top: `calc(var(--total-header-height) + ${isMobile ? '4px' : '6px'})` }}
                      className={`fixed right-3 sm:right-6 lg:right-10 w-56 sm:w-64 lg:w-72 max-w-[calc(100vw-24px)] p-1 rounded-2xl border shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-[9999] origin-top-right print:hidden ${
                      isDarkMode ? 'bg-zinc-900 border-zinc-700 shadow-black/50' : 'bg-white border-zinc-100 shadow-zinc-200/50'
                    }`}>

                      {/* 1. 계정 정보 (최상단 Identity 영역) */}
                      <div className="px-3 py-2.5 sm:px-4 sm:py-3.5 border-b border-zinc-500/10 mb-0.5">
                        <p className={`text-[8px] lg:text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>계정 정보</p>
                        <p className={`text-[12px] sm:text-sm lg:text-base font-black truncate ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>{formData.username || '사용자'}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <p className={`text-[8.5px] sm:text-[10px] lg:text-[11px] font-bold ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {formData.provider === 'KAKAO' ? (isMobile ? '카카오 로그인' : '카카오 계정으로 로그인됨') :
                             formData.provider === 'NAVER' ? (isMobile ? '네이버 로그인' : '네이버 계정으로 로그인됨') :
                             (isMobile ? 'OneResume 로그인' : 'OneResume 이메일로 로그인됨')}
                          </p>
                          <div className="flex items-center">
                            {formData.provider === 'KAKAO' && (
                              <div className="w-3 h-3 bg-[#FEE500] rounded-[2px] flex items-center justify-center shadow-sm">
                                <svg viewBox="0 0 24 24" className="w-1.5 h-1.5 text-[#3C1E1E]" fill="currentColor">
                                  <path d="M12 3C7.029 3 3 6.129 3 10.129c0 2.59 1.676 4.88 4.232 6.13l-1.077 3.96c-.083.303.326.541.53.37l4.67-3.111c.532.062 1.078.093 1.645.093 4.971 0 9-3.129 9-7.129C21 6.129 16.971 3 12 3z" />
                                </svg>
                              </div>
                            )}
                            {formData.provider === 'NAVER' && (
                              <div className="w-3 h-3 bg-[#03C75A] rounded-[2px] flex items-center justify-center shadow-sm">
                                <span className="text-[6px] font-[1000] text-white leading-none">N</span>
                              </div>
                            )}
                            {( !formData.provider || formData.provider === 'LOCAL') && (
                              <img src={logo} alt="OneResume" className="w-3.5 h-3.5 object-contain opacity-80" />
                            )}
                          </div>
                        </div>
                      </div>
                      {(isMobile || isHeaderCollapsed) && (
                        <div className="border-b border-zinc-500/10 mb-0.5 pb-0.5">
                          <div className="px-3 py-1.5 sm:px-4 sm:py-2"><p className={`text-[8px] lg:text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>빠른 도구</p></div>
                          <div className="lg:hidden">
                            <button onClick={(e) => { e.stopPropagation(); toggleDarkMode(); setIsMenuOpen(false); }} className={`w-full flex items-center gap-2.5 px-2 py-2 sm:px-3 sm:py-2.5 text-[11px] sm:text-xs font-black rounded-xl transition-all ${isDarkMode ? 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'}`}>
                              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800/10 text-zinc-700'}`}>{isDarkMode ? <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}</div>{isDarkMode ? '라이트 모드' : '다크 모드'}
                            </button>
                          </div>
                          <>
                            <button onClick={() => { setIsConnectModalOpen(true); setIsMenuOpen(false); }} className={`w-full flex items-center gap-2.5 px-2 py-2 sm:px-3 sm:py-2.5 text-[11px] sm:text-xs font-black rounded-xl transition-all ${isDarkMode ? 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-blue-600'}`}>
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 flex-shrink-0"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M13 10V3L4 14H11V21L20 10H13Z" /></svg></div>확장 프로그램 연동
                            </button>
                            <button onClick={() => { setIsJDModalOpen(true); setIsMenuOpen(false); }} className={`w-full flex items-center gap-2.5 px-2 py-2 sm:px-3 sm:py-2.5 text-[11px] sm:text-xs font-black rounded-xl transition-all ${isDarkMode ? 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-indigo-600'}`}>
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 flex-shrink-0"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg></div>AI 공고 매칭
                            </button>
                            <button onClick={() => { copyShareLink(); setIsMenuOpen(false); }} className={`w-full flex items-center gap-2.5 px-2 py-2 sm:px-3 sm:py-2.5 text-[11px] sm:text-xs font-black rounded-xl transition-all ${isDarkMode ? 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-blue-600'}`}>
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg></div>링크 복사
                            </button>
                            <button onClick={() => { downloadPDF(); setIsMenuOpen(false); }} className={`w-full flex items-center gap-2.5 px-2 py-2 sm:px-3 sm:py-2.5 text-[11px] sm:text-xs font-black rounded-xl transition-all ${isDarkMode ? 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-emerald-600'}`}>
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>PDF 저장
                            </button>
                          </>
                        </div>
                      )}                  <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 sm:px-4 sm:py-3 text-[11px] sm:text-xs font-black text-red-500 rounded-xl hover:bg-red-500/5 transition-all group/logout">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover/logout:bg-red-500/20 transition-colors flex-shrink-0">
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </div>로그아웃
                      </button>
                    </div>, document.body
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="h-[calc(100vh-var(--total-header-height))] flex overflow-hidden w-full relative print:hidden">
            {( !isMobile || activeView === 'edit') && (
              <div style={{ width: isMobile ? '100%' : `${effectiveLeftWidth}%` }} className={`h-full overflow-y-auto custom-scrollbar relative ${transitionClass} ${!isMobile ? 'border-r' : ''} ${isDarkMode ? 'bg-zinc-950 border-zinc-900 lg:bg-[#09090b]' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className={`w-full relative origin-top-left min-h-full ${isDarkMode ? 'bg-zinc-950 lg:bg-transparent' : 'bg-zinc-50'}`} style={{ zoom: activeZoom, padding: isMobile ? '0 0 140px 0' : '24px' }}>
                  <ResumeForm formData={formData} handleChange={handleChange} handleProjectChange={handleProjectChange} addProject={addProject} removeProject={removeProject} handleWorkChange={handleWorkChange} addWork={addWork} removeWork={removeWork} handleCertChange={handleCertChange} addCert={addCert} removeCert={removeCert} handleSubmit={handleSubmit} handleGithubSync={handleGithubSync} handleDragEnd={handleDragEndWithState} onDragStart={handleDragStart} handleImageUpload={handleImageUpload} auditContent={auditContent} isDarkMode={isDarkMode} paneWidth={leftPanePixelWidth} />
                </div>
              </div>
            )}
            {( !isMobile || activeView === 'preview') && (
              <>
                {!isMobile && <div onMouseDown={startResizing} className="relative w-1 cursor-col-resize z-50 flex-shrink-0 group"><div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/30 transition-colors" /></div>}
                <div style={{ width: isMobile ? '100%' : `${100 - leftWidth}%` }} className={`${isMobile ? 'flex' : 'hidden lg:flex'} h-full overflow-hidden relative items-center justify-center ${transitionClass} ${isDarkMode ? 'bg-[#09090b]' : 'bg-zinc-100'}`}>
                  {focusedPage && (
                    <div className="absolute inset-0 z-[100] pointer-events-none flex flex-col items-center justify-between p-6 animate-fade-in">
                      <div className="w-full flex justify-end pointer-events-auto"><button onClick={() => setFocusedPage(null)} className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all shadow-2xl active:scale-90 border ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700' : 'bg-black/80 hover:bg-black text-white border-white/20'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                      <div className="w-full flex justify-between items-center px-2">
                        <button onClick={handlePrevPage} className={`pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-90 border ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700' : 'bg-black/80 hover:bg-black text-white border-white/20'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg></button>
                        <button onClick={handleNextPage} className={`pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-90 border ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700' : 'bg-black/80 hover:bg-black text-white border-white/20'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 5l7 7-7 7" /></svg></button>
                      </div>
                      <div className="pointer-events-auto flex items-center gap-4 bg-black/60 backdrop-blur-2xl px-6 py-3 rounded-[24px] border border-white/10 shadow-2xl mb-20 md:mb-4 transition-all duration-500 opacity-0 translate-y-4 hover:opacity-100 hover:translate-y-0 group/controls"><button onClick={() => setFocusedPage(null)} className="flex items-center gap-2 text-white font-black text-xs pr-4 border-r border-white/20 hover:text-blue-400 transition-colors">전체 보기</button><span className="text-white/80 font-black text-xs italic tracking-widest pl-2">PAGE {String(focusedPage).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}</span></div>
                    </div>
                  )}
                  <div className={`w-full h-full flex justify-center items-start custom-scrollbar select-none overflow-x-hidden ${focusedPage ? 'overflow-hidden' : 'overflow-y-auto'}`}><div className={`relative flex-shrink-0 transform-gpu ${transitionClass}`} style={{ width: scaledWidth, height: scaledHeight, marginTop: isMobile ? '20px' : '40px', marginBottom: isMobile ? '120px' : '80px' }}><div className={`${transitionClass} transform-gpu flex items-start justify-center pointer-events-auto absolute top-0 left-0`} style={{ transform: `scale(${baseScale})`, transformOrigin: 'top left' }}><ResumePreview formData={formData} ref={resumeRef} isDarkMode={isDarkMode} paneWidth={isMobile ? 20 : (100 - leftWidth)} focusedPage={focusedPage} setFocusedPage={setFocusedPage} setTotalPages={setTotalPages} containerHeight={windowSize.height - 56} scale={baseScale} marginTop={40} /></div></div></div>
                </div>
              </>
            )}
            {( !isMobile || activeView === 'preview') && (
              <>
                <button onClick={() => setIsLayoutOpen(!isLayoutOpen)} className={`fixed z-[60] w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 active:scale-90 ${isLayoutOpen ? (isDarkMode ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-zinc-900 border-zinc-700 text-white') : (isDarkMode ? 'bg-zinc-800 border-zinc-700 text-blue-400 hover:border-blue-500 hover:text-white' : 'bg-white border-zinc-200 text-blue-600 hover:border-blue-400')} ${isMobile ? 'bottom-20 right-4' : 'bottom-8'}`} style={{ left: isMobile ? 'auto' : `calc(${leftWidth}% - 80px)` }}>
                  {isLayoutOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      {/* 왼쪽 리스트 라인 */}
                      <path strokeLinecap="round" d="M4 7h7M4 12h7M4 17h7" />
                      {/* 오른쪽 위아래 화살표 */}
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9l3-3 3 3M20 6v12M17 15l3 3 3-3" />
                    </svg>
                  )}
                </button>
                {isLayoutOpen && (
                  <div className={`fixed w-52 sm:w-64 lg:w-72 p-3 sm:p-4 lg:p-4 rounded-[22px] border-2 animate-in slide-in-from-bottom-8 fade-in zoom-in-95 duration-200 z-[9999] origin-top-right ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'} ${isMobile ? 'bottom-36 right-4' : 'bottom-28'}`} style={{ left: isMobile ? 'auto' : `calc(${leftWidth}% - ${windowSize.width < 1280 ? '290px' : '320px'})` }}><div className="flex items-center gap-2 mb-2.5 lg:mb-3.5"><div className="w-1 h-3 sm:w-1.5 sm:h-4 bg-blue-600 rounded-full shadow-lg" /><h4 className={`font-black text-[10px] sm:text-[11px] lg:text-sm uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>섹션 순서 배치</h4></div><div className="space-y-1"><div className="pr-0"><ResumeForm formData={formData} handleDragEnd={handleDragEndWithState} onDragStart={handleDragStart} isDarkMode={isDarkMode} onlyLayout={true} /></div></div></div>
                )}
              </>
            )}
          </main>
          {isMobile && (
            <div className={`fixed bottom-0 left-0 right-0 h-16 border-t z-[100] flex items-center px-4 gap-2 backdrop-blur-xl transition-all duration-500 ease-in-out ${
              showBottomBar ? 'translate-y-0' : 'translate-y-full opacity-0'
            } ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white/50 border-zinc-200 shadow-[0_-4px_30px_rgba(0,0,0,0.08)]'}`}>
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
                <span className="text-[10px] font-[900] uppercase tracking-tighter">작성하기</span>
              </button>

              <button
                onClick={handleSubmit}
                className="flex-1 flex flex-col items-center justify-center gap-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                <span className="text-[10px] font-[900] uppercase tracking-tighter">이력서 저장</span>
              </button>

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
                <span className="text-[10px] font-[900] uppercase tracking-tighter">미리보기</span>
              </button>
            </div>
          )}
          <JDMatchModal isOpen={isJDModalOpen} onClose={() => setIsJDModalOpen(false)} isDarkMode={isDarkMode} />
          <ConnectModal isOpen={isConnectModalOpen} onClose={() => setIsConnectModalOpen(false)} isDarkMode={isDarkMode} isExtensionInstalled={isExtensionInstalled} />
        </PageLayout>
      </div>

      {/* 2. 인쇄 전용 레이아웃 (Hidden Print Portal) - 루트 형제로 배치하여 레이아웃 격리 */}
      <div className="hidden print:block bg-white relative">
        <ResumePreview formData={formData} isDarkMode={false} printMode={true} />
      </div>
    </>
  );
}

export default EditPage;