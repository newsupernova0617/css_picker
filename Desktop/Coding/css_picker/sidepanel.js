// 사이드패널의 모든 기능을 관리하는 클래스를 정의합니다
// 클래스는 관련된 변수들과 함수들을 하나로 묶어서 관리하는 방법입니다
class SidePanel {
  
  // constructor는 클래스가 생성될 때 가장 먼저 실행되는 함수입니다
  // 초기 설정을 여기서 합니다
  constructor() {
    // 피커가 현재 활성화되어 있는지를 나타내는 변수 (true = 켜짐, false = 꺼짐)
    this.isActive = true;
    
    // HTML에서 상태를 보여주는 요소를 저장할 변수 (나중에 찾아서 넣을 예정)
    this.$statusIndicator = null;
    
    // HTML에서 토글 버튼 요소를 저장할 변수 (나중에 찾아서 넣을 예정)
    this.$toggleButton = null;
    
    // 현재 선택된 요소 정보를 저장하는 변수
    this.currentElement = null;
    this.originalStyles = {}; // 원본 스타일 백업용
    
    // 초기화 함수를 호출합니다
    this.init();
  }
  
  // 사이드패널을 초기화하는 함수입니다
  init() {
    // jQuery의 $(document).ready()는 DOM이 로드되었을 때 실행됩니다
    $(document).ready(() => {
      // HTML 요소들을 찾아서 변수에 저장합니다
      this.setupElements();
      
      // 버튼 클릭 등의 이벤트 리스너를 설정합니다
      this.setupEventListeners();
      
      // CSS 정보 영역을 초기화합니다
      this.initializeCssInfoSection();
      
      // 백그라운드 스크립트에게 "사이드패널이 열렸다"고 알려줍니다
      this.notifyOpened();
    });
  }
  
  // HTML에서 필요한 요소들을 찾아서 변수에 저장하는 함수입니다
  setupElements() {
    // jQuery의 $("#id")는 특정 id를 가진 요소를 찾는 함수입니다
    // "statusIndicator" id를 가진 요소를 찾아서 저장합니다
    this.$statusIndicator = $("#statusIndicator");
    
    // "toggleBtn" id를 가진 버튼을 찾아서 저장합니다
    this.$toggleButton = $("#toggleBtn");
    
    // CSS 정보 관련 요소들
    this.$cssInfoSection = $("#cssInfoSection");
    this.$instructionsSection = $("#instructionsSection");
    this.$elementTag = $("#elementTag");
    this.$elementClass = $("#elementClass");
    this.$elementId = $("#elementId");
    this.$propertiesContainer = $("#propertiesContainer");
    this.$closeCssInfo = $("#closeCssInfo");
    this.$resetStyles = $("#resetStyles");
  }
  
  // 각종 이벤트 리스너들을 설정하는 함수입니다
  // 이벤트 리스너는 "특정 상황이 발생했을 때 실행할 함수"를 등록하는 것입니다
  setupEventListeners() {
    // jQuery의 .click()으로 클릭 이벤트를 간단하게 등록합니다
    this.$toggleButton.click(() => {
      this.togglePicker(); // 피커를 켜거나 끄는 함수를 호출합니다
    });
    
    // beforeunload는 창이나 탭이 닫히기 직전에 발생하는 이벤트입니다
    $(window).on("beforeunload", () => {
      // 사이드패널이 닫힐 때 백그라운드에게 알려줍니다
      this.notifyClosed();
    });
    
    // Chrome 확장 프로그램의 다른 부분(백그라운드 스크립트)에서 메시지가 올 때를 처리합니다
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // 받은 메시지를 처리하는 함수를 호출합니다
      this.handleMessage(message, sender, sendResponse);
    });
  }
  
  // 피커 기능을 켜거나 끄는 함수입니다
  togglePicker() {
    // ! 연산자는 "반대로 바꾸기"를 의미합니다
    // true였으면 false로, false였으면 true로 바꿉니다
    this.isActive = !this.isActive;
    
    // 현재 상태에 따라 다른 동작을 합니다
    if (this.isActive) {
      // 피커가 켜진 상태라면
      this.notifyOpened(); // 백그라운드에게 "켜짐"을 알리고
      this.updateStatus("🟢 Active", "active"); // 화면에 "활성" 상태를 표시합니다
    } else {
      // 피커가 꺼진 상태라면
      this.notifyClosed(); // 백그라운드에게 "꺼짐"을 알리고
      this.updateStatus("🔴 Inactive", "inactive"); // 화면에 "비활성" 상태를 표시합니다
    }
  }
  
  // 화면에 표시되는 상태를 업데이트하는 함수입니다
  updateStatus(text, state) {
    // jQuery의 .length를 사용해서 요소 존재 여부를 확인합니다
    if (this.$statusIndicator.length === 0) return;
    
    // jQuery의 .text()로 텍스트를 변경합니다
    this.$statusIndicator.text(text);
    
    // jQuery의 .attr()로 클래스 속성을 변경합니다
    this.$statusIndicator.attr("class", `status-indicator status-${state}`);
  }
  
  // 백그라운드 스크립트에게 "사이드패널이 열렸다"고 알려주는 함수입니다
  notifyOpened() {
    try {
      // try-catch는 오류가 발생할 수 있는 코드를 안전하게 실행하는 방법입니다
      // chrome.runtime.sendMessage는 다른 스크립트에게 메시지를 보내는 함수입니다
      chrome.runtime.sendMessage({ 
        type: "sidepanel_opened", // 메시지 종류를 "사이드패널 열림"으로 설정
        timestamp: Date.now() // 현재 시간을 함께 보냅니다
      });
    } catch (error) {
      // 메시지 보내기에 실패하면 콘솔에 오류를 출력합니다
      console.error("Failed to send opened message:", error);
    }
  }
  
  // 백그라운드 스크립트에게 "사이드패널이 닫혔다"고 알려주는 함수입니다
  notifyClosed() {
    try {
      // 메시지를 보냅니다
      chrome.runtime.sendMessage({ 
        type: "sidepanel_closed", // 메시지 종류를 "사이드패널 닫힘"으로 설정
        timestamp: Date.now() // 현재 시간을 함께 보냅니다
      });
    } catch (error) {
      // 메시지 보내기에 실패하면 콘솔에 오류를 출력합니다
      console.error("Failed to send closed message:", error);
    }
  }
  
  // 다른 스크립트에서 온 메시지를 처리하는 함수입니다
  handleMessage(message, sender, sendResponse) {
    // message.ping이 있는지 확인합니다 (백그라운드에서 "살아있는지" 확인하는 용도)
    if (message.ping) {
      // "살아있다"는 응답을 보냅니다
      sendResponse({ pong: true, timestamp: Date.now() });
      return true; // true를 반환하면 응답이 비동기적으로 처리됨을 의미합니다
    }
    
    // 상태 요청 메시지인지 확인합니다
    if (message.type === "status_request") {
      // 현재 활성화 상태와 시간을 응답으로 보냅니다
      sendResponse({ 
        isActive: this.isActive, // 현재 피커가 활성화되어 있는지
        timestamp: Date.now() // 현재 시간
      });
      return true; // 비동기 응답 처리
    }
    
    // CSS 요소 정보 메시지인지 확인합니다
    if (message.type === "element_clicked") {
      // CSS 정보를 화면에 표시합니다
      this.displayElementInfo(message.cssInfo);
      sendResponse({ success: true });
      return true;
    }
  }
  
  // CSS 정보 영역을 초기화하는 함수입니다
  initializeCssInfoSection() {
    // 닫기 버튼 이벤트 리스너 설정
    this.$closeCssInfo.click(() => {
      this.hideCssInfo();
    });
    
    // 리셋 버튼 이벤트 리스너 설정
    this.$resetStyles.click(() => {
      this.resetAllStyles();
    });
  }
  
  // CSS 요소 정보를 화면에 표시하는 함수입니다
  displayElementInfo(cssInfo) {
    try {
      // 요소 기본 정보 업데이트
      this.$elementTag.text(cssInfo.tagName);
      this.$elementClass.text(cssInfo.className);
      this.$elementId.text(cssInfo.id);
      
      // CSS 속성 컨테이너 비우기
      this.$propertiesContainer.empty();
      
      // CSS 속성들을 알파벳 순으로 정렬
      const sortedProperties = Object.keys(cssInfo.properties).sort();
      
      // 각 CSS 속성을 표시
      sortedProperties.forEach(property => {
        const value = cssInfo.properties[property];
        const $propertyItem = this.createEditablePropertyItem(property, value);
        this.$propertiesContainer.append($propertyItem);
      });
      
      // 현재 선택된 요소 정보 저장
      this.currentElement = {
        tagName: cssInfo.tagName,
        className: cssInfo.className,
        id: cssInfo.id
      };
      
      // 원본 스타일 백업
      this.backupOriginalStyles(cssInfo.properties);
      
      // CSS 정보 섹션 보이기 및 설명 섹션 숨기기
      this.showCssInfo();
      
      console.log('CSS info displayed:', cssInfo);
    } catch (error) {
      console.error('Failed to display CSS info:', error);
    }
  }
  
  // CSS 정보 섹션을 보여주는 함수입니다
  showCssInfo() {
    this.$cssInfoSection.show();
    this.$instructionsSection.hide();
  }
  
  // CSS 정보 섹션을 숨기는 함수입니다
  hideCssInfo() {
    this.$cssInfoSection.hide();
    this.$instructionsSection.show();
    // 편집 중인 상태 정리
    this.currentElement = null;
    this.originalStyles = {};
  }
  
  // 편집 가능한 CSS 속성 아이템을 생성하는 함수입니다
  createEditablePropertyItem(property, value) {
    const $propertyItem = $(`
      <div class="property-item" data-property="${property}">
        <span class="property-name">${property}</span>
        <span class="property-value editable" data-original-value="${value}">${value}</span>
        <span class="edit-icon">✏️</span>
      </div>
    `);
    
    // 속성값 클릭 시 편집 모드로 전환
    $propertyItem.find('.property-value').click((e) => {
      this.startEditing($(e.target), property, value);
    });
    
    // 편집 아이콘 클릭 시 편집 모드로 전환
    $propertyItem.find('.edit-icon').click((e) => {
      const $valueSpan = $propertyItem.find('.property-value');
      this.startEditing($valueSpan, property, value);
    });
    
    return $propertyItem;
  }
  
  // 편집 모드를 시작하는 함수입니다
  startEditing($valueSpan, property, currentValue) {
    // 이미 편집 중인 다른 항목이 있다면 취소
    this.cancelAllEditing();
    
    // 편집 중 표시
    $valueSpan.addClass('editing');
    
    // 입력 필드 생성
    const $input = $('<input>', {
      type: 'text',
      class: 'property-input',
      value: currentValue
    });
    
    // 원본 텍스트 숨기고 입력 필드 표시
    $valueSpan.hide().after($input);
    $input.focus().select();
    
    // 실시간 업데이트를 위한 이벤트 리스너
    let debounceTimer;
    $input.on('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.applyStyleChange(property, $input.val());
      }, 300); // 300ms 디바운싱
    });
    
    // Enter 키로 확정
    $input.on('keydown', (e) => {
      if (e.key === 'Enter') {
        this.confirmEdit($valueSpan, $input, property);
      } else if (e.key === 'Escape') {
        this.cancelEdit($valueSpan, $input, property);
      }
    });
    
    // 포커스 잃으면 확정
    $input.on('blur', () => {
      setTimeout(() => {
        if ($input.is(':visible')) {
          this.confirmEdit($valueSpan, $input, property);
        }
      }, 100);
    });
  }
  
  // 편집을 확정하는 함수입니다
  confirmEdit($valueSpan, $input, property) {
    const newValue = $input.val();
    
    // 최종 스타일 적용
    this.applyStyleChange(property, newValue);
    
    // UI 업데이트
    $valueSpan.text(newValue).removeClass('editing').show();
    $input.remove();
  }
  
  // 편집을 취소하는 함수입니다
  cancelEdit($valueSpan, $input, property) {
    // 원본값으로 되돌리기
    const originalValue = $valueSpan.data('original-value');
    this.applyStyleChange(property, originalValue);
    
    // UI 복원
    $valueSpan.removeClass('editing').show();
    $input.remove();
  }
  
  // 모든 편집 상태를 취소하는 함수입니다
  cancelAllEditing() {
    this.$propertiesContainer.find('.property-input').each((index, input) => {
      const $input = $(input);
      const $valueSpan = $input.prev('.property-value');
      const property = $input.closest('.property-item').data('property');
      
      this.cancelEdit($valueSpan, $input, property);
    });
  }
  
  // 스타일 변경을 실제로 적용하는 함수입니다
  applyStyleChange(property, value) {
    try {
      // 기본적인 입력 유효성 검사
      if (!value || value.trim() === '') {
        console.warn('Empty value provided for property:', property);
        return;
      }
      
      // 위험한 값 차단 (기본적인 XSS 방지)
      if (value.includes('<script') || value.includes('javascript:') || value.includes('expression(')) {
        console.error('Invalid CSS value detected:', value);
        this.showError('Invalid CSS value. Please enter a valid CSS property value.');
        return;
      }
      
      // content script에게 스타일 변경 요청
      chrome.runtime.sendMessage({
        type: 'update_css',
        property: property,
        value: value.trim(),
        elementInfo: this.currentElement,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to apply style change:', error);
      this.showError('Failed to apply style change.');
    }
  }
  
  // 에러 메시지를 표시하는 함수입니다
  showError(message) {
    // 간단한 에러 표시 (나중에 더 예쁘게 만들 수 있음)
    const $errorDiv = $('<div>', {
      class: 'alert alert-danger alert-sm',
      text: message,
      style: 'margin-top: 10px; padding: 8px; font-size: 0.8rem;'
    });
    
    // 기존 에러 메시지 제거
    this.$propertiesContainer.find('.alert').remove();
    
    // 새 에러 메시지 추가
    this.$propertiesContainer.before($errorDiv);
    
    // 3초 후 자동 제거
    setTimeout(() => {
      $errorDiv.fadeOut(300, () => $errorDiv.remove());
    }, 3000);
  }
  
  // 원본 스타일을 백업하는 함수입니다
  backupOriginalStyles(properties) {
    this.originalStyles = { ...properties };
  }
  
  // 모든 변경사항을 되돌리는 함수입니다
  resetAllStyles() {
    Object.keys(this.originalStyles).forEach(property => {
      this.applyStyleChange(property, this.originalStyles[property]);
    });
    
    // UI도 원본값으로 업데이트
    this.$propertiesContainer.find('.property-value').each((index, element) => {
      const $element = $(element);
      const property = $element.closest('.property-item').data('property');
      const originalValue = this.originalStyles[property];
      if (originalValue) {
        $element.text(originalValue);
      }
    });
  }
}

// SidePanel 클래스의 인스턴스(실제 객체)를 생성합니다
// new 키워드를 사용하면 클래스를 실제로 실행 가능한 객체로 만들어줍니다
// 이렇게 하면 위에서 정의한 모든 함수들이 실행됩니다
new SidePanel();
