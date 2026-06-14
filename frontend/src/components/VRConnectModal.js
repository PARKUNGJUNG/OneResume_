import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../config";

function VRConnectModal({ isOpen, onClose, isDarkMode }) {
  const [pinCode, setPinCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (pinCode) {
        setPinCode("");
        toast.error("연동 코드가 만료되었습니다. 다시 발급해주세요.");
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, pinCode]);

  if (!isOpen) return null;

  const handleGeneratePin = async () => {
    const token = localStorage.getItem("oneresume-token") || sessionStorage.getItem("oneresume-token");
    if (!token) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    setIsLoading(false);
    const loadingToast = toast.loading("연동 코드 생성 중...");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/resume/pin`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPinCode(data.pinCode);
        setTimeLeft(data.expiresIn || 180);
        toast.success("VR 연동 코드가 성공적으로 발급되었습니다!", { id: loadingToast });
      } else {
        toast.error(data.message || "연동 코드 발급에 실패했습니다.", { id: loadingToast });
      }
    } catch (err) {
      console.error(err);
      toast.error("서버와 통신 중 오류가 발생했습니다.", { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 print:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className={`relative w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-500 ${
        isDarkMode ? 'bg-zinc-900 border border-white/5' : 'bg-white'
      }`}>
        {/* 상단 앰비언트 글로우 & 그라데이션 라인 */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        <div className="p-6 md:p-10 relative z-10">
          <div className="flex justify-between items-start mb-6 md:mb-8">
            <div className="flex items-center gap-3 md:gap-5">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 rounded-[28px] blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                
                <div className={`relative w-12 h-12 md:w-16 md:h-16 rounded-[18px] md:rounded-[24px] flex items-center justify-center transition-all duration-500 shadow-2xl border ${
                  isDarkMode 
                    ? 'bg-zinc-800/40 border-white/10 backdrop-blur-md' 
                    : 'bg-white/80 border-zinc-200 backdrop-blur-md'
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-indigo-500/10 rounded-[18px] md:rounded-[24px]"></div>
                  
                  {/* VR 헤드셋 모양의 SVG 아이콘 */}
                  <svg 
                    viewBox="0 0 24 24" 
                    className={`w-7 h-7 md:w-9 md:h-9 relative z-10 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="7" width="20" height="10" rx="2" ry="2" />
                    <path d="M12 17a3 3 0 0 1-3-3H6" />
                    <path d="M12 17a3 3 0 0 0 3-3h3" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className={`text-lg md:text-2xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>OneResume VR Link</h3>
                <div className="flex items-center gap-2 mt-1 md:mt-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" />
                  <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    VR INTERVIEW CONNECT
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl md:rounded-2xl hover:bg-zinc-500/10 transition-all active:scale-90 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="space-y-6">
            <div className={`p-5 md:p-6 rounded-[24px] border ${
              isDarkMode ? 'bg-zinc-800/40 border-white/5' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <p className={`text-xs md:text-sm font-bold leading-relaxed mb-4 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                VR 기기 내부에서 이력서를 편리하게 불러오려면 일회용 연동 코드가 필요합니다. 
                아래 버튼을 눌러 연동용 6자리 핀코드를 발급받으세요.
              </p>

              <div className="flex flex-col items-center justify-center py-4 relative">
                {pinCode ? (
                  <div className="text-center animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-2 justify-center mb-2">
                      <span className={`text-[11px] font-black uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>연동 핀코드</span>
                    </div>
                    {/* 핀코드 출력 */}
                    <div className={`text-4xl md:text-5xl font-[1000] tracking-widest px-8 py-4 rounded-3xl font-mono shadow-inner border mb-3 select-all ${
                      isDarkMode 
                        ? 'bg-zinc-950/60 border-white/5 text-blue-400 shadow-black' 
                        : 'bg-white border-zinc-200 text-blue-600 shadow-zinc-200'
                    }`}>
                      {pinCode.slice(0, 3)} {pinCode.slice(3)}
                    </div>
                    {/* 타이머 */}
                    <div className="flex items-center gap-2 justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${timeLeft < 30 ? 'text-red-500 animate-bounce' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={`text-xs sm:text-sm font-black font-mono ${timeLeft < 30 ? 'text-red-500 animate-pulse' : (isDarkMode ? 'text-zinc-400' : 'text-zinc-500')}`}>
                        남은 시간: {formatTime(timeLeft)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleGeneratePin}
                    disabled={isLoading}
                    className="group relative w-full h-14 md:h-16 rounded-[20px] font-black text-xs md:text-sm text-white overflow-hidden shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_auto] animate-[shimmer_3s_infinite_linear] group-hover:bg-[right_center]" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14H11V21L20 10H13Z" />
                      </svg>
                      {isLoading ? "발급 코드 생성 중..." : "VR 연동 핀코드 발급받기"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className={`text-[10px] md:text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>진행 방법</h4>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-5 h-5 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black flex-shrink-0 mt-0.5">1</div>
                  <p className={`text-xs md:text-sm font-bold leading-normal ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    VR 대기실로 이동하여 화면에 나타나는 3D 키패드 패널을 확인합니다.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black flex-shrink-0 mt-0.5">2</div>
                  <p className={`text-xs md:text-sm font-bold leading-normal ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    웹에 발급된 <span className="text-blue-500 font-black">6자리 숫자</span>를 키패드에 순서대로 입력합니다.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black flex-shrink-0 mt-0.5">3</div>
                  <p className={`text-xs md:text-sm font-bold leading-normal ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    인증이 완료되면 문이 열리고, 면접실 의자에 착석하여 본인의 이력서 기반의 맞춤 면접을 시작하세요!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VRConnectModal;
