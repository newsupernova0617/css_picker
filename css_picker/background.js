// Chrome 확장 프로그램의 백그라운드에서 실행되는 메인 서비스 클래스입니다
// 이 스크립트는 확장 프로그램이 설치되는 동안 계속 백그라운드에서 실행됩니다
class BackgroundService {
  
  // 클래스가 생성될 때 실행되는 초기화 함수입니다
  constructor() {
    // 현재 활성화된 탭의 ID를 저장하는 변수 (null이면 활성 탭이 없음)
    this.activeTabId = null;
    
    // 피커 기능이 현재 활성화되어 있는지를 나타내는 변수 (true = 켜짐, false = 꺼짐)
    this.isPickerActive = false;
    
    // 사이드패널의 상태를 주기적으로 확인하는 타이머를 저장하는 변수
    this.healthCheckInterval = null;
    
    // 초기화 함수를 호출합니다
    this.init();
  }
  
  // 백그라운드 서비스를 초기화하는 함수입니다
  init() {
    // 각종 이벤트 리스너들을 설정합니다
    this.setupEventListeners();
    
    // 사이드패널 상태 확인을 시작합니다
    this.startHealthCheck();
  }
  
  // Chrome 확장 프로그램의 각종 이벤트들을 처리할 리스너들을 설정하는 함수입니다
  setupEventListeners() {
    // 사용자가 확장 프로그램 아이콘을 클릭했을 때 실행됩니다
    chrome.action.onClicked.addListener((tab) => {
      this.handleActionClick(tab); // 아이콘 클릭을 처리하는 함수를 호출합니다
    });
    
    // 다른 스크립트(사이드패널, 컨텐츠 스크립트)에서 메시지가 올 때 실행됩니다
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse); // 메시지를 처리하는 함수를 호출합니다
    });
    
    // 사용자가 다른 탭으로 이동했을 때 실행됩니다
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabChange(activeInfo); // 탭 변경을 처리하는 함수를 호출합니다
    });
    
    // 탭의 상태가 변경되었을 때 (로딩 중, 완료 등) 실행됩니다
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab); // 탭 업데이트를 처리하는 함수를 호출합니다
    });
    
    // 다운로드 완료 이벤트 처리
    chrome.downloads.onChanged.addListener((delta) => {
      this.handleDownloadChange(delta);
    });
  }
  
  // 사용자가 확장 프로그램 아이콘을 클릭했을 때 실행되는 함수입니다
  async handleActionClick(tab) {
    try {
      // async/await는 비동기 작업을 순서대로 처리하기 위한 문법입니다
      // 사이드패널을 엽니다 - await는 이 작업이 완료될 때까지 기다립니다
      await chrome.sidePanel.open({ tabId: tab.id });
      
      // 현재 활성 탭 ID를 저장합니다
      this.activeTabId = tab.id;
    } catch (error) {
      // 사이드패널 열기에 실패하면 콘솔에 오류를 출력합니다
      console.error("Failed to open side panel:", error);
    }
  }
  
  // 다른 스크립트에서 온 메시지를 처리하는 함수입니다
  handleMessage(message, sender, sendResponse) {
    // 메시지에서 타입과 타임스탬프를 추출합니다 (구조 분해 할당 문법)
    const { type, timestamp } = message;
    
    // 메시지 타입에 따라 다른 동작을 수행합니다 (switch 문)
    switch (type) {
      case "sidepanel_opened":
        // 사이드패널이 열렸다는 메시지를 받으면
        this.enablePicker(); // 피커 기능을 활성화합니다
        sendResponse({ success: true }); // 성공했다고 응답합니다
        break;
        
      case "sidepanel_closed":
        // 사이드패널이 닫혔다는 메시지를 받으면
        this.disablePicker(); // 피커 기능을 비활성화합니다
        sendResponse({ success: true }); // 성공했다고 응답합니다
        break;
        
      case "download_assets":
        // Asset 다운로드 메시지를 받았을 때
        this.downloadAssets(message.assets).then(result => {
          sendResponse(result);
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        return true; // 비동기 응답을 위해 true 반환

      case "CLERK_AUTH_SUCCESS":
        // Clerk 인증 성공 메시지를 받았을 때
        this.handleClerkAuthSuccess(message.data).then(result => {
          sendResponse(result);
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        return true; // 비동기 응답을 위해 true 반환
        
      default:
        // 알 수 없는 메시지 타입인 경우
        sendResponse({ success: false, error: "Unknown message type" }); // 오류 응답을 보냅니다
    }
  }
  
  // 피커 기능을 활성화하는 함수입니다
  async enablePicker() {
    // 피커가 활성화되었다고 표시합니다
    this.isPickerActive = true;
    
    try {
      // 현재 활성화된 탭을 찾습니다
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // tabs[0]?.id는 "tabs[0]이 존재하고 그 안에 id가 있으면"이라는 의미입니다 (옵셔널 체이닝)
      if (tabs[0]?.id) {
        // 활성 탭 ID를 저장합니다
        this.activeTabId = tabs[0].id;
        
        // 컨텐츠 스크립트가 로드되어 있는지 먼저 확인
        try {
          await chrome.tabs.sendMessage(this.activeTabId, { 
            action: "border-on", // 액션 타입을 "테두리 켜기"로 설정
            timestamp: Date.now() // 현재 시간을 함께 보냅니다
          });
        } catch (messageError) {
          // 컨텐츠 스크립트가 로드되어 있지 않으면 주입하고 다시 시도
          await chrome.scripting.executeScript({
            target: { tabId: this.activeTabId },
            files: ['content.js']
          });
          
          // 주입 후 메시지 재전송
          await chrome.tabs.sendMessage(this.activeTabId, { 
            action: "border-on",
            timestamp: Date.now()
          });
        }
        
        // 콘솔에 성공 메시지를 출력합니다
        console.log("Picker enabled for tab:", this.activeTabId);
      }
    } catch (error) {
      // 피커 활성화에 실패하면 콘솔에 오류를 출력합니다
      console.error("Failed to enable picker:", error);
    }
  }
  
  // 피커 기능을 비활성화하는 함수입니다
  async disablePicker() {
    // 피커가 비활성화되었다고 표시합니다
    this.isPickerActive = false;
    
    // 활성 탭이 없으면 함수를 종료합니다
    if (!this.activeTabId) return;
    
    try {
      // 컨텐츠 스크립트에게 "테두리 끄기" 메시지 전송 시도
      try {
        await chrome.tabs.sendMessage(this.activeTabId, { 
          action: "border-off", // 액션 타입을 "테두리 끄기"로 설정
          timestamp: Date.now() // 현재 시간을 함께 보냅니다
        });
      } catch (messageError) {
        // 컨텐츠 스크립트가 로드되어 있지 않아도 정상적인 상황
        console.log("Content script not loaded, normal for picker disable");
      }
      
      // 콘솔에 성공 메시지를 출력합니다
      console.log("Picker disabled for tab:", this.activeTabId);
    } catch (error) {
      // 피커 비활성화에 실패하면 콘솔에 오류를 출력합니다
      console.error("Failed to disable picker:", error);
    }
  }
  
  // 사용자가 다른 탭으로 이동했을 때 실행되는 함수입니다
  handleTabChange(activeInfo) {
    // 피커가 활성화되어 있고, 새로운 탭이 현재 활성 탭과 다르다면
    if (this.isPickerActive && this.activeTabId !== activeInfo.tabId) {
      // 이전 탭에서 피커를 비활성화합니다
      this.disablePicker();
      
      // 새로운 탭 ID를 저장합니다
      this.activeTabId = activeInfo.tabId;
      
      // setTimeout은 지정된 시간 후에 함수를 실행하는 함수입니다
      // 100ms 후에 새로운 탭에서 피커를 다시 활성화합니다
      setTimeout(() => {
        if (this.isPickerActive) { // 여전히 피커가 활성화 상태라면
          this.enablePicker(); // 새로운 탭에서 피커를 켭니다
        }
      }, 100); // 100밀리초 = 0.1초 후에 실행
    }
  }
  
  // 탭의 상태가 업데이트되었을 때 (페이지 로딩 완료 등) 실행되는 함수입니다
  handleTabUpdate(tabId, changeInfo, tab) {
    // 페이지 로딩이 완료되고, 피커가 활성화되어 있고, 해당 탭이 현재 활성 탭이라면
    if (changeInfo.status === "complete" && 
        this.isPickerActive && 
        tabId === this.activeTabId) {
      
      // 500ms 후에 피커를 다시 활성화합니다
      // 페이지가 새로 로드되면 컨텐츠 스크립트도 새로 로드되기 때문입니다
      setTimeout(() => {
        this.enablePicker();
      }, 500); // 500밀리초 = 0.5초 후에 실행
    }
  }
  
  // 사이드패널이 살아있는지 주기적으로 확인하는 기능을 시작하는 함수입니다
  startHealthCheck() {
    // setInterval은 지정된 시간마다 반복해서 함수를 실행하는 함수입니다
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck(); // 상태 확인 함수를 호출합니다
    }, 3000); // 3000밀리초 = 3초마다 실행
  }
  
  // 실제로 사이드패널의 상태를 확인하는 함수입니다
  performHealthCheck() {
    // 피커가 비활성화 상태라면 확인할 필요가 없습니다
    if (!this.isPickerActive) return;
    
    // 사이드패널에게 "살아있는지" 확인하는 ping 메시지를 보냅니다
    chrome.runtime.sendMessage({ ping: true }, (response) => {
      // 오류가 발생했거나 응답이 없으면 사이드패널이 닫혔다고 판단합니다
      if (chrome.runtime.lastError || !response) {
        console.log("Side panel disconnected, disabling picker");
        this.disablePicker(); // 피커를 비활성화합니다
      }
    });
  }
  
  // Asset들을 다운로드하는 함수입니다
  async downloadAssets(assets) {
    if (!assets || assets.length === 0) {
      return { success: false, error: "No assets to download" };
    }

    const downloadResults = [];
    const failedDownloads = [];

    try {
      // 각 asset을 순차적으로 다운로드합니다
      for (const asset of assets) {
        try {
          // 파일명을 URL에서 추출합니다
          const url = new URL(asset.url);
          const pathParts = url.pathname.split('/');
          let filename = pathParts[pathParts.length - 1] || 'download';
          
          // 확장자가 없으면 asset 타입에 따라 추가합니다
          if (!filename.includes('.')) {
            const extensions = {
              'image': '.jpg',
              'stylesheet': '.css',
              'script': '.js',
              'font': '.woff',
              'video': '.mp4',
              'audio': '.mp3'
            };
            filename += extensions[asset.type] || '.txt';
          }

          // 다운로드를 시작합니다
          const downloadId = await chrome.downloads.download({
            url: asset.url,
            filename: `CSS-Picker-Assets/${asset.type}s/${filename}`,
            conflictAction: 'uniquify' // 파일명이 중복되면 자동으로 번호를 붙입니다
          });

          downloadResults.push({
            id: downloadId,
            url: asset.url,
            filename: filename,
            type: asset.type
          });

          console.log(`Download started: ${filename} (ID: ${downloadId})`);

        } catch (error) {
          console.error(`Failed to download asset: ${asset.url}`, error);
          failedDownloads.push({
            url: asset.url,
            error: error.message
          });
        }
      }

      return {
        success: true,
        downloadedCount: downloadResults.length,
        failedCount: failedDownloads.length,
        downloads: downloadResults,
        failures: failedDownloads
      };

    } catch (error) {
      console.error("Download assets error:", error);
      return { success: false, error: error.message };
    }
  }

  // 다운로드 상태 변경을 처리하는 함수입니다
  handleDownloadChange(delta) {
    // 다운로드 완료 시 알림을 보냅니다
    if (delta.state && delta.state.current === 'complete') {
      console.log(`Download completed: ${delta.id}`);
      
      // 사이드패널에 다운로드 완료 알림을 보냅니다
      chrome.runtime.sendMessage({
        type: 'download_complete',
        downloadId: delta.id
      }).catch(() => {
        // 사이드패널이 닫혀있으면 무시합니다
      });
    }

    // 다운로드 실패 시 알림을 보냅니다
    if (delta.state && delta.state.current === 'interrupted') {
      console.error(`Download failed: ${delta.id}`);
      
      chrome.runtime.sendMessage({
        type: 'download_failed',
        downloadId: delta.id,
        error: delta.error
      }).catch(() => {
        // 사이드패널이 닫혀있으면 무시합니다
      });
    }
  }

  // Clerk 인증 성공을 처리하는 함수입니다
  async handleClerkAuthSuccess(authData) {
    try {
      console.log('Background: Handling Clerk auth success', authData);

      // Chrome storage에 인증 정보를 저장합니다
      await chrome.storage.local.set({
        clerk_session: authData.sessionToken,
        clerk_user: authData.user
      });

      console.log('Background: Auth data saved to storage');

      // clerkClient가 있다면 업데이트합니다
      // 이를 위해 clerk-config.js를 가져와서 업데이트할 수 있습니다
      chrome.runtime.sendMessage({
        type: 'CLERK_AUTH_UPDATE',
        data: authData
      }).catch(() => {
        // sidepanel이 닫혀있으면 무시합니다
        console.log('Sidepanel not open, auth data saved to storage');
      });

      return { success: true, message: 'Auth data processed successfully' };

    } catch (error) {
      console.error('Background: Failed to handle auth success:', error);
      return { success: false, error: error.message };
    }
  }

  // 리소스를 정리하는 함수입니다 (메모리 누수 방지)
  cleanup() {
    // 상태 확인 타이머가 있다면 중지합니다
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval); // 타이머를 제거합니다
    }
  }
}

// BackgroundService 클래스의 인스턴스(실제 객체)를 생성합니다
// 이렇게 하면 백그라운드 서비스가 시작됩니다
new BackgroundService();