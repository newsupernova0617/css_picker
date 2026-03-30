class ConsoleManager {
  constructor() {
    this.messages = [];
    this.filteredMessages = [];
    this.currentFilter = 'all';
    this.searchTerm = '';
    this.isActive = false;
    this.maxMessages = 1000;
    this.messageCount = 0;
    this.messageRate = 0;
    this.lastMessageTime = 0;
    this.memoryUsage = 0;

    // Performance monitoring
    this.performanceTimer = null;
    this.messageRateCounter = 0;
    this.rateCheckInterval = 1000; // 1초마다 체크

    // Message type icons
    this.messageIcons = {
      'log': '💬',
      'info': 'ℹ️',
      'warn': '⚠️',
      'error': '❌',
      'debug': '🐛',
      'failed-fetch': '🌐'
    };

    // Message type colors
    this.messageColors = {
      'log': '#d1d5db',
      'info': '#0dcaf0',
      'warn': '#ffc107',
      'error': '#dc3545',
      'debug': '#6c757d',
      'failed-fetch': '#fd7e14',
      'table': '#d1d5db',
      'groupEnd': '#d1d5db',
      'trace': '#d1d5db'
    };

    this.init();
  }

  init() {
    // 메시지 리스너는 메인 클래스에서 통합 처리됨
  }

  // 콘솔 모니터링 시작
  async startMonitoring() {
    console.log('🔄 startMonitoring called, isActive:', this.isActive);

    if (this.isActive) {
      console.log('⚠️ Console monitoring already active, returning');
      return;
    }

    this.isActive = true;
    console.log('🖥️ Console monitoring started - setting isActive to true');

    try {
      // Always ensure content script is injected first
      console.log('🔧 Ensuring content script injection...');
      await this.ensureContentScriptInjected();
      console.log('✅ Content script injection step completed');

      // content script에 시작 신호 전송
      console.log('📨 Sending startConsoleCapture message to content script...');
      await this.sendMessageToActiveTab('startConsoleCapture');
      console.log('✅ Message sent successfully');

      // 성능 모니터링 시작
      console.log('📊 Starting performance monitoring...');
      this.startPerformanceMonitoring();

      // UI 업데이트
      console.log('🎨 Updating monitoring status UI...');
      this.updateMonitoringStatus(true);

      console.log('🎉 Console monitoring startup completed');
    } catch (error) {
      console.error('❌ Error during console monitoring startup:', error);
      this.isActive = false; // Reset on error
    }
  }

  // Ensure content script is injected
  async ensureContentScriptInjected() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      // Try to send a ping message first
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
        console.log('✅ Content script already injected');
      } catch (error) {
        // Content script not injected, inject it now
        console.log('🔄 Injecting content script...');
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        console.log('✅ Content script injected successfully');
        // Wait a bit for initialization
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Failed to ensure content script injection:', error);
    }
  }

  // 콘솔 모니터링 중지
  stopMonitoring() {
    if (!this.isActive) return;

    this.isActive = false;
    console.log('🖥️ Console monitoring stopped');

    // content script에 중지 신호 전송
    this.sendMessageToActiveTab('stopConsoleCapture');

    // 성능 모니터링 중지
    this.stopPerformanceMonitoring();

    // UI 업데이트
    this.updateMonitoringStatus(false);
  }

  // 활성 탭에 메시지 전송
  async sendMessageToActiveTab(action) {
    let tab = null;
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      tab = tabs[0];

      if (!tab) {
        console.error('No active tab found');
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        action,
        timestamp: Date.now()
      });
      console.log(`📨 Console capture message sent: ${action}`, response);

    } catch (error) {
      console.error('Failed to send message to active tab:', error);

      // Content script might not be injected, try to inject it
      if (error.message.includes('Could not establish connection') && tab) {
        console.log('🔄 Attempting to inject content script...');
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });

          // Wait a bit for content script to initialize
          await new Promise(resolve => setTimeout(resolve, 100));

          // Retry message after injection
          const retryResponse = await chrome.tabs.sendMessage(tab.id, {
            action,
            timestamp: Date.now()
          });
          console.log(`📨 Console capture message sent after injection: ${action}`, retryResponse);
        } catch (injectionError) {
          console.error('Failed to inject content script:', injectionError);
        }
      }
    }
  }

  // 메시지 추가
  addMessage(messageData) {
    console.log('📥 ConsoleManager.addMessage called:', {
      isActive: this.isActive,
      messageData: messageData,
      messagesLength: this.messages.length
    });

    if (!this.isActive) {
      console.warn('⚠️ Console monitoring is not active, message ignored');
      return;
    }

    if (this.messages.length >= this.maxMessages) {
      // 오래된 메시지 제거 (FIFO)
      this.messages.shift();
    }

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...messageData,
      displayTime: this.formatTimestamp(messageData.timestamp)
    };

    this.messages.push(message);
    this.messageCount++;

    console.log('✅ Message added to console monitor:', message);

    // 메시지 속도 계산
    this.updateMessageRate();

    // 필터링된 메시지 업데이트
    this.applyFilters();

    // UI 업데이트
    this.updateMessageDisplay();
    this.updatePerformanceInfo();
  }

  // 메시지 속도 업데이트
  updateMessageRate() {
    const now = Date.now();
    if (this.lastMessageTime === 0) {
      this.lastMessageTime = now;
      return;
    }

    this.messageRateCounter++;

    // 1초마다 속도 계산
    if (now - this.lastMessageTime >= this.rateCheckInterval) {
      this.messageRate = this.messageRateCounter / ((now - this.lastMessageTime) / 1000);
      this.messageRateCounter = 0;
      this.lastMessageTime = now;
    }
  }

  // 필터 적용
  applyFilters() {
    console.log(`Applying filter: ${this.currentFilter}`);
    this.filteredMessages = this.messages.filter(message => {
      // 타입 필터
      const typeMatch = this.currentFilter === 'all' || message.type === this.currentFilter;
      console.log(`Message type: ${message.type}, Current filter: ${this.currentFilter}, Match: ${typeMatch}`);

      // 검색 필터
      const searchMatch = !this.searchTerm ||
        message.args.some(arg =>
          String(arg).toLowerCase().includes(this.searchTerm.toLowerCase())
        );

      return typeMatch && searchMatch;
    });
  }

  // 필터 설정
  setFilter(filter) {
    this.currentFilter = filter;
    this.applyFilters();
    this.updateMessageDisplay();
    this.updateFilterButtons();
  }

  // 검색어 설정
  setSearchTerm(term) {
    this.searchTerm = term;
    this.applyFilters();
    this.updateMessageDisplay();
  }

  // 메시지 표시 업데이트
  updateMessageDisplay() {
    const output = document.getElementById('consoleOutput');
    console.log('📺 updateMessageDisplay called:', {
      outputExists: !!output,
      messagesCount: this.messages.length,
      filteredCount: this.filteredMessages.length
    });

    if (!output) {
      console.warn('⚠️ consoleOutput element not found in DOM');
      return;
    }

    // Welcome 메시지 숨기기
    const welcome = output.querySelector('.console-welcome');
    if (welcome) {
      welcome.style.display = this.messages.length > 0 ? 'none' : 'block';
    }

    // 기존 메시지들 제거 (welcome 제외)
    const existingMessages = output.querySelectorAll('.console-message');
    existingMessages.forEach(msg => msg.remove());

    // 새 메시지들 추가
    this.filteredMessages.slice(-50).forEach(message => { // 최근 50개만 표시
      const messageElement = this.createMessageElement(message);
      output.appendChild(messageElement);
    });

    // 자동 스크롤
    output.scrollTop = output.scrollHeight;

    // 메시지 카운트 업데이트
    this.updateMessageCount();
  }

  // 메시지 엘리먼트 생성
  createMessageElement(message) {
    const div = document.createElement('div');
    div.className = `console-message console-${message.type}`;
    div.dataset.messageId = message.id;

    const icon = this.messageIcons[message.type] || '📝';
    const color = this.messageColors[message.type] || '#333';

    // Create message structure safely without innerHTML
    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'message-icon';
    iconSpan.textContent = icon;

    const typeSpan = document.createElement('span');
    typeSpan.className = 'message-type';
    typeSpan.textContent = message.type.toUpperCase();

    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = message.displayTime;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn btn-sm btn-outline-secondary copy-message-btn';
    copyBtn.title = 'Copy Message';
    copyBtn.textContent = '📋';

    messageHeader.appendChild(iconSpan);
    messageHeader.appendChild(typeSpan);
    messageHeader.appendChild(timeSpan);
    messageHeader.appendChild(copyBtn);

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.style.color = color;
    messageContent.textContent = this.formatMessageContent(message.args);

    div.appendChild(messageHeader);
    div.appendChild(messageContent);

    // Add metadata if exists
    if (message.metadata && Object.keys(message.metadata).length > 0) {
      const metadataDiv = document.createElement('div');
      metadataDiv.className = 'message-metadata';

      const small = document.createElement('small');
      small.textContent = this.formatMetadata(message.metadata);

      metadataDiv.appendChild(small);
      div.appendChild(metadataDiv);
    }

    // 복사 버튼 이벤트 (이미 생성된 copyBtn 재사용)
    copyBtn.addEventListener('click', () => {
      this.copyMessage(message);
    });

    return div;
  }

  // 메시지 내용 포맷팅
  formatMessageContent(args) {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        return `<pre class="json-content">${JSON.stringify(arg, null, 2)}</pre>`;
      } else {
        return this.escapeHtml(String(arg));
      }
    }).join(' ');
  }

  // 메타데이터 포맷팅
  formatMetadata(metadata) {
    return Object.entries(metadata)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' | ');
  }

  // HTML 이스케이프
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 타임스탬프 포맷팅
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  }

  // 메시지 복사
  copyMessage(message) {
    if (planManager.currentPlan !== 'premium') {
      alert('Copying console messages is a Premium feature. Please upgrade your plan.');
      return;
    }
    const content = `[${message.displayTime}] ${message.type.toUpperCase()}: ${message.args.join(' ')}`;
    navigator.clipboard.writeText(content).then(() => {
      console.log('Message copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy message:', err);
    });
  }

  // 모든 메시지 클리어
  clearMessages() {
    this.messages = [];
    this.filteredMessages = [];
    this.messageCount = 0;
    this.updateMessageDisplay();
    this.updatePerformanceInfo();
  }

  // 메시지 내보내기
  exportMessages() {
    const exportData = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      messageCount: this.messages.length,
      messages: this.messages.map(msg => ({
        timestamp: msg.timestamp,
        type: msg.type,
        content: msg.args.join(' '),
        metadata: msg.metadata
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-log-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 성능 모니터링 시작
  startPerformanceMonitoring() {
    this.performanceTimer = setInterval(() => {
      this.updateMemoryUsage();
      this.updatePerformanceInfo();
    }, 1000);
  }

  // 성능 모니터링 중지
  stopPerformanceMonitoring() {
    if (this.performanceTimer) {
      clearInterval(this.performanceTimer);
      this.performanceTimer = null;
    }
  }

  // 메모리 사용량 업데이트
  updateMemoryUsage() {
    const messagesSize = JSON.stringify(this.messages).length;
    this.memoryUsage = Math.round(messagesSize / 1024); // KB
  }

  // UI 상태 업데이트
  updateMonitoringStatus(isActive) {
    const statusElement = document.getElementById('consoleStatus');
    const toggleBtn = document.getElementById('toggleConsoleBtn');

    if (statusElement) {
      statusElement.textContent = isActive ? '🟢 Active' : '🔴 Stopped';
    }

    if (toggleBtn) {
      toggleBtn.textContent = isActive ? '⏸️ Stop Monitor' : '🔍 Start Monitor';
      toggleBtn.className = isActive ?
        'btn btn-warning btn-sm' :
        'btn btn-info btn-sm';
    }
  }

  // 메시지 카운트 업데이트
  updateMessageCount() {
    const countElement = document.getElementById('consoleMessageCount');
    if (countElement) {
      const filtered = this.filteredMessages.length;
      const total = this.messages.length;
      countElement.textContent = filtered === total ?
        `${total} messages` :
        `${filtered}/${total} messages`;
    }
  }

  // 성능 정보 업데이트
  updatePerformanceInfo() {
    const perfElement = document.getElementById('consolePerformanceInfo');
    if (perfElement) {
      perfElement.textContent =
        `Memory: ${this.memoryUsage}KB | Rate: ${Math.round(this.messageRate)}/sec`;
    }
  }

  // 필터 버튼 업데이트
  updateFilterButtons() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === this.currentFilter);
    });
  }

  // Test method to simulate console message
  testConsoleMessage() {
    console.log('🧪 Testing console message flow...');

    // Create a test message directly
    const testMessage = {
      type: 'log',
      args: ['TEST MESSAGE FROM CONSOLE MANAGER - DO YOU SEE THIS?'],
      timestamp: Date.now(),
      url: window.location.href,
      source: 'test'
    };

    console.log('🧪 Calling addMessage directly with test data:', testMessage);
    this.addMessage(testMessage);
  }

  // Force console manager to active state for testing
  forceActive() {
    console.log('🔧 Forcing console manager to active state');
    this.isActive = true;
    this.updateMonitoringStatus(true);
  }
}

export { ConsoleManager };
