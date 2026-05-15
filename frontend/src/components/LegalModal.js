import React from 'react';

const LegalModal = ({ isOpen, onClose, title, content, isDarkMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* 모달 카드 */}
      <div className={`relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-[32px] border shadow-2xl flex flex-col transition-all duration-300 transform scale-100 ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
      }`}>
        
        {/* 헤더 */}
        <div className="p-8 border-b border-white/10 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          <button 
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDarkMode ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-slate-50 text-slate-400'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className={`p-8 overflow-y-auto custom-scrollbar leading-relaxed text-[14px] ${
          isDarkMode ? 'text-zinc-400' : 'text-slate-600'
        }`}>
          {content}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-white/10 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-blue-600/30"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;