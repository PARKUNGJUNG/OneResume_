import { API_BASE_URL } from "../config";
import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Login = ({ onSuccess, onSwitchSignup, onSwitchForgot, isDarkMode, rememberMe, setRememberMe }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const loading = toast.loading("로그인 중...");
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      const { user, token } = response.data;

      // 토큰 저장 (기능 복구)
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('oneresume-token', token);
      
      toast.success(`${user.username}님, 반갑습니다`, { id: loading });
      
      // 부모에게 성공 알림 (즉시 이동 처리됨)
      if (onSuccess) onSuccess(response.data);
      
    } catch (err) {
      if (err.response?.status === 429) {
        toast.dismiss(loading);
        return;
      }
      toast.error(err.response?.data?.message || "로그인 실패", { id: loading });
    }
  };

  const theme = {
    titleText: isDarkMode ? 'text-white' : 'text-zinc-800',
    subText: isDarkMode ? 'text-slate-400' : 'text-zinc-600',
    labelText: isDarkMode ? 'text-slate-300' : 'text-zinc-500',
    inputBg: isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-100 border-transparent text-zinc-800',
  };

  const inputBaseClass = `w-full px-6 py-4 rounded-[48px] outline-none transition-all font-semibold text-base ${theme.inputBg} focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 border-2 border-transparent`;

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pt-10 pb-4">
      <div className="space-y-3 text-center lg:text-left mt-2">
        <h2 className={`text-4xl font-black tracking-tight ${theme.titleText}`}>로그인</h2>
      </div>
      
      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-2">
          <label className={`block text-[14px] font-black uppercase tracking-widest ml-2 ${theme.labelText}`}>이메일 주소</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputBaseClass} placeholder="example@gmail.com" required />
        </div>
        <div className="space-y-2">
          <label className={`block text-[14px] font-black uppercase tracking-widest ml-2 ${theme.labelText}`}>비밀번호</label>
          <div className="relative group">
            <input 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className={`${inputBaseClass} pr-14`} 
              placeholder="••••••••" 
              required 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-blue-500 transition-all active:scale-90 group/eye"
            >
              <div className="relative w-5 h-5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 absolute inset-0 transition-all duration-300 transform ${showPassword ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 -rotate-12"}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 absolute inset-0 transition-all duration-300 transform ${!showPassword ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 rotate-12"}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </div>
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between px-2">
          <label className="flex items-center cursor-pointer group">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="sr-only peer" />
            <div className={`w-5 h-5 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${isDarkMode ? 'bg-slate-800 border-slate-700 peer-checked:bg-blue-600 peer-checked:border-blue-600' : 'bg-white border-zinc-300 peer-checked:bg-blue-600 peer-checked:border-blue-600'}`}>
              <svg className={`w-3.5 h-3.5 text-white transition-transform duration-200 ${rememberMe ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <span className={`ml-2.5 text-xs font-black uppercase tracking-tighter ${theme.labelText}`}>로그인 유지</span>
          </label>
          <button type="button" onClick={onSwitchForgot} className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-tighter">비밀번호 찾기</button>
        </div>
        <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[48px] font-black text-xl shadow-2xl shadow-blue-600/30 transition-all transform hover:-translate-y-1 active:scale-95">로그인 →</button>
      </form>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-zinc-500/10" />
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.labelText}`}>또는 소셜 계정으로 로그인</span>
          <div className="flex-1 h-px bg-zinc-500/10" />
        </div>

        <div className="flex justify-center gap-6">
          <button 
            onClick={() => window.location.href = `${API_BASE_URL}/api/auth/kakao`}
            className="w-14 h-14 flex items-center justify-center bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] rounded-full transition-all active:scale-90 group"
            title="카카오 로그인"
          >
            <svg viewBox="0 0 24 24" className="w-9 h-9 fill-current group-hover:scale-110 transition-transform transform translate-y-[1.5px]">
              <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.707 4.8 4.33 6.048-.17.625-.62 2.28-.714 2.613-.113.4.14.394.29.293.118-.08 1.882-1.28 2.635-1.793.82.114 1.666.173 2.458.173 4.97 0 9-3.185 9-7.115S16.97 3 12 3z"/>
            </svg>
          </button>
          <button 
            onClick={() => window.location.href = `${API_BASE_URL}/api/auth/naver`}
            className="w-14 h-14 flex items-center justify-center bg-[#03C75A] hover:bg-[#02b359] text-white rounded-full transition-all active:scale-90 group"
            title="네이버 로그인"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current group-hover:scale-110 transition-transform">
              <path d="M16.273 12.845L7.376 0H0v24h7.726V11.155L16.624 24H24V0h-7.727v12.845z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="text-center pt-4 border-t border-zinc-500/10">
        <button onClick={onSwitchSignup} className="text-xs font-black text-blue-600 hover:underline tracking-wider uppercase">계정이 없으신가요? 회원가입 하기</button>
      </div>
    </div>
  );
};

export default Login;