import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../config";

function JDMatchModal({ isOpen, onClose, isDarkMode }) {
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [inputMode, setInputMode] = useState("url"); // 'url' or 'text'

  if (!isOpen) return null;

  const handleMatch = async () => {
    const minLength = inputMode === 'url' ? 10 : 20;
    if (!jdText || jdText.trim().length < minLength) {
      toast.error(inputMode === 'url' ? "올바른 공고 URL을 입력해 주세요." : "채용 공고 내용을 최소 20자 이상 입력해 주세요.");
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
      if (error.response?.status === 429) return;
      const errorMsg = error.response?.data?.message || "서버와 통신할 수 없습니다. 잠시 후 다시 시도해 주세요.";
      toast.error(errorMsg);
    }
 finally {
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-6 print:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className={`relative w-[95vw] md:w-full ${result ? 'md:max-w-4xl' : 'md:max-w-2xl'} h-auto max-h-[90vh] md:max-h-[85vh] overflow-hidden rounded-[28px] md:rounded-[32px] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300 ${
        isDarkMode ? 'bg-zinc-900 border border-zinc-800/50' : 'bg-white'
      }`}>
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 md:top-6 md:right-6 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center hover:bg-zinc-500/10 transition-colors z-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 md:h-6 md:w-6 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="flex-1 flex flex-col relative overflow-hidden">
          
          {/* VIEW 1: INPUT */}
          {!loading && !result && (
            <div className="flex-1 flex flex-col p-4 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto hide-scrollbar">
              <div className="mb-3 md:mb-8 flex-shrink-0">
                <div className="flex items-center gap-2 mb-1 md:mb-2">
                  <div className="w-1.5 h-4 md:h-6 bg-blue-600 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.3)]" />
                  <h2 className={`text-base md:text-3xl font-[1000] tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>AI Match</h2>
                </div>
                <p className={`text-[9px] md:text-sm font-bold ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>공고를 분석하여 내 이력서와의 매칭 점수를 확인하세요.</p>
              </div>

              <div className={`flex p-1 rounded-xl mb-3 md:mb-8 w-full md:w-fit border flex-shrink-0 ${isDarkMode ? 'bg-zinc-800 border-zinc-700/50' : 'bg-zinc-100 border-zinc-200'}`}>
                <button onClick={() => { setInputMode('url'); setJdText(""); }} className={`flex-1 md:flex-none md:px-8 py-1.5 md:py-2.5 rounded-lg text-[10px] md:text-sm font-black transition-all flex items-center justify-center gap-2 ${inputMode === 'url' ? (isDarkMode ? 'bg-zinc-700 text-blue-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm') : 'text-zinc-500'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  URL 입력
                </button>
                <button onClick={() => { setInputMode('text'); setJdText(""); }} className={`flex-1 md:flex-none md:px-8 py-1.5 md:py-2.5 rounded-lg text-[10px] md:text-sm font-black transition-all flex items-center justify-center gap-2 ${inputMode === 'text' ? (isDarkMode ? 'bg-zinc-700 text-blue-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm') : 'text-zinc-500'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  상세 내용
                </button>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                {inputMode === 'url' ? (
                  <div className="space-y-3">
                    <input type="text" value={jdText} onChange={(e) => setJdText(e.target.value)} placeholder="공고 URL을 붙여넣으세요..." className={`w-full h-11 md:h-16 px-5 md:px-6 rounded-xl md:rounded-2xl outline-none border-2 transition-all font-black text-xs md:text-base ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white focus:border-blue-500/50' : 'bg-white border-zinc-200 text-zinc-800 focus:border-blue-500/30 shadow-sm'}`} />
                    <div className="flex items-start gap-2 px-1">
                      <div className={`mt-0.5 w-3.5 h-3.5 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <p className={`text-[10px] md:text-xs font-bold leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>공고 링크만 넣으면 <span className={isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}>AI가 핵심 역량을 자동으로 분석</span>합니다.</p>
                    </div>
                  </div>
                ) : (
                  <textarea value={jdText} onChange={(e) => setJdText(e.target.value)} placeholder="공고 상세 내용을 붙여넣으세요..." className={`flex-1 min-h-[80px] md:min-h-[250px] p-4 md:p-8 rounded-xl md:rounded-[32px] resize-none outline-none border-2 transition-all font-medium text-xs md:text-base leading-relaxed ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white focus:border-blue-500/50' : 'bg-white border-zinc-200 text-zinc-800 focus:border-blue-500/30 shadow-sm'}`} />
                )}
              </div>
              
              <button onClick={handleMatch} disabled={loading} className="relative mt-4 md:mt-10 w-full h-12 md:h-16 rounded-xl md:rounded-2xl font-black text-sm md:text-lg transition-all active:scale-95 flex items-center justify-center gap-2 overflow-hidden group bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-blue-600/20 flex-shrink-0">
                <div className="absolute top-2.5 right-6 pointer-events-none opacity-80 animate-pulse"><svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg></div>
                <div className="absolute bottom-3 left-8 pointer-events-none opacity-60 animate-pulse [animation-delay:0.7s]"><svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-white"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg></div>
                <span>분석 시작하기</span>
              </button>
            </div>
          )}

          {/* VIEW 2: LOADING - 은하계 컨셉 반짝임 강화 */}
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center p-10 animate-in fade-in duration-500 relative overflow-hidden min-h-[450px]">
              {/* 은하계 별 파티클 (애니메이션 속도 정밀 보정) */}
              <div className="absolute top-[8%] left-[15%] animate-pulse opacity-80 [animation-duration:800ms]"><svg viewBox="0 0 24 24" className="w-8 h-8 fill-blue-500"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg></div>
              <div className="absolute top-[12%] right-[15%] animate-pulse opacity-70 [animation-duration:1200ms] [animation-delay:200ms]"><svg viewBox="0 0 24 24" className="w-6 h-6 fill-indigo-400"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg></div>
              <div className="absolute top-[45%] left-[5%] animate-pulse opacity-60 [animation-duration:1500ms] [animation-delay:500ms]"><svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg></div>
              <div className="absolute top-[55%] right-[8%] animate-pulse opacity-80 [animation-duration:1000ms] [animation-delay:800ms]"><svg viewBox="0 0 24 24" className="w-12 h-12 fill-blue-600/40 blur-[1px]"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg></div>
              <div className="absolute bottom-[10%] left-[20%] animate-pulse opacity-70 [animation-duration:900ms] [animation-delay:300ms]"><svg viewBox="0 0 24 24" className="w-9 h-9 fill-purple-400"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg></div>
              <div className="absolute bottom-[8%] right-[15%] animate-pulse opacity-80 [animation-duration:1300ms] [animation-delay:600ms]"><svg viewBox="0 0 24 24" className="w-10 h-10 fill-indigo-500"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg></div>
              <div className="absolute top-[35%] right-[5%] animate-pulse opacity-40 [animation-duration:2000ms]"><svg viewBox="0 0 24 24" className="w-5 h-5 fill-blue-300"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg></div>
              <div className="absolute bottom-[40%] left-[8%] animate-pulse opacity-60 [animation-duration:1100ms] [animation-delay:100ms]"><svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg></div>
              <div className="absolute top-[5%] right-[40%] animate-pulse opacity-70 [animation-duration:1800ms]"><svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg></div>
              <div className="absolute bottom-[5%] left-[45%] animate-pulse opacity-60 [animation-duration:2200ms]"><svg viewBox="0 0 24 24" className="w-6 h-6 fill-blue-200"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg></div>
              
              <div className="relative mb-12">
                {/* 메인 행성 (스피너) */}
                <div className="w-24 h-24 border-[8px] border-blue-500/10 border-t-blue-600 rounded-full animate-spin shadow-[0_0_40px_rgba(37,99,235,0.15)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-blue-500/5 rounded-full animate-pulse blur-2xl opacity-60" />
                </div>
              </div>
              
              <div className="text-center space-y-3 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/10 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">AI Engine Active</span>
                </div>
                <h3 className={`text-xl md:text-3xl font-[1000] tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>데이터 분석 중...</h3>
                <p className={`text-[11px] md:text-sm font-bold ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>AI가 공고와 이력서의 매칭율을 정밀 분석하고 있습니다</p>
              </div>
            </div>
          )}

          {/* VIEW 3: RESULT */}
          {result && (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className={`p-6 md:p-10 border-b text-center flex-shrink-0 ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                <h3 className={`text-[10px] md:text-xs font-black mb-2 uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>매칭 점수</h3>
                <div className={`text-5xl md:text-8xl font-[1000] mb-4 tracking-tighter ${getScoreColor(result.score)}`}>{result.score}<span className="text-2xl md:text-4xl ml-1 font-black">%</span></div>
                <div className="h-1.5 md:h-2 w-48 md:w-64 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ease-out ${result.score >= 80 ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : result.score >= 60 ? 'bg-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.3)]' : 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.3)]'}`} style={{ width: `${result.score}%` }} />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-10 space-y-8">
                <section>
                  <h4 className={`text-sm md:text-lg font-black mb-4 flex items-center gap-2.5 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}><span className="w-1.5 h-5 bg-blue-500 rounded-full" />채용 공고 핵심 키워드</h4>
                  <div className="flex flex-wrap gap-2 md:gap-3">{result.coreCompetencies.map((item, i) => (<span key={i} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-black border transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-600 shadow-sm'}`}>{item}</span>))}</div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className={`p-6 md:p-8 rounded-[32px] border-2 transition-all ${isDarkMode ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50/50 border-emerald-100'}`}>
                    <h5 className="text-[11px] md:text-xs font-black text-emerald-600 mb-4 flex items-center gap-2 uppercase tracking-widest"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>보유 강점 (Match)</h5>
                    <ul className="space-y-2.5 md:space-y-3">{result.matchedKeywords.map((item, i) => (<li key={i} className={`text-xs md:text-sm font-bold leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>• {item}</li>))}</ul>
                  </div>
                  <div className={`p-6 md:p-8 rounded-[32px] border-2 transition-all ${isDarkMode ? 'bg-orange-500/5 border-orange-500/10' : 'bg-orange-50/50 border-orange-100'}`}>
                    <h5 className="text-[11px] md:text-xs font-black text-orange-600 mb-4 flex items-center gap-2 uppercase tracking-widest"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>보완 역량 (Gap)</h5>
                    <ul className="space-y-2.5 md:space-y-3">{result.missingKeywords.map((item, i) => (<li key={i} className={`text-xs md:text-sm font-bold leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>• {item}</li>))}</ul>
                  </div>
                </div>

                <section className={`p-7 md:p-10 rounded-[40px] transition-all border ${isDarkMode ? 'bg-blue-600/5 border-blue-600/10' : 'bg-blue-50 border-blue-100'}`}>
                  <h4 className="text-base md:text-xl font-black text-blue-600 mb-6 flex items-center gap-3">
                    <div className="relative">
                      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-blue-600"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg>
                      <div className="absolute -top-1 -right-1 animate-pulse"><svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-blue-400"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg></div>
                    </div>
                    OneResume AI 가이드
                  </h4>
                  <div className="space-y-5">
                    {result.improvementTips.map((tip, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <span className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center text-[10px] md:text-xs font-black shadow-lg shadow-blue-500/20 mt-0.5">{i + 1}</span>
                        <p className={`text-[13px] md:text-base font-[900] leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{tip}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="pt-2 flex flex-row gap-3 md:gap-4 pb-10 md:pb-0">
                  <button onClick={() => { setResult(null); setJdText(""); }} className={`flex-[1.4] h-12 md:h-16 rounded-2xl font-black text-[11px] md:text-sm transition-all active:scale-95 flex items-center justify-center gap-2 border-2 ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 shadow-sm'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>다시 분석</button>
                  <button onClick={onClose} className={`flex-1 h-12 md:h-16 rounded-2xl font-black text-[11px] md:text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${isDarkMode ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-xl'}`}>닫기</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JDMatchModal;