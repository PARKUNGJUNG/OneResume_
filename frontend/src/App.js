import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import axios from 'axios';

// 페이지 컴포넌트 불러오기
import AuthPage from "./pages/AuthPage";
import EditPage from "./pages/EditPage";
import UserResumePage from "./pages/UserResumePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SetupProfile from "./pages/SetupProfile";
import OAuthCallback from "./pages/OAuthCallback";

function App() {
  // 브라우저 접속 주소 확인 (서브도메인 판별)
  const host = window.location.hostname;
  const parts = host.split('.');
  const isS3 = host.includes('s3-website');
  const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host);
  
  // oneresume.kr (parts.length=2) 인 경우 subdomain은 null
  // user.oneresume.kr (parts.length=3) 인 경우 subdomain은 'user'
  // IP 주소(isIP)이거나 localhost, www 인 경우도 서브도메인 제외
  const subdomain = (parts.length > 2 && !isS3 && !isIP && parts[0] !== 'www' && parts[0] !== 'localhost') ? parts[0] : null;

		// 컴포넌트가 처음 로드될 때 딱 한 번 실행
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response, // 성공하면 그냥 통과
      (error) => {
        // 에러가 났는데 그게 429 요청 초과 라면?
        if (error.response && error.response.status === 429) {
          toast.error(error.response.data.message || "요청이 너무 많습니다.\n1분 후 다시 시도해주세요.", {
            id: 'rate-limit-error', // 중복 토스트 방지용 ID
          });
        }
        return Promise.reject(error);
      }
    );

    // 컴포넌트가 사라질 때 인터셉터 제거 (메모리 관리)
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // 전역 다크모드 상태 관리
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 첫 로딩 시 로컬스토리지에서 테마 불러오기
  useEffect(() => {
    const savedTheme = localStorage.getItem("oneresume-theme") === "true";
    setIsDarkMode(savedTheme);
  }, []);

  // isDarkMode 상태가 변할 때마다 html 태그에 dark 클래스 토글 (Tailwind dark 모드 지원)
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // 인쇄 시 다크모드 강제 해제 로직 (PDF는 무조건 라이트모드)
  useEffect(() => {
    const handleBeforePrint = () => {
      document.documentElement.classList.remove('dark');
    };
    const handleAfterPrint = () => {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      }
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [isDarkMode]);

  // 테마 토글 함수 (자식 컴포넌트들에게 전달할 용도)
  const toggleDarkMode = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("oneresume-theme", newTheme.toString());
  };

  return (
    <>
      {/* 알림창 (isDarkMode 상태에 따라 실시간으로 스타일 변경) */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          className: 'oneresume-toast',
          style: {
            borderRadius: '16px',
            // 실시간 isDarkMode 상태 반영
            background: isDarkMode ? '#1e293b' : '#ffffff', // slate-800 : white
            color: isDarkMode ? '#f8fafc' : '#1e293b',      // slate-50 : slate-800
            border: isDarkMode ? '1px solid #334155' : '1px solid #f1f5f9', // slate-700 : slate-100
           },
          success: {
            duration: 2000,
            theme: { primary: '#10b981' },
          },
          error: {
            duration: 2500,
            theme: { primary: '#ef4444' },
          },
        }}
      />

      {subdomain ? (
        // 1. 사용자 이력서 페이지 (서브도메인 접속)
        <UserResumePage subdomain={subdomain} isDarkMode={isDarkMode} />
      ) : (
        // 2. 관리자 모드 라우팅
        <Router>
          <Routes>
            {/* 각 페이지에 isDarkMode와 필요 시 toggleDarkMode 전달 */}
            <Route path="/" element={<AuthPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/setup-profile" element={<SetupProfile isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} />
            <Route 
              path="/edit" 
              element={<EditPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} 
            />
            <Route 
              path="/forgot-password" 
              element={<ForgotPasswordPage isDarkMode={isDarkMode} />} 
            />
            <Route 
              path="/reset-password/:token" 
              element={<ResetPasswordPage isDarkMode={isDarkMode} />} 
            />
          </Routes>
        </Router>
      )}
    </>
  );
}

export default App;