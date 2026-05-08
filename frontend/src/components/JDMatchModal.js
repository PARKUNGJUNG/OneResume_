import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../config";

function JDMatchModal({ isOpen, onClose, isDarkMode }) {
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleMatch = async () => {
    if (!jdText || jdText.trim().length < 20) {
      toast.error("채용 공고 내용을 최소 20자 이상 입력해 주세요.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem("oneresume-token") || sessionStorage.getItem("oneresume-token");
      if (!token) {
        toast.error("로그인이 필요합니다.");
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/ai/match-jd`,
        { jdText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult(response.data);
      toast.success("AI 분석이 완료되었습니다!");
    } catch (error) {
      console.error("Match Error:", error);
      toast.error(error.response?.data?.message || "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-blue-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className={`relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[32px] shadow-2xl flex flex-col lg:flex-row animate-in fade-in zoom-in duration-300 ${
        isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'
      }`}>
        {/* PC용 고정 닫기 버튼 (스크롤 영역 밖) */}
        <button 
          onClick={onClose} 
          className="hidden lg:flex absolute top-6 right-6 w-10 h-10 rounded-full items-center justify-center hover:bg-zinc-500/10 transition-colors z-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* 좌측: JD 입력 (모바일에서는 상단) */}
        <div className={`w-full lg:w-[45%] p-6 sm:p-8 flex flex-col border-b lg:border-b-0 lg:border-r ${
          isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-gray-50 border-zinc-200'
        }`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className={`text-xl sm:text-2xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>AI Match</h2>
              <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>공고 내용이나 채용 링크(URL)를 붙여넣으세요.</p>
            </div>
            <button onClick={onClose} className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-500/10 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

              <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="사람인, 잡코리아 등 공고 URL 또는 상세 내용을 입력하세요..."
              className={`flex-1 min-h-[200px] p-5 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm leading-relaxed ${

              isDarkMode ? 'bg-zinc-800 text-zinc-200 border-zinc-700' : 'bg-white text-zinc-700 border-zinc-200 shadow-sm'
            }`}
          />
          
          <button
            onClick={handleMatch}
            disabled={loading}
            className={`mt-6 h-14 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl ${
              loading 
                ? 'bg-zinc-500 cursor-not-allowed opacity-70 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                분석 중...
              </>
            ) : "매칭 분석 시작"}
          </button>
        </div>

        {/* 우측: 결과 (모바일에서는 하단) */}
        <div className={`w-full lg:w-[55%] overflow-y-auto custom-scrollbar p-6 sm:p-8 relative ${
          isDarkMode ? 'bg-[#09090b]' : 'bg-white'
        }`}>
          {!result && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 min-h-[300px]">
              <div className="w-20 h-20 bg-zinc-500/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>분석 결과가 여기에 표시됩니다</p>
              <p className="text-sm">공고 내용을 입력하고 분석을 시작해보세요.</p>
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center space-y-4 min-h-[300px]">
              <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <div className="text-center">
                <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>OneResume AI 분석 중</p>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>이력서와의 매칭도를 꼼꼼하게 계산하고 있습니다...</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4">
              {/* 점수 섹션 */}
              <div className="text-center">
                <h3 className={`text-xs font-black mb-1 uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Matching Score</h3>
                <div className={`text-6xl sm:text-7xl font-black mb-3 ${getScoreColor(result.score)}`}>
                  {result.score}<span className="text-2xl ml-1">%</span>
                </div>
                <div className="h-2 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${
                      result.score >= 80 ? 'bg-emerald-500' : result.score >= 60 ? 'bg-blue-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${result.score}%` }}
                  />
                </div>
              </div>

              {/* 핵심 역량 */}
              <section>
                <h4 className={`text-sm sm:text-base font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>
                  <span className="w-1.5 h-4 bg-blue-500 rounded-full" />
                  채용 공고 핵심 키워드
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.coreCompetencies.map((item, i) => (
                    <span key={i} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold ${isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'}`}>
                      {item}
                    </span>
                  ))}
                </div>
              </section>

              {/* 일치/불일치 비교 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-5 rounded-3xl ${isDarkMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
                  <h5 className="text-xs font-bold text-emerald-600 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    보유 강점
                  </h5>
                  <ul className="space-y-2">
                    {result.matchedKeywords.map((item, i) => (
                      <li key={i} className={`text-[11px] font-medium leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className={`p-5 rounded-3xl ${isDarkMode ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-50 border border-orange-100'}`}>
                  <h5 className="text-xs font-bold text-orange-600 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    보완 역량
                  </h5>
                  <ul className="space-y-2">
                    {result.missingKeywords.map((item, i) => (
                      <li key={i} className={`text-[11px] font-medium leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 개선 팁 */}
              <section className={`p-6 rounded-3xl ${isDarkMode ? 'bg-blue-600/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
                <h4 className="text-sm sm:text-base font-bold text-blue-600 mb-4 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-blue-600">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                  </svg>
                  OneResume AI 가이드
                </h4>
                <div className="space-y-4">
                  {result.improvementTips.map((tip, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                      <p className={`text-xs sm:text-sm font-medium leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{tip}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JDMatchModal;
