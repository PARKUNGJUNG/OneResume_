import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from "../config";
import toast from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import LegalModal from '../components/LegalModal';
import ThemeToggle from '../components/ThemeToggle';
import logo from "../logo.svg";

const SetupProfile = ({ isDarkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1); // 1: 기본정보, 2: 직무선택
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
        <p className="text-zinc-500 mb-8">oneresume.dev@gmail.com</p>
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
    }
  };

  const jobs = [
    { id: 'frontend', title: '프론트엔드', description: '사용자 중심의 가치를 코드로 구현합니다.', icon: '🎨' },
    { id: 'backend', title: '백엔드', description: '안정적인 데이터와 서버 로직을 설계합니다.', icon: '⚙️' },
    { id: 'fullstack', title: '풀스택', description: '서비스의 전체 흐름을 아우르는 개발자입니다.', icon: '🚀' },
    { id: 'mobile', title: '모바일', description: '손안의 최적화된 앱 경험을 창조합니다.', icon: '📱' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('oneresume-token') || sessionStorage.getItem('oneresume-token');
    if (!profile.job) {
      toast.error("직무를 선택해주세요.");
      return;
    }
    const loading = toast.loading("프로필 정보를 저장 중입니다...");
    
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
      toast.success("프로필 작성이 완료되었습니다!", { id: loading });
      navigate('/edit'); 
    } catch (err) {
      console.error('저장 실패:', err);
      toast.error(err.response?.data?.message || "프로필 저장 실패", { id: loading });
    }
  };

  return (
    <PageLayout isDarkMode={isDarkMode} toggleDarkMode={null} noPadding={true}>
      {/* 고품격 상단바 */}
      <header className={`h-14 px-4 md:px-6 border-b flex items-center justify-between z-40 relative ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-zinc-200'}`}>
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
          className="w-full max-w-[520px] flex flex-col items-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ 
            transform: windowSize.height < 900 && windowSize.width >= 1024 ? 'scale(0.95)' : 'none'
          }}
        >
          {/* 간결하고 따뜻한 환영 타이틀 */}
          <div className="text-center mb-10">
            <h2 className={`text-3xl md:text-4xl font-black tracking-tighter mb-3 leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>
              {step === 1 ? <>환영해요!<br />첫걸음을 내디뎌볼까요?</> : "커리어 목표 선택하기"}
            </h2>
            <p className={`text-sm font-bold break-keep leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {step === 1 
                ? "OneResume에서 당신의 커리어 여정을 시작하기 위한 첫 번째 단계입니다." 
                : "어떤 개발자로 성장하고 싶으신가요?"}
            </p>
          </div>

          {/* 메인 카드 */}
          <div className={`w-full relative rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border p-8 md:p-10 transition-all duration-500 ${
            isDarkMode 
              ? 'bg-zinc-800 border-zinc-700 shadow-black/60' 
              : 'bg-white border-zinc-100'
          }`}>
            {/* 세그먼트 스테퍼 - 카드 상단 중앙 안착 (라이트 모드 대응 완료) */}
            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1.5 w-[140px] px-3 py-1.5 rounded-full border shadow-xl z-20 ${
              isDarkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-zinc-200'
            }`}>
              <div className={`flex-1 h-1.5 rounded-full overflow-hidden relative ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                <div className="absolute inset-0 bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>
              </div>
              <div className={`flex-1 h-1.5 rounded-full overflow-hidden relative ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                <div className={`absolute inset-0 bg-blue-600 transition-transform duration-700 ease-out ${step >= 2 ? 'translate-x-0' : '-translate-x-full'}`}></div>
              </div>
            </div>

            {step === 1 ? (
              <div className="animate-in fade-in slide-in-from-right-6 duration-700">
                <div className="space-y-7">
                  <div className="flex flex-col items-center gap-5">
                    <div 
                      onClick={() => fileInputRef.current.click()}
                      className={`relative w-[110px] h-[146px] rounded-xl border-2 flex justify-center items-center cursor-pointer overflow-hidden group shadow-xl transition-all hover:border-blue-500 hover:scale-105 ${
                        isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-100 shadow-zinc-200/50'
                      }`}
                    >
                      {profile.previewUrl ? (
                        <img src={profile.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-300 dark:text-zinc-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 opacity-20" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <span className="text-white text-[10px] font-black underline underline-offset-4">사진 선택</span>
                      </div>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 transition-all hover:bg-blue-100 dark:hover:bg-blue-900/50"
                    >
                      <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">사진 등록/변경</span>
                    </button>
                    <input type="file" hidden ref={fileInputRef} onChange={handleImageChange} accept="image/*" />
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2.5">
                        <label className={`pl-2 text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>이름</label>
                        <input
                          name="username"
                          type="text"
                          placeholder="이름을 입력해주세요"
                          value={profile.username}
                          onChange={handleChange}
                          className={`w-full px-6 py-4 rounded-[22px] transition-all font-bold border text-base ${
                            isDarkMode 
                              ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' 
                              : 'bg-zinc-50 border-transparent text-zinc-800 placeholder-zinc-300 focus:bg-white focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/10'
                          }`}
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center justify-between px-2">
                          <label className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>나이</label>
                          <label className="flex items-center gap-2.5 cursor-pointer group">
                            <input type="checkbox" name="useInternationalAge" checked={profile.useInternationalAge} onChange={handleChange} className="sr-only peer" />
                            <div className={`w-4.5 h-4.5 rounded-md border-2 transition-all flex items-center justify-center ${
                              isDarkMode ? 'bg-zinc-900 border-zinc-700 peer-checked:bg-blue-600 peer-checked:border-blue-600' : 'bg-white border-zinc-300 peer-checked:bg-blue-600 peer-checked:border-blue-600'
                            }`}>
                              <svg className={`w-2.5 h-2.5 text-white transition-transform ${profile.useInternationalAge ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <span className={`text-[10px] font-black transition-colors ${isDarkMode ? 'text-zinc-500 group-hover:text-blue-400' : 'text-zinc-400 group-hover:text-blue-600'}`}>만 나이</span>
                          </label>
                        </div>
                        <input
                          name="age"
                          type="number"
                          placeholder="25"
                          value={profile.age}
                          onChange={handleChange}
                          className={`w-full px-6 py-4 rounded-[22px] transition-all font-bold border text-base ${
                            isDarkMode 
                              ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' 
                              : 'bg-zinc-50 border-transparent text-zinc-800 placeholder-zinc-300 focus:bg-white focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/10'
                          }`}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <label className={`pl-2 text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>이메일</label>
                      <input
                        name="email"
                        type="email"
                        placeholder="example@email.com"
                        value={profile.email}
                        onChange={handleChange}
                        className={`w-full px-6 py-4 rounded-[22px] transition-all font-bold border text-base ${
                          isDarkMode 
                            ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' 
                            : 'bg-zinc-50 border-transparent text-zinc-800 placeholder-zinc-300 focus:bg-white focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/10'
                        }`}
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <label className={`pl-2 text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>휴대폰 번호</label>
                      <input
                        name="phone"
                        type="tel"
                        value={profile.phone}
                        placeholder="010-0000-0000"
                        onChange={handleChange}
                        maxLength="13"
                        className={`w-full px-6 py-4 rounded-[22px] transition-all font-bold border text-base ${
                          isDarkMode 
                            ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' 
                            : 'bg-zinc-50 border-transparent text-zinc-800 placeholder-zinc-300 focus:bg-white focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/10'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="button"
                      onClick={handleNextStep}
                      className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[32px] font-black text-xl shadow-[0_25px_50px_-12px_rgba(37,99,235,0.5)] transition-all transform hover:-translate-y-1.5 active:scale-95"
                    >
                      다음 단계로 →
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-left-6 duration-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                  {jobs.map((job) => (
                    <div 
                      key={job.id}
                      onClick={() => setProfile({ ...profile, job: job.id })}
                      className={`p-6 rounded-[32px] border-2 cursor-pointer transition-all duration-300 group ${
                        profile.job === job.id 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/20 scale-[1.02]' 
                          : (isDarkMode ? 'bg-zinc-900/50 border-zinc-700 text-white hover:border-zinc-500' : 'bg-zinc-50 border-transparent text-zinc-800 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-zinc-200/50')
                      }`}
                    >
                      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform origin-left">{job.icon}</div>
                      <h4 className="font-black text-lg mb-1">{job.title}</h4>
                      <p className={`text-[10px] font-bold leading-relaxed ${profile.job === job.id ? 'text-white/80' : 'text-zinc-500'}`}>{job.description}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className={`flex-1 py-6 rounded-[28px] font-black text-lg transition-all ${isDarkMode ? 'bg-zinc-900 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>이전으로</button>
                  <button onClick={handleSubmit} className="flex-[2] py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[28px] font-black text-xl shadow-[0_25px_50px_-12px_rgba(37,99,235,0.5)] transition-all transform hover:-translate-y-1.5 active:scale-95">OneResume 시작하기</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 이용약관 영역을 최하단 푸터로 안정적으로 배치 */}
        <footer className={`mt-auto pt-16 pb-8 text-center px-6 transition-colors ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
          <div className="flex items-center justify-center gap-6 text-[11px] font-bold tracking-tight mb-3">
            <button onClick={() => openModal('terms')} className="hover:text-blue-500 transition-colors">이용약관</button>
            <button onClick={() => openModal('privacy')} className="hover:text-blue-500 transition-colors">개인정보처리방침</button>
            <button onClick={() => openModal('disclaimer')} className="hover:text-blue-500 transition-colors">법적고지</button>
          </div>
          <p className="text-[10px] opacity-40 font-medium tracking-[0.2em]">
            © 2026 ONERESUME. ALL RIGHTS RESERVED.
          </p>
        </footer>

        <LegalModal 
          isOpen={legalModal.isOpen}
          onClose={() => setLegalModal({ ...legalModal, isOpen: false })}
          title={legalModal.title}
          content={legalModal.content}
          isDarkMode={isDarkMode}
        />
      </div>
    </PageLayout>
  );
};

export default SetupProfile;