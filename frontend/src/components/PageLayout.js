import React from 'react';
import ThemeToggle from './ThemeToggle';

const PageLayout = ({ children, isDarkMode, toggleDarkMode, noPadding = false, allowScroll = true }) => {
  return (
    <div className={`relative min-h-screen w-full flex flex-col transition-colors duration-300 overflow-x-hidden ${
      allowScroll ? 'overflow-y-auto' : 'overflow-y-hidden'
    } ${
      isDarkMode ? 'bg-zinc-950' : 'bg-zinc-50'
    }`}>
      {/* 장식용 배경 원형 */}
      <div className={`w-[500px] h-[500px] fixed -right-20 -top-28 rounded-full blur-[80px] transition-all duration-500 pointer-events-none opacity-50 print:hidden ${
        isDarkMode ? 'bg-blue-500/10' : 'bg-blue-700/5'
      }`}></div>
      <div className={`w-96 h-96 fixed -left-32 bottom-20 rounded-full blur-[60px] transition-all duration-500 pointer-events-none opacity-50 print:hidden ${
        isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-700/5'
      }`}></div>

      {/* 우측 상단 테마 토글 버튼 (전역 적용) */}
      {toggleDarkMode && (
        <div className="fixed top-6 right-6 z-[100] print:hidden">
          <ThemeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        </div>
      )}

      {/* 실제 컨텐츠 */}
      <div className={`flex-1 flex flex-col z-10 ${noPadding ? '' : 'p-4 md:p-6'}`}>
        {children}
      </div>
    </div>
  );
};

export default PageLayout;