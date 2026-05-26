import React, { useState } from "react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../config";

function ConnectModal({ isOpen, onClose, isDarkMode, isExtensionInstalled }) {
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  // --- 원클릭 동기화 실행 ---
  const handleSyncExtension = () => {
    const token = localStorage.getItem("oneresume-token") || sessionStorage.getItem("oneresume-token");
    if (!token) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    setIsSyncing(true);
    const loadingToast = toast.loading("확장 프로그램과 연동 중...");
    console.log("📤 [Website] Sending sync token to extension...");

    // 확장 프로그램에 토큰 전달
    window.postMessage({ 
      type: 'ONERESUME_SYNC_TOKEN', 
      token: token 
    }, "*");

    // 성공 응답 대기 (5초 타임아웃)
    const syncTimeout = setTimeout(() => {
      if (isSyncing) {
        setIsSyncing(false);
        toast.error("연동 응답 시간이 초과되었습니다. 페이지 새로고침 후 다시 시도해 주세요.", { id: loadingToast });
      }
    }, 5000);

    const handleSyncSuccess = (event) => {
      if (event.data?.type === 'ONERESUME_SYNC_SUCCESS') {
        console.log("✅ [Website] Sync confirmed by extension!");
        clearTimeout(syncTimeout);
        setIsSyncing(false);
        toast.success("확장 프로그램 연동 성공!", { id: loadingToast });
        window.removeEventListener('message', handleSyncSuccess);
      }
    };

    window.addEventListener('message', handleSyncSuccess);
  };

  const handleCopyJson = async () => {
    const token = localStorage.getItem("oneresume-token") || sessionStorage.getItem("oneresume-token");
    if (!token) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    const loadingToast = toast.loading("데이터를 추출하고 있습니다...");
    try {
      const response = await fetch(`${API_BASE_URL}/api/resume/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("데이터 로드 실패");
      const data = await response.json();
      
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast.success("표준 JSON이 클립보드에 복사되었습니다!", { id: loadingToast });
    } catch (e) {
      toast.error("데이터를 가져오는 중 오류가 발생했습니다.", { id: loadingToast });
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className={`relative w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-500 ${
        isDarkMode ? 'bg-zinc-900 border border-white/5' : 'bg-white'
      }`}>
        {/* 상단 앰비언트 글로우 & 그라데이션 라인 */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-purple-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        
        <div className="p-6 md:p-10 relative z-10">
          <div className="flex justify-between items-start mb-6 md:mb-10">
            <div className="flex items-center gap-3 md:gap-5">
              <div className="relative group">
                {/* 외곽 앰비언트 글로우: 우리 브랜드 컬러(Purple/Blue) */}
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-[28px] blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                
                <div className={`relative w-12 h-12 md:w-16 md:h-16 rounded-[18px] md:rounded-[24px] flex items-center justify-center transition-all duration-500 shadow-2xl border ${
                  isDarkMode 
                    ? 'bg-zinc-800/40 border-white/10 backdrop-blur-md' 
                    : 'bg-white/80 border-zinc-200 backdrop-blur-md'
                }`}>
                  {/* 로고 하단에 아주 살짝 우리 테마의 보랏빛 빛 번짐 추가 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 rounded-[18px] md:rounded-[24px]"></div>
                  
                  <svg 
                    viewBox="0 0 48 48" 
                    className="w-8 h-8 md:w-11 md:h-11 relative z-10 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="chrome-grad-a" x1="3.2173" y1="15" x2="44.7812" y2="15" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stop-color="#d93025" />
                        <stop offset="1" stop-color="#ea4335" />
                      </linearGradient>
                      <linearGradient id="chrome-grad-b" x1="20.7219" y1="47.6791" x2="41.5039" y2="11.6837" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stop-color="#fcc934" />
                        <stop offset="1" stop-color="#fbbc04" />
                      </linearGradient>
                      <linearGradient id="chrome-grad-c" x1="26.5981" y1="46.5015" x2="5.8161" y2="10.506" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stop-color="#1e8e3e" />
                        <stop offset="1" stop-color="#34a853" />
                      </linearGradient>
                    </defs>
                    {/* 중앙 흰색 원에 살짝의 투명도와 글로우를 주어 배경과 조화롭게 함 */}
                    <circle cx="24" cy="23.9947" r="12" fill={isDarkMode ? "#fff" : "#fff"} fillOpacity={isDarkMode ? "0.9" : "1"} />
                    <path d="M24,12H44.7812a23.9939,23.9939,0,0,0-41.5639.0029L13.6079,30l.0093-.0024A11.9852,11.9852,0,0,1,24,12Z" fill="url(#chrome-grad-a)" />
                    <circle cx="24" cy="24" r="9.5" fill="#1a73e8" />
                    <path d="M34.3913,30.0029,24.0007,48A23.994,23.994,0,0,0,44.78,12.0031H23.9989l-.0025.0093A11.985,11.985,0,0,1,34.3913,30.0029Z" fill="url(#chrome-grad-b)" />
                    <path d="M13.6086,30.0031,3.218,12.006A23.994,23.994,0,0,0,24.0025,48L34.3931,30.0029l-.0067-.0068a11.9852,11.9852,0,0,1-20.7778.007Z" fill="url(#chrome-grad-c)" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className={`text-lg md:text-2xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>OneResume Connect</h3>
                <div className="flex items-center gap-2 md:gap-2.5 mt-1.5 md:mt-2">
                  <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isExtensionInstalled ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-zinc-500'}`} />
                  <span className={`text-[9px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.15em] ${isExtensionInstalled ? 'text-emerald-500' : 'text-zinc-400'}`}>
                    {isExtensionInstalled ? 'Extension Active' : 'Extension Not Detected'}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl md:rounded-2xl hover:bg-zinc-500/10 transition-all active:scale-90 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="space-y-4 md:space-y-6">
            {/* PC 환경 렌더링 (확장 프로그램 연동/동기화) */}
            <div className="hidden md:block space-y-6">
              <div className={`p-5 md:p-8 rounded-[24px] md:rounded-[32px] border-2 border-dashed transition-all ${
                isDarkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-start gap-2.5 md:gap-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-600/10 text-blue-600 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black flex-shrink-0 mt-0.5">1</div>
                    <p className={`text-xs md:text-sm font-bold leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                      채용 사이트에서 <span className="text-blue-600 underline underline-offset-4">원클릭으로 이력서를 입력</span>하려면 확장 프로그램이 필요합니다.
                    </p>
                  </div>
                  {!isExtensionInstalled && (
                    <button 
                      onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
                      className="w-full py-3 md:py-4 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white rounded-xl md:rounded-2xl text-[13px] md:text-sm font-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/10"
                    >
                      확장 프로그램 설치하기
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 md:gap-4">
                <button 
                  onClick={handleSyncExtension}
                  disabled={isSyncing}
                  className={`w-full py-6 md:py-8 rounded-[24px] md:rounded-[32px] transition-all transform hover:-translate-y-1 active:scale-95 group flex flex-col items-center justify-center gap-3 md:gap-4 ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-2xl shadow-purple-900/40' 
                      : 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-2xl shadow-purple-500/30'
                  }`}
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 backdrop-blur-md rounded-[18px] md:rounded-[24px] flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 md:h-8 md:w-8 ${isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  </div>
                  <div className="text-center">
                    <span className="text-lg md:text-xl font-black block tracking-tight">원클릭 동기화</span>
                    <span className="text-[10px] md:text-xs opacity-70 mt-1 font-bold block uppercase tracking-widest">Extension Real-time Sync</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 모바일 환경 렌더링 (예외 안내) */}
            <div className="md:hidden space-y-4">
              <div className={`p-6 rounded-[24px] border-2 border-dashed flex flex-col items-center text-center gap-3 transition-all ${
                isDarkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className="w-12 h-12 bg-blue-600/10 text-blue-600 rounded-full flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className={`text-[13px] font-black leading-relaxed ${isDarkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>
                  크롬 확장 프로그램 연동은<br/><span className="text-blue-600 underline underline-offset-4">PC 데스크톱 환경</span>에서만 지원됩니다.
                </p>
                <p className={`text-[11px] font-medium leading-relaxed mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  PC로 접속하여 사람인, 잡코리아 등 채용 플랫폼에<br/>완성된 이력서를 원클릭으로 등록해 보세요!
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 md:mt-10 flex flex-col items-center gap-3 md:gap-4 text-center">
            <p className={`text-[10px] md:text-[11px] font-bold leading-relaxed max-w-[280px] ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>확장 프로그램은 사용자의 데이터를 안전하게 암호화하여 처리합니다.</p>
            
            <button 
              onClick={handleCopyJson}
              className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-colors hover:underline underline-offset-4 ${
                isDarkMode ? 'text-zinc-700 hover:text-zinc-500' : 'text-zinc-300 hover:text-zinc-500'
              }`}
            >
              Advanced: Copy Standard JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConnectModal;
