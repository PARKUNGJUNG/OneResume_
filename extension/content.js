/**
 * ---------------------------------------------------------
 * OneResume Connect: Engine v1.5.0 (Reactive & Controlled)
 * ---------------------------------------------------------
 */

console.log("OneResume Connect: Engine v1.5.0 Loaded");

let cachedResumeData = null;
let isExtensionActive = true;

/**
 * [성능 최적화] 데이터 가져오기 (Reactive 방식)
 */
const fetchResumeDataFromBg = () => {
  try {
    if (!window.chrome?.runtime?.id || !window.chrome?.storage?.local) return;

    chrome.storage.local.get(['oneresume_token', 'or_extension_active'], (result) => {
      if (chrome.runtime.lastError) return;

      isExtensionActive = result.or_extension_active !== false;
      
      // 꺼져있으면 데이터 요청도 안 함
      if (!isExtensionActive) {
        removeEngineUI();
        return;
      }

      if (result.oneresume_token) {
        try {
          const token = atob(result.oneresume_token);
          chrome.runtime.sendMessage({ action: "FETCH_RESUME_DATA", token: token }, (response) => {
            if (chrome.runtime.lastError) return;
            if (response && response.success) {
              cachedResumeData = response.data;
              console.log("📦 OR Connect: Data Synced");
              initSmartEngine(); // 활성화 상태면 엔진 초기화
            }
          });
        } catch (e) {}
      }
    });
  } catch (err) {}
};

/**
 * [실시간 동기화] 스토리지 변경 감지 (Polling 대체)
 */
try {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.oneresume_token || changes.or_extension_active)) {
      fetchResumeDataFromBg();
    }
  });
} catch (e) {}

/**
 * [원클릭 동기화] 웹사이트로부터 토큰 수신
 */
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ONERESUME_SYNC_TOKEN') {
    const token = event.data.token;
    if (token) {
      const encodedToken = btoa(token);
      chrome.storage.local.set({ oneresume_token: encodedToken }, () => {
        console.log("✅ OR Connect: Token Synced from Website");
        fetchResumeDataFromBg(); // 동기화 즉시 데이터 로드
        
        // 웹사이트에 성공 알림 보내기 (웹사이트의 ConnectModal.js가 이 메시지를 기다림)
        window.postMessage({ type: 'ONERESUME_SYNC_SUCCESS' }, "*");
      });
    }
  }
});

/**
 * [실시간 감지] 확장 프로그램 생존 신고 (Heartbeat)
 * 웹사이트의 Ping을 기다리지 않고, 1초마다 스스로 활성화 상태를 방송합니다.
 * 이 방식이 브라우저 컨텍스트 격리 환경에서 가장 확실하게 작동합니다.
 */
setInterval(() => {
  window.postMessage({ type: 'ONERESUME_PONG' }, "*");
  window.dispatchEvent(new CustomEvent('ONERESUME_PONG'));
}, 1000);

// 초기 실행
fetchResumeDataFromBg();

/**
 * [UI 제거] 엔진 비활성화 시 UI 삭제
 */
const removeEngineUI = () => {
  const overlay = document.getElementById('or-magic-overlay');
  const fab = document.getElementById('or-magic-fab-container');
  const aiWidget = document.getElementById('or-ai-widget-container');
  if (overlay) overlay.remove();
  if (fab) fab.remove();
  if (aiWidget) aiWidget.remove();
};

/**
 * [자동 입력 엔진] 필드 매핑 및 주입 로직
 */
const AUTOFILL_CONFIG = {
  'wanted.co.kr': {
    'input[name="name"]': 'basics.name',
    'input[name="email"]': 'basics.email',
    'input[name="mobile"]': 'basics.phone',
  },
  'jobkorea.co.kr': {
    '[name="User_NM"], input#User_NM, [name="nm"], [placeholder*="이름"]': 'basics.name',
    '[name*="Email"], [id*="Email"], [placeholder*="이메일"]': 'basics.email',
    '[name*="Hand_Phone"], [id*="Hand_Phone"], [placeholder*="휴대폰"]': 'basics.phone',
    '[id*="Schl_Name"], [name*="Schl_Name"], [placeholder*="학교명"], [title*="학교명"]': 'education.0.institution',
    '[id*="Major_Name"], [name*="Major_Name"], [placeholder*="전공명"], [title*="전공명"]': 'education.0.area',
    '[id*="Gpa"], [name*="Gpa"], [placeholder*="학점"], [title*="학점"]': 'education.0.score',
    '[id*="Gpa_Tot"], [name*="Gpa_Tot"]': 'education.0.score',
    '[id*="Corp_Name"], [name*="Corp_Name"], [placeholder*="회사명"], [title*="회사명"]': 'work.0.company',
    '[id*="Dept_Name"], [name*="Dept_Name"], [placeholder*="부서명"], [title*="부서명"]': 'work.0.department',
    '[id*="Post_Name"], [name*="Post_Name"], [placeholder*="직급"], [title*="직급"]': 'work.0.position',
    'textarea[id*="Job_Desc"], textarea[name*="Job_Desc"], [placeholder*="업무"], [title*="업무"]': 'work.0.summary',
    '[placeholder*="입학년월"], [placeholder*="입사년월"], [title*="입학년월"], [title*="입사년월"]': 'work.0.startDate',
    '[placeholder*="졸업년월"], [placeholder*="퇴사년월"], [title*="졸업년월"], [title*="퇴사년월"]': 'work.0.endDate',
    '[name*="Growth"], [id*="Growth"], [placeholder*="성장과정"]': 'selfIntroduction.growth',
    '[name*="Personality"], [id*="Personality"], [placeholder*="성격"]': 'selfIntroduction.character',
    '[name*="Motive"], [id*="Motive"], [placeholder*="지원동기"]': 'selfIntroduction.motivation',
    'CLICK_SELECT': {
      '학교구분': 'education.0.studyType',
      '졸업상태': 'education.0.status',
      '직급/직책': 'work.0.position'
    }
  },
  'saramin.co.kr': {
    'input[name="nm"], input#nm, input[placeholder*="이름"]': 'basics.name',
    'input[name="email"], input#email, input[placeholder*="이메일"]': 'basics.email',
    'input[name="phone"], input#phone, input[placeholder*="휴대폰"]': 'basics.phone',
    'input#school_nm, input[placeholder*="학교명"], input[title*="학교명"]': 'education.0.institution',
    'input#major_nm, input[placeholder*="전공"], input[title*="전공"]': 'education.0.area',
    'input#gpa, input[placeholder*="학점"], input[title*="학점"]': 'education.0.score',
    'input#company_nm, input[placeholder*="회사명"]': 'work.0.company',
    'input#work_position, input[placeholder*="직무"]': 'work.0.position',
    'input[placeholder*="입사년월"]': 'work.0.startDate',
    'input[placeholder*="퇴사년월"]': 'work.0.endDate',
    'textarea#work_desc, textarea[placeholder*="업무"]': 'work.0.summary',
    'input[placeholder*="GitHub"]': 'basics.profiles.0.url',
    'textarea[placeholder*="성장"]': 'selfIntroduction.growth',
    'textarea[placeholder*="성격"]': 'selfIntroduction.character',
    'textarea[placeholder*="지원"]': 'selfIntroduction.motivation',
    'CLICK_SELECT': {
      '대학구분': 'education.0.studyType',
      '졸업여부': 'education.0.status'
    }
  }
};

const clickByText = (text) => {
  const elements = Array.from(document.querySelectorAll('button, a, div, span, li'));
  const target = elements.find(el => el.textContent.trim().includes(text) && el.offsetParent !== null);
  if (target) {
    target.click();
    return true;
  }
  return false;
};

const getValueByPath = (obj, path) => {
  if (!obj) return null;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return null;
    current = current[part];
  }
  if (path.includes('Date') && typeof current === 'string') {
    return current.replace(/[^0-9]/g, '');
  }
  if (Array.isArray(current)) return current.join(', ');
  return current;
};

const findTargetElements = (selector, useFuzzy = true) => {
  let elements = Array.from(document.querySelectorAll(selector));
  if (elements.length > 0 || !useFuzzy) return elements;

  const keywords = [];
  const regex = /(?:placeholder|title)\*="([^"]+)"/g;
  let match;
  while ((match = regex.exec(selector)) !== null) keywords.push(match[1]);

  for (const keyword of keywords) {
    const candidates = Array.from(document.querySelectorAll('label, span, div, p, dt, th, td, strong, em, b')).filter(el => {
      const text = el.textContent.trim();
      if (!text.includes(keyword)) return false;
      const hasChildWithKeyword = Array.from(el.children).some(child => child.textContent.trim().includes(keyword));
      return !hasChildWithKeyword;
    });
    
    for (const cand of candidates) {
      let parent = cand.parentElement;
      for (let i = 0; i < 6 && parent; i++) {
        const inputs = parent.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]), textarea');
        if (inputs.length > 0) {
          if (!elements.includes(inputs[0])) elements.push(inputs[0]);
          break;
        }
        parent = parent.parentElement;
      }
    }
  }
  return elements;
};

/**
 * [시각적 피드백] 입력 필드 하이라이트 주입
 * 유지 시간을 1.5초에서 3초로 연장하여 시인성 강화
 */
const highlightElement = (element) => {
  if (!element) return;
  element.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
  element.style.boxShadow = '0 0 0 5px rgba(16, 185, 129, 0.5)';
  element.style.borderColor = '#10b981';
  
  setTimeout(() => {
    element.style.boxShadow = '';
    element.style.borderColor = '';
  }, 3000); // 3초간 유지
};

const forceInput = (element, value, domainType) => {
  if (!element) return;
  try {
    element.focus();
    if (domainType === 'jobkorea') element.click();

    const valueSetter = Object.getOwnPropertyDescriptor(element.constructor.prototype, "value")?.set;
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value")?.set;
    
    if (valueSetter && valueSetter !== prototypeValueSetter) prototypeValueSetter.call(element, value);
    else element.value = value;

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    if (domainType === 'jobkorea') {
      element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    }
    
    highlightElement(element); // 하이라이트 효과 적용
    element.blur();
  } catch (err) {
    element.value = value;
  }
};

const runAutofill = async (resumeData) => {
  if (!resumeData || !isExtensionActive) return;
  const host = window.location.hostname;
  const domainType = host.includes('saramin.co.kr') ? 'saramin' : (host.includes('jobkorea.co.kr') ? 'jobkorea' : 'other');

  if (window.self !== window.top) return;

  const configEntry = Object.entries(AUTOFILL_CONFIG).find(([domain]) => host.includes(domain));
  if (!configEntry) return;

  const config = configEntry[1];
  for (const [selector, dataPath] of Object.entries(config)) {
    if (selector === 'CLICK_SELECT') continue;
    try {
      const value = getValueByPath(resumeData, dataPath);
      if (!value) continue;

      const elements = findTargetElements(selector, domainType === 'jobkorea');
      if (elements.length === 0) continue;

      let finalValue = value;
      if (selector.includes('년월')) {
        const rawDate = value.replace(/[^0-9]/g, '');
        if (rawDate.length >= 6) finalValue = rawDate.substring(0, 4) + '.' + rawDate.substring(4, 6);
        else if (rawDate.length >= 4) finalValue = rawDate.substring(0, 4);
      }
      elements.forEach(element => forceInput(element, finalValue, domainType));
    } catch (e) {}
  }

  if (config.CLICK_SELECT) {
    for (const [triggerLabel, dataPath] of Object.entries(config.CLICK_SELECT)) {
      const value = getValueByPath(resumeData, dataPath);
      if (!value) continue;
      if (clickByText(triggerLabel)) setTimeout(() => clickByText(value), 500);
    }
  }
};

// 팝업 버튼 클릭으로 들어오는 요청 처리
if (window.chrome?.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "RUN_AUTOFILL") {
      runAutofill(request.resumeData).then(() => {
        const host = window.location.hostname;
        let siteName = null;
        let themeColor = null;
        if (host.includes('saramin.co.kr')) { siteName = '사람인'; themeColor = '#4876ef'; }
        else if (host.includes('jobkorea.co.kr')) { siteName = '잡코리아'; themeColor = '#ff4b13'; }
        if (siteName) createOverlay(siteName, themeColor, 'success');
      });
      sendResponse({ status: "success" });
    }
    return true;
  });
}

/**
 * [UI/UX] Overlay 및 FAB 생성
 */
const createOverlay = (siteName, themeColor, mode = 'ready') => {
  const existingOverlay = document.getElementById('or-magic-overlay');
  if (existingOverlay) existingOverlay.remove();

  try {
    const overlay = document.createElement('div');
    overlay.id = 'or-magic-overlay';
    let siteLogo = siteName === '사람인' ? chrome.runtime.getURL('icons/saramin.webp') : 'https://www.jobkorea.co.kr/favicon.ico';

    const textContent = mode === 'success' ? `<strong>${siteName}</strong> 자동입력이 완료되었습니다` : `<strong>${siteName}</strong> 자동입력 준비완료`;
    const iconContent = mode === 'success'
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;
    const arrowClass = mode === 'success' ? '' : 'or-bounce-x';
    const boxStyle = mode === 'success' ? 'border: 2px solid rgba(16,185,129,0.4); box-shadow: 0 20px 50px rgba(16,185,129,0.15);' : '';

    overlay.innerHTML = `
      <div class="or-box" style="${boxStyle}">
        <div class="or-inner-content">
          <div class="or-logo or-brand">
            <img src="${chrome.runtime.getURL('icons/logo128.png')}" alt="OR" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div class="or-reveal-group">
            <div class="or-arrow ${arrowClass}">
              ${iconContent}
            </div>
            <div class="or-logo or-site-logo" style="background: transparent;">
              <img src="${siteLogo}" alt="Site" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="or-divider"></div>
            <div class="or-text">
              ${textContent}
            </div>
          </div>
        </div>
      </div>
    `;

    if (!document.getElementById('or-magic-overlay-style')) {
      const style = document.createElement('style');
      style.id = 'or-magic-overlay-style';
      style.textContent = `
        #or-magic-overlay { position: fixed; top: 64px; left: 50%; transform: translateX(-50%) translateY(-20px); z-index: 2147483647; opacity: 0; pointer-events: none; transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.19, 1, 0.22, 1); font-family: 'Pretendard', sans-serif; }
        #or-magic-overlay.visible { opacity: 1; transform: translateX(-50%) translateY(0); }
        #or-magic-overlay .or-box { background: rgba(15, 23, 42, 0.98); backdrop-filter: blur(24px); padding: 10px; border-radius: 28px; border: 2px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: flex-start; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.4); width: 80px; height: 80px; box-sizing: border-box; transition: width 0.9s cubic-bezier(0.19, 1, 0.22, 1), border-color 0.5s ease, box-shadow 0.5s ease; }
        #or-magic-overlay.expanded .or-box { width: 580px; }
        #or-magic-overlay .or-inner-content { display: flex; align-items: center; flex-wrap: nowrap; flex-shrink: 0; width: 600px; height: 100%; }
        #or-magic-overlay .or-logo { width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
        #or-magic-overlay .or-brand { background: linear-gradient(135deg, #2563eb, #1d4ed8); }
        #or-magic-overlay .or-site-logo { background: transparent; }
        #or-magic-overlay .or-reveal-group { display: flex; align-items: center; gap: 20px; opacity: 0; transform: translateX(-30px); transition: opacity 0.7s ease, transform 0.9s cubic-bezier(0.19, 1, 0.22, 1); width: 0; overflow: hidden; padding-left: 20px; }
        #or-magic-overlay.expanded .or-reveal-group { opacity: 1; transform: translateX(0); width: 480px; }
        #or-magic-overlay .or-arrow { color: #60a5fa; width: 28px; display: flex; justify-content: center; }
        #or-magic-overlay .or-divider { width: 2px; height: 36px; background: rgba(255,255,255,0.18); }
        #or-magic-overlay .or-text { color: white; font-size: 22px; font-weight: 700; }
        #or-magic-overlay .or-text strong { color: #60a5fa; font-weight: 900; margin-right: 8px; }
        
        .or-bounce-x { animation: or-bounce-x 1s infinite; }
        @keyframes or-bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(6px); }
        }
      `;
      document.head.appendChild(style);
    }
    document.body.appendChild(overlay);
    
    // Force reflow for animation restart if needed
    void overlay.offsetWidth;

    setTimeout(() => { 
      overlay.classList.add('visible'); 
      setTimeout(() => overlay.classList.add('expanded'), 450); 
    }, 100);
    
    setTimeout(() => { 
      overlay.classList.remove('expanded'); 
      setTimeout(() => { 
        overlay.classList.remove('visible'); 
        setTimeout(() => overlay.remove(), 1000); 
      }, 1000); 
    }, mode === 'success' ? 4000 : 5500);
  } catch (e) {}
};

const createFAB = () => {
  if (document.getElementById('or-magic-fab-container')) return;
  try {
    const container = document.createElement('div');
    container.id = 'or-magic-fab-container';
    container.innerHTML = `
      <div class="or-fab-tooltip">
        <span class="or-tooltip-text">OneResume Connect 자동입력</span>
        <div class="or-tooltip-arrow or-bounce-x">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </div>
      </div>
      <button id="or-magic-fab">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/></svg>
      </button>
    `;
    const style = document.createElement('style');
    style.textContent = `
      #or-magic-fab-container { position: fixed; bottom: 40px; right: 40px; display: flex; align-items: center; gap: 12px; z-index: 2147483646; }
      #or-magic-fab { width: 60px; height: 60px; border-radius: 18px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; border: 2.5px solid rgba(255,255,255,0.1); box-shadow: 0 12px 30px rgba(37, 99, 235, 0.4); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
      .or-fab-tooltip { background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); color: white; padding: 10px 18px; border-radius: 14px; font-family: 'Pretendard', sans-serif; font-size: 14px; font-weight: 800; opacity: 0; transform: translateX(10px); transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1); pointer-events: none; white-space: nowrap; border: 1px solid rgba(255,255,255,0.15); display: flex; align-items: center; gap: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
      #or-magic-fab-container:hover .or-fab-tooltip { opacity: 1; transform: translateX(0); }
      #or-magic-fab:hover { transform: translateY(-6px) scale(1.1); box-shadow: 0 20px 40px rgba(37, 99, 235, 0.5); }
      .or-fab-spin svg { animation: or-spin 1s linear infinite; } @keyframes or-spin { 100% { transform: rotate(360deg); } }
      .or-tooltip-arrow { color: #60a5fa; display: flex; }
      
      /* 강제 표시 클래스 (완료 알림용) */
      #or-magic-fab-container.or-force-show .or-fab-tooltip {
        opacity: 1 !important;
        transform: translateX(0) !important;
        background: rgba(16, 185, 129, 0.95) !important;
        border-color: rgba(255, 255, 255, 0.3) !important;
      }
      #or-magic-fab-container.or-force-show .or-tooltip-text { color: white !important; }
      #or-magic-fab-container.or-force-show .or-tooltip-arrow { display: none !important; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(container);
    
    const fabBtn = document.getElementById('or-magic-fab');
    const tooltipText = document.querySelector('.or-tooltip-text');
    
    fabBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!cachedResumeData) {
        alert("데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
        fetchResumeDataFromBg();
        return;
      }

      // 1. 상태 전환: 로딩/실행 중
      fabBtn.classList.add('or-fab-spin');
      const originalIcon = fabBtn.innerHTML;
      const originalBg = fabBtn.style.background;
      const originalText = tooltipText.textContent;
      
      // 2. 자동 입력 실행
      await runAutofill(cachedResumeData);
      
      // 3. 중앙 오버레이 띄우기 (사람인/잡코리아 감지)
      const host = window.location.hostname;
      let siteName = null;
      let themeColor = null;
      if (host.includes('saramin.co.kr')) { siteName = '사람인'; themeColor = '#4876ef'; }
      else if (host.includes('jobkorea.co.kr')) { siteName = '잡코리아'; themeColor = '#ff4b13'; }
      if (siteName) createOverlay(siteName, themeColor, 'success');

      // 4. FAB 상태 전환: 완료 알림
      fabBtn.classList.remove('or-fab-spin');
      fabBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      fabBtn.style.background = '#10b981';
      fabBtn.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.6)';
      
      tooltipText.textContent = "자동입력이 완료되었습니다";
      container.classList.add('or-force-show');
      
      // 5. 원복 (3.5초 후)
      setTimeout(() => {
        fabBtn.innerHTML = originalIcon;
        fabBtn.style.background = originalBg;
        fabBtn.style.boxShadow = '';
        tooltipText.textContent = originalText;
        container.classList.remove('or-force-show');
      }, 3500);
    });
  } catch (e) {}
};

const initSmartEngine = () => {
  if (!isExtensionActive) return;
  try {
    const host = window.location.hostname;
    let siteName = null;
    let themeColor = null;
    if (host.includes('saramin.co.kr')) { siteName = '사람인'; themeColor = '#4876ef'; }
    else if (host.includes('jobkorea.co.kr')) { siteName = '잡코리아'; themeColor = '#ff4b13'; }
    
    if (siteName && window.self === window.top) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { 
          createOverlay(siteName, themeColor); 
          createFAB(); 
          createAIWidget();
        });
      } else {
        setTimeout(() => { 
          createOverlay(siteName, themeColor); 
          createFAB(); 
          createAIWidget();
        }, 500);
      }
    }
  } catch (e) {}
};

const extractJDText = () => {
  const host = window.location.hostname;
  let text = `[공고 URL]: ${window.location.href}\n\n`;
  try {
    let extracted = "";
    if (host.includes('saramin.co.kr')) {
      const container = document.querySelector('.wrap_jv_cont, .cont_info, .jv_summary, .wrap_jview');
      if (container) extracted = container.innerText;
    } else if (host.includes('jobkorea.co.kr')) {
      const container = document.querySelector('.artReadJobSum, .stContainer, .artReadTxt, .tbRow');
      if (container) extracted = container.innerText;
    }
    
    if (!extracted || extracted.trim().length < 50) {
      extracted = document.body.innerText;
    }
    text += extracted;
  } catch (e) {
    text += document.body.innerText;
  }
  return text.substring(0, 8000);
};

const createAIWidget = () => {
  if (document.getElementById('or-ai-widget-container')) return;
  try {
    const container = document.createElement('div');
    container.id = 'or-ai-widget-container';
    container.innerHTML = `
      <div id="or-ai-toggle" class="or-ai-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg>
        <span>AI 분석</span>
      </div>
      <div id="or-ai-menu" class="or-ai-panel or-ai-hidden">
        <button id="or-btn-match" class="or-ai-action-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          공고 적합도 매칭
        </button>
        <button id="or-btn-cover" class="or-ai-action-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          맞춤형 자소서 생성
        </button>
      </div>
      <div id="or-ai-result" class="or-ai-panel or-ai-hidden">
        <div class="or-ai-result-header">
          <span id="or-ai-result-title">분석 결과</span>
          <button id="or-ai-close-btn">&times;</button>
        </div>
        <div id="or-ai-result-content"></div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #or-ai-widget-container { position: fixed; top: 120px; right: 40px; z-index: 2147483646; font-family: 'Pretendard', sans-serif; display: flex; flex-direction: column; align-items: flex-end; pointer-events: none; }
      #or-ai-widget-container > * { pointer-events: auto; }
      .or-ai-btn { position: relative; z-index: 2; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); color: white; padding: 10px 16px; border-radius: 20px; font-size: 14px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 10px 25px rgba(0,0,0,0.3); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; }
      .or-ai-btn:hover { background: #4f46e5; border-color: #6366f1; transform: translateY(-2px); box-shadow: 0 15px 30px rgba(79, 70, 229, 0.4); }
      .or-ai-btn:active { transform: scale(0.95); }
      
      .or-ai-panel { position: absolute; top: 52px; right: 0; background: rgba(15, 23, 42, 0.98); backdrop-filter: blur(16px); border-radius: 18px; border: 1px solid rgba(255,255,255,0.15); padding: 8px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); opacity: 1; transform: translateY(0) scale(1); visibility: visible; transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0s 0s; transform-origin: top right; z-index: 1; }
      .or-ai-hidden { opacity: 0; transform: translateY(-10px) scale(0.95); visibility: hidden; pointer-events: none; transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), visibility 0s 0.25s; }
      
      .or-ai-action-btn { background: transparent; border: none; color: white; padding: 12px 16px; text-align: left; border-radius: 12px; font-size: 13.5px; font-weight: 700; cursor: pointer; transition: background 0.2s, transform 0.1s; display: flex; align-items: center; gap: 10px; width: 190px; }
      .or-ai-action-btn:hover { background: rgba(255,255,255,0.1); transform: translateX(2px); }
      .or-ai-action-btn:active { transform: scale(0.98); }
      
      #or-ai-result { padding: 18px; width: 340px; color: white; display: flex; flex-direction: column; max-height: 520px; }
      .or-ai-result-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; margin-bottom: 12px; }
      #or-ai-result-title { font-weight: 800; font-size: 15px; color: #818cf8; display: flex; align-items: center; gap: 6px; }
      #or-ai-close-btn { background: transparent; border: none; color: #94a3b8; font-size: 24px; cursor: pointer; padding: 0; line-height: 1; transition: color 0.2s; }
      #or-ai-close-btn:hover { color: white; }
      
      #or-ai-result-content { overflow-y: auto; font-size: 13.5px; line-height: 1.7; padding-right: 6px; color: #cbd5e1; }
      #or-ai-result-content::-webkit-scrollbar { width: 4px; }
      #or-ai-result-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
      .or-ai-section-title { font-weight: 800; color: white; margin-top: 14px; margin-bottom: 6px; font-size: 14px; border-left: 3px solid #6366f1; padding-left: 8px; }
      .or-ai-score { font-size: 28px; font-weight: 900; color: #10b981; text-shadow: 0 0 15px rgba(16,185,129,0.3); }
      .or-ai-tag { display: inline-block; background: rgba(255,255,255,0.08); padding: 3px 8px; border-radius: 6px; margin: 2px; font-size: 11.5px; font-weight: 600; }
      .or-ai-tag.matched { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
      .or-ai-tag.missing { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }
      .or-loading-spinner { animation: or-spin 0.8s linear infinite; display: inline-block; width: 20px; height: 20px; border: 2.5px solid rgba(255,255,255,0.2); border-top-color: #6366f1; border-radius: 50%; }
      @keyframes or-spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
    document.body.appendChild(container);

    const toggleBtn = document.getElementById('or-ai-toggle');
    const menu = document.getElementById('or-ai-menu');
    const resultBox = document.getElementById('or-ai-result');
    const closeBtn = document.getElementById('or-ai-close-btn');
    const contentBox = document.getElementById('or-ai-result-content');
    const titleBox = document.getElementById('or-ai-result-title');

    let isMenuOpen = false;

    toggleBtn.addEventListener('click', () => {
      isMenuOpen = !isMenuOpen;
      if (isMenuOpen) {
        menu.classList.remove('or-ai-hidden');
        resultBox.classList.add('or-ai-hidden');
      } else {
        menu.classList.add('or-ai-hidden');
      }
    });

    closeBtn.addEventListener('click', () => {
      resultBox.classList.add('or-ai-hidden');
    });

    const callAI = (endpoint, bodyData, renderSuccess) => {
      chrome.storage.local.get(['oneresume_token'], (res) => {
        if (!res.oneresume_token) {
          alert('먼저 확장 프로그램을 연동해주세요.');
          return;
        }
        const token = atob(res.oneresume_token);

        menu.classList.add('or-ai-hidden');
        resultBox.classList.remove('or-ai-hidden');
        
        contentBox.innerHTML = '<div style="display:flex; flex-direction:column; align-items:center; padding: 40px 0;"><div class="or-loading-spinner"></div><div style="margin-top:15px; color:#94a3b8; font-weight:600;">AI가 분석 중입니다...</div></div>';

        chrome.runtime.sendMessage({
          action: "CALL_AI_API",
          endpoint: endpoint,
          token: token,
          body: bodyData
        }, (response) => {
          if (chrome.runtime.lastError || !response || !response.success) {
            contentBox.innerHTML = `<div style="color:#ef4444; padding:20px; text-align:center;">오류가 발생했습니다:<br>${response ? response.error : '네트워크 오류'}</div>`;
            return;
          }
          renderSuccess(response.data);
        });
      });
    };

    document.getElementById('or-btn-match').addEventListener('click', () => {
      titleBox.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> 공고 적합도 매칭`;
      const jdText = extractJDText();
      callAI('/api/ai/match-jd', { jdText }, (data) => {
        // [Security] innerHTML 대신 fragment와 textContent를 사용하여 XSS 방어
        contentBox.innerHTML = ''; // 초기화
        
        const scoreBox = document.createElement('div');
        scoreBox.style.cssText = "text-align: center; margin-bottom: 20px; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 14px;";
        
        const scoreLabel = document.createElement('div');
        scoreLabel.style.cssText = "font-size:12px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:1px;";
        scoreLabel.textContent = "Match Score";
        
        const scoreVal = document.createElement('div');
        scoreVal.className = "or-ai-score";
        scoreVal.textContent = `${data.score}점`;
        
        scoreBox.appendChild(scoreLabel);
        scoreBox.appendChild(scoreVal);
        contentBox.appendChild(scoreBox);

        const renderTags = (title, keywords, className) => {
          const titleDiv = document.createElement('div');
          titleDiv.className = "or-ai-section-title";
          titleDiv.textContent = title;
          contentBox.appendChild(titleDiv);
          
          const tagContainer = document.createElement('div');
          tagContainer.style.marginBottom = "10px";
          
          if (keywords && keywords.length > 0) {
            keywords.forEach(k => {
              const span = document.createElement('span');
              span.className = `or-ai-tag ${className}`;
              span.textContent = k;
              tagContainer.appendChild(span);
            });
          } else {
            tagContainer.textContent = "-";
          }
          contentBox.appendChild(tagContainer);
        };

        renderTags("일치하는 역량", data.matchedKeywords, "matched");
        renderTags("부족한 역량", data.missingKeywords, "missing");

        const tipTitle = document.createElement('div');
        tipTitle.className = "or-ai-section-title";
        tipTitle.textContent = "AI 개선 팁";
        contentBox.appendChild(tipTitle);

        const tipList = document.createElement('ul');
        tipList.style.cssText = "padding-left: 18px; margin-top: 8px;";
        data.improvementTips?.forEach(t => {
          const li = document.createElement('li');
          li.style.cssText = "margin-bottom:8px; color:#cbd5e1;";
          li.textContent = t;
          tipList.appendChild(li);
        });
        contentBox.appendChild(tipList);
      });
    });

    document.getElementById('or-btn-cover').addEventListener('click', () => {
      titleBox.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> 맞춤형 자소서 생성`;
      const jdText = extractJDText();
      callAI('/api/ai/generate-cover-letter', { jdText }, (data) => {
        // [Security] innerHTML 대신 textContent 사용하여 XSS 방어
        contentBox.innerHTML = ''; // 초기화

        const strategyBox = document.createElement('div');
        strategyBox.style.cssText = "background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.15)); border: 1px solid rgba(99, 102, 241, 0.3); padding: 12px; border-radius: 12px; margin-bottom: 20px; font-size: 13px;";
        
        const strategyTitle = document.createElement('strong');
        strategyTitle.style.cssText = "color:#a5b4fc; display:block; margin-bottom:4px;";
        strategyTitle.textContent = "💡 AI 작성 전략:";
        
        const strategyText = document.createTextNode(data.summary);
        strategyBox.appendChild(strategyTitle);
        strategyBox.appendChild(strategyText);
        contentBox.appendChild(strategyBox);

        const renderSection = (title, text) => {
          const titleDiv = document.createElement('div');
          titleDiv.className = "or-ai-section-title";
          titleDiv.textContent = title;
          contentBox.appendChild(titleDiv);
          
          const contentDiv = document.createElement('div');
          contentDiv.style.cssText = "background: rgba(0,0,0,0.25); padding: 12px; border-radius: 10px; margin-bottom: 12px; white-space: pre-wrap; font-size:13px;";
          contentDiv.textContent = text;
          contentBox.appendChild(contentDiv);
        };

        renderSection("1. 지원동기", data.motivation);
        renderSection("2. 직무 역량", data.competency);
        renderSection("3. 성장과정/성격", data.character);

        const copyBtn = document.createElement('button');
        copyBtn.id = "or-copy-cover";
        copyBtn.style.cssText = "width: 100%; padding: 12px; background: #4f46e5; color: white; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; margin-top: 15px; transition: all 0.2s;";
        copyBtn.textContent = "본문 전체 복사하기";
        
        contentBox.appendChild(copyBtn);
        
        copyBtn.addEventListener('click', (e) => {
          const textToCopy = `[지원동기]\n${data.motivation}\n\n[직무 역량]\n${data.competency}\n\n[성장과정/성격]\n${data.character}`;
          navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = "✅ 복사 완료!";
            copyBtn.style.background = "#10b981";
            setTimeout(() => {
              copyBtn.textContent = originalText;
              copyBtn.style.background = "#4f46e5";
            }, 2000);
          });
        });
      });
    });

  } catch (e) {}
};