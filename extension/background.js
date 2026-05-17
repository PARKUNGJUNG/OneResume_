chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FETCH_RESUME_DATA") {
    fetch("https://api.oneresume.kr/api/resume/export", {
      headers: { 'Authorization': `Bearer ${request.token}` }
    })
    .then(response => {
      if (!response.ok) throw new Error("Server responded with status: " + response.status);
      return response.json();
    })
    .then(data => {
      sendResponse({ success: true, data: data });
    })
    .catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; 
  }

  // 모든 프레임으로 데이터 전파 (Broadcast)
  if (request.action === "BROADCAST_RESUME_DATA" && sender.tab) {
    chrome.webNavigation.getAllFrames({ tabId: sender.tab.id }, (frames) => {
      if (frames) {
        frames.forEach(frame => {
          // .catch()를 추가하여 리스너가 없는 프레임에서의 에러가 콘솔에 남지 않도록 함
          chrome.tabs.sendMessage(sender.tab.id, {
            action: "RUN_AUTOFILL",
            resumeData: request.data
          }, { frameId: frame.frameId }).catch(() => {
            // 조용히 무시 (해당 프레임에 content.js가 없거나 권한이 없는 경우임)
          });
        });
      }
    });
    sendResponse({ success: true });
  }
});
