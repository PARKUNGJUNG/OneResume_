import { API_BASE_URL } from "../config";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PWD_REGEX, ValidationItem } from '../components/PasswordValidation';

const Signup = ({ onSuccess, onSwitch, isDarkMode }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [step, setStep] = useState(0); 
  const [isVerified, setIsVerified] = useState(false);

  const [validations, setValidations] = useState({
    length: false,
    upper: false,
    number: false,
    special: false,
    match: false
  });

  useEffect(() => {
    setValidations({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
      match: password.length > 0 && password === confirmPassword
    });
  }, [password, confirmPassword]);

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) return toast.error("올바른 이메일 주소를 입력해주세요.");
    const loading = toast.loading("인증번호를 발송 중입니다...");
    try {
      await axios.post(`${API_BASE_URL}/api/auth/send-code`, { email });
      toast.success("메일함을 확인해주세요", { id: loading });
      if (!subdomain && email.includes('@')) {
        const suggested = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        setSubdomain(suggested);
      }
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || "발송 실패", { id: loading });
    }
  };

  const handleVerifyCode = async () => {
    if (!code) return toast.error("인증번호를 입력해주세요.");
    const loading = toast.loading("인증번호 확인 중...");
    try {
      await axios.post(`${API_BASE_URL}/api/auth/verify-code`, { email, code });
      toast.success("이메일 인증 성공!", { id: loading });
      setIsVerified(true);
    } catch (err) {
      if (err.response?.status === 429) {
        toast.dismiss(loading);
        return;
      }
      toast.error("인증번호가 틀렸습니다.", { id: loading });
    }
  };

  const getSubdomainError = (val) => {
    if (!val) return null;
    if (!/^[a-z0-9]+$/.test(val)) return "영문 소문자와 숫자만 가능합니다.";
    const forbidden = ['admin', 'api', 'www', 'mail', 'master', 'root', 'help', 'login', 'dev', 'test', 'support'];
    if (forbidden.includes(val.toLowerCase())) return "사용할 수 없는 도메인입니다.";
    if (val.length < 3) return "3자 이상 입력해주세요.";
    return null;
  };

  const handleFinalSignup = async () => {
    const subError = getSubdomainError(subdomain);
    if (subError) { toast.error(subError); return; }
    if (!PWD_REGEX.test(password)) { toast.error("비밀번호 보안 정책을 확인해주세요."); return; }
    if (password !== confirmPassword) { toast.error("비밀번호가 일치하지 않습니다."); return; }

    const loading = toast.loading("회원가입 처리 중...");
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, { email, password, subdomain });
      toast.success("OneResume에 오신 걸 환영합니다!", { id: loading });
      if (onSuccess) onSuccess(response.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "가입 중 오류 발생", { id: loading });
    }
  };

  const theme = {
    titleText: isDarkMode ? 'text-white' : 'text-zinc-800',
    subText: isDarkMode ? 'text-slate-400' : 'text-zinc-600',
    labelText: isDarkMode ? 'text-slate-300' : 'text-zinc-500',
    inputBg: isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-100 border-transparent text-zinc-800',
    subdomainAddon: isDarkMode ? 'bg-slate-700 text-slate-400 border-slate-600' : 'bg-gray-200 text-zinc-500 border-gray-300'
  };

  const isStep2 = step === 2;

  const inputBaseClass = `w-full py-4 rounded-[48px] outline-none transition-all font-semibold ${theme.inputBg} focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 border-2 border-transparent ${
    !isStep2 ? 'px-6 text-base' : 'px-5 text-sm'
  }`;

  const getPasswordInputClass = (value, isValid) => {
    const base = `w-full px-5 py-4 rounded-[48px] outline-none transition-all font-semibold text-sm border-2 ${theme.inputBg} `;
    if (value.length > 0) return base + (isValid ? "border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/20" : "border-red-500/60 focus:ring-4 focus:ring-red-500/20");
    return base + "border-transparent focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50";
  };

  return (
    <div className={`w-full max-w-md mx-auto pt-6 pb-4 transition-all duration-500 ${!isStep2 ? 'space-y-6' : 'space-y-3'}`}>
      {/* 고정 헤더 */}
      <div className="space-y-2 text-center lg:text-left mt-2">
        <h2 className={`text-3xl font-black tracking-tight ${theme.titleText}`}>회원가입</h2>
        <div className="relative h-6">
          <p className={`absolute inset-0 text-lg font-bold transition-all duration-500 ${theme.subText} ${!isStep2 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            시작을 위해 이메일 인증이 필요합니다.
          </p>
          <p className={`absolute inset-0 text-lg font-bold transition-all duration-500 ${theme.subText} ${isStep2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            상세 정보를 입력해주세요.
          </p>
        </div>
      </div>

      {/* 슬라이딩 컨텐츠 영역 (Double Slider 로직) */}
      <div className="relative">
        {/* Step 1: 이메일 인증 (왼쪽에서 오고감) */}
        <div className={`w-full transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${!isStep2 ? 'opacity-100 translate-x-0 relative z-20' : 'opacity-0 -translate-x-full absolute top-0 left-0 z-10'}`}>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className={`block text-[14px] font-black uppercase tracking-widest ml-2 ${theme.labelText}`}>이메일 주소</label>
              <input type="email" value={email} disabled={step > 0} onChange={(e) => setEmail(e.target.value)} className={inputBaseClass} placeholder="example@gmail.com" />
            </div>
            
            {step === 1 && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-3 duration-500">
                <label className={`block text-[14px] font-black uppercase tracking-widest ml-2 ${theme.labelText}`}>인증 번호</label>
                <div className="flex gap-3">
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value)} disabled={isVerified} className={`${inputBaseClass} flex-1`} placeholder="000000" />
                  {!isVerified && (
                    <button 
                      onClick={handleVerifyCode} 
                      disabled={code.length !== 6}
                      className={`px-8 py-4 rounded-[48px] font-bold text-sm transition-all active:scale-95 whitespace-nowrap ${
                        code.length === 6 ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                      }`}
                    >확인</button>
                  )}
                </div>
              </div>
            )}

            <button onClick={step === 0 ? handleSendCode : () => setStep(2)} disabled={step === 1 && !isVerified} className={`w-full py-4 bg-blue-600 text-white rounded-[48px] font-black shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${!isStep2 ? 'text-xl' : 'text-base'} ${step === 1 && !isVerified ? 'opacity-50 grayscale' : 'hover:bg-blue-700 shadow-blue-600/30'}`}>
              {step === 0 ? "인증번호 전송 →" : isVerified ? "다음 단계로 →" : "인증 대기 중..."}
            </button>
          </div>
        </div>

        {/* Step 2: 정보 입력 (오른쪽에서 나타남) */}
        <div className={`w-full transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isStep2 ? 'opacity-100 translate-x-0 relative z-20' : 'opacity-0 translate-x-full absolute top-0 left-0 z-10'}`}>
          <div className="space-y-2.5">
            <div className="space-y-1.5">
              <label className={`block text-[14px] font-black uppercase tracking-widest ml-2 ${theme.labelText}`}>비밀번호</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={getPasswordInputClass(password, validations.length && validations.upper && validations.number && validations.special)} placeholder="••••••••" />
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2 px-2 text-[13px]">
                <ValidationItem isValid={validations.length} text={password.length > 0 && !validations.length ? "8자 미만" : "8자 이상"} isDirty={password.length > 0} />
                <ValidationItem isValid={validations.upper} text={password.length > 0 && !validations.upper ? "대문자 미포함" : "대문자 포함"} isDirty={password.length > 0} />
                <ValidationItem isValid={validations.number} text={password.length > 0 && !validations.number ? "숫자 미포함" : "숫자 포함"} isDirty={password.length > 0} /> 
                <ValidationItem isValid={validations.special} text={password.length > 0 && !validations.special ? "특수문자 미포함" : "특수문자 포함"} isDirty={password.length > 0} /> 
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className={`block text-[14px] font-black uppercase tracking-widest ml-2 ${theme.labelText}`}>비밀번호 확인</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={getPasswordInputClass(confirmPassword, validations.match)} placeholder="••••••••" />
              <div className="mt-1 px-2 text-[13px]"><ValidationItem isValid={validations.match} text={confirmPassword.length > 0 && !validations.match ? "비밀번호 불일치" : "비밀번호 일치"} isDirty={confirmPassword.length > 0} /></div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between mb-0.5 px-2">
                <div className="flex items-center gap-2">
                  <label className={`text-[14px] font-black uppercase tracking-widest ${theme.labelText}`}>개인 도메인 주소</label>
                  <div className="group relative flex items-center">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[11px] font-serif font-bold italic cursor-help transition-colors ${isDarkMode ? 'border-slate-600 text-slate-500' : 'border-zinc-300 text-zinc-400'}`}>i</div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-72 p-4 bg-zinc-800 text-white text-[13px] rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 shadow-2xl pointer-events-none border border-white/10 backdrop-blur-xl text-center">
                      나만의 고유한 <span className="text-blue-400">웹 주소</span>입니다.<br/>이 주소를 통해 이력서를 공유할 수 있습니다.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent border-t-zinc-800"></div>
                    </div>
                  </div>
                </div>
                {/* 미리보기를 오른쪽 끝으로 이동 */}
                {!getSubdomainError(subdomain) && subdomain && (
                  <p className="text-[11px] font-black text-blue-500 dark:text-blue-400 animate-in fade-in slide-in-from-right-2 duration-300 truncate max-w-[180px]">
                    내 주소: <span className="underline">{subdomain.toLowerCase()}.oneresume.kr</span>
                  </p>
                )}
              </div>
              <div className="flex items-center">
                <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} className={`${inputBaseClass} !rounded-r-none border-r-0`} placeholder="아이디" />
                <span className={`px-5 py-4 rounded-r-[48px] font-black text-sm border-2 border-l-0 ${theme.subdomainAddon}`}>.oneresume.kr</span>
              </div>
              {/* 에러가 있을 때만 공간 차지 */}
              {getSubdomainError(subdomain) && (
                <div className="mt-1 ml-2 animate-in fade-in slide-in-from-top-1">
                  <p className="text-[11px] font-black text-red-500 animate-pulse">⚠️ {getSubdomainError(subdomain)}</p>
                </div>
              )}
            </div>
            
            <div className="pt-1">
              <button onClick={handleFinalSignup} disabled={!Object.values(validations).every(v => v) || !!getSubdomainError(subdomain)} className={`w-full py-4 rounded-[48px] font-black text-sm shadow-2xl transition-all active:scale-95 ${Object.values(validations).every(v => v) && !getSubdomainError(subdomain) ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-zinc-300 text-zinc-500 cursor-not-allowed opacity-50'}`}>회원가입 완료 →</button>
            </div>
          </div>
        </div>
      </div>

      <div className={`transition-all duration-500 ${!isStep2 ? 'space-y-4' : 'space-y-2.5'}`}>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-zinc-500/10" />
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.labelText}`}>또는 소셜 계정으로 시작</span>
          <div className="flex-1 h-px bg-zinc-500/10" />
        </div>

        <div className="flex justify-center gap-6">
          <button 
            onClick={() => window.location.href = `${API_BASE_URL}/api/auth/kakao`}
            className={`flex items-center justify-center bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] rounded-full transition-all duration-500 active:scale-90 group ${
              !isStep2 ? 'w-14 h-14' : 'w-11 h-11'
            }`}
            title="카카오 로그인"
          >
            <svg viewBox="0 0 24 24" className={`fill-current group-hover:scale-110 transition-all duration-500 transform translate-y-[1.2px] ${
              !isStep2 ? 'w-9 h-9' : 'w-7 h-7'
            }`}>
              <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.707 4.8 4.33 6.048-.17.625-.62 2.28-.714 2.613-.113.4.14.394.29.293.118-.08 1.882-1.28 2.635-1.793.82.114 1.666.173 2.458.173 4.97 0 9-3.185 9-7.115S16.97 3 12 3z"/>
            </svg>
          </button>
          <button 
            onClick={() => window.location.href = `${API_BASE_URL}/api/auth/naver`}
            className={`flex items-center justify-center bg-[#03C75A] hover:bg-[#02b359] text-white rounded-full transition-all duration-500 active:scale-90 group ${
              !isStep2 ? 'w-14 h-14' : 'w-11 h-11'
            }`}
            title="네이버 로그인"
          >
            <svg viewBox="0 0 24 24" className={`fill-current group-hover:scale-110 transition-all duration-500 ${
              !isStep2 ? 'w-6 h-6' : 'w-5 h-5'
            }`}>
              <path d="M16.273 12.845L7.376 0H0v24h7.726V11.155L16.624 24H24V0h-7.727v12.845z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 고정 푸터 */}
      <div className={`text-center border-t border-zinc-500/10 transition-all duration-500 ${!isStep2 ? 'pt-4' : 'pt-3'}`}>
        <button onClick={onSwitch} className="text-xs font-black text-blue-600 hover:underline tracking-wider uppercase">이미 회원이신가요? 로그인하기</button>
      </div>
    </div>
  );
};

export default Signup;