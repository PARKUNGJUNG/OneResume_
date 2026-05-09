import React from "react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../config";

function ConnectModal({ isOpen, onClose, isDarkMode }) {
  if (!isOpen) return null;

  const handleCopyJson = async () => {
    const token = localStorage.getItem("oneresume-token") || sessionStorage.getItem("oneresume-token");
    if (!token) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    const loadingToast = toast.loading("데이터를 가져오고 있습니다...");
    try {
      const response = await fetch(`${API_BASE_URL}/api/resume/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("데이터 로드 실패");
      const data = await response.json();
      
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast.success("표준 JSON 데이터가 클립보드에 복사되었습니다!", { id: loadingToast });
    } catch (e) {
      toast.error("데이터를 가져오는 중 오류가 발생했습니다.", { id: loadingToast });
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className={`relative w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 ${
        isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'
      }`}>
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
              </div>
              <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>OneResume Connect</h3>
            </div>
            <button onClick={onClose} className={`w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-500/10 transition-colors ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className={`p-6 rounded-3xl border-2 border-dashed mb-6 ${
            isDarkMode ? 'bg-purple-600/5 border-purple-500/20' : 'bg-purple-50/50 border-purple-100'
          }`}>
            <p className={`text-xs font-bold leading-relaxed mb-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              원티드, 사람인 등 채용 사이트에서 이력서를 자동으로 입력하려면 OneResume 전용 크롬 확장 프로그램을 설치해주세요.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
                className="w-full py-3.5 bg-zinc-900 text-white rounded-xl text-xs font-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>Chrome 웹스토어로 이동</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </button>
              <button 
                onClick={handleCopyJson}
                className={`w-full py-3.5 rounded-xl text-xs font-black border transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${
                  isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-600 shadow-sm'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                <span>표준 JSON 데이터 복사</span>
              </button>
            </div>
          </div>

          <div className="text-center">
            <p className={`text-[10px] font-bold ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
              확장 프로그램은 사용자의 데이터를 안전하게 암호화하여 처리합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConnectModal;
