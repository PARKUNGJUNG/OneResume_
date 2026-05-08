import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ResumeForm from "../components/ResumeForm";
import ResumePreview from "../components/ResumePreview";
import toast from "react-hot-toast";
import useResume from "../hooks/useResume";
import PageLayout from "../components/PageLayout";
import ThemeToggle from "../components/ThemeToggle";
import JDMatchModal from "../components/JDMatchModal";

function EditPage({ isDarkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const resumeRef = useRef();
  
  const [leftWidth, setLeftWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [focusedPage, setFocusedPage] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [isJDModalOpen, setIsJDModalOpen] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [windowSize, setWindowSize] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });

  // --- 새로고침 및 이탈 방지 경고 (beforeunload) ---
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

  // --- 네비게이션 핸들러 (무한 루프) ---
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
  const leftPanePixelWidth = (leftWidth / 100) * windowSize.width;
  const dynamicFormZoom = Math.min(1.2, Math.max(0.7, leftPanePixelWidth / 900));
  
  // 드래그 중에는 줌 수치를 고정하여 좌표 계산 오류 방지
  const [activeZoom, setActiveZoom] = useState(dynamicFormZoom);
  useEffect(() => {
    if (!isDragging) setActiveZoom(dynamicFormZoom);
  }, [dynamicFormZoom, isDragging]);

  if (loading) return <PageLayout isDarkMode={isDarkMode}><div className="h-full flex items-center justify-center animate-pulse text-slate-500 font-bold text-xl">데이터 로딩 중...</div></PageLayout>;

  const getScale = () => {
    const a4HeightPx = 1122.52;
    if (focusedPage) return (windowSize.height - 76) / a4HeightPx;
    return windowSize.height < 950 ? 0.38 : 0.44;
  };

  const baseScale = getScale();
  // 리사이징 중에는 트랜지션을 완전히 제거하여 마우스 포인터를 즉각 따라오게 함
  const transitionClass = isResizing 
    ? "transition-none" 
    : "transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]";

  return (
    <PageLayout isDarkMode={isDarkMode} noPadding={true}>
      <header className={`h-14 px-6 border-b flex items-center justify-between z-20 print:hidden ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-zinc-200'}`}>
        <div className="flex items-center gap-3"><div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg font-black">O</div><h1 className={`text-base font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>OneResume</h1></div>
        <div className="flex items-center gap-3">
          <ThemeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
          <button 
            onClick={() => setIsJDModalOpen(true)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 h-9 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
            AI 공고 매칭
          </button>
          <button 
            onClick={copyShareLink} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 h-9 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            링크 복사
          </button>
          <button 
            onClick={downloadPDF} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 h-9 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF 저장
          </button>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 h-9 rounded-xl text-xs transition-all active:scale-95">로그아웃</button>
        </div>
      </header>

      <main className="h-[calc(100vh-56px)] flex overflow-hidden w-full relative print:hidden">
        <div 
          style={{ width: `${leftWidth}%` }} 
          className={`h-full overflow-y-auto custom-scrollbar border-r relative ${transitionClass} ${
            isDarkMode ? 'border-zinc-800 bg-zinc-900/30' : 'border-zinc-200 bg-gray-50/30'
          }`}
        >
          {/* 배율 조절 컨테이너: DND와 잘 어울리는 zoom 방식 사용 및 잘림 방지 */}
          <div 
            className="w-full relative origin-top-left" 
            style={{ 
              zoom: activeZoom,
              padding: '24px',
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

          {/* 레이아웃 플로팅 버튼 (FAB) */}
          <button 
            onClick={() => setIsLayoutOpen(!isLayoutOpen)}
            className={`fixed bottom-8 z-[60] w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-500 active:scale-90 border-2 ${
              isResizing ? 'transition-none' : 'transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]'
            } ${
              isLayoutOpen 
                ? (isDarkMode ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900 border-zinc-700 text-white')
                : (isDarkMode ? 'bg-zinc-800 border-zinc-700 text-blue-400 hover:border-blue-500' : 'bg-white border-blue-100 text-blue-600 hover:border-blue-500')
            }`}
            style={{ left: `calc(${leftWidth}% - 80px)` }}
          >
            {isLayoutOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-in spin-in-90 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 11a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM4 17a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z" /></svg>
            )}
          </button>

          {/* 레이아웃 설정 사이드 패널 */}
          {isLayoutOpen && (
            <div 
              className={`fixed bottom-24 z-[60] w-80 p-6 rounded-[32px] shadow-2xl border-2 animate-in slide-in-from-bottom-8 fade-in zoom-in-95 duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                isResizing ? 'transition-none' : 'transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]'
              } ${
                isDarkMode ? 'bg-zinc-900 border-zinc-700 shadow-blue-900/20' : 'bg-white border-blue-50'
              }`}
              style={{ left: `calc(${leftWidth}% - 340px)` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-5 bg-blue-600 rounded-full shadow-lg shadow-blue-500/50" />
                <h4 className={`font-black text-sm uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>섹션 순서 배치</h4>
              </div>
              
              <div className="space-y-2">
                <div className={`p-4 rounded-2xl border-2 border-dashed mb-4 ${isDarkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`text-[11px] font-bold leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    드래그하여 섹션 순서를 바꾸면<br/>오른쪽 미리보기에 즉시 반영됩니다.
                  </p>
                </div>

                <div className="custom-scrollbar max-h-[400px] overflow-y-auto pr-1">
                  <ResumeForm
                    formData={formData} handleDragEnd={handleDragEndWithState}
                    onDragStart={handleDragStart} isDarkMode={isDarkMode}
                    onlyLayout={true} // 레이아웃 모드 전용 플래그
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div onMouseDown={startResizing} className="relative w-1 cursor-col-resize z-50 flex-shrink-0 group"><div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/30 transition-colors" /></div>

        <div 
          style={{ width: `${100 - leftWidth}%` }} 
          className={`hidden lg:flex h-full overflow-hidden relative items-center justify-center ${transitionClass} ${
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

              <div className="pointer-events-auto flex items-center gap-4 bg-black/60 backdrop-blur-2xl px-6 py-3 rounded-[24px] border border-white/10 shadow-2xl mb-4 transition-all duration-500 opacity-0 translate-y-4 hover:opacity-100 hover:translate-y-0 group/controls">
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
              style={{ transform: `scale(${baseScale})`, transformOrigin: 'top center', marginTop: '40px', marginBottom: '80px' }}
            >
              <ResumePreview formData={formData} ref={resumeRef} isDarkMode={isDarkMode} paneWidth={100 - leftWidth} focusedPage={focusedPage} setFocusedPage={setFocusedPage} setTotalPages={setTotalPages} containerHeight={windowSize.height - 56} scale={baseScale} marginTop={40} />
            </div>
          </div>
        </div>
      </main>

      <div className="hidden print:block bg-white relative"><ResumePreview formData={formData} isDarkMode={false} printMode={true} /></div>

      <JDMatchModal 
        isOpen={isJDModalOpen} 
        onClose={() => setIsJDModalOpen(false)} 
        isDarkMode={isDarkMode} 
      />
    </PageLayout>
  );
}

export default EditPage;