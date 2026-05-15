import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "../components/Login";
import Signup from "../components/Signup";
import ForgotPassword from "../components/ForgotPassword";
import PageLayout from "../components/PageLayout";
import LegalModal from "../components/LegalModal";
import logo from "../logo.svg";
import saraminLogo from "../saramin_logo.svg";
import jobkoreaLogo from "../jobkorea_logo.svg";

function AuthPage({ isDarkMode, toggleDarkMode }) {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'forgot'
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [windowSize, setWindowSize] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });

  // 법적 고지 모달 상태
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
        <section>
          <h3 className="text-lg font-bold mb-3 text-blue-600">제2조 (서비스의 범위)</h3>
          <p>서비스는 사용자가 입력한 이력서 데이터를 보관하며, 브라우저 확장 프로그램을 통해 외부 채용 사이트(사람인, 잡코리아 등)에 해당 데이터를 자동으로 입력하는 기능을 제공합니다.</p>
        </section>
        <section>
          <h3 className="text-lg font-bold mb-3 text-blue-600">제3조 (계정 관리)</h3>
          <p>사용자는 본인의 계정과 비밀번호를 보안상 안전하게 관리해야 하며, 본인 부주의로 인해 발생하는 정보 유출에 대한 책임은 사용자에게 있습니다.</p>
        </section>
      </div>
    ),
    privacy: (
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-bold mb-3 text-blue-600">1. 수집하는 개인정보 항목</h3>
          <p>회원가입 시 이메일, 이름, 비밀번호를 수집하며, 이력서 작성 시 학력, 경력, 자기소개서 등 사용자가 자발적으로 입력한 정보를 수집합니다.</p>
        </section>
        <section>
          <h3 className="text-lg font-bold mb-3 text-blue-600">2. 개인정보의 수집 및 이용 목적</h3>
          <p>- 서비스 회원 관리 및 본인 확인<br/>- 마스터 이력서 보관 및 외부 채용 사이트 자동 연동<br/>- AI를 활용한 채용 공고(JD) 매칭 분석 서비스 제공</p>
        </section>
        <section>
          <h3 className="text-lg font-bold mb-3 text-blue-600">3. 개인정보의 보유 및 이용 기간</h3>
          <p>사용자의 개인정보는 회원 탈퇴 시까지 보유하며, 탈퇴 즉시 모든 데이터는 복구 불가능한 방법으로 파기됩니다.</p>
        </section>
      </div>
    ),
    disclaimer: (
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-bold mb-3 text-red-500">⚠️ 중요 고지</h3>
          <p>OneResume은 사용자의 편의를 위한 자동 연동 도구를 제공할 뿐, 각 채용 사이트(사람인, 잡코리아 등)와 공식적인 제휴 관계가 없음을 밝힙니다.</p>
        </section>
        <section>
          <h3 className="text-lg font-bold mb-3 text-blue-600">1. 자동 입력 결과에 대한 책임</h3>
          <p>확장 프로그램을 통한 자동 입력 결과물은 각 사이트의 UI 변경 등에 따라 일부 오차가 발생할 수 있습니다. 사용자는 반드시 최종 제출 전 입력된 내용을 확인해야 하며, 확인 소홀로 인해 발생하는 불이익에 대해 본 서비스는 책임지지 않습니다.</p>
        </section>
        <section>
          <h3 className="text-lg font-bold mb-3 text-blue-600">2. 서비스의 한계</h3>
          <p>본 서비스는 채용 사이트의 정책 변경에 따라 일부 기능이 제한될 수 있으며, 이로 인한 직접적/간접적 손해에 대해 보상하지 않습니다.</p>
        </section>
      </div>
    ),
    contact: (
      <div className="space-y-6 text-center py-10">
        <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold mb-2">고객 문의</h3>
        <p className="text-zinc-500 mb-8">서비스 이용 중 불편한 점이나 제안사항이 있으신가요?</p>
        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <p className="text-sm font-medium mb-1 opacity-50">공식 이메일</p>
          <p className="text-lg font-bold text-blue-600">oneresume.dev@gmail.com</p>
        </div>
        <p className="mt-8 text-xs text-zinc-400">문의하신 내용은 확인 후 1~3 영업일 이내에 답변해 드립니다.</p>
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

  // 리사이즈 감지 로직 (부드러운 대응을 위해 애니메이션 프레임 활용)
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

  useEffect(() => {
    const token = localStorage.getItem("oneresume-token") || sessionStorage.getItem("oneresume-token");
    if (token) navigate('/edit');
    else setIsChecking(false);
  }, [navigate]);

  if (isChecking) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-zinc-900' : 'bg-gray-50'}`}>
        <div className="animate-pulse text-slate-500 font-bold text-xl">OneResume Loading...</div>
      </div>
    );
  }

  const handleAuthSuccess = (data) => {
    if (data.token) {
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("oneresume-token", data.token);
    }
    if (data.user && data.user.isProfileComplete) navigate('/edit');
    else navigate('/setup-profile');
  };

  const isSignup = authMode === 'signup';
  const isForgot = authMode === 'forgot';
  const isRightSide = isSignup || isForgot;

  // 해상도별 스케일 배율 계산 (가시성 확보를 위해 배율 상향 조정)
  const getAuthScale = () => {
    const baseHeight = 900; // 기준 높이 하향 조정
    const currentHeight = windowSize.height;
    
    // 화면 높이가 충분할 때 기본 크기를 더 크게(0.9)
    if (currentHeight >= baseHeight) return 0.9;
    
    // 화면이 작아질 때도 좀 더 공격적으로 크기 유지 (최소 0.55배)
    return Math.max(0.55, (currentHeight / baseHeight) * 0.9);
  };

  const authScale = getAuthScale();

  return (
    <PageLayout isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}>
      <div className="flex-1 flex flex-col items-center justify-center h-screen overflow-hidden relative">
        <div 
          className="flex flex-col items-center justify-center transition-all duration-500 ease-out transform-gpu"
          style={{ 
            transform: `scale(${authScale})`,
            transformOrigin: 'center center'
          }}
        >
          {/* 상단 헤더 - 크기 대폭 축소 및 간격 조절 */}
          <header className="text-center mb-10 relative print:hidden flex-shrink-0">
            <h1 className={`text-4xl md:text-5xl font-black mb-3 tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>OneResume</h1>
            <p className={`font-bold text-base md:text-lg tracking-tight ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>나를 증명하는 가장 완벽한 한 페이지</p>
          </header>

          {/* 카드 섹션 - 크기 최적화 */}
          <div className={`relative w-[1020px] min-h-[680px] overflow-hidden rounded-[56px] border shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            
            {/* 왼쪽 섹션 (회원가입 & 비밀번호 찾기) */}
            <div className={`absolute top-0 left-0 w-1/2 h-full transition-all duration-700 ease-in-out flex flex-col justify-center px-10 lg:px-16 ${isRightSide ? 'opacity-100 z-50' : 'opacity-0 z-10 pointer-events-none'}`}>
              <div className="py-8">
                {authMode === 'signup' ? (
                  <Signup onSuccess={handleAuthSuccess} onSwitch={() => setAuthMode('login')} isDarkMode={isDarkMode} />
                ) : (
                  <ForgotPassword onSwitch={() => setAuthMode('login')} isDarkMode={isDarkMode} />
                )}
              </div>
            </div>

            {/* 오른쪽 섹션 (로그인) */}
            <div className={`absolute top-0 left-1/2 w-1/2 h-full transition-all duration-700 ease-in-out flex flex-col justify-center px-10 lg:px-16 ${isRightSide ? 'opacity-0 z-10 pointer-events-none' : 'opacity-100 z-50'}`}>
              <div className="py-8">
                <Login 
                  onSuccess={handleAuthSuccess} 
                  onSwitchSignup={() => setAuthMode('signup')}
                  onSwitchForgot={() => setAuthMode('forgot')}
                  isDarkMode={isDarkMode} 
                  rememberMe={rememberMe} 
                  setRememberMe={setRememberMe} 
                />
              </div>
            </div>

            {/* 오버레이 디자인 패널 */}
            <div className={`absolute top-0 left-0 w-1/2 h-full overflow-hidden transition-all duration-700 ease-in-out z-[100] ${isRightSide ? 'translate-x-full' : 'translate-x-0'}`}>
              <div className={`relative h-full w-[200%] transition-all duration-700 ease-in-out ${isRightSide ? '-translate-x-1/2' : 'translate-x-0'}`}>
                <img className="w-full h-full absolute object-cover opacity-90" src="https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop" alt="Background" />
                <div className="w-full h-full absolute mix-blend-multiply bg-blue-700/20"></div>

                {/* 로그인용 오버레이 콘텐츠 */}
                <div className={`absolute top-0 left-0 w-1/2 h-full p-12 xl:p-16 flex flex-col justify-between items-start text-white transition-all duration-700 z-20 ${isRightSide ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                  <div className="flex items-end gap-4">
                    <img src={logo} alt="OneResume Logo" className="w-12 h-12 object-contain" />
                    <div className="text-[1.35rem] font-black tracking-tighter pb-1">OneResume</div>
                  </div>
                  <div className="max-w-sm space-y-4 xl:space-y-6 mb-8">
                    <div className="w-16 h-1.5 bg-white/40 rounded-full"></div>
                    <h2 className="text-4xl xl:text-5xl font-extrabold leading-[1.2] tracking-tight break-keep" style={{ wordBreak: 'keep-all' }}>
                      나를 증명하는<br/>
                      가장 스마트한 방법.
                    </h2>
                    <p className="text-white/90 text-lg xl:text-xl font-medium leading-relaxed break-keep" style={{ wordBreak: 'keep-all' }}>
                      OneResume과 함께 당신의 커리어를<br/>
                      정교하게 관리하고, 더 넓은 기회를 향해<br/>
                      한 발짝 더 나아가세요.
                    </p>
                  </div>

                  <div className="w-full space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-[1px] flex-1 bg-white/20"></div>
                      <span className="text-[12px] font-bold tracking-tight text-white/90">자동 입력 엔진 지원</span>
                      <div className="h-[1px] flex-1 bg-white/20"></div>
                    </div>
                    <div className="marquee-container relative h-10 flex items-center">
                      <div className="animate-marquee flex items-center gap-20">
                        {[...Array(8)].map((_, idx) => (
                          <React.Fragment key={idx}>
                            <img src={saraminLogo} alt="Saramin" className="h-6 object-contain brightness-0 invert opacity-70 hover:opacity-100 transition-opacity" />
                            <img src={jobkoreaLogo} alt="Jobkorea" className="h-7 object-contain brightness-0 invert opacity-70 hover:opacity-100 transition-opacity" />
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-white/40 font-medium text-center opacity-80 mt-5 italic">
                      * 본 서비스는 해당 기업들과 제휴 관계가 없는 독립적 서비스입니다.
                    </p>
                  </div>
                </div>

                {/* 회원가입/비밀번호찾기용 오버레이 콘텐츠 */}
                <div className={`absolute top-0 right-0 w-1/2 h-full p-12 xl:p-16 flex flex-col justify-between items-start text-white transition-all duration-700 z-20 ${isRightSide ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                  <div className="flex items-end gap-4">
                    <img src={logo} alt="OneResume Logo" className="w-12 h-12 object-contain" />
                    <div className="text-[1.35rem] font-black tracking-tighter pb-1">OneResume</div>
                  </div>
                  <div className="max-w-sm space-y-4 xl:space-y-6 mb-8">
                    <div className="w-16 h-1.5 bg-white/40 rounded-full"></div>
                    <h2 className="text-4xl xl:text-5xl font-extrabold leading-[1.2] tracking-tight break-keep" style={{ wordBreak: 'keep-all' }}>
                      {isForgot ? (
                        <>걱정하지 마세요.<br/>금방 도와드릴게요.</>
                      ) : (
                        <>당신의 커리어를<br/>가장 완벽하게 보여주는 곳.</>
                      )}
                    </h2>
                    <p className="text-white/90 text-lg xl:text-xl font-medium leading-relaxed break-keep" style={{ wordBreak: 'keep-all' }}>
                      {isForgot ? (
                        <>메일을 통해 비밀번호 재설정 링크를<br/>보내드립니다. OneResume과 함께<br/>당신의 커리어를 다시 시작하세요.</>
                      ) : (
                        <>나만의 고유한 서브도메인으로<br/>경력을 통합하고, 당신의 전문성을<br/>명확하게 전달하세요.</>
                      )}
                    </p>
                  </div>

                  <div className="w-full space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-[1px] flex-1 bg-white/20"></div>
                      <span className="text-[12px] font-bold tracking-tight text-white/90">자동 입력 엔진 지원</span>
                      <div className="h-[1px] flex-1 bg-white/20"></div>
                    </div>
                    <div className="marquee-container relative h-10 flex items-center">
                      <div className="animate-marquee flex items-center gap-20">
                        {[...Array(8)].map((_, idx) => (
                          <React.Fragment key={idx}>
                            <img src={saraminLogo} alt="Saramin" className="h-6 object-contain brightness-0 invert opacity-70 hover:opacity-100 transition-opacity" />
                            <img src={jobkoreaLogo} alt="Jobkorea" className="h-7 object-contain brightness-0 invert opacity-70 hover:opacity-100 transition-opacity" />
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-white/40 font-medium text-center opacity-80 mt-5 italic">
                      * 본 서비스는 해당 기업들과 제휴 관계가 없는 독립적 서비스입니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 하단 푸터 - 법적 고지 및 안내 */}
        <footer className={`absolute bottom-6 w-full text-center z-[110] transition-colors duration-300 print:hidden ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
          <div className="flex items-center justify-center gap-5 text-[11px] font-semibold tracking-tight">
            <button 
              onClick={() => openModal('terms')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              이용약관
            </button>
            <span className="w-1 h-1 rounded-full bg-current opacity-20"></span>
            <button 
              onClick={() => openModal('privacy')}
              className="hover:text-blue-600 transition-colors cursor-pointer font-bold"
            >
              개인정보처리방침
            </button>
            <span className="w-1 h-1 rounded-full bg-current opacity-20"></span>
            <button 
              onClick={() => openModal('disclaimer')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              책임의 한계와 법적고지
            </button>
            <span className="w-1 h-1 rounded-full bg-current opacity-20"></span>
            <button 
              onClick={() => openModal('contact')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              고객문의
            </button>
          </div>
          <p className="mt-2 text-[10px] opacity-50 font-medium tracking-wider">
            © 2026 OneResume. All rights reserved.
          </p>
        </footer>

        {/* 법적 고지 모달 */}
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
}

export default AuthPage;