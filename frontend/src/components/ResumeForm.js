import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import DaumPostcode from "react-daum-postcode";
import toast from "react-hot-toast";

const ResumeForm = ({
  formData,
  handleChange,
  handleProjectChange,
  addProject,
  removeProject,
  handleWorkChange,
  addWork,
  removeWork,
  handleCertChange,
  addCert,
  removeCert,
  handleSubmit,
  handleGithubSync,
  handleDragEnd,
  onDragStart,
  handleImageUpload,
  auditContent,
  isDarkMode,
  isCompact = false,
  paneWidth = 600,
  onlyLayout = false
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [direction, setDirection] = useState(0); // -1: left, 1: right
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  // ... rest of state ...
  const [schoolResults, setSchoolResults] = useState([]);
  const [majorResults, setMajorResults] = useState([]);
  const [jobResults, setJobResults] = useState([]);
  const [showSchoolList, setShowSchoolList] = useState(false);
  const [showMajorList, setShowMajorList] = useState(false);
  const [showJobList, setShowJobList] = useState(false);
  const [activeJobIndex, setActiveJobIndex] = useState(null);
  const [isMilitaryOpen, setIsMilitaryOpen] = useState(false);

  const [aiFeedback, setAiFeedback] = useState(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const tabContainerRef = React.useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 활성 탭이 바뀔 때 해당 탭이 화면 중앙으로 오도록 스크롤
  useEffect(() => {
    if (tabContainerRef.current) {
      const activeTabElement = tabContainerRef.current.querySelector(`[data-tab-id="${activeTab}"]`);
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeTab]);

  const switchTab = (newTabId) => {
    if (activeTab === newTabId) return;
    const newIndex = tabs.findIndex(t => t.id === newTabId);
    setDirection(newIndex > activeIndex ? 1 : -1);
    setActiveTab(newTabId);
    
    // 모바일에서 섹션 이동 시 상단으로 스크롤
    const container = document.querySelector('.custom-scrollbar');
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwipe = (event, info) => {
    if (!isMobile) return;
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold && activeIndex < tabs.length - 1) {
      switchTab(tabs[activeIndex + 1].id);
    } else if (info.offset.x > swipeThreshold && activeIndex > 0) {
      switchTab(tabs[activeIndex - 1].id);
    }
  };

  const variants = {
    enter: (direction) => ({
      x: isMobile 
        ? (direction > 0 ? '100%' : '-100%') // 모바일: 인스타 스타일 슬라이드
        : (direction > 0 ? '10%' : '-10%'),   // PC: 시네마틱 오프셋
      opacity: isMobile ? 1 : 0,               // 모바일은 불투명도 유지(슬라이드 집중)
      scale: isMobile ? 1 : 0.96,              // PC만 스케일 효과
      filter: isMobile ? 'blur(0px)' : 'blur(8px)',
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        x: { type: "spring", stiffness: 500, damping: 45, mass: 0.8 }, // 훨씬 빠릿빠릿한 반응성
        opacity: { duration: 0.2 },
        filter: { duration: 0.2 },
        scale: { type: "spring", stiffness: 400, damping: 30 }
      }
    },
    exit: (direction) => ({
      x: isMobile 
        ? (direction < 0 ? '100%' : '-100%')
        : (direction < 0 ? '10%' : '-10%'),
      opacity: isMobile ? 1 : 0,
      scale: isMobile ? 1 : 0.96,
      filter: isMobile ? 'blur(0px)' : 'blur(8px)',
      position: 'absolute', // 나가는 요소가 레이아웃을 차지하지 않도록 설정
      top: 0,
      left: 0,
      right: 0,
      transition: {
        x: { type: "spring", stiffness: 500, damping: 45, mass: 0.8 },
        opacity: { duration: 0.2 },
        filter: { duration: 0.2 }
      }
    })
  };

  const theme = {
    formBg: isDarkMode ? "bg-zinc-950 lg:bg-zinc-900 border-zinc-900 lg:border-zinc-800" : "bg-zinc-200/40 lg:bg-zinc-200/20 border-zinc-300",
    tabActive: "text-white",
    tabInactive: isDarkMode ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-500 hover:text-zinc-700",
    titleText: isDarkMode ? "text-zinc-100" : "text-zinc-900",
    labelText: isDarkMode ? "text-zinc-300" : "text-zinc-700",
    subText: isDarkMode ? "text-zinc-400" : "text-zinc-500",
    cardBg: isDarkMode ? "bg-zinc-800/40 border-zinc-800" : "bg-white border-zinc-300 shadow-lg shadow-zinc-400/10",
    innerInputBg: isDarkMode ? "bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-blue-500" : "bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-blue-500 focus:bg-white",
  };

  const tabs = [
    { id: 'basic', label: '인적사항', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'links', label: '브랜딩/연동', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
    { id: 'edu', label: '학력/기술', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-5.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
    { id: 'experience', label: '경력', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'certs', label: '자격/수상', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
    { id: 'projects', label: '프로젝트', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { id: 'extra', label: '자기소개서', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  ];

  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  const searchSchool = async (keyword) => {
    if (!keyword || keyword.length < 2) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/resume/search?type=SCHOOL&keyword=${encodeURIComponent(keyword)}`);
      const data = await response.json();
      setSchoolResults(data.dataSearch?.content || []);
      setShowSchoolList(true);
    } catch (e) {}
  };

  const searchMajor = async (keyword) => {
    if (!keyword || keyword.length < 2) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/resume/search?type=MAJOR&keyword=${encodeURIComponent(keyword)}`);
      const data = await response.json();
      setMajorResults(data.dataSearch?.content || []);
      setShowMajorList(true);
    } catch (e) {}
  };

  const searchJob = async (keyword) => {
    if (!keyword || keyword.length < 2) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/resume/search-job?keyword=${encodeURIComponent(keyword)}`);
      const data = await response.json();
      let jobs = [];
      if (data.jobSrch) {
        jobs = Array.isArray(data.jobSrch) ? data.jobSrch : (data.jobSrch.item || []);
      }
      setJobResults(jobs);
      setShowJobList(true);
    } catch (e) {
      console.error("Job Search Error:", e);
    }
  };

  const [isAuditing, setIsAuditing] = useState(false);

  const handleAiAudit = async (fieldName, content, context) => {
    if (isAuditing) return;
    if (!content || content.trim().length < 5) {
      toast.error("분석할 내용이 너무 짧습니다. (최소 5자 이상)");
      return;
    }
    setIsAuditing(true);
    const loadingToast = toast.loading("AI가 내용을 분석하고 있습니다...");
    try {
      const result = await auditContent(fieldName, content, context);
      if (result) {
        setAiFeedback({ ...result, targetField: fieldName });
        setIsAiModalOpen(true);
        toast.success("분석이 완료되었습니다!", { id: loadingToast });
      }
    } catch (e) {
      if (e.response?.status === 429) {
        toast.dismiss(loadingToast);
        return;
      }
      const errorMsg = e.response?.data?.message || "서버와 통신할 수 없습니다. 네트워크 상태를 확인해 주세요.";
      toast.error(errorMsg, { id: loadingToast });
    } finally {
      setIsAuditing(false);
    }
  };

  const applyAiRefinement = (text) => {
    if (aiFeedback.targetField === 'bio') handleChange({ target: { name: 'bio', value: text } });
    else if (aiFeedback.targetField.startsWith('project-')) {
      const index = parseInt(aiFeedback.targetField.split('-')[1]);
      handleProjectChange(index, { target: { name: 'description', value: text } });
    } else if (aiFeedback.targetField.startsWith('work-')) {
      const index = parseInt(aiFeedback.targetField.split('-')[1]);
      handleWorkChange(index, { target: { name: 'jobDescription', value: text } });
    } else handleChange({ target: { name: aiFeedback.targetField, value: text } });
    setIsAiModalOpen(false);
    toast.success("문장이 성공적으로 반영되었습니다!");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("클립보드에 복사되었습니다!");
  };

  const handleRegenerate = () => {
    const fieldName = aiFeedback.targetField;
    let content = "";
    if (fieldName === 'bio') content = formData.bio;
    else if (fieldName.startsWith('project-')) content = formData.projects[parseInt(fieldName.split('-')[1])].description;
    else if (fieldName.startsWith('work-')) content = formData.workExperiences[parseInt(fieldName.split('-')[1])].jobDescription;
    else content = formData[fieldName];
    handleAiAudit(fieldName, content);
  };

  const autoExpand = (e) => {
    const target = e.target || e;
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
  };

  // 공용 AI 컨설팅 버튼 컴포넌트
  const AiConsultingButton = ({ onClick, label = "AI 컨설팅" }) => (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9.5px] md:text-[10.5px] font-black shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all group"
    >
      <div className="relative flex items-center justify-center w-3.5 h-3.5 translate-y-[1px]">
        {/* 큰 별 (메인) */}
        <svg viewBox="0 0 24 24" className="absolute top-0 left-0 w-3 h-3 fill-white animate-[pulse_2s_infinite]" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
        </svg>
        {/* 작은 별 (대각선 위 - 엇박자 애니메이션) */}
        <svg viewBox="0 0 24 24" className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 fill-white/90 animate-[pulse_1.5s_infinite_500ms]" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
        </svg>
      </div>
      {label}
    </button>
  );

  const renderStepNavigation = () => {
    const isFirst = activeIndex === 0;
    const isLast = activeIndex === tabs.length - 1;
    const isSpecialTab = ['basic', 'extra'].includes(activeTab);

    const scrollToTop = () => {
      const container = document.querySelector('.custom-scrollbar');
      if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
      <div className="hidden lg:flex flex-col gap-3 pt-6 md:pt-8 mt-6 md:mt-8 border-t border-zinc-500/10 w-full">
        {/* Row 1: Navigation Row */}
        <div className="flex flex-row items-center gap-2 md:gap-3 w-full">
          {!isFirst && (
            <button 
              type="button" 
              onClick={() => switchTab(tabs[activeIndex - 1].id)}
              className={`${isSpecialTab ? 'flex-none md:flex-1' : 'flex-1'} px-3.5 md:px-5 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-[13px] md:text-sm transition-all border flex items-center justify-center gap-1.5 active:scale-95 group ${
                isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-600 shadow-sm hover:bg-zinc-50'
              }`}
            >
              <svg className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
              <span className={isSpecialTab ? "hidden sm:inline" : ""}>이전</span>
            </button>
          )}

          {!isLast && (
            <button 
              type="button" 
              onClick={handleSubmit}
              className={`flex-1 px-3.5 md:px-5 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-[12.5px] md:text-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] ${isSpecialTab ? 'md:flex-1' : ''}`}
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              <span className={isSpecialTab ? "" : "whitespace-nowrap"}>이력서 저장</span>
            </button>
          )}

          <button 
            type={isLast ? "submit" : "button"}
            onClick={isLast ? handleSubmit : () => { setActiveTab(tabs[activeIndex + 1].id); scrollToTop(); }}
            className={`${isSpecialTab ? 'flex-[2] md:flex-1' : 'flex-1'} px-3.5 md:px-5 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-1.5 group text-[13px] md:text-sm active:scale-95 hover:scale-[1.02] ${
              isLast 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/20' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-600/20'
            }`}
          >
            {isLast ? (
              <>
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                이력서 저장
              </>
            ) : (
              <>
                <span className="hidden sm:inline">다음: {tabs[activeIndex + 1]?.label}</span>
                <span className="sm:hidden">다음</span>
                <svg className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 5l7 7-7 7" /></svg>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const YearMonthPicker = ({ value, onChange, isDarkMode, placeholder = "선택" }) => {
    const [year, month] = (value || "").split(".");
    const [isYearOpen, setIsYearOpen] = useState(false);
    const [isMonthOpen, setIsMonthOpen] = useState(false);
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear + 5; y >= 1970; y--) years.push(y);
    const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const triggerClass = `px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border outline-none transition-all cursor-pointer text-[13px] md:text-[14px] font-bold flex items-center justify-between group ${isDarkMode ? "bg-zinc-900 border-zinc-700 text-zinc-100 hover:border-zinc-500" : "bg-white border-gray-200 text-zinc-900 hover:border-gray-400"}`;
    const listClass = `absolute bottom-[calc(100%+8px)] left-0 right-0 z-[120] max-h-60 overflow-y-auto rounded-xl md:rounded-2xl border-2 shadow-2xl custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-200 ${isDarkMode ? "bg-zinc-900 border-zinc-700 shadow-black/50" : "bg-white border-zinc-100 shadow-zinc-200/50"}`;
    const itemClass = `px-4 py-2.5 cursor-pointer text-[13px] font-bold transition-colors border-b last:border-0 ${isDarkMode ? "text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white" : "text-zinc-600 border-zinc-50 hover:bg-blue-50 hover:text-blue-600"}`;
    return (
      <div className="flex gap-2 items-center w-full">
        <div className="relative flex-1">
          <div tabIndex={0} onBlur={() => setTimeout(() => setIsYearOpen(false), 200)} onClick={() => { setIsYearOpen(!isYearOpen); setIsMonthOpen(false); }} className={triggerClass}>
            <span className={year ? "" : "opacity-40"}>{year ? `${year}년` : placeholder}</span>
            <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isYearOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M19 9l-7 7-7-7" /></svg>
          </div>
          {isYearOpen && (<div className={listClass}>{years.map(y => (<div key={y} className={`${itemClass} ${year === String(y) ? (isDarkMode ? 'bg-zinc-800 text-white' : 'bg-blue-50 text-blue-600') : ''}`} onClick={(e) => { e.stopPropagation(); onChange(`${y}.${month || '01'}`); setIsYearOpen(false); }}>{y}년</div>))}</div>)}
        </div>
        <div className="relative flex-1">
          <div tabIndex={0} onBlur={() => setTimeout(() => setIsMonthOpen(false), 200)} onClick={() => { setIsMonthOpen(!isMonthOpen); setIsYearOpen(false); }} className={triggerClass}>
            <span className={month ? "" : "opacity-40"}>{month ? `${month}월` : "월"}</span>
            <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isMonthOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M19 9l-7 7-7-7" /></svg>
          </div>
          {isMonthOpen && (<div className={listClass}>{months.map(m => (<div key={m} className={`${itemClass} ${month === m ? (isDarkMode ? 'bg-zinc-800 text-white' : 'bg-blue-50 text-blue-600') : ''}`} onClick={(e) => { e.stopPropagation(); onChange(`${year || currentYear}.${m}`); setIsMonthOpen(false); }}>{m}월</div>))}</div>)}
        </div>
      </div>
    );
  };

  const PeriodPicker = ({ value, onChange, isDarkMode, isCurrent }) => {
    const [start, end] = (value || "").split(" ~ ");
    const handleStartChange = (newStart) => { onChange(`${newStart}${!isCurrent && end ? ` ~ ${end}` : ''}`); };
    const handleEndChange = (newEnd) => { onChange(`${start || ''} ~ ${newEnd}`); };
    return (
      <div className={`flex flex-col sm:flex-row gap-3 ${isCurrent ? '' : 'sm:items-center'}`}>
        <div className="flex-1 w-full"><YearMonthPicker value={start} onChange={handleStartChange} isDarkMode={isDarkMode} placeholder="시작년도" /></div>
        {!isCurrent && (<><div className="hidden sm:block text-zinc-400 font-bold px-1">~</div><div className="flex-1 w-full"><YearMonthPicker value={end} onChange={handleEndChange} isDarkMode={isDarkMode} placeholder="종료년도" /></div></>)}
      </div>
    );
  };

  React.useEffect(() => {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(ta => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; });
  }, [activeTab, formData]);

  if (onlyLayout) {
    return (
      <DragDropContext onDragStart={onDragStart} onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections">{(provided) => (<div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">{(formData.sectionOrder || "edu,skills,experience,projects,certs,extra").split(',').map((section, index) => {
          const sectionMap = {
            edu: { label: '학력 사항', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-5.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg> },
            skills: { label: '보유 기술', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> },
            experience: { label: '경력 사항', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
            projects: { label: '주요 프로젝트', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
            certs: { label: '자격/수상/어학', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg> },
            extra: { label: '자기소개서', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> }
          };
          const info = sectionMap[section];
          if (!info) return null;
          return (
            <Draggable key={section} draggableId={section} index={index}>
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.draggableProps} 
                  {...provided.dragHandleProps} 
                  style={provided.draggableProps.style} 
                  className={`flex items-center gap-1.5 sm:gap-2.5 md:gap-4 p-1.5 sm:p-2.5 md:p-4 rounded-lg md:rounded-2xl border-2 transition-all duration-200 ${
                    snapshot.isDragging 
                      ? 'bg-blue-600 border-blue-400 text-white shadow-xl z-50 scale-105' 
                      : (isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-white border-gray-100 text-zinc-700') + ' hover:border-blue-500/50'
                  }`}
                >
                  <div className={`w-5 h-5 sm:w-6.5 sm:h-6.5 md:w-8 md:h-8 flex items-center justify-center rounded-md md:rounded-lg flex-shrink-0 ${
                    snapshot.isDragging ? 'bg-white/20' : 'bg-zinc-500/10'
                  }`}>
                    {React.cloneElement(info.icon, { className: "w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" })}
                  </div>
                  <span className="flex-1 font-black text-[9.5px] sm:text-[12px] md:text-[14px] truncate whitespace-nowrap leading-none">
                    {info.label}
                  </span>
                  <div className="opacity-30 flex-shrink-0">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                </div>
              )}
            </Draggable>
          );
        })} {provided.placeholder}</div>)}</Droppable>
      </DragDropContext>
    );
  }

  return (
    <div className={`w-full h-full min-h-0 flex flex-col transition-all ${
      isCompact ? '' : 'lg:rounded-[24px] lg:overflow-hidden lg:shadow-2xl lg:border'
    } ${theme.formBg}`}>
      {/* Sticky Tab Bar (Native App Top Tabs style) */}
      <div className={`flex-none sticky top-0 z-40 border-b border-zinc-500/10 overflow-x-auto hide-scrollbar p-1.5 backdrop-blur-xl ${
        isDarkMode ? 'bg-zinc-900/80' : 'bg-white/80'
      }`} ref={tabContainerRef}>
        <div className="flex w-max min-w-full gap-1 relative">
          <div 
            className="absolute top-0 bottom-0 bg-blue-600 rounded-xl shadow-lg transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] z-0" 
            style={{ 
              width: `calc((100% - 1.5rem) / 7)`,
              left: `calc(${activeIndex} * ((100% - 1.5rem) / 7 + 0.25rem))`
            }} 
          />
          {tabs.map((tab, idx) => (
            <button 
              key={tab.id} 
              data-tab-id={tab.id}
              onClick={() => switchTab(tab.id)} 
              className={`flex-1 min-w-[85px] sm:min-w-[110px] flex items-center justify-center gap-2 rounded-xl text-[11px] sm:text-[12px] font-black transition-all duration-300 py-2.5 sm:py-3 px-3 relative z-10 ${
                activeTab === tab.id 
                  ? 'text-white' 
                  : theme.tabInactive
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} /></svg>
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3.5 md:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto space-y-4 md:space-y-8 overflow-hidden">
          <DragDropContext onDragStart={onDragStart} onDragEnd={handleDragEnd}>
            <div className="relative">
              <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                <motion.div
                  key={activeTab}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  drag={isMobile ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1} // 손가락을 1:1로 따라오도록 변경
                  onDragEnd={handleSwipe}
                  className="w-full"
                >
                  {activeTab === 'basic' && (
                  <div className="space-y-4 md:space-y-8">
                <div className={`p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[32px] border transition-all ${theme.cardBg}`}>
                  <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                    <div className="shrink-0 mx-auto md:mx-0 text-center flex flex-col items-center">
                      <div className="w-[90px] md:w-[120px] h-[120px] md:h-[160px] rounded-xl md:rounded-2xl overflow-hidden border-2 shadow-xl bg-white dark:bg-zinc-900 border-white dark:border-zinc-700 relative">
                        {formData.profileImageUrl ? <img src={formData.profileImageUrl} alt="프로필" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-300"><svg className="h-10 w-10 md:h-16 md:w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>}
                      </div>
                      <div className="mt-3 md:mt-4">
                        <label className="inline-flex cursor-pointer px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                          <span className="text-[10px] md:text-[11px] font-black uppercase flex items-center gap-1.5">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            사진 변경
                          </span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                      </div>
                    </div>
                    <div className="flex-1 w-full grid gap-3.5 md:gap-6">
                      {/* 모바일: 3열(이름/성별/나이) / PC: 2~3열 가변 */}
                      <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-5 items-end">
                        <div className="flex flex-col gap-1.5">
                          <label className={`pl-1 text-[10px] md:text-[12px] font-black uppercase tracking-wider ${theme.labelText}`}>이름 *</label>
                          <input type="text" name="username" value={formData.username || ""} onChange={handleChange} placeholder="홍길동" className={`w-full px-2.5 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl border outline-none transition-all text-[13px] md:text-base ${theme.innerInputBg} h-[44px] md:h-[48px]`} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className={`pl-1 text-[10px] md:text-[12px] font-black uppercase tracking-wider ${theme.labelText}`}>성별</label>
                          <div className={`relative flex p-1 rounded-lg md:rounded-xl border ${theme.innerInputBg} h-[44px] md:h-[48px] box-border`}>
                            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md md:rounded-lg transition-all duration-500 shadow-sm ${formData.gender === 'male' ? 'left-1 bg-blue-600' : (formData.gender === 'female' ? 'left-[calc(50%)] bg-pink-500' : 'opacity-0')}`} />
                            <button type="button" onClick={() => handleChange({ target: { name: 'gender', value: 'male' } })} className={`relative z-10 flex-1 flex items-center justify-center text-[10px] md:text-[12px] font-black ${formData.gender === 'male' ? 'text-white' : 'text-zinc-500'}`}>남성</button>
                            <button type="button" onClick={() => handleChange({ target: { name: 'gender', value: 'female' } })} className={`relative z-10 flex-1 flex items-center justify-center text-[10px] md:text-[12px] font-black ${formData.gender === 'female' ? 'text-white' : 'text-zinc-500'}`}>여성</button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between pl-1">
                            <label className={`text-[10px] md:text-[12px] font-black uppercase tracking-wider ${theme.labelText}`}>나이</label>
                            {/* 모바일에서도 체크박스 유지 */}
                            <label className="flex items-center gap-1 cursor-pointer group">
                              <input type="checkbox" name="useInternationalAge" checked={formData.useInternationalAge || false} onChange={handleChange} className="sr-only peer" />
                              <div className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 border-zinc-700 peer-checked:bg-blue-600 peer-checked:border-blue-600' : 'bg-white border-zinc-300 peer-checked:bg-blue-600 peer-checked:border-blue-600'}`}>
                                <svg className={`w-2.5 h-2.5 text-white transition-transform duration-200 ${formData.useInternationalAge ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              </div>
                              <span className={`text-[9px] md:text-[11px] font-black transition-colors ${isDarkMode ? 'text-zinc-400 group-hover:text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-700'}`}>만 나이</span>
                            </label>
                          </div>
                          <input type="number" name="age" value={formData.age || ""} onChange={handleChange} placeholder="숫자" className={`w-full px-2.5 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl border outline-none transition-all text-[13px] md:text-base ${theme.innerInputBg} h-[44px] md:h-[48px]`} />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-5">
                        <div className="flex flex-col gap-1.5">
                          <label className={`pl-1 text-[10px] md:text-[12px] font-black uppercase tracking-wider ${theme.labelText}`}>전화번호</label>
                          <input type="text" name="phone" value={formData.phone || ""} onChange={handleChange} placeholder="010-0000-0000" className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border outline-none transition-all text-[14px] md:text-base ${theme.innerInputBg}`} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className={`pl-1 text-[10px] md:text-[12px] font-black uppercase tracking-wider ${theme.labelText}`}>이메일</label>
                          <input type="email" name="email" value={formData.email || ""} onChange={handleChange} placeholder="example@email.com" className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border outline-none transition-all text-[14px] md:text-base ${theme.innerInputBg}`} />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 pt-1">
                        <div className="flex justify-between items-center pl-1">
                          <label className={`text-[10px] md:text-[12px] font-black uppercase tracking-wider ${theme.labelText}`}>한 줄 소개</label>
                          <AiConsultingButton onClick={() => handleAiAudit('bio', formData.bio)} label="AI 컨설팅" />
                        </div>
                        <textarea name="bio" value={formData.bio || ""} onChange={handleChange} onInput={autoExpand} rows="1" placeholder="나를 표현하는 핵심 문장" className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border outline-none resize-none transition-all ${theme.innerInputBg} leading-relaxed min-h-[44px] md:min-h-[48px] overflow-hidden text-[14px] md:text-base`} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:gap-6">
                  <div className={`p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[32px] border ${theme.cardBg} space-y-3.5 md:space-y-5`}><div className="flex items-center gap-2 mb-1"><div className="w-1.5 h-3.5 md:h-4 bg-blue-600 rounded-full" /><label className={`text-[11px] md:text-[13px] font-black uppercase tracking-widest ${theme.labelText}`}>거주지 정보</label></div><div className="flex gap-2 md:gap-3"><input type="text" value={formData.address || ""} readOnly onClick={() => setIsAddressOpen(true)} placeholder="주소 검색" className={`flex-1 px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border outline-none transition-all text-[14px] md:text-base ${theme.innerInputBg} cursor-pointer`} /><button type="button" onClick={() => setIsAddressOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4 md:px-8 rounded-lg md:rounded-xl text-[10px] md:text-xs shadow-lg shadow-blue-600/20 active:scale-95 transition-all">검색</button></div><input type="text" name="addressDetail" value={formData.addressDetail || ""} onChange={handleChange} placeholder="상세주소 입력" className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border outline-none transition-all text-[14px] md:text-base ${theme.innerInputBg}`} /></div>
                  <div className={`p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[32px] border ${theme.cardBg} space-y-3.5 md:space-y-5`}>
                    <div className="flex items-center gap-2 mb-1"><div className="w-1.5 h-3.5 md:h-4 bg-blue-600 rounded-full" /><label className={`text-[11px] md:text-[13px] font-black uppercase tracking-widest ${theme.labelText}`}>병역 사항</label></div>
                    <div className={`grid grid-cols-1 gap-3.5 md:gap-5 ${!['미필', '해당없음', '면제', ''].includes(formData.militaryStatus) ? 'md:grid-cols-3' : (formData.militaryStatus === '면제' ? 'md:grid-cols-2' : 'md:grid-cols-1')}`}>
                      <div className="flex flex-col gap-1.5">
                        <label className={`pl-1 text-[10px] md:text-[11px] font-black uppercase ${theme.subText}`}>군필 여부</label>
                        <div className="relative">
                          <div 
                            tabIndex={0} 
                            onClick={() => setIsMilitaryOpen(!isMilitaryOpen)}
                            onBlur={() => setTimeout(() => setIsMilitaryOpen(false), 200)}
                            className={`w-full h-[44px] md:h-[48px] px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border outline-none transition-all cursor-pointer text-[13px] md:text-[14px] font-bold flex items-center justify-between group ${isDarkMode ? "bg-zinc-900 border-zinc-700 text-zinc-100 hover:border-zinc-500" : "bg-white border-gray-200 text-zinc-900 hover:border-gray-400"}`}
                          >
                            <span className={formData.militaryStatus ? "" : "opacity-40"}>
                              {formData.militaryStatus || "선택 안함"}
                            </span>
                            <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isMilitaryOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M19 9l-7 7-7-7" /></svg>
                          </div>
                          {isMilitaryOpen && (
                            <div className={`absolute bottom-[calc(100%+8px)] left-0 right-0 z-[120] max-h-60 overflow-y-auto rounded-xl md:rounded-2xl border-2 shadow-2xl custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-200 ${isDarkMode ? "bg-zinc-900 border-zinc-700 shadow-black/50" : "bg-white border-zinc-100 shadow-zinc-200/50"}`}>
                              {['선택 안함', '군필', '복무중', '미필', '면제', '해당없음'].map((opt) => (
                                <div 
                                  key={opt} 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    handleChange({ target: { name: 'militaryStatus', value: opt === '선택 안함' ? '' : opt } }); 
                                    setIsMilitaryOpen(false); 
                                  }} 
                                  className={`px-4 py-2.5 cursor-pointer text-[13px] font-bold transition-colors border-b last:border-0 ${isDarkMode ? "text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white" : "text-zinc-600 border-zinc-50 hover:bg-blue-50 hover:text-blue-600"} ${formData.militaryStatus === (opt === '선택 안함' ? '' : opt) ? (isDarkMode ? 'bg-zinc-800 text-white' : 'bg-blue-50 text-blue-600') : ''}`}
                                >
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {formData.militaryStatus === '면제' && <div className="flex flex-col gap-1.5"><label className={`pl-1 text-[10px] md:text-[11px] font-black uppercase ${theme.subText}`}>면제 사유</label><input type="text" name="militaryExemption" value={formData.militaryExemption || ""} onChange={handleChange} placeholder="면제 사유 입력" className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border outline-none transition-all text-[14px] md:text-base ${theme.innerInputBg}`} /></div>}
                      {!['미필', '해당없음', '면제', ''].includes(formData.militaryStatus) && (<><div className="flex flex-col gap-1.5"><label className={`pl-1 text-[10px] md:text-[11px] font-black uppercase ${theme.subText}`}>군별</label><input type="text" name="militaryBranch" value={formData.militaryBranch || ""} onChange={handleChange} placeholder="육군" className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border outline-none transition-all text-[14px] md:text-base ${theme.innerInputBg}`} /></div><div className="flex flex-col gap-1.5"><label className={`pl-1 text-[10px] md:text-[11px] font-black uppercase ${theme.subText}`}>계급</label><input type="text" name="militaryRank" value={formData.militaryRank || ""} onChange={handleChange} placeholder="병장" className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border outline-none transition-all text-[14px] md:text-base ${theme.innerInputBg}`} /></div></>)}
                    </div>
                    {!['미필', '해당없음', '면제', ''].includes(formData.militaryStatus) && (<div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-5 pt-3 border-t border-zinc-500/10 mt-3 md:mt-5"><div className="flex flex-col gap-1.5"><label className={`pl-1 text-[10px] md:text-[11px] font-black uppercase ${theme.subText}`}>입대년월</label><YearMonthPicker value={formData.militaryStartDate || ""} onChange={(val) => handleChange({ target: { name: 'militaryStartDate', value: val } })} isDarkMode={isDarkMode} /></div><div className="flex flex-col gap-1.5"><label className={`pl-1 text-[10px] md:text-[11px] font-black uppercase ${theme.subText}`}>전역년월</label><YearMonthPicker value={formData.militaryEndDate || ""} onChange={(val) => handleChange({ target: { name: 'militaryEndDate', value: val } })} isDarkMode={isDarkMode} /></div></div>)}
                  </div>
                </div>
                {renderStepNavigation()}
              </div>
            )}

            {activeTab === 'links' && (
              <div className="space-y-4 md:space-y-8 animate-fade-in">
                <div className={`p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[32px] border ${theme.cardBg} space-y-4 md:space-y-6`}>
                  <div className="flex items-center gap-2 mb-1"><div className="w-1.5 h-3.5 md:h-4 bg-blue-600 rounded-full" /><h4 className={`text-[10px] md:text-[13px] font-black uppercase tracking-widest ${theme.labelText}`}>개인 브랜딩</h4></div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 pl-1">
                      <label className={`text-[10px] md:text-[12px] font-black uppercase tracking-wider ${theme.labelText}`}>서브도메인</label>
                      <div className="group relative">
                        <svg className={`w-3.5 h-3.5 cursor-help transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className={`absolute top-full left-0 mt-2 w-64 p-3 rounded-xl border shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] text-[11px] font-medium leading-relaxed ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-600'}`}>
                          나만의 <span className="text-blue-500 font-bold">전용 이력서 주소</span>를 설정합니다.<br/>
                          예: <span className="font-bold underline">kim-dev</span> 입력 시<br/>
                          <span className="text-blue-500 font-black">kim-dev.oneresume.kr</span>로 접속 가능합니다.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-stretch h-[44px] md:h-[48px]">
                      <input 
                        type="text" 
                        name="subdomain" 
                        value={formData.subdomain || ""} 
                        onChange={handleChange} 
                        placeholder="your-id" 
                        className={`flex-1 min-w-0 px-3.5 md:px-4 border rounded-l-lg md:rounded-l-xl outline-none border-r-0 ${theme.innerInputBg} font-black text-[14px] md:text-base transition-all h-full`} 
                      />
                      <span className={`flex items-center px-4 md:px-5 font-black text-[11px] md:text-[13px] border border-l-0 rounded-r-lg md:rounded-r-xl whitespace-nowrap h-full ${
                        isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-gray-100 border-gray-200 text-zinc-500'
                      }`}>
                        .oneresume.kr
                      </span>
                    </div>
                    <div className="pl-1 flex flex-col gap-1 pt-0.5">
<div className="flex items-center gap-2"><span className={`text-[10px] md:text-[12px] font-bold ${theme.subText}`}>접속 주소 미리보기:</span><span className="text-[10px] md:text-[13px] font-black text-blue-500 underline underline-offset-4 tracking-tight">https://{formData.subdomain || "your-id"}.oneresume.kr</span></div></div>
                  </div>
                </div>
                <div className={`p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[32px] border ${theme.cardBg} space-y-4 md:space-y-8`}><div className="flex items-center gap-2 mb-1"><div className="w-1.5 h-3.5 md:h-4 bg-blue-600 rounded-full" /><h4 className={`text-[11px] md:text-[13px] font-black uppercase tracking-widest ${theme.labelText}`}>외부 링크 연동</h4></div><div className="flex flex-col gap-2"><label className={`pl-1 text-[10px] md:text-[12px] font-black uppercase tracking-wider ${theme.labelText}`}>GitHub 주소</label><div className="flex gap-2 md:gap-3"><input type="text" name="githubUrl" value={formData.githubUrl || ""} onChange={handleChange} placeholder="https://github.com/your-id" className={`flex-1 px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border outline-none transition-all text-[14px] md:text-base ${theme.innerInputBg}`} />{formData.githubUrl && <button type="button" onClick={handleGithubSync} className="bg-zinc-900 dark:bg-blue-600 text-white font-black px-4 md:px-6 rounded-lg md:rounded-xl text-[10px] md:text-xs active:scale-95 transition-all">동기화</button>}</div></div><div className="flex flex-col gap-2"><label className={`pl-1 text-[10px] md:text-[12px] font-black uppercase tracking-wider ${theme.labelText}`}>기술 블로그</label><input type="text" name="blogUrl" value={formData.blogUrl || ""} onChange={handleChange} placeholder="https://velog.io/@your-id" className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border outline-none transition-all text-[14px] md:text-base ${theme.innerInputBg}`} /></div></div>
                {renderStepNavigation()}
              </div>
            )}

            {activeTab === 'edu' && (
              <div className="space-y-4 md:space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <div className={`p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[32px] border ${theme.cardBg} space-y-4 md:space-y-6`}><h4 className={`text-[10px] md:text-[13px] font-black uppercase tracking-widest ${theme.labelText} mb-1`}>학력 사항</h4><div className="relative flex flex-col gap-1.5 md:gap-2"><label className={`pl-1 text-[10px] md:text-[12px] font-black uppercase tracking-wider ${theme.labelText}`}>학교명</label><input type="text" name="school" value={formData.school || ""} onChange={(e) => { handleChange(e); searchSchool(e.target.value); }} onFocus={() => (formData?.school || "").length >= 2 && setShowSchoolList(true)} onBlur={() => setTimeout(() => setShowSchoolList(false), 200)} autoComplete="off" placeholder="학교명 입력 (2자 이상)" className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border outline-none transition-all text-[14px] md:text-base ${theme.innerInputBg}`} />{showSchoolList && (<div className={`absolute top-[calc(100%+8px)] left-0 right-0 z-50 max-h-60 overflow-y-auto rounded-xl md:rounded-2xl border-2 shadow-2xl ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-100'}`}>{schoolResults.length > 0 ? schoolResults.map((item, idx) => (<div key={idx} onClick={() => { handleChange({ target: { name: 'school', value: item.schoolName } }); setShowSchoolList(false); }} className={`px-4 md:px-5 py-2.5 md:py-3 cursor-pointer border-b last:border-0 transition-colors ${isDarkMode ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-50 hover:bg-blue-50'}`}><div className={`font-black text-[13px] md:text-[14px] ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>{item.schoolName}</div><div className={`text-[10px] md:text-[11px] mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500 opacity-70'}`}>{item.region} | {item.campusName}</div></div>)) : <div className={`p-4 text-center text-[10px] font-bold ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>결과가 없습니다.</div>}</div>)}</div><div className="relative flex flex-col gap-1.5 md:gap-2"><label className={`pl-1 text-[10px] md:text-[12px] font-black uppercase tracking-wider ${theme.labelText}`}>전공명</label><input type="text" name="major" value={formData.major || ""} onChange={(e) => { handleChange(e); searchMajor(e.target.value); }} onFocus={() => (formData?.major || "").length >= 2 && setShowMajorList(true)} onBlur={() => setTimeout(() => setShowMajorList(false), 200)} autoComplete="off" placeholder="전공명 입력 (2자 이상)" className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border outline-none transition-all text-[14px] md:text-base ${theme.innerInputBg}`} />{showMajorList && (<div className={`absolute top-[calc(100%+8px)] left-0 right-0 z-50 max-h-60 overflow-y-auto rounded-xl md:rounded-2xl border-2 shadow-2xl ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-100'}`}>{majorResults.length > 0 ? majorResults.map((item, idx) => (<div key={idx} onClick={() => { handleChange({ target: { name: 'major', value: item.majorName } }); setShowMajorList(false); }} className={`px-4 md:px-5 py-2.5 md:py-3 cursor-pointer border-b last:border-0 transition-colors ${isDarkMode ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-50 hover:bg-blue-50'}`}><div className={`font-black text-[13px] md:text-[14px] ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>{item.majorName}</div></div>)) : <div className={`p-4 text-center text-[10px] font-bold ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>결과가 없습니다.</div>}</div>)}</div><div className="flex flex-col gap-1.5 md:gap-2"><label className={`pl-1 text-[10px] md:text-[12px] font-black uppercase tracking-wider ${theme.labelText}`}>학점</label><div className="flex items-center gap-3"><input type="text" name="gpa" value={formData.gpa || ""} onChange={handleChange} placeholder="4.5" className={`w-32 px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border outline-none transition-all text-[14px] md:text-base ${theme.innerInputBg}`} /><span className={`text-[12px] font-bold ${theme.subText}`}>/ 4.5</span></div></div></div>
                  <div className={`p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[32px] border ${theme.cardBg} flex flex-col`}><h4 className={`text-[10px] md:text-[13px] font-black uppercase tracking-widest ${theme.labelText} mb-3 md:mb-4`}>보유 기술</h4><textarea name="skills" value={formData.skills || ""} onChange={handleChange} onInput={autoExpand} rows="8" placeholder="기술을 콤마(,)로 구분 (예: React, TypeScript)" className={`flex-1 w-full px-4 py-4 rounded-xl border outline-none transition-all ${theme.innerInputBg} resize-none leading-relaxed min-h-[160px] md:min-h-[200px] text-[14px] md:text-base`} /></div>
                </div>
                {renderStepNavigation()}
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="space-y-4 md:space-y-8 animate-fade-in">
                <div className={`p-3 md:p-5 rounded-xl md:rounded-[24px] border ${theme.cardBg} flex items-center justify-between shadow-sm`}><h4 className={`text-[12px] md:text-[14px] font-black ${theme.titleText}`}>경력 사항 ({formData.workExperiences.length})</h4><button type="button" onClick={addWork} className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black active:scale-95 transition-all">+ 추가</button></div>
                <div className="flex flex-col gap-4 md:gap-6">
                  {formData.workExperiences.map((work, index) => (
                    <div key={index} className={`p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[32px] border ${theme.cardBg} relative group space-y-4 md:space-y-6 transition-all hover:border-blue-500/30 shadow-sm`}>
                      <button type="button" onClick={() => removeWork(index)} className="absolute right-2 top-2 w-7 h-7 md:w-9 md:h-9 bg-red-500 text-white rounded-lg md:rounded-xl flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all font-bold shadow-xl z-50 text-[10px] md:text-xs">✕</button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-5"><div className="flex flex-col gap-1.5"><label className={`text-[10px] md:text-[11px] font-black uppercase ${theme.subText}`}>회사명</label><input type="text" name="companyName" value={work.companyName || ""} onChange={(e) => handleWorkChange(index, e)} placeholder="회사명 입력" className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border ${theme.innerInputBg} font-black text-[14px] md:text-base`} /></div><div className="flex flex-col gap-1.5"><label className={`text-[10px] md:text-[11px] font-black uppercase ${theme.subText}`}>직급 / 직위</label><input type="text" name="position" value={work.position || ""} onChange={(e) => handleWorkChange(index, e)} placeholder="예: 과장, 선임, 사원" className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border ${theme.innerInputBg} text-[14px] md:text-base`} /></div></div>
                      <div className="flex flex-col gap-1.5 relative">
                        <label className={`text-[10px] md:text-[11px] font-black uppercase ${theme.subText}`}>담당 직무</label>
                        <input type="text" name="role" value={work.role || ""} onChange={(e) => { handleWorkChange(index, e); searchJob(e.target.value); }} onFocus={() => { setActiveJobIndex(`work-${index}`); (work.role || "").length >= 2 && setShowJobList(true); }} onBlur={() => setTimeout(() => setShowJobList(false), 200)} autoComplete="off" placeholder="예: 프론트엔드 개발자" className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border ${theme.innerInputBg} text-[14px] md:text-base`} />
                        {showJobList && activeJobIndex === `work-${index}` && (<div className={`absolute top-[calc(100%+8px)] left-0 right-0 z-50 max-h-60 overflow-y-auto rounded-xl md:rounded-2xl border-2 shadow-2xl ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-100'}`}>{jobResults.length > 0 ? jobResults.map((item, idx) => (<div key={idx} onClick={() => { handleWorkChange(index, { target: { name: 'role', value: item.jobNm } }); setShowJobList(false); }} className={`px-4 md:px-5 py-2.5 md:py-3 cursor-pointer border-b last:border-0 transition-colors ${isDarkMode ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-50 hover:bg-blue-50'}`}><div className={`font-black text-[13px] md:text-[14px] ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>{item.jobNm}</div></div>)) : <div className={`p-4 text-center text-[10px] font-bold ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>검색 결과가 없습니다.</div>}</div>)}
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className={`text-[10px] md:text-[11px] font-black uppercase ${theme.subText}`}>근무 기간</label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" name="isCurrent" checked={work.isCurrent || false} onChange={(e) => handleWorkChange(index, e)} className="sr-only peer" />
                            <div className={`w-3.5 h-3.5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 border-zinc-700 peer-checked:bg-blue-600' : 'bg-white border-zinc-300 peer-checked:bg-blue-600'}`}><svg className={`w-2.5 h-2.5 text-white transition-transform duration-200 ${work.isCurrent ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div>
                            <span className={`text-[10px] md:text-[11px] font-black ${isDarkMode ? 'text-zinc-400 group-hover:text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-700'}`}>현재 재직 중</span>
                          </label>
                        </div>
                        <PeriodPicker value={work.period || ""} onChange={(val) => handleWorkChange(index, { target: { name: 'period', value: val } })} isDarkMode={isDarkMode} isCurrent={work.isCurrent} />
                      </div>
                      <div className="flex flex-col gap-1.5 pt-1">
                        <div className="flex justify-between items-center pl-1">
                          <label className={`text-[10px] md:text-[11px] font-black uppercase ${theme.subText}`}>업무 내용 및 성과</label>
                          <AiConsultingButton onClick={() => handleAiAudit(`work-${index}`, work.jobDescription)} label="AI 가이드" />
                        </div>
                        <textarea name="jobDescription" value={work.jobDescription || ""} onChange={(e) => handleWorkChange(index, e)} onInput={autoExpand} rows="3" className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border ${theme.innerInputBg} resize-none leading-relaxed text-[14px] min-h-[90px] md:min-h-[120px] overflow-hidden`} />
                      </div>
                    </div>
                  ))}
                </div>
                {renderStepNavigation()}
              </div>
            )}

            {activeTab === 'certs' && (
              <div className="space-y-4 md:space-y-8 animate-fade-in">
                <div className={`p-3 md:p-5 rounded-xl md:rounded-[24px] border ${theme.cardBg} flex items-center justify-between shadow-sm`}><h4 className={`text-[12px] md:text-[14px] font-black ${theme.titleText}`}>자격 / 수상 ({formData.certifications.length})</h4><button type="button" onClick={addCert} className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black active:scale-95 transition-all">+ 추가</button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {formData.certifications.map((cert, index) => (
                    <div key={index} className={`p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[32px] border ${theme.cardBg} relative group space-y-3.5 md:space-y-5 transition-all hover:border-blue-500/30 shadow-sm`}><button type="button" onClick={() => removeCert(index)} className="absolute right-2 top-2 w-7 h-7 md:w-9 md:h-9 bg-red-500 text-white rounded-lg md:rounded-xl flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all font-bold shadow-xl z-50 text-[10px] md:text-xs">✕</button>
                      <div className="flex flex-col gap-1.5"><label className={`text-[10px] md:text-[11px] font-black uppercase ${theme.subText}`}>명칭</label><input type="text" name="name" value={cert.name || ""} onChange={(e) => handleCertChange(index, e)} className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border ${theme.innerInputBg} text-[14px] font-bold`} /></div>
                      <div className="grid grid-cols-2 gap-3 md:gap-4"><div className="flex flex-col gap-1.5"><label className={`text-[10px] md:text-[11px] font-black uppercase ${theme.subText}`}>발급기관</label><input type="text" name="issuer" value={cert.issuer || ""} onChange={(e) => handleCertChange(index, e)} className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border ${theme.innerInputBg} text-[14px]`} /></div><div className="flex flex-col gap-1.5"><label className={`text-[10px] md:text-[11px] font-black uppercase ${theme.subText}`}>점수 / 등급</label><input type="text" name="score" value={cert.score || ""} onChange={(e) => handleCertChange(index, e)} className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border ${theme.innerInputBg} text-[14px]`} /></div></div>
                      <div className="flex flex-col gap-1.5"><label className={`text-[10px] md:text-[11px] font-black uppercase ${theme.subText}`}>취득일</label><YearMonthPicker value={cert.date || ""} onChange={(val) => handleCertChange(index, { target: { name: 'date', value: val } })} isDarkMode={isDarkMode} /></div>
                    </div>
                  ))}
                </div>
                {renderStepNavigation()}
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-4 md:space-y-8 animate-fade-in">
                <div className={`p-3 md:p-5 rounded-xl md:rounded-[24px] border ${theme.cardBg} flex items-center justify-between shadow-sm`}><h4 className={`text-[12px] md:text-[14px] font-black ${theme.titleText}`}>프로젝트 ({formData.projects.length})</h4><button type="button" onClick={addProject} className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black active:scale-95 transition-all">+ 추가</button></div>
                <Droppable droppableId="projects">{(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-4 md:gap-6">
                    {formData.projects.map((project, index) => (
                      <Draggable key={project.id} draggableId={String(project.id)} index={index}>{(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} style={provided.draggableProps.style} className={`p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[32px] border transition-all duration-200 ${snapshot.isDragging ? 'shadow-2xl border-blue-500 bg-white dark:bg-zinc-800 z-[100] scale-[1.02]' : theme.cardBg} relative group shadow-sm`}><button type="button" onClick={() => removeProject(index)} className="absolute right-2 top-2 w-7 h-7 md:w-9 md:h-9 bg-red-500 text-white rounded-lg md:rounded-xl flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all font-bold shadow-xl z-50 text-[10px] md:text-xs">✕</button><div {...provided.dragHandleProps} className="absolute left-1/2 -translate-x-1/2 top-2.5 w-10 md:w-12 h-1 md:h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full cursor-grab active:cursor-grabbing" />
                          <div className="space-y-4 md:space-y-6 mt-3 md:mt-4">
                            <div className="flex flex-col gap-1.5"><label className={`text-[10px] md:text-[11px] font-black uppercase ${theme.subText}`}>프로젝트명</label><input type="text" name="name" value={project.name || ""} onChange={(e) => handleProjectChange(index, e)} className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border ${theme.innerInputBg} font-black text-[15px] md:text-lg`} /></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 md:gap-5"><div className="flex flex-col gap-1.5"><label className={`text-[10px] md:text-[11px] font-black uppercase ${theme.subText}`}>담당 역할</label><input type="text" name="role" value={project.role || ""} onChange={(e) => handleProjectChange(index, e)} autoComplete="off" placeholder="예: 프론트엔드 개발" className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border ${theme.innerInputBg} text-[14px] md:text-base`} /></div><div className="flex flex-col gap-1.5"><label className={`text-[10px] md:text-[11px] font-black uppercase ${theme.subText}`}>기술 스택</label><input type="text" name="techStack" value={project.techStack || ""} onChange={(e) => handleProjectChange(index, e)} placeholder="예: React, Node.js" className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border ${theme.innerInputBg} text-[14px] md:text-base`} /></div></div>
                            <div className="flex flex-col gap-1.5"><label className={`text-[10px] md:text-[11px] font-black uppercase ${theme.subText}`}>진행 기간</label><PeriodPicker value={project.period || ""} onChange={(val) => handleProjectChange(index, { target: { name: 'period', value: val } })} isDarkMode={isDarkMode} /></div>
                            <div className="flex flex-col gap-1.5 pt-1">
                              <div className="flex justify-between items-center pl-1">
                                <label className={`text-[10px] md:text-[11px] font-black uppercase ${theme.subText}`}>상세 성과</label>
                                <AiConsultingButton onClick={() => handleAiAudit("project-" + index, project.description)} label="AI 분석" />
                              </div>
                              <textarea name="description" value={project.description || ""} onChange={(e) => handleProjectChange(index, e)} onInput={autoExpand} rows="3" className={`w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border ${theme.innerInputBg} resize-none leading-relaxed text-[14px] min-h-[90px] md:min-h-[120px] overflow-hidden`} />
                            </div>
                          </div>
                        </div>
                      )}</Draggable>
                    ))}{provided.placeholder}
                  </div>
                )}</Droppable>
                {renderStepNavigation()}
              </div>
            )}

            {activeTab === 'extra' && (
              <div className="space-y-4 md:space-y-8 animate-fade-in">
                <div className={`p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[32px] border ${theme.cardBg} space-y-4 md:space-y-8`}>
                  <div className="flex flex-col gap-2 relative">
                    <div className="flex justify-between items-center pl-1">
                      <label className={`text-[10px] md:text-[13px] font-black uppercase tracking-wider ${theme.labelText}`}>성장과정</label>
                      <AiConsultingButton onClick={() => handleAiAudit('selfIntroGrowth', formData.selfIntroGrowth)} label="AI 컨설팅" />
                    </div>
                    <textarea name="selfIntroGrowth" value={formData.selfIntroGrowth || ""} onChange={handleChange} onInput={autoExpand} rows="5" className={`w-full px-3.5 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl border outline-none transition-all ${theme.innerInputBg} leading-relaxed min-h-[110px] md:min-h-[150px] overflow-hidden text-[14px] md:text-base`} />
                  </div>
                  <div className="flex flex-col gap-2 relative">
                    <div className="flex justify-between items-center pl-1">
                      <label className={`text-[10px] md:text-[13px] font-black uppercase tracking-wider ${theme.labelText}`}>성격의 장단점</label>
                      <AiConsultingButton onClick={() => handleAiAudit('selfIntroCharacter', formData.selfIntroCharacter)} label="AI 컨설팅" />
                    </div>
                    <textarea name="selfIntroCharacter" value={formData.selfIntroCharacter || ""} onChange={handleChange} onInput={autoExpand} rows="5" className={`w-full px-3.5 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl border outline-none transition-all ${theme.innerInputBg} leading-relaxed min-h-[110px] md:min-h-[150px] overflow-hidden text-[14px] md:text-base`} />
                  </div>
                  <div className="flex flex-col gap-2 relative">
                    <div className="flex justify-between items-center pl-1">
                      <label className={`text-[10px] md:text-[13px] font-black uppercase tracking-wider ${theme.labelText}`}>지원동기 및 포부</label>
                      <AiConsultingButton onClick={() => handleAiAudit('selfIntroMotivation', formData.selfIntroMotivation)} label="AI 컨설팅" />
                    </div>
                    <textarea name="selfIntroMotivation" value={formData.selfIntroMotivation || ""} onChange={handleChange} onInput={autoExpand} rows="5" className={`w-full px-3.5 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl border outline-none transition-all ${theme.innerInputBg} leading-relaxed min-h-[110px] md:min-h-[150px] overflow-hidden text-[14px] md:text-base`} />
                  </div>
                </div>
                {renderStepNavigation()}
              </div>
            )}
            
            </motion.div>
            </AnimatePresence>
            </div>
          </DragDropContext>

        </div>
      </div>

      {isAiModalOpen && aiFeedback && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-lg animate-fade-in">
          <div className={`relative w-full max-w-2xl rounded-3xl md:rounded-[40px] overflow-hidden shadow-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-white'}`}>
            <div className="p-5 md:p-6 border-b border-zinc-700/10 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md">
              <div className="flex items-center gap-3"><div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg"><svg viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6 fill-white"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg></div><h3 className="text-lg md:text-xl font-black text-white">AI 커리어 컨설팅</h3></div>
              <button onClick={() => setIsAiModalOpen(false)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all text-xl md:text-2xl">✕</button>
            </div>
            <div className="p-6 md:p-8 lg:p-10 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-6 md:space-y-8">
              <section className="space-y-3">
                <div className="flex items-center justify-between"><h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-blue-500">AI 분석 리포트</h4><button onClick={handleRegenerate} className="flex items-center gap-1.5 text-[10px] font-black text-zinc-400 hover:text-blue-500 transition-colors"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>다시 분석하기</button></div>
                <div className={`p-5 md:p-6 rounded-2xl md:rounded-[24px] text-[13px] md:text-[14px] leading-relaxed font-medium ${isDarkMode ? 'bg-zinc-800/50 text-zinc-300' : 'bg-gray-50 text-zinc-600'}`}>{aiFeedback.feedback}</div>
              </section>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2"><span className="pl-1 text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Original (원문)</span><div className={`p-4 md:p-5 rounded-xl md:rounded-2xl border border-dashed text-[12px] md:text-sm opacity-60 ${isDarkMode ? 'border-zinc-700 text-zinc-400' : 'border-zinc-200 text-zinc-500'}`}>{aiFeedback.targetField === 'bio' ? formData.bio : aiFeedback.targetField.startsWith('project-') ? formData.projects[parseInt(aiFeedback.targetField.split('-')[1])].description : aiFeedback.targetField.startsWith('work-') ? formData.workExperiences[parseInt(aiFeedback.targetField.split('-')[1])].jobDescription : formData[aiFeedback.targetField]}</div></div>
                <div className="relative pt-4">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-7 h-7 md:w-8 md:h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-zinc-900"><svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M19 9l-7 7-7-7" /></svg></div>
                  <div className="space-y-2"><span className="pl-1 text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Recommended (추천문)</span><div className={`p-6 md:p-8 rounded-[24px] md:rounded-[32px] border-2 shadow-xl ${isDarkMode ? 'bg-blue-950/10 border-blue-500/20 text-white' : 'bg-blue-50/50 border-blue-100 text-zinc-900'}`}><p className="font-black text-[15px] md:text-[17px] leading-relaxed italic text-center mb-6 md:mb-8">"{aiFeedback.refinedText}"</p><div className="flex flex-col sm:flex-row gap-3"><button onClick={() => copyToClipboard(aiFeedback.refinedText)} className={`flex-1 flex items-center justify-center gap-2 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-xs transition-all ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200 shadow-sm'}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>복사하기</button><button onClick={() => applyAiRefinement(aiFeedback.refinedText)} className="flex-[2] py-3.5 md:py-4 bg-blue-600 text-white rounded-xl md:rounded-2xl font-black shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all">즉시 변경하기</button></div></div></div>
                </div>
              </div>
            </div>
            <div className="p-4 md:p-6 border-t flex justify-center bg-zinc-500/5"><button onClick={() => setIsAiModalOpen(false)} className="px-10 py-2.5 text-zinc-400 font-black text-sm hover:text-zinc-200 transition-colors">나중에 할게요</button></div>
          </div>
        </div>
      )}

      {isAddressOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className={`relative w-full max-w-lg rounded-2xl md:rounded-[32px] overflow-hidden shadow-2xl ${isDarkMode ? 'bg-zinc-900 border border-zinc-700' : 'bg-white'}`}>
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-zinc-700/10"><h3 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>주소 검색</h3><button onClick={() => setIsAddressOpen(false)} className={`w-8 h-8 flex items-center justify-center rounded-full transition-all text-xl ${isDarkMode ? 'text-white/60 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-800 hover:bg-gray-100'}`}>✕</button></div>
            <div className="p-2"><DaumPostcode onComplete={(data) => { handleChange({ target: { name: "address", value: data.address } }); setIsAddressOpen(false); }} style={{ height: '450px' }} theme={isDarkMode ? { bgColor: "#18181b", searchBgColor: "#18181b", contentBgColor: "#18181b", pageBgColor: "#18181b", textColor: "#ffffff", queryTextColor: "#ffffff", postcodeTextColor: "#3b82f6", emphasizeTextColor: "#60a5fa", outlineColor: "#3f3f46" } : null} /></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeForm;