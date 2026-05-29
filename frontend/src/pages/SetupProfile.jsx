import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from "../config";
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '../components/PageLayout';
import LegalModal from '../components/LegalModal';
import ThemeToggle from '../components/ThemeToggle';
import logo from "../logo.svg";

const SetupProfile = ({ isDarkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const submitButtonRef = useRef(null);
  const jobRefs = useRef({});

  const [step, setStep] = useState(location.state?.step || 1); 
  const [isFlying, setIsFlying] = useState(false);
  const [flyingConfig, setFlyingConfig] = useState(null);

  const [windowSize, setWindowSize] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });

  const [profile, setProfile] = useState({
    username: '',
    email: '', 
    age: '',
    phone: '',
    useInternationalAge: false,
    profileImage: null,
    previewUrl: null,
    job: ''
  });

  const [legalModal, setLegalModal] = useState({
    isOpen: false,
    title: '',
    content: null
  });

  const legalContent = {
    terms: (
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-bold mb-3 text-blue-600">제1조 (목적)</h3>
          <p>본 약관은 OneResume(이하 "서비스")이 제공하는 마스터 이력서 관리 및 채용 사이트 자동 입력 연동 서비스의 이용 조건 및 절차를 규정함을 목적으로 합니다.</p>
        </section>
      </div>
    ),
    privacy: (
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-bold mb-3 text-blue-600">1. 수집하는 개인정보 항목</h3>
          <p>회원가입 시 이메일, 이름, 비밀번호를 수집하며, 이력서 작성 시 학력, 경력, 자기소개서 등 사용자가 자발적으로 입력한 정보를 수집합니다.</p>
        </section>
      </div>
    ),
    disclaimer: (
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-bold mb-3 text-red-500">⚠️ 중요 고지</h3>
          <p>OneResume은 사용자의 편의를 위한 자동 연동 도구가 제공할 뿐, 각 채용 사이트와 공식적인 제휴 관계가 없음을 밝힙니다.</p>
        </section>
      </div>
    ),
    contact: (
      <div className="space-y-6 text-center py-10">
        <h3 className="text-2xl font-bold mb-2">고객 문의</h3>
        <p className="text-zinc-500 mb-8">서비스 이용 중 불편한 점이나 제안사항이 있으신가요?</p>
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <p className="text-sm font-medium mb-1 opacity-50">공식 이메일</p>
            <p className="text-lg font-bold text-blue-600">oneresume.dev@gmail.com</p>
          </div>
          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-blue-600/5 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
            <p className="text-sm font-medium mb-1 text-blue-600 opacity-80 font-bold">개발자 직통 문의 (빠른 답변)</p>
            <p className="text-lg font-bold text-blue-600">parkjeongung0705@gmail.com</p>
          </div>
        </div>
      </div>
    )
  };

  const openModal = (type) => {
    let title = '';
    let content = null;
    switch(type) {
      case 'terms': title = '이용약관'; content = legalContent.terms; break;
      case 'privacy': title = '개인정보처리방침'; content = legalContent.privacy; break;
      case 'disclaimer': title = '책임의 한계와 법적고지'; content = legalContent.disclaimer; break;
      case 'contact': title = '고객문의'; content = legalContent.contact; break;
      default: break;
    }
    setLegalModal({ isOpen: true, title, content });
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile({
        ...profile,
        profileImage: file,
        previewUrl: URL.createObjectURL(file)
      });
    }
  };

  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const cpLen = phoneNumber.length;
    if (cpLen < 4) return phoneNumber;
    if (cpLen < 7) return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    if (cpLen < 11) return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'phone') {
      setProfile({ ...profile, [name]: formatPhoneNumber(value) });
    } else {
      setProfile({ ...profile, [name]: type === 'checkbox' ? checked : value });
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!profile.username || !profile.email || !profile.age || !profile.phone) {
        toast.error("필수 정보를 모두 입력해주세요.");
        return;
      }
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const jobs = [
    { 
      id: 'developer', 
      title: '개발직', 
      description: '프론트엔드, 백엔드, 풀스택 개발 및 시스템 엔지니어링', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
        </svg>
      ),
      color: 'blue'
    },
    { 
      id: 'it', 
      title: '전산직', 
      description: '정보보안, 클라우드 아키텍처 및 네트워크 시스템 관리', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-6 h-6">
          <rect width="20" height="8" x="2" y="2" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
          <rect width="20" height="8" x="2" y="14" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="6" x2="6.01" y1="6" y2="6" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="6" x2="6.01" y1="18" y2="18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      color: 'emerald'
    },
    { 
      id: 'admin', 
      title: '행정직', 
      description: '일반 행정, 경영지원 및 공공기관 실무 관리', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5M9 16.5h1.5m3 0h1.5" />
        </svg>
      ),
      color: 'teal'
    },
    { 
      id: 'sales', 
      title: '영업/마케팅', 
      description: '시장 전략 분석, B2B 영업 및 브랜드 마케팅 솔루션', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.281-2.28 5.941" />
        </svg>
      ),
      color: 'orange'
    },
    { 
      id: 'design', 
      title: '디자인', 
      description: 'UI/UX 디자인, 브랜드 아이덴티티 및 디지털 비주얼', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
          <circle cx="13.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="17.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="8.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="6.5" cy="12.5" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      ),
      color: 'purple'
    },
    { 
      id: 'finance', 
      title: '금융/회계', 
      description: '재무 회계, 자산 관리 및 리스크 분석 전문성', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      color: 'amber'
    },
    { 
      id: 'hr', 
      title: '인사/교육', 
      description: '인재 채용, 교육 기획 및 사내 문화 개발', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      ),
      color: 'indigo'
    },
    { 
      id: 'service', 
      title: '서비스/고객지원', 
      description: 'CS 전략 기획, 고객 경험 관리 및 서비스 운영', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      ),
      color: 'cyan'
    },
    { 
      id: 'marketing_pr', 
      title: '마케팅/홍보', 
      description: '디지털 광고, 언론 홍보 및 콘텐츠 크리에이션', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.124a.75.75 0 0 1 1.28.54v14.668a.75.75 0 0 1-1.28.54L6.75 15.75H4.5a2.25 2.25 0 0 1-2.25-2.25v-3a2.25 2.25 0 0 1 2.25-2.25h2.25Z" />
        </svg>
      ),
      color: 'rose'
    },
    { 
      id: 'education', 
      title: '교육/강사', 
      description: '아카데미 강의, 커리큘럼 개발 및 교육 멘토링', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4 2 9l10 5 10-5-10-5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M22 9v7M6 11v6a6 3 0 0 0 12 0v-6" />
        </svg>
      ),
      color: 'orange'
    },
    { 
      id: 'medical', 
      title: '의료/보건', 
      description: '의료 행정, 공공 보건 관리 및 전문 의료 서비스', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
      ),
      color: 'red'
    },
    { 
      id: 'legal', 
      title: '법률/공공', 
      description: '법무 행정, 정책 분석 및 공공 섹터 전문가', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M4 21v-4m16 4v-4M4 17h16M6 17V9m4 8V9m4 8V9m4 8V9M2 9h20M12 3l10 6H2Z" />
        </svg>
      ),
      color: 'slate'
    }
  ];

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const token = localStorage.getItem('oneresume-token') || sessionStorage.getItem('oneresume-token');
    
    if (!profile.job) {
      toast.error("직무를 선택해주세요.");
      return;
    }

    const selectedJobRef = jobRefs.current[profile.job];
    const targetRef = submitButtonRef.current;

    if (selectedJobRef && targetRef) {
      const startRect = selectedJobRef.getBoundingClientRect();
      const endRect = targetRef.getBoundingClientRect();
      const selectedJob = jobs.find(j => j.id === profile.job);
      
      setFlyingConfig({
        x: startRect.left + startRect.width / 2 - 24, 
        y: startRect.top + startRect.height / 2 - 24,
        targetX: endRect.left + endRect.width / 2 - 24,
        targetY: endRect.top + endRect.height / 2 - 24,
        icon: selectedJob.icon,
        color: selectedJob.color
      });
      
      setIsFlying(true);
      
      // 백그라운드 데이터 저장 시작
      const savePromise = proceedSubmitBackground(token);

      // 시네마틱 다이렉트 전환 타이밍 (1.6초: 아이콘이 버튼에 도킹되는 순간)
      setTimeout(async () => {
        await savePromise;
        navigate('/edit');
      }, 1600);
    } else {
      const loading = toast.loading("프로필 정보를 저장 중입니다...");
      await proceedSubmit(token, loading);
    }
  };

  const proceedSubmitBackground = async (token) => {
    const formData = new FormData();
    formData.append('username', profile.username);
    formData.append('email', profile.email);
    formData.append('age', profile.age);
    formData.append('phone', profile.phone);
    formData.append('useInternationalAge', profile.useInternationalAge);
    formData.append('job', profile.job);
    if (profile.profileImage) {
      formData.append('profileImage', profile.profileImage);
    }

    try {
      await axios.put(`${API_BASE_URL}/api/auth/profile-setup`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` 
        }
      });
      return true;
    } catch (err) {
      console.error('저장 실패:', err);
      toast.error(err.response?.data?.message || "프로필 저장 실패");
      setIsFlying(false);
      return false;
    }
  };

  const proceedSubmit = async (token, loading) => {
    const formData = new FormData();
    formData.append('username', profile.username);
    formData.append('email', profile.email);
    formData.append('age', profile.age);
    formData.append('phone', profile.phone);
    formData.append('useInternationalAge', profile.useInternationalAge);
    formData.append('job', profile.job);
    if (profile.profileImage) { formData.append('profileImage', profile.profileImage); }

    try {
      await axios.put(`${API_BASE_URL}/api/auth/profile-setup`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` }
      });
      toast.success("프로필 작성이 완료되었습니다!", { id: loading });
      navigate('/edit'); 
    } catch (err) {
      if (err.response?.status === 429) {
        toast.dismiss(loading);
        return;
      }
      toast.error(err.response?.data?.message || "프로필 저장 실패", { id: loading });
    }
  };

  const getJobColor = (colorName, type = 'bg') => {
    const colors = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', active: 'bg-blue-600', border: 'border-blue-100', darkBg: 'dark:bg-blue-400/10', darkText: 'dark:text-blue-400' },
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', active: 'bg-emerald-600', border: 'border-emerald-100', darkBg: 'dark:bg-emerald-400/10', darkText: 'dark:text-emerald-400' },
      teal: { bg: 'bg-teal-50', text: 'text-teal-600', active: 'bg-teal-600', border: 'border-teal-100', darkBg: 'dark:bg-teal-400/10', darkText: 'dark:text-teal-400' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', active: 'bg-orange-600', border: 'border-orange-100', darkBg: 'dark:bg-orange-400/10', darkText: 'dark:text-orange-400' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', active: 'bg-purple-600', border: 'border-purple-100', darkBg: 'dark:bg-purple-400/10', darkText: 'dark:text-purple-400' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', active: 'bg-amber-600', border: 'border-amber-100', darkBg: 'dark:bg-amber-400/10', darkText: 'dark:text-amber-400' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', active: 'bg-indigo-600', border: 'border-indigo-100', darkBg: 'dark:bg-indigo-400/10', darkText: 'dark:text-indigo-400' },
      cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', active: 'bg-cyan-600', border: 'border-cyan-100', darkBg: 'dark:bg-cyan-400/10', darkText: 'dark:text-cyan-400' },
      rose: { bg: 'bg-rose-50', text: 'text-rose-600', active: 'bg-rose-600', border: 'border-rose-100', darkBg: 'dark:bg-rose-400/10', darkText: 'dark:text-rose-400' },
      red: { bg: 'bg-red-50', text: 'text-red-600', active: 'bg-red-600', border: 'border-red-100', darkBg: 'dark:bg-red-400/10', darkText: 'dark:text-red-400' },
      slate: { bg: 'bg-slate-50', text: 'text-slate-600', active: 'bg-slate-600', border: 'border-slate-100', darkBg: 'dark:bg-slate-400/10', darkText: 'dark:text-slate-400' },
    };
    const c = colors[colorName] || colors.blue;
    return c[type] || '';
  };

  return (
    <PageLayout isDarkMode={isDarkMode} toggleDarkMode={null} noPadding={true}>
      <AnimatePresence>
        {isFlying && flyingConfig && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`trail-${i}`}
                initial={{ x: flyingConfig.x, y: flyingConfig.y, scale: 1, opacity: 0.4 - (i * 0.1) }}
                animate={{ x: flyingConfig.targetX, y: flyingConfig.targetY, scale: 0.1, opacity: 0 }}
                transition={{ duration: 1.5, delay: i * 0.08, ease: [0.45, 0, 0.55, 1] }}
                className={`fixed z-[99] w-10 h-10 rounded-full blur-xl pointer-events-none ${getJobColor(flyingConfig.color, 'bg')}`}
              />
            ))}
            <motion.div
              initial={{ x: flyingConfig.x, y: flyingConfig.y, scale: 1.2, opacity: 1, rotate: 0 }}
              animate={{ x: flyingConfig.targetX, y: flyingConfig.targetY, scale: [1.2, 2.5, 0.2], opacity: [1, 1, 0], rotate: 720 }}
              transition={{ duration: 1.7, ease: [0.68, -0.6, 0.32, 1.6] }}
              className={`fixed z-[100] w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl pointer-events-none text-white ${getJobColor(flyingConfig.color, 'active')}`}
            >
              {flyingConfig.icon}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <header className={`h-14 px-4 md:px-6 border-b flex items-center justify-between z-40 relative backdrop-blur-md transition-all duration-300 ${isDarkMode ? 'bg-zinc-900/90 border-zinc-800 shadow-lg shadow-black/20' : 'bg-white/90 border-zinc-200 shadow-sm'}`}>
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="OneResume Logo" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
          <h1 className={`text-[1rem] md:text-[1.2rem] font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>OneResume</h1>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center w-full relative pt-8 md:pt-12 pb-16 px-6 overflow-y-auto custom-scrollbar">
        <div 
          className={`w-full ${step === 2 ? 'max-w-[1280px]' : 'max-w-[520px]'} flex flex-col items-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]`}
          style={{ transform: windowSize.height < 900 && windowSize.width >= 1024 ? 'scale(0.95)' : 'none' }}
        >
          <div className="text-center h-[120px] flex flex-col justify-center mb-10">
            <h2 className={`text-3xl md:text-4xl font-black tracking-tighter mb-3 leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>
              {step === 1 ? <>환영해요!<br />첫걸음을 내디뎌볼까요?</> : "어떤 직무를 준비하시나요?"}
            </h2>
            <p className={`text-sm font-bold break-keep leading-relaxed px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {step === 1 ? "OneResume에서 당신의 커리어 여정을 시작하기 위한 첫 번째 단계입니다." : "선택하신 직무에 맞춰 최적화된 대시보드를 구성해 드립니다."}
            </p>
          </div>

          <div className={`w-full relative rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border p-8 md:p-10 transition-all duration-500 ${
            isDarkMode ? 'bg-zinc-800 border-zinc-700 shadow-black/60' : 'bg-white border-zinc-100'
          }`}>
            {/* 세그먼트 스테퍼 - 애니메이션 밖으로 완전히 분리하여 물리적 위치 고정 */}
            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1.5 w-[140px] px-3 py-1.5 rounded-full border shadow-xl z-30 ${
              isDarkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-zinc-200'
            }`}>
              <div className={`flex-1 h-1.5 rounded-full overflow-hidden relative ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                <div className="absolute inset-0 bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>
              </div>
              <div className={`flex-1 h-1.5 rounded-full overflow-hidden relative ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                <div className={`absolute inset-0 bg-blue-600 transition-transform duration-700 ease-out ${step >= 2 ? 'translate-x-0' : '-translate-x-full'}`}></div>
              </div>
            </div>

            <motion.div
              animate={isFlying ? { scale: [1, 1.01, 1], opacity: [1, 0.95, 1] } : {}}
              transition={{ duration: 0.5 }}
              className="w-full h-full relative z-20"
            >
              {step === 1 ? (
                <div className="animate-in fade-in slide-in-from-right-6 duration-700">
                  <div className="space-y-7">
                    <div className="flex flex-col items-center gap-5">
                      <div onClick={() => fileInputRef.current.click()} className={`relative w-[110px] h-[146px] rounded-xl border-2 flex justify-center items-center cursor-pointer overflow-hidden group shadow-xl transition-all hover:border-blue-500 hover:scale-105 ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-100 shadow-zinc-200/50'}`}>
                        {profile.previewUrl ? <img src={profile.previewUrl} alt="Preview" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center gap-2 text-zinc-300 dark:text-zinc-700"><svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 opacity-20" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" /></svg></div>}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]"><span className="text-white text-[10px] font-black underline underline-offset-4">사진 선택</span></div>
                      </div>
                      <button type="button" onClick={() => fileInputRef.current.click()} className="px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 transition-all hover:bg-blue-100 dark:hover:bg-blue-900/50"><span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">사진 등록/변경</span></button>
                      <input type="file" hidden ref={fileInputRef} onChange={handleImageChange} accept="image/*" />
                    </div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2.5">
                          <label className={`pl-2 text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>이름</label>
                          <input name="username" type="text" placeholder="이름을 입력해주세요" value={profile.username} onChange={handleChange} className={`w-full px-6 py-4 rounded-[22px] transition-all font-bold border text-base ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' : 'bg-zinc-50 border-transparent text-zinc-800 placeholder-zinc-300 focus:bg-white focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/10'}`} required />
                        </div>
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center justify-between px-2">
                            <label className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>나이</label>
                            <label className="flex items-center gap-2.5 cursor-pointer group">
                              <input type="checkbox" name="useInternationalAge" checked={profile.useInternationalAge} onChange={handleChange} className="sr-only peer" />
                              <div className={`w-4.5 h-4.5 rounded-md border-2 transition-all flex items-center justify-center ${isDarkMode ? 'bg-zinc-900 border-zinc-700 peer-checked:bg-blue-600 peer-checked:border-blue-600' : 'bg-white border-zinc-300 peer-checked:bg-blue-600 peer-checked:border-blue-600'}`}><svg className={`w-2.5 h-2.5 text-white transition-transform ${profile.useInternationalAge ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div>
                              <span className={`text-[10px] font-black transition-colors ${isDarkMode ? 'text-zinc-500 group-hover:text-blue-400' : 'text-zinc-400 group-hover:text-blue-600'}`}>만 나이</span>
                            </label>
                          </div>
                          <input name="age" type="number" placeholder="25" value={profile.age} onChange={handleChange} className={`w-full px-6 py-4 rounded-[22px] transition-all font-bold border text-base ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' : 'bg-zinc-50 border-transparent text-zinc-800 placeholder-zinc-300 focus:bg-white focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/10'}`} required />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <label className={`pl-2 text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>이메일</label>
                        <input name="email" type="email" placeholder="example@email.com" value={profile.email} onChange={handleChange} className={`w-full px-6 py-4 rounded-[22px] transition-all font-bold border text-base ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' : 'bg-zinc-50 border-transparent text-zinc-800 placeholder-zinc-300 focus:bg-white focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/10'}`} required />
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <label className={`pl-2 text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>휴대폰 번호</label>
                        <input name="phone" type="tel" value={profile.phone} placeholder="010-0000-0000" onChange={handleChange} maxLength="13" className={`w-full px-6 py-4 rounded-[22px] transition-all font-bold border text-base ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' : 'bg-zinc-50 border-transparent text-zinc-800 placeholder-zinc-300 focus:bg-white focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/10'}`} required />
                      </div>
                    </div>
                    <div className="pt-2"><button type="button" onClick={handleNextStep} className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[32px] font-black text-xl shadow-[0_25px_50px_-12px_rgba(37,99,235,0.5)] transition-all transform hover:-translate-y-1.5 active:scale-95">다음 단계로 →</button></div>
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in-95 duration-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5 mb-12">
                    {jobs.map((job) => (
                      <div key={job.id} onClick={() => setProfile({ ...profile, job: profile.job === job.id ? '' : job.id })} className={`relative flex flex-col p-6 rounded-[32px] border-2 cursor-pointer transition-all duration-300 group ${profile.job === job.id ? 'bg-blue-600 border-blue-500 text-white shadow-2xl shadow-blue-500/30 scale-[1.05] z-10' : (isDarkMode ? 'bg-zinc-900/50 border-zinc-700 text-white hover:border-zinc-500' : 'bg-zinc-50 border-transparent text-zinc-800 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-zinc-200/50')}`}>
                        <div ref={el => jobRefs.current[job.id] = el} className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${profile.job === job.id ? 'bg-white/20 text-white' : `${getJobColor(job.color, 'bg')} ${getJobColor(job.color, 'text')} ${getJobColor(job.color, 'darkBg')} ${getJobColor(job.color, 'darkText')}`}`}><div className={isFlying && profile.job === job.id ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>{job.icon}</div></div>
                        <h4 className="font-black text-lg mb-2 tracking-tight">{job.title}</h4>
                        <p className={`text-[10.5px] font-bold leading-relaxed mb-6 break-keep line-clamp-2 ${profile.job === job.id ? 'text-white/80' : 'text-zinc-500'}`}>{job.description}</p>
                        <div className={`mt-auto pt-4 border-t flex items-center justify-between transition-all ${profile.job === job.id ? 'border-white/20' : (isDarkMode ? 'border-zinc-800' : 'border-zinc-100')}`}><span className={`text-[11px] font-black uppercase tracking-widest ${profile.job === job.id ? 'text-white' : (isDarkMode ? 'text-zinc-500' : 'text-zinc-400')}`}>직무 선택</span><svg className={`w-3 h-3 transition-transform group-hover:translate-x-1 ${profile.job === job.id ? 'text-white' : (isDarkMode ? 'text-zinc-600' : 'text-zinc-300')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 max-w-[500px] mx-auto">
                    <button onClick={() => setStep(1)} className={`flex-1 h-[72px] rounded-[28px] font-black text-lg transition-all ${isDarkMode ? 'bg-zinc-900 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>이전으로</button>
                    <button ref={submitButtonRef} onClick={handleSubmit} disabled={isFlying} className="flex-[2] h-[72px] bg-blue-600 hover:bg-blue-700 text-white rounded-[28px] font-black text-xl shadow-[0_25px_50px_-12px_rgba(37,99,235,0.5)] transition-all transform hover:-translate-y-1.5 active:scale-95 disabled:opacity-100 disabled:cursor-not-allowed overflow-visible relative">
                      <div className="relative z-20 flex items-center justify-center w-full h-full">
                        {isFlying ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : <span>OneResume 시작하기</span>}
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <footer className={`mt-auto pt-16 pb-8 text-center px-6 transition-colors ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
          <div className="flex items-center justify-center gap-6 text-[11px] font-bold tracking-tight mb-4">
            <button onClick={() => openModal('terms')} className="hover:text-blue-500 transition-colors">이용약관</button>
            <button onClick={() => openModal('privacy')} className="hover:text-blue-500 transition-colors">개인정보처리방침</button>
            <button onClick={() => openModal('disclaimer')} className="hover:text-blue-500 transition-colors">법적고지</button>
            <button onClick={() => openModal('contact')} className="hover:text-blue-500 transition-colors font-bold">고객문의</button>
          </div>
          <p className="text-[10px] opacity-70 font-bold tracking-[0.1em] mb-1">© 2026 ONERESUME. Created by 박정웅. ALL RIGHTS RESERVED.</p>
          <p className="text-[9px] opacity-40 font-medium tracking-tight">Logo Design by 김다인</p>
        </footer>

        <LegalModal isOpen={legalModal.isOpen} onClose={() => setLegalModal({ ...legalModal, isOpen: false })} title={legalModal.title} content={legalModal.content} isDarkMode={isDarkMode} />
      </div>
    </PageLayout>
  );
};

export default SetupProfile;