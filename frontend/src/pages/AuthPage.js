import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "../components/Login";
import Signup from "../components/Signup";
import ForgotPassword from "../components/ForgotPassword";
import PageLayout from "../components/PageLayout";
import logo from "../logo.svg";

function AuthPage({ isDarkMode, toggleDarkMode }) {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'forgot'
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [windowSize, setWindowSize] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });

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

  // 해상도별 스케일 배율 계산 (더 안정적인 scale 방식 사용)
  const getAuthScale = () => {
    const minHeight = 880; 
    if (windowSize.height >= minHeight) return 0.9; // 기본 0.9배로 여유있게
    return Math.max(0.55, (windowSize.height / minHeight) * 0.9);
  };

  const authScale = getAuthScale();

  return (
    <PageLayout isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}>
      <div className="flex-1 flex flex-col items-center justify-center overflow-hidden relative">
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
            <p className={`font-bold text-base md:text-lg opacity-50 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>나를 증명하는 가장 완벽한 한 페이지</p>
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
                <div className="w-full h-full absolute mix-blend-multiply bg-indigo-700/20"></div>

                {/* 로그인용 오버레이 콘텐츠 */}
                <div className={`absolute top-0 left-0 w-1/2 h-full p-12 xl:p-16 flex flex-col justify-between items-start text-white transition-all duration-700 ${isRightSide ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                  <div className="flex items-end gap-4">
                    <img src={logo} alt="OneResume Logo" className="w-12 h-12 object-contain" />
                    <div className="text-lg font-black tracking-tight pb-1">OneResume</div>
                  </div>
                  <div className="max-w-sm space-y-4 xl:space-y-6">
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
                  <div className="bg-white/10 backdrop-blur-md p-6 xl:p-8 rounded-[32px] border border-white/20 w-full space-y-4 xl:space-y-6">
                    <div className="flex items-center gap-4 group"><div className="w-8 h-8 xl:w-10 xl:h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg xl:text-xl shadow-inner group-hover:scale-110 transition-transform">🔑</div><div className="flex flex-col"><span className="text-sm font-black uppercase tracking-widest text-white">Secure Access</span><span className="text-[11px] font-bold text-white/60">강력한 보안 기반의 데이터 관리</span></div></div>
                    <div className="flex items-center gap-4 group"><div className="w-8 h-8 xl:w-10 xl:h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg xl:text-xl shadow-inner group-hover:scale-110 transition-transform">📊</div><div className="flex flex-col"><span className="text-sm font-black uppercase tracking-widest text-white">Insights</span><span className="text-[11px] font-bold text-white/60">나의 이력서 조회수 실시간 분석</span></div></div>
                  </div>
                </div>

                {/* 회원가입/비밀번호찾기용 오버레이 콘텐츠 */}
                <div className={`absolute top-0 right-0 w-1/2 h-full p-12 xl:p-16 flex flex-col justify-between items-start text-white transition-all duration-700 ${isRightSide ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                  <div className="flex items-end gap-4">
                    <img src={logo} alt="OneResume Logo" className="w-12 h-12 object-contain" />
                    <div className="text-lg font-black tracking-tight pb-1">OneResume</div>
                  </div>
                  <div className="max-w-sm space-y-4 xl:space-y-6">
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
                  <div className="bg-white/10 backdrop-blur-md p-6 xl:p-8 rounded-[32px] border border-white/20 w-full space-y-4 xl:space-y-6">
                    <div className="flex items-center gap-4 group"><div className="w-8 h-8 xl:w-10 xl:h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg xl:text-xl shadow-inner group-hover:scale-110 transition-transform">{isForgot ? "✉️" : "🌐"}</div><div className="flex flex-col"><span className="text-sm font-black uppercase tracking-widest text-white">{isForgot ? "Fast Recovery" : "Personal Domain"}</span><span className="text-[11px] font-bold text-white/60">{isForgot ? "가장 빠른 계정 복구 시스템" : "나만의 고유한 웹 주소 제공"}</span></div></div>
                    <div className="flex items-center gap-4 group"><div className="w-8 h-8 xl:w-10 xl:h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg xl:text-xl shadow-inner group-hover:scale-110 transition-transform">{isForgot ? "🛡️" : "🤖"}</div><div className="flex flex-col"><span className="text-sm font-black uppercase tracking-widest text-white">{isForgot ? "Safe Access" : "AI Resume Audit"}</span><span className="text-[11px] font-bold text-white/60">{isForgot ? "철저한 본인 확인 절차" : "Gemini 기반 실시간 이력서 분석"}</span></div></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default AuthPage;