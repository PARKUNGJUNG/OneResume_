console.log("🚀 OneResume Connect: Engine v1.4.3 (Sync-Injection) Loaded");

const encodeToken = (str) => {
  try { return btoa(str); } catch(e) { return str; }
};

window.addEventListener('ONERESUME_PING', () => {
  try {
    if (window.chrome && chrome.runtime && chrome.runtime.id) {
      window.dispatchEvent(new CustomEvent('ONERESUME_PONG'));
    }
  } catch (e) {}
});

window.addEventListener('message', (event) => {
  try {
    if (!event || !event.data || typeof event.data !== 'object') return;
    if (event.data.type === 'ONERESUME_SYNC_TOKEN') {
      const { token } = event.data;
      if (window.chrome && chrome.runtime && chrome.runtime.id) {
        chrome.storage.local.set({ 'oneresume_token': encodeToken(token) }, () => {
          window.postMessage({ type: 'ONERESUME_SYNC_SUCCESS' }, "*");
          fetchResumeDataFromBg(); // 토큰 동기화 시 데이터 갱신
        });
      }
    }
  } catch (err) {}
});

/**
 * ---------------------------------------------------------
 * [버전 1.4.3] 데이터 캐싱 시스템 (비동기 제스처 유실 방지)
 * ---------------------------------------------------------
 */
let cachedResumeData = null;

const fetchResumeDataFromBg = () => {
  if (!window.chrome || !chrome.runtime || !chrome.storage) return;
  chrome.storage.local.get(['oneresume_token'], (result) => {
    if (result.oneresume_token) {
      try {
        const token = atob(result.oneresume_token);
        chrome.runtime.sendMessage({ action: "FETCH_RESUME_DATA", token: token }, (response) => {
          if (response && response.success) {
            cachedResumeData = response.data;
            console.log("📦 OR Connect: Resume Data Cached for Synchronous Injection");
          }
        });
      } catch (e) {}
    }
  });
};

// 스크립트 로드 시 즉시 데이터 캐싱 시작 (1분마다 갱신)
fetchResumeDataFromBg();
setInterval(fetchResumeDataFromBg, 60000);

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

const forceInput = (element, value, domainType) => {
  if (!element) return;
  try {
    // 팝업 버튼처럼 동기식으로 실행되므로 브라우저가 포커스를 허용함
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
    element.blur();
  } catch (err) {
    element.value = value;
  }
};

const runAutofill = async (resumeData) => {
  if (!resumeData) return;
  const host = window.location.hostname;
  const domainType = host.includes('saramin.co.kr') ? 'saramin' : (host.includes('jobkorea.co.kr') ? 'jobkorea' : 'other');

  // [전역 보안] 중복 입력 및 리스트 팝업 방지를 위해 메인 프레임에서만 실행
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
if (window.chrome && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "RUN_AUTOFILL") {
      runAutofill(request.resumeData);
      sendResponse({ status: "success" });
    }
    return true;
  });
}

/**
 * ---------------------------------------------------------
 * [프리미엄 디자인 완전 복구] Ultra-Seamless Overlay
 * ---------------------------------------------------------
 */
const createOverlay = (siteName, themeColor) => {
  const overlay = document.createElement('div');
  overlay.id = 'or-magic-overlay';
  let siteLogo = siteName === '사람인' ? chrome.runtime.getURL('icons/saramin.webp') : 'https://www.jobkorea.co.kr/favicon.ico';

  overlay.innerHTML = `
    <div class="or-box">
      <div class="or-inner-content">
        <div class="or-logo or-brand">
          <img src="${chrome.runtime.getURL('icons/logo.png')}" alt="OR" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div class="or-reveal-group">
          <div class="or-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
          <div class="or-logo or-site-logo" style="background: transparent;">
            <img src="${siteLogo}" alt="Site" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div class="or-divider"></div>
          <div class="or-text">
            <strong>${siteName}</strong> 자동입력 준비완료
          </div>
        </div>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #or-magic-overlay { position: fixed; top: 64px; left: 50%; transform: translateX(-50%) translateY(-20px); z-index: 2147483647; opacity: 0; pointer-events: none; transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.19, 1, 0.22, 1); font-family: 'Pretendard', sans-serif; }
    #or-magic-overlay.visible { opacity: 1; transform: translateX(-50%) translateY(0); }
    #or-magic-overlay .or-box { background: rgba(15, 23, 42, 0.98); backdrop-filter: blur(24px); padding: 10px; border-radius: 28px; border: 2px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: flex-start; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.4); width: 80px; height: 80px; box-sizing: border-box; transition: width 0.9s cubic-bezier(0.19, 1, 0.22, 1); }
    #or-magic-overlay.expanded .or-box { width: 580px; }
    #or-magic-overlay .or-inner-content { display: flex; align-items: center; flex-wrap: nowrap; flex-shrink: 0; width: 600px; height: 100%; }
    #or-magic-overlay .or-logo { width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
    #or-magic-overlay .or-brand { background: linear-gradient(135deg, #2563eb, #1d4ed8); }
    #or-magic-overlay .or-site-logo { background: transparent; }
    #or-magic-overlay .or-reveal-group { display: flex; align-items: center; gap: 20px; opacity: 0; transform: translateX(-30px); transition: opacity 0.7s ease, transform 0.9s cubic-bezier(0.19, 1, 0.22, 1); width: 0; overflow: hidden; padding-left: 20px; }
    #or-magic-overlay.expanded .or-reveal-group { opacity: 1; transform: translateX(0); width: 480px; }
    #or-magic-overlay .or-arrow { color: #60a5fa; width: 28px; display: flex; }
    #or-magic-overlay .or-divider { width: 2px; height: 36px; background: rgba(255,255,255,0.18); }
    #or-magic-overlay .or-text { color: white; font-size: 22px; font-weight: 700; }
    #or-magic-overlay .or-text strong { color: #60a5fa; font-weight: 900; margin-right: 8px; }
  `;
  document.head.appendChild(style);
  document.body.appendChild(overlay);
  setTimeout(() => { overlay.classList.add('visible'); setTimeout(() => overlay.classList.add('expanded'), 1000); }, 100);
  setTimeout(() => { overlay.classList.remove('expanded'); setTimeout(() => { overlay.classList.remove('visible'); setTimeout(() => overlay.remove(), 1000); }, 1000); }, 5500);
};

const createFAB = () => {
  if (document.getElementById('or-magic-fab-container')) return;
  const container = document.createElement('div');
  container.id = 'or-magic-fab-container';
  container.innerHTML = `<div class="or-fab-tooltip">OneResume Connect 자동입력</div><button id="or-magic-fab"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/></svg></button>`;
  const style = document.createElement('style');
  style.textContent = `
    #or-magic-fab-container { position: fixed; bottom: 40px; right: 40px; display: flex; align-items: center; gap: 12px; z-index: 2147483646; }
    #or-magic-fab { width: 60px; height: 60px; border-radius: 18px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; border: 2.5px solid rgba(255,255,255,0.1); box-shadow: 0 12px 30px rgba(37, 99, 235, 0.4); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    .or-fab-tooltip { background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(8px); color: white; padding: 8px 16px; border-radius: 12px; font-family: 'Pretendard', sans-serif; font-size: 14px; font-weight: 700; opacity: 0; transform: translateX(10px); transition: all 0.3s; pointer-events: none; white-space: nowrap; border: 1px solid rgba(255,255,255,0.1); }
    #or-magic-fab-container:hover .or-fab-tooltip { opacity: 1; transform: translateX(0); }
    #or-magic-fab:hover { transform: translateY(-6px) scale(1.1); box-shadow: 0 20px 40px rgba(37, 99, 235, 0.5); }
    .or-fab-spin svg { animation: or-spin 1s linear infinite; } @keyframes or-spin { 100% { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);
  document.body.appendChild(container);
  
  // [완벽 해결] 팝업과 동일한 동기 실행 로직 적용
  document.getElementById('or-magic-fab').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!cachedResumeData) {
      alert("데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요. (또는 팝업창에서 원클릭 동기화를 진행해주세요)");
      fetchResumeDataFromBg();
      return;
    }

    const fab = document.getElementById('or-magic-fab');
    fab.classList.add('or-fab-spin');
    
    // 비동기 딜레이 없이 즉시 캐시된 데이터를 주입 (사용자 제스처 토큰 유지 -> focus 정상 작동)
    runAutofill(cachedResumeData);
    
    fab.classList.remove('or-fab-spin');
    const oldIcon = fab.innerHTML;
    fab.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    fab.style.background = '#10b981';
    setTimeout(() => { fab.innerHTML = oldIcon; fab.style.background = 'linear-gradient(135deg, #2563eb, #1d4ed8)'; }, 3000);
  });
};

const initSmartEngine = () => {
  const host = window.location.hostname;
  let siteName = null;
  let themeColor = null;
  if (host.includes('saramin.co.kr')) { siteName = '사람인'; themeColor = '#4876ef'; }
  else if (host.includes('jobkorea.co.kr')) { siteName = '잡코리아'; themeColor = '#ff4b13'; }
  if (siteName && window.self === window.top) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { createOverlay(siteName, themeColor); createFAB(); });
    else setTimeout(() => { createOverlay(siteName, themeColor); createFAB(); }, 500);
  }
};

initSmartEngine();