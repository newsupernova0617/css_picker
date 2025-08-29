// 웹페이지의 HTML 요소들에 마우스를 올렸을 때 테두리를 그어주는 클래스입니다
// 이 스크립트는 모든 웹페이지에 삽입되어 실행됩니다 (content script)
class ElementHighlighter {
  
  // 클래스가 생성될 때 실행되는 초기화 함수입니다
  constructor() {
    // 현재 하이라이트(테두리 표시)되고 있는 HTML 요소를 저장하는 변수
    this.currentHighlighted = null;
    
    // 하이라이터가 현재 활성화되어 있는지를 나타내는 변수 (true = 켜짐, false = 꺼짐)
    this.isActive = false;
    
    // 요소의 원래 outline 스타일을 저장하는 변수 (나중에 복원하기 위해)
    this.originalOutline = '';
    
    // 하이라이트할 때 사용할 테두리 색깔
    this.highlightColor = '#ff0000'; // 빨간색
    
    // 하이라이트할 때 사용할 테두리 두께
    this.highlightWidth = '2px'; // 2픽셀
    
    // CSS 편집과 관련된 변수들
    this.selectedElement = null; // 현재 선택된 요소
    this.selectedElementSelector = null; // 선택된 요소의 CSS 선택자
    this.modifiedStyles = new Map(); // 변경된 스타일 기록
    this.isEditingMode = false; // 편집 모드 상태
    
    // 컬러 샘플링과 관련된 변수들
    this.colorSamplingMode = false; // 컬러 샘플링 모드 상태
    this.colorSamplingCanvas = null; // 색상 샘플링용 캔버스
    this.colorSamplingCursor = null; // 샘플링 커서 요소
    
    // 초기화 함수를 호출합니다
    this.init();
  }
  
  // 컨텐츠 스크립트를 초기화하는 함수입니다
  init() {
    // 백그라운드 스크립트에서 메시지가 올 때를 처리하는 리스너를 등록합니다
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const result = this.handleMessage(message, sender, sendResponse); // 메시지를 처리하는 함수를 호출합니다
      return result; // 비동기 응답을 위해 결과를 반환
    });
    
    // 마우스 이벤트 핸들러 함수들을 bind해서 저장합니다
    // bind를 사용하는 이유: 나중에 removeEventListener로 제거할 때 같은 함수 참조가 필요하기 때문입니다
    this.boundHandleMouseOver = this.handleMouseOver.bind(this);
    this.boundHandleMouseOut = this.handleMouseOut.bind(this);
    this.boundHandleClick = this.handleClick.bind(this);
  }
  
  // 백그라운드 스크립트에서 온 메시지를 처리하는 함수입니다
  handleMessage(message, sender, sendResponse) {
    // 메시지에서 액션과 타임스탬프를 추출합니다 (구조 분해 할당)
    const { action, timestamp } = message;
    
    let isAsyncResponse = false; // 비동기 응답 여부를 추적
    
    try {
      // try-catch는 오류가 발생할 수 있는 코드를 안전하게 실행하는 방법입니다
      // 액션 타입에 따라 다른 동작을 수행합니다
      switch (action) {
        case "border-on":
          // "테두리 켜기" 메시지를 받았을 때
          this.enable(); // 하이라이터를 활성화합니다
          sendResponse({ success: true, action: "enabled" }); // 성공 응답을 보냅니다
          break;
          
        case "border-off":
          // "테두리 끄기" 메시지를 받았을 때
          this.disable(); // 하이라이터를 비활성화합니다
          sendResponse({ success: true, action: "disabled" }); // 성공 응답을 보냅니다
          break;
          
        case "update_css":
          // CSS 업데이트 메시지를 받았을 때
          this.updateElementStyle(message);
          sendResponse({ success: true, action: "css_updated" });
          break;

        case "collect_assets":
          // Asset 수집 메시지를 받았을 때
          assetCollector.collectAllAssets().then(assets => {
            sendResponse({ success: true, assets: assets });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          isAsyncResponse = true; // 비동기 응답 플래그 설정
          break;

        case "prepare-color-sampling":
          // 컬러 샘플링 준비 메시지를 받았을 때
          this.enableColorSampling();
          sendResponse({ success: true, action: "color_sampling_enabled" });
          break;

        case "disable-color-sampling":
          // 컬러 샘플링 비활성화 메시지를 받았을 때
          this.disableColorSampling();
          sendResponse({ success: true, action: "color_sampling_disabled" });
          break;

        case "start-eyedropper":
          // EyeDropper API 시작 메시지를 받았을 때
          this.startEyeDropperMode().then(color => {
            sendResponse({ success: !!color, color: color });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          isAsyncResponse = true; // 비동기 응답 플래그 설정
          break;
          
        default:
          // 알 수 없는 액션인 경우
          sendResponse({ success: false, error: "Unknown action" }); // 오류 응답을 보냅니다
      }
    } catch (error) {
      // 오류가 발생하면 콘솔에 출력하고 오류 응답을 보냅니다
      console.error("Error handling message:", error);
      sendResponse({ success: false, error: error.message });
    }
    
    // 비동기 응답이 필요한 경우 true를 반환
    return isAsyncResponse;
  }
  
  // 요소 하이라이터를 활성화하는 함수입니다
  enable() {
    // 이미 활성화되어 있다면 함수를 종료합니다
    if (this.isActive) return;
    
    // 활성화 상태로 변경합니다
    this.isActive = true;
    
    // 이벤트 리스너 제거 후 재등록 (중복 방지)
    document.removeEventListener("mouseover", this.boundHandleMouseOver);
    document.removeEventListener("mouseout", this.boundHandleMouseOut);
    document.removeEventListener("click", this.boundHandleClick);
    
    // vanilla JavaScript를 사용해서 document에 이벤트 리스너를 등록합니다
    document.addEventListener("mouseover", this.boundHandleMouseOver, true);
    document.addEventListener("mouseout", this.boundHandleMouseOut, true);
    document.addEventListener("click", this.boundHandleClick, true);
    
    // 콘솔에 활성화 메시지를 출력합니다
    console.log("Element highlighter enabled");
  }
  
  // 요소 하이라이터를 비활성화하는 함수입니다
  disable() {
    // 이미 비활성화되어 있다면 함수를 종료합니다
    if (!this.isActive) return;
    
    // 비활성화 상태로 변경합니다
    this.isActive = false;
    
    // vanilla JavaScript를 사용해서 이벤트 리스너를 제거합니다 (capture phase도 제거)
    document.removeEventListener("mouseover", this.boundHandleMouseOver, true);
    document.removeEventListener("mouseout", this.boundHandleMouseOut, true);
    document.removeEventListener("click", this.boundHandleClick, true);
    
    // 현재 하이라이트된 요소가 있다면 하이라이트를 제거합니다
    this.clearHighlight();
    
    // 모든 CSS 변경사항도 정리합니다
    this.clearAllModifications();
    
    // 콘솔에 비활성화 메시지를 출력합니다
    console.log("Element highlighter disabled");
  }
  
  // 마우스가 요소 위로 올라갔을 때 실행되는 함수입니다
  handleMouseOver(event) {
    // 하이라이터가 비활성화 상태라면 함수를 종료합니다
    if (!this.isActive) return;
    
    // 마우스가 올라간 요소를 가져옵니다
    const target = event.target;
    
    // 이미 같은 요소가 하이라이트되어 있다면 무시
    if (this.currentHighlighted === target) return;
    
    // 이전에 하이라이트된 요소가 있다면 하이라이트를 제거합니다 (선택된 요소가 아닌 경우에만)
    if (this.currentHighlighted && this.currentHighlighted !== this.selectedElement) {
      this.clearHighlight();
    }
    
    // 이 요소가 하이라이트해도 되는 요소인지 확인합니다
    if (this.shouldHighlight(target)) {
      this.highlightElement(target); // 요소를 하이라이트합니다
    }
  }
  
  // 마우스가 요소에서 벗어났을 때 실행되는 함수입니다
  handleMouseOut(event) {
    // 하이라이터가 비활성화 상태라면 함수를 종료합니다
    if (!this.isActive) return;
    
    // 선택된 요소(클릭된 요소)라면 하이라이트를 유지합니다
    if (event.target === this.selectedElement) {
      return;
    }
    
    // relatedTarget이 현재 하이라이트된 요소의 자식이면 무시
    if (this.currentHighlighted && event.relatedTarget) {
      if (this.currentHighlighted.contains(event.relatedTarget)) {
        return;
      }
    }
    
    // 마우스가 벗어난 요소가 현재 하이라이트된 요소와 같다면
    if (this.currentHighlighted && this.currentHighlighted === event.target) {
      this.clearHighlight(); // 하이라이트를 제거합니다
    }
  }
  
  // 특정 요소가 하이라이트되어도 되는지 판단하는 함수입니다
  shouldHighlight(element) {
    // 요소가 없거나, body 태그이거나, html 태그라면 하이라이트하지 않습니다
    if (!element || element === document.body || element === document.documentElement) {
      return false;
    }
    
    // 요소의 태그 이름을 소문자로 변환합니다
    const tagName = element.tagName.toLowerCase();
    
    // 하이라이트하면 안 되는 태그들의 목록입니다
    const skipTags = ['html', 'body', 'script', 'style', 'meta', 'title', 'head'];
    
    // skipTags 배열에 현재 태그가 포함되어 있지 않다면 하이라이트해도 됩니다
    // ! 연산자는 "반대"를 의미하므로, "포함되어 있지 않다면 true"를 반환합니다
    return !skipTags.includes(tagName);
  }
  
  // 특정 요소를 하이라이트하는 함수입니다
  highlightElement(element) {
    // 현재 하이라이트된 요소로 저장합니다
    this.currentHighlighted = element;
    
    // 원래 outline 스타일을 저장합니다
    this.originalOutline = element.style.outline || '';
    
    // 하이라이트 스타일을 적용합니다
    element.style.outline = `${this.highlightWidth} solid ${this.highlightColor}`;
    element.style.outlineOffset = '1px';
  }
  
  // 현재 하이라이트된 요소의 하이라이트를 제거하는 함수입니다
  clearHighlight() {
    // 현재 하이라이트된 요소가 있는지 확인합니다
    if (this.currentHighlighted) {
      // 스타일을 원래대로 복원합니다
      this.currentHighlighted.style.outline = this.originalOutline || '';
      this.currentHighlighted.style.outlineOffset = '';
      
      // 현재 하이라이트된 요소 변수를 비웁니다
      this.currentHighlighted = null;
      
      // 저장된 원래 outline 스타일도 비웁니다
      this.originalOutline = '';
    }
    
    // 편집 모드는 클릭할 때만 활성화되므로 clearHighlight에서는 해제하지 않음
  }
  
  // 클릭 이벤트를 처리하는 함수입니다
  handleClick(event) {
    // 하이라이터가 비활성화 상태라면 함수를 종료합니다
    if (!this.isActive) return;
    
    // 클릭된 요소를 사용 (currentHighlighted 대신)
    const clickedElement = event.target;
    
    // 클릭된 요소가 유효한지 확인
    if (!clickedElement || !this.shouldHighlight(clickedElement)) return;
    
    // 이벤트 전파를 중지합니다
    event.preventDefault();
    event.stopPropagation();
    
    // 이전에 선택된 요소의 스타일을 제거
    if (this.selectedElement && this.selectedElement !== clickedElement) {
      // 이전 선택 요소가 현재 하이라이트된 요소가 아니라면 스타일 제거
      if (this.selectedElement !== this.currentHighlighted) {
        this.selectedElement.style.outline = '';
        this.selectedElement.style.outlineOffset = '';
      }
    }
    
    // 편집 모드 활성화 (요소를 클릭했을 때만)
    this.isEditingMode = true;
    this.selectedElement = clickedElement;
    
    // 선택된 요소에 하이라이트 유지
    this.highlightElement(clickedElement);
    
    // 클릭된 요소의 CSS 정보를 추출합니다
    const cssInfo = this.extractCSSProperties(clickedElement);
    
    console.log('Element clicked, sending CSS info:', cssInfo);
    
    // 사이드패널로 CSS 정보를 전송합니다
    this.sendElementInfo(cssInfo, clickedElement);
  }
  
  // 요소의 CSS 속성들을 추출하는 함수입니다
  extractCSSProperties(element) {
    // getComputedStyle로 실제 적용된 CSS 스타일을 가져옵니다
    const computedStyles = window.getComputedStyle(element);
    
    // 표시할 주요 CSS 속성들을 정의합니다
    const importantProperties = [
      // 레이아웃 관련
      'display', 'position', 'float', 'clear',
      'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
      
      // 박스 모델
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'border', 'border-width', 'border-style', 'border-color',
      'border-radius',
      
      // 색상 및 배경
      'color', 'background-color', 'background-image', 'background-size',
      'background-repeat', 'background-position', 'opacity',
      
      // 폰트 관련
      'font-family', 'font-size', 'font-weight', 'font-style',
      'line-height', 'text-align', 'text-decoration', 'text-transform',
      
      // 플렉스박스
      'flex', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items',
      
      // 그리드
      'grid-template-columns', 'grid-template-rows', 'grid-gap',
      
      // 기타
      'z-index', 'overflow', 'cursor', 'visibility'
    ];
    
    const cssInfo = {
      tagName: element.tagName.toLowerCase(),
      className: (typeof element.className === 'string' ? element.className : element.className?.baseVal) || '(none)',
      id: element.id || '(none)',
      properties: {}
    };
    
    // 각 속성의 값을 추출합니다
    importantProperties.forEach(property => {
      const value = computedStyles.getPropertyValue(property);
      // 값이 있으면 저장 (모든 값 포함)
      if (value && value !== '') {
        cssInfo.properties[property] = value;
      }
    });
    
    return cssInfo;
  }
  
  // 요소 정보를 사이드패널로 전송하는 함수입니다
  sendElementInfo(cssInfo, element) {
    try {
      // 현재 선택된 요소를 저장합니다 (CSS 수정을 위해)
      this.selectedElement = element;
      this.selectedElementSelector = this.generateElementSelector(element);
      
      console.log('Sending element info to sidepanel:', cssInfo);
      
      // Chrome extension 메시징 API를 사용해서 사이드패널로 정보를 전송합니다
      chrome.runtime.sendMessage({
        type: 'element_clicked',
        cssInfo: cssInfo,
        timestamp: Date.now()
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to send message:', chrome.runtime.lastError);
        } else {
          console.log('Message sent successfully:', response);
        }
      });
      
    } catch (error) {
      console.error('Failed to send element info:', error);
    }
  }
  
  // 요소의 CSS 선택자를 생성하는 함수입니다
  generateElementSelector(element) {
    // ID가 있으면 ID를 사용 (CSS 선택자 특수문자 이스케이프)
    if (element.id) {
      const escapedId = CSS.escape(element.id);
      return `#${escapedId}`;
    }
    
    // 고유한 클래스 조합을 찾아보기
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(cls => cls.trim());
      if (classes.length > 0) {
        const escapedClasses = classes.map(cls => CSS.escape(cls));
        const selector = element.tagName.toLowerCase() + '.' + escapedClasses.join('.');
        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }
      }
    }
    
    // nth-child를 이용한 선택자 생성
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(element) + 1;
      const parentSelector = parent.tagName.toLowerCase();
      return `${parentSelector} > ${element.tagName.toLowerCase()}:nth-child(${index})`;
    }
    
    return element.tagName.toLowerCase();
  }
  
  // CSS 스타일을 업데이트하는 함수입니다
  updateElementStyle(message) {
    try {
      const { property, value, elementInfo } = message;
      
      console.log('updateElementStyle called with:', { property, value, elementInfo });
      console.log('this.selectedElement:', this.selectedElement);
      console.log('this.currentHighlighted:', this.currentHighlighted);
      
      // selectedElement가 없다면 현재 하이라이트된 요소 사용
      let targetElement = this.selectedElement;
      if (!targetElement && this.currentHighlighted) {
        targetElement = this.currentHighlighted;
        console.log('Using currentHighlighted element:', targetElement);
      }
      
      if (!targetElement) {
        console.error('No element available for styling');
        return;
      }
      
      // 스타일 직접 적용 (inline style이 가장 높은 우선순위를 가짐)
      targetElement.style.setProperty(property, value, 'important');
      
      // 변경된 스타일 기록 저장
      if (!this.modifiedStyles) {
        this.modifiedStyles = new Map();
      }
      
      if (!this.modifiedStyles.has(targetElement)) {
        this.modifiedStyles.set(targetElement, new Map());
      }
      
      this.modifiedStyles.get(targetElement).set(property, value);
      
      console.log(`✅ Updated ${property}: ${value} on element`, targetElement);
      console.log('Element style after update:', targetElement.style.cssText);
    } catch (error) {
      console.error('Failed to update element style:', error);
    }
  }
  
  // 모든 CSS 변경사항을 정리하는 함수입니다
  clearAllModifications() {
    if (this.modifiedStyles) {
      this.modifiedStyles.forEach((styleMap, element) => {
        styleMap.forEach((value, property) => {
          // 인라인 스타일 제거
          element.style.removeProperty(property);
        });
      });
      this.modifiedStyles.clear();
    }
    
    this.selectedElement = null;
    this.selectedElementSelector = null;
    this.isEditingMode = false;
  }
  
  // 하이라이트 스타일(색깔, 두께)을 업데이트하는 함수입니다
  updateHighlightStyle(color, width) {
    // 새로운 색깔이 주어지면 업데이트하고, 아니면 기존 색깔을 유지합니다
    this.highlightColor = color || this.highlightColor;
    
    // 새로운 두께가 주어지면 업데이트하고, 아니면 기존 두께를 유지합니다
    this.highlightWidth = width || this.highlightWidth;
    
    // 현재 하이라이트된 요소가 있다면 새로운 스타일을 즉시 적용합니다
    if (this.currentHighlighted) {
      this.currentHighlighted.style.outline = `${this.highlightWidth} solid ${this.highlightColor}`;
    }
  }

  // ========== 컬러 샘플링 관련 메서드들 ==========
  
  // 컬러 샘플링 모드 활성화
  enableColorSampling() {
    this.colorSamplingMode = true;
    
    // 기존 하이라이터 비활성화
    this.disable();
    
    // 컬러 샘플링 커서 추가
    this.addColorSamplingCursor();
    
    // 컬러 샘플링 이벤트 리스너 추가
    this.addColorSamplingListeners();
    
    console.log("Color sampling mode enabled");
  }
  
  // 컬러 샘플링 모드 비활성화
  disableColorSampling() {
    this.colorSamplingMode = false;
    
    // 컬러 샘플링 커서 제거
    this.removeColorSamplingCursor();
    
    // 컬러 샘플링 이벤트 리스너 제거
    this.removeColorSamplingListeners();
    
    console.log("Color sampling mode disabled");
  }
  
  // 컬러 샘플링 커서 추가
  addColorSamplingCursor() {
    // 기존 커서 제거
    this.removeColorSamplingCursor();
    
    // 십자선 커서 스타일 추가
    const cursorStyle = document.createElement('style');
    cursorStyle.id = 'css-picker-cursor-style';
    cursorStyle.textContent = `
      * {
        cursor: crosshair !important;
      }
    `;
    document.head.appendChild(cursorStyle);
    
    // EyeDropper 모드에서는 십자선 요소 생성하지 않음
  }
  
  // 컬러 샘플링 커서 제거
  removeColorSamplingCursor() {
    // 커서 스타일 제거
    const cursorStyle = document.getElementById('css-picker-cursor-style');
    if (cursorStyle) {
      cursorStyle.remove();
    }
    
    // EyeDropper 모드에서는 제거할 십자선 요소 없음
  }
  
  // 컬러 샘플링 이벤트 리스너 추가 (클릭만)
  addColorSamplingListeners() {
    this.boundHandleColorClick = this.handleColorClick.bind(this);
    document.addEventListener('click', this.boundHandleColorClick, true);
  }
  
  // 컬러 샘플링 이벤트 리스너 제거
  removeColorSamplingListeners() {
    if (this.boundHandleColorClick) {
      document.removeEventListener('click', this.boundHandleColorClick, true);
    }
  }
  
  // 클릭 시 색상 샘플링 실행
  async handleColorClick(event) {
    if (!this.colorSamplingMode) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    // 클릭한 위치의 색상 샘플링 (EyeDropper API 우선 사용)
    const color = await this.sampleColorAtClick(event.clientX, event.clientY);
    
    if (color) {
      // 사이드패널에 색상 정보 전송 (샘플링)
      chrome.runtime.sendMessage({
        action: 'color-sampled',
        colorData: color,
        coordinates: {
          x: event.clientX,
          y: event.clientY
        }
      });
      
      // 클릭 효과 표시
      this.showColorSampledEffect(event.clientX, event.clientY, color);
    }
  }
  
  // 지정된 위치의 색상 샘플링 (2단계 fallback 시스템 - hover용)
  async sampleColorAtPosition(x, y) {
    try {
      // 1단계: HTML2Canvas 픽셀 추출 시도
      console.log('Trying HTML2Canvas pixel sampling...');
      const canvasColor = await this.sampleWithCanvas(x, y);
      if (canvasColor && canvasColor.r !== undefined) {
        console.log('HTML2Canvas success:', canvasColor);
        return canvasColor;
      }
      
      // 2단계: CSS 방식 fallback
      console.log('Trying CSS-based sampling...');
      const cssColor = await this.sampleWithCSS(x, y);
      if (cssColor && cssColor.r !== undefined) {
        console.log('CSS sampling success:', cssColor);
        return cssColor;
      }
      
      // 모든 방식 실패시 기본값 반환
      console.warn('All color sampling methods failed, returning default');
      return { r: 128, g: 128, b: 128, a: 1 }; // 회색
      
    } catch (error) {
      console.error('Color sampling failed:', error);
      return { r: 255, g: 0, b: 0, a: 1 }; // 빨간색 (오류 표시)
    }
  }

  // 클릭 시 EyeDropper API 사용 (기본 동작)
  async sampleColorAtClick(x, y) {
    try {
      // EyeDropper API 우선 시도
      if ('EyeDropper' in window) {
        console.log('Using EyeDropper API for color sampling...');
        const eyeDropperColor = await this.sampleWithEyeDropper();
        if (eyeDropperColor && eyeDropperColor.r !== undefined) {
          console.log('EyeDropper API success:', eyeDropperColor);
          return eyeDropperColor;
        }
      }
      
      // EyeDropper 실패시 fallback
      console.log('EyeDropper not available, using fallback...');
      return await this.sampleColorAtPosition(x, y);
      
    } catch (error) {
      console.error('Click color sampling failed:', error);
      return { r: 255, g: 0, b: 0, a: 1 }; // 빨간색 (오류 표시)
    }
  }

  // EyeDropper API 전용 함수 (별도 버튼에서 호출)
  async startEyeDropperMode() {
    try {
      if (!('EyeDropper' in window)) {
        throw new Error('EyeDropper API not supported');
      }
      
      console.log('Starting EyeDropper mode...');
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      
      if (result && result.sRGBHex) {
        const color = this.parseColorString(result.sRGBHex);
        console.log('EyeDropper API success:', color);
        
        // 사이드패널에 색상 정보 전송
        chrome.runtime.sendMessage({
          action: 'color-sampled',
          colorData: color,
          coordinates: { x: 0, y: 0 }, // EyeDropper는 좌표 무관
          source: 'eyedropper'
        });
        
        return color;
      }
    } catch (error) {
      console.log('EyeDropper failed:', error);
      return null;
    }
  }
  
  // EyeDropper API를 사용한 색상 추출
  async sampleWithEyeDropper() {
    try {
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      
      if (result && result.sRGBHex) {
        return this.parseColorString(result.sRGBHex);
      }
    } catch (error) {
      console.log('EyeDropper failed:', error);
    }
    return null;
  }
  
  // HTML2Canvas를 사용한 픽셀 단위 색상 추출
  async sampleWithCanvas(x, y) {
    try {
      // HTML2Canvas가 로드되어 있는지 확인
      if (!window.html2canvas) {
        // 동적으로 HTML2Canvas 로드
        await this.loadHTML2Canvas();
      }
      
      // 뷰포트 내에서의 좌표로 변환
      const rect = document.body.getBoundingClientRect();
      const canvasX = x - rect.left + window.scrollX;
      const canvasY = y - rect.top + window.scrollY;
      
      // 작은 영역만 캔버스로 렌더링 (성능 최적화)
      const element = document.elementFromPoint(x, y);
      if (!element) return null;
      
      const canvas = await html2canvas(element, {
        allowTaint: true,
        useCORS: true,
        scale: 1,
        logging: false,
        width: element.offsetWidth,
        height: element.offsetHeight
      });
      
      // 해당 좌표의 픽셀 데이터 추출
      const ctx = canvas.getContext('2d');
      const elementRect = element.getBoundingClientRect();
      const localX = x - elementRect.left;
      const localY = y - elementRect.top;
      
      const pixelData = ctx.getImageData(localX, localY, 1, 1).data;
      
      return {
        r: pixelData[0],
        g: pixelData[1],
        b: pixelData[2],
        a: pixelData[3] / 255
      };
      
    } catch (error) {
      console.log('Canvas sampling failed:', error);
    }
    return null;
  }
  
  // HTML2Canvas 동적 로드
  async loadHTML2Canvas() {
    return new Promise((resolve, reject) => {
      if (window.html2canvas) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('lib/html2canvas.min.js');
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load html2canvas'));
      document.head.appendChild(script);
    });
  }
  
  // 기존 CSS 방식 (폴백)
  async sampleWithCSS(x, y) {
    try {
      const element = document.elementFromPoint(x, y);
      if (!element) return null;
      
      const computedStyle = window.getComputedStyle(element);
      
      // 배경색 또는 텍스트 색상 추출
      let color = computedStyle.backgroundColor;
      
      // 투명한 배경인 경우 텍스트 색상 사용
      if (color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
        color = computedStyle.color;
      }
      
      return this.parseColorString(color);
      
    } catch (error) {
      console.error('CSS sampling failed:', error);
      return null;
    }
  }
  
  // 실시간 색상 프리뷰 기능 제거됨 (EyeDropper 기본 사용)
  
  // 색상 문자열을 RGB 객체로 파싱
  parseColorString(colorStr) {
    if (!colorStr) return null;
    
    // rgb(r, g, b) 또는 rgba(r, g, b, a) 형식 파싱
    const rgbaMatch = colorStr.match(/rgba?\(([^)]+)\)/);
    if (rgbaMatch) {
      const values = rgbaMatch[1].split(',').map(v => parseFloat(v.trim()));
      return {
        r: Math.round(values[0]),
        g: Math.round(values[1]),
        b: Math.round(values[2]),
        a: values[3] !== undefined ? values[3] : 1
      };
    }
    
    // hex 색상 파싱
    const hexMatch = colorStr.match(/^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/);
    if (hexMatch) {
      const hex = hexMatch[1];
      const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16);
      const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16);
      const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16);
      
      return { r, g, b, a: 1 };
    }
    
    return null;
  }
  
  // RGB를 HEX로 변환
  rgbToHex(r, g, b) {
    const componentToHex = (c) => {
      const hex = Math.round(c).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`.toUpperCase();
  }
  
  // RGB를 HSL로 변환
  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }
  
  // 색상 샘플링 성공 효과 표시
  showColorSampledEffect(x, y, color) {
    const effect = document.createElement('div');
    const hex = this.rgbToHex(color.r, color.g, color.b);
    
    effect.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: 60px;
      height: 60px;
      background: ${hex};
      border: 3px solid white;
      border-radius: 50%;
      transform: translate(-50%, -50%) scale(0);
      pointer-events: none;
      z-index: 999999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      animation: colorSampleEffect 0.6s ease-out forwards;
    `;
    
    // 애니메이션 CSS 추가
    if (!document.getElementById('color-sample-animation')) {
      const style = document.createElement('style');
      style.id = 'color-sample-animation';
      style.textContent = `
        @keyframes colorSampleEffect {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(effect);
    
    // 애니메이션 완료 후 제거
    setTimeout(() => {
      effect.remove();
    }, 600);
  }
}

// Asset 수집 및 관리 클래스
class AssetCollector {
  constructor() {
    this.collectedAssets = {
      images: [],
      stylesheets: [],
      scripts: [],
      fonts: [],
      videos: [],
      audio: []
    };
    this.isCollecting = false;
  }

  // 모든 asset들을 수집하는 메인 함수
  async collectAllAssets() {
    if (this.isCollecting) return this.collectedAssets;
    
    this.isCollecting = true;
    console.log('🔍 Starting asset collection...');

    try {
      // 각 타입별로 asset 수집
      this.collectedAssets.images = await this.collectImages();
      this.collectedAssets.stylesheets = this.collectStylesheets();
      this.collectedAssets.scripts = this.collectScripts();
      this.collectedAssets.videos = this.collectVideos();
      this.collectedAssets.audio = this.collectAudio();
      
      // 폰트는 별도로 처리 (Web Fonts API 사용)
      this.collectedAssets.fonts = await this.collectFonts();

      console.log('✅ Asset collection completed:', this.collectedAssets);
      return this.collectedAssets;
    } catch (error) {
      console.error('❌ Asset collection failed:', error);
      return this.collectedAssets;
    } finally {
      this.isCollecting = false;
    }
  }

  // 이미지 asset 수집
  async collectImages() {
    const images = [];
    const imageElements = [...document.querySelectorAll('img[src]')];
    
    // img 태그들 처리
    imageElements.forEach(img => {
      if (img.src && this.isValidUrl(img.src)) {
        images.push(this.createAssetInfo('image', img.src, img));
      }
    });

    // CSS background-image 처리
    const elementsWithBgImage = [...document.querySelectorAll('*')];
    elementsWithBgImage.forEach(el => {
      const style = window.getComputedStyle(el);
      const bgImage = style.backgroundImage;
      
      if (bgImage && bgImage !== 'none') {
        const matches = bgImage.match(/url\(['"]?([^'"()]+)['"]?\)/g);
        if (matches) {
          matches.forEach(match => {
            const url = match.replace(/url\(['"]?([^'"()]+)['"]?\)/, '$1');
            if (this.isValidUrl(url)) {
              images.push(this.createAssetInfo('image', this.resolveUrl(url), el));
            }
          });
        }
      }
    });

    return this.removeDuplicates(images);
  }

  // CSS 파일 수집
  collectStylesheets() {
    const stylesheets = [];
    const linkElements = [...document.querySelectorAll('link[rel="stylesheet"][href]')];
    
    linkElements.forEach(link => {
      if (this.isValidUrl(link.href)) {
        stylesheets.push(this.createAssetInfo('stylesheet', link.href, link));
      }
    });

    return stylesheets;
  }

  // JavaScript 파일 수집
  collectScripts() {
    const scripts = [];
    const scriptElements = [...document.querySelectorAll('script[src]')];
    
    scriptElements.forEach(script => {
      if (this.isValidUrl(script.src)) {
        scripts.push(this.createAssetInfo('script', script.src, script));
      }
    });

    return scripts;
  }

  // 비디오 파일 수집
  collectVideos() {
    const videos = [];
    const videoElements = [...document.querySelectorAll('video[src], source[src]')];
    
    videoElements.forEach(video => {
      if (video.src && this.isValidUrl(video.src)) {
        videos.push(this.createAssetInfo('video', video.src, video));
      }
    });

    return this.removeDuplicates(videos);
  }

  // 오디오 파일 수집
  collectAudio() {
    const audio = [];
    const audioElements = [...document.querySelectorAll('audio[src], source[src][type*="audio"]')];
    
    audioElements.forEach(audioEl => {
      if (audioEl.src && this.isValidUrl(audioEl.src)) {
        audio.push(this.createAssetInfo('audio', audioEl.src, audioEl));
      }
    });

    return this.removeDuplicates(audio);
  }

  // 웹 폰트 수집
  async collectFonts() {
    const fonts = [];
    
    try {
      if (document.fonts && document.fonts.forEach) {
        document.fonts.forEach(font => {
          // FontFace API로 로드된 폰트들
          if (font.status === 'loaded') {
            fonts.push(this.createAssetInfo('font', font.family, null, {
              family: font.family,
              style: font.style,
              weight: font.weight
            }));
          }
        });
      }

      // CSS에서 @font-face 규칙 찾기
      const stylesheets = [...document.styleSheets];
      for (const stylesheet of stylesheets) {
        try {
          const rules = [...(stylesheet.cssRules || [])];
          rules.forEach(rule => {
            if (rule.type === CSSRule.FONT_FACE_RULE) {
              const src = rule.style.src;
              if (src) {
                const matches = src.match(/url\(['"]?([^'"()]+)['"]?\)/g);
                if (matches) {
                  matches.forEach(match => {
                    const url = match.replace(/url\(['"]?([^'"()]+)['"]?\)/, '$1');
                    if (this.isValidUrl(url)) {
                      fonts.push(this.createAssetInfo('font', this.resolveUrl(url), null, {
                        family: rule.style.fontFamily,
                        format: this.getFontFormat(url)
                      }));
                    }
                  });
                }
              }
            }
          });
        } catch (e) {
          // CORS 등으로 stylesheet 접근 불가
          console.warn('Cannot access stylesheet:', stylesheet.href);
        }
      }
    } catch (error) {
      console.warn('Font collection error:', error);
    }

    return this.removeDuplicates(fonts);
  }

  // Asset 정보 객체 생성
  createAssetInfo(type, url, element = null, metadata = {}) {
    const filename = this.extractFilename(url);
    const extension = this.getFileExtension(filename);
    
    return {
      type,
      url: this.resolveUrl(url),
      filename,
      extension,
      element,
      metadata,
      size: null, // 나중에 fetch로 가져올 수 있음
      downloaded: false,
      id: this.generateAssetId(url)
    };
  }

  // URL에서 파일명 추출
  extractFilename(url) {
    try {
      const urlObj = new URL(url, window.location.href);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || 'unnamed';
      
      // 쿼리 파라미터 제거
      return filename.split('?')[0] || 'unnamed';
    } catch (error) {
      return 'unnamed';
    }
  }

  // 파일 확장자 추출
  getFileExtension(filename) {
    const match = filename.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : '';
  }

  // 폰트 포맷 추출
  getFontFormat(url) {
    const ext = this.getFileExtension(url);
    const formatMap = {
      'woff2': 'woff2',
      'woff': 'woff',
      'ttf': 'truetype',
      'otf': 'opentype',
      'eot': 'embedded-opentype'
    };
    return formatMap[ext] || 'unknown';
  }

  // 상대 URL을 절대 URL로 변환
  resolveUrl(url) {
    try {
      return new URL(url, window.location.href).href;
    } catch (error) {
      return url;
    }
  }

  // 유효한 URL인지 확인
  isValidUrl(url) {
    try {
      const urlObj = new URL(url, window.location.href);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  // 중복 제거
  removeDuplicates(assets) {
    const seen = new Set();
    return assets.filter(asset => {
      if (seen.has(asset.url)) {
        return false;
      }
      seen.add(asset.url);
      return true;
    });
  }

  // Asset ID 생성
  generateAssetId(url) {
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
  }
}

// Console Capture 클래스 - 웹페이지의 콘솔 메시지를 캡처하는 클래스입니다
class ConsoleCapture {
  constructor() {
    // 원본 콘솔 메서드들을 저장
    this.originalMethods = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };
    
    // 캡처 상태
    this.isCapturing = false;
    this.messageCount = 0;
    this.maxMessages = 1000;
    
    // 네트워크 모니터링을 위한 원본 메서드들 저장
    this.originalFetch = window.fetch;
    this.originalXHR = window.XMLHttpRequest;
    
    this.init();
  }
  
  init() {
    // 메시지 리스너 등록
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'startConsoleCapture') {
        this.startCapturing();
        sendResponse({ success: true });
        return false; // 동기 응답
      } else if (message.action === 'stopConsoleCapture') {
        this.stopCapturing();
        sendResponse({ success: true });
        return false; // 동기 응답
      }
    });
  }
  
  // 콘솔 캡처 시작
  startCapturing() {
    if (this.isCapturing) return;
    
    this.isCapturing = true;
    console.log('🖥️ Console capture started');
    
    // 콘솔 메서드들 오버라이드
    this.overrideConsoleMethods();
    
    // 네트워크 모니터링 시작
    this.startNetworkMonitoring();
    
    // 에러 이벤트 리스너 등록
    this.addErrorListeners();
  }
  
  // 콘솔 캡처 중지
  stopCapturing() {
    if (!this.isCapturing) return;
    
    this.isCapturing = false;
    console.log('🖥️ Console capture stopped');
    
    // 원본 콘솔 메서드들 복원
    this.restoreConsoleMethods();
    
    // 네트워크 모니터링 중지
    this.stopNetworkMonitoring();
    
    // 에러 리스너 제거
    this.removeErrorListeners();
  }
  
  // 콘솔 메서드들 오버라이드
  overrideConsoleMethods() {
    const self = this;
    
    ['log', 'error', 'warn', 'info', 'debug'].forEach(method => {
      console[method] = function(...args) {
        // 원본 메서드 실행
        self.originalMethods[method].apply(console, args);
        
        // 메시지 캡처 및 전송
        if (self.isCapturing) {
          self.captureMessage(method, args);
        }
      };
    });
  }
  
  // 원본 콘솔 메서드들 복원
  restoreConsoleMethods() {
    Object.keys(this.originalMethods).forEach(method => {
      console[method] = this.originalMethods[method];
    });
  }
  
  // 네트워크 모니터링 시작
  startNetworkMonitoring() {
    const self = this;
    
    // fetch API 오버라이드
    window.fetch = function(...args) {
      return self.originalFetch.apply(this, args)
        .then(response => {
          if (!response.ok) {
            self.captureNetworkError('fetch', args[0], response.status, response.statusText);
          }
          return response;
        })
        .catch(error => {
          self.captureNetworkError('fetch', args[0], null, error.message);
          throw error;
        });
    };
    
    // XMLHttpRequest 오버라이드
    const OriginalXHR = this.originalXHR;
    window.XMLHttpRequest = function() {
      const xhr = new OriginalXHR();
      const originalSend = xhr.send;
      
      xhr.send = function(...args) {
        xhr.addEventListener('error', () => {
          self.captureNetworkError('xhr', xhr.responseURL || 'unknown', null, 'Network Error');
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 400) {
            self.captureNetworkError('xhr', xhr.responseURL || 'unknown', xhr.status, xhr.statusText);
          }
        });
        
        return originalSend.apply(this, args);
      };
      
      return xhr;
    };
    
    // 원본 XMLHttpRequest의 프로토타입 복사
    window.XMLHttpRequest.prototype = OriginalXHR.prototype;
  }
  
  // 네트워크 모니터링 중지
  stopNetworkMonitoring() {
    window.fetch = this.originalFetch;
    window.XMLHttpRequest = this.originalXHR;
  }
  
  // 에러 이벤트 리스너 등록
  addErrorListeners() {
    this.boundErrorHandler = this.handleError.bind(this);
    this.boundUnhandledRejectionHandler = this.handleUnhandledRejection.bind(this);
    
    window.addEventListener('error', this.boundErrorHandler);
    window.addEventListener('unhandledrejection', this.boundUnhandledRejectionHandler);
  }
  
  // 에러 이벤트 리스너 제거
  removeErrorListeners() {
    if (this.boundErrorHandler) {
      window.removeEventListener('error', this.boundErrorHandler);
    }
    if (this.boundUnhandledRejectionHandler) {
      window.removeEventListener('unhandledrejection', this.boundUnhandledRejectionHandler);
    }
  }
  
  // JavaScript 에러 처리
  handleError(event) {
    if (this.isCapturing) {
      this.captureMessage('error', [`${event.message} at ${event.filename}:${event.lineno}:${event.colno}`], {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    }
  }
  
  // 처리되지 않은 Promise rejection 처리
  handleUnhandledRejection(event) {
    if (this.isCapturing) {
      this.captureMessage('error', [`Unhandled Promise Rejection: ${event.reason}`], {
        reason: event.reason,
        promise: event.promise
      });
    }
  }
  
  // 네트워크 에러 캡처
  captureNetworkError(type, url, status, statusText) {
    if (this.isCapturing) {
      const message = status 
        ? `${type.toUpperCase()} ${status} ${statusText}: ${url}`
        : `${type.toUpperCase()} Failed: ${url} - ${statusText}`;
        
      this.captureMessage('failed-fetch', [message], {
        type,
        url,
        status,
        statusText
      });
    }
  }
  
  // 메시지 캡처 및 전송
  captureMessage(type, args, metadata = {}) {
    if (!this.isCapturing || this.messageCount >= this.maxMessages) return;
    
    this.messageCount++;
    
    const message = {
      type,
      args: this.serializeArgs(args),
      timestamp: Date.now(),
      url: window.location.href,
      metadata,
      stack: this.getStackTrace()
    };
    
    // sidepanel로 메시지 전송
    try {
      chrome.runtime.sendMessage({
        action: 'console-message',
        data: message
      });
    } catch (error) {
      // 확장 프로그램이 비활성화되었거나 연결이 끊어진 경우
      console.warn('Failed to send console message to extension:', error);
    }
  }
  
  // 인자들을 직렬화 가능한 형태로 변환
  serializeArgs(args) {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          // 순환 참조 방지를 위한 JSON 직렬화
          return JSON.parse(JSON.stringify(arg));
        } catch (error) {
          return '[Object: Cannot serialize]';
        }
      } else if (typeof arg === 'function') {
        return `[Function: ${arg.name || 'anonymous'}]`;
      } else if (typeof arg === 'undefined') {
        return '[undefined]';
      } else if (typeof arg === 'symbol') {
        return `[Symbol: ${arg.toString()}]`;
      }
      return arg;
    });
  }
  
  // 스택 트레이스 획득
  getStackTrace() {
    try {
      throw new Error();
    } catch (error) {
      return error.stack || '';
    }
  }
  
  // 메시지 카운트 리셋
  resetMessageCount() {
    this.messageCount = 0;
  }
}

// ElementHighlighter 클래스의 인스턴스(실제 객체)를 생성합니다
// 이렇게 하면 요소 하이라이터가 시작됩니다
new ElementHighlighter();

// AssetCollector 인스턴스 생성
const assetCollector = new AssetCollector();

// ConsoleCapture 인스턴스 생성 (나중에 필요할 때 생성)
let consoleCapture = null;
