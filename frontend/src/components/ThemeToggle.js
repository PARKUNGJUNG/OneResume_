import React from 'react';

const ThemeToggle = ({ isDarkMode, toggleDarkMode }) => {
  return (
    <button
      onClick={toggleDarkMode}
      className={`relative w-[64px] h-[36px] rounded-full transition-all duration-500 border-2 overflow-hidden flex items-center shadow-sm active:scale-95
        ${isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-blue-100 border-blue-200"}`}
    >
      {/* 움직이는 원 (Slider) - 다른 버튼들 높이에 맞춰 36px/32px로 최적화 */}
      <div 
        className={`absolute w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-md
          ${isDarkMode ? "translate-x-[32px] bg-zinc-950" : "translate-x-1 bg-white"}`}
      >
        <span className="text-[15px] leading-none select-none transform -translate-y-[1px]">
          {isDarkMode ? "🌙" : "☀️"}
        </span>
      </div>
    </button>
  );
};

export default ThemeToggle;