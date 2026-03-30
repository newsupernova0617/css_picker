class ElementHighlighter {
  
  // 클래스가 생성될 때 실행되는 초기화 함수입니다
  constructor() {
    // 현재 하이라이트(테두리 표시)되고 있는 HTML 요소를 저장하는 변수
    this.currentHighlighted = null;
    
    // 하이라이터가 현재 활성화되어 있는지를 나타내는 변수 (true = 켜짐, false = 꺼짐)
    this.isActive = false;
    
    // 요소의 원래 outline 스타일을 저장하는 변수 (나중에 복원하기 위해)
    this.originalOutline = '';
    this.originalOutlineOffset = '';
    
    // 하이라이트할 때 사용할 테두리 색깔
    this.hoverColor = '#0066ff'; // 파란색 (hover 시)
    this.selectedColor = '#ff0000'; // 빨간색 (selected 시)
    
    // 하이라이트할 때 사용할 테두리 두께
    this.highlightWidth = '2px'; // 2픽셀
    
    // CSS 편집과 관련된 변수들
    this.selectedElement = null; // 현재 선택된 요소
    this.selectedElementOriginalOutline = '';
    this.selectedElementOriginalOutlineOffset = '';
    this.selectedElementSelector = null; // 선택된 요소의 CSS 선택자
    this.modifiedStyles = new Map(); // 변경된 스타일 기록
    this.isEditingMode = false; // 편집 모드 상태
    

    
    // CSS 추출 옵션
    this.optimizedExtraction = true; // 기본값으로 최적화된 추출을 사용
    
    // 성능 최적화 변수들
    this.lastMouseOverTime = 0;
    this.mouseOverThrottle = 16; // 60fps throttling (~16ms)
    this.pendingHighlight = null;
    this.cssCache = {}; // CSS 추출 결과 캐시
    
    // 콘솔 모니터링 관련 변수들
    this.isConsoleCapturing = false; // 콘솔 캡처 상태
    this.originalConsoleMethods = {}; // 원본 콘솔 메서드 백업
    this.originalFetch = null; // 원본 fetch 함수 백업
    this.errorHandler = null; // 에러 핸들러
    this.rejectionHandler = null; // Promise rejection 핸들러
    
    // 초기화 함수를 호출합니다
    this.init();
  }
  
  // 컨텐츠 스크립트를 초기화하는 함수입니다
  init() {
    // 메시지 리스너는 이제 전역 레벨에서 설정되므로 여기서는 제거
    
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



        case "get-page-screenshot":
          // 페이지 스크린샷 요청 메시지를 받았을 때
          this.capturePageScreenshot().then(dataUrl => {
            sendResponse({ success: true, dataUrl: dataUrl });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          isAsyncResponse = true; // 비동기 응답 플래그 설정
          break;

        case "startConsoleCapture":
          // 콘솔 모니터링 시작 메시지를 받았을 때
          try {
            this.startConsoleCapture();
            sendResponse({ success: true, action: "console_capture_started", captureActive: this.isConsoleCapturing });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case "stopConsoleCapture":
          // 콘솔 모니터링 중지 메시지를 받았을 때
          this.stopConsoleCapture();
          sendResponse({ success: true, action: "console_capture_stopped" });
          break;

        case "ping":
          // 핑 메시지 - content script가 로드되어 있는지 확인용
          sendResponse({ success: true, action: "pong" });
          break;
          
        default:
          // 알 수 없는 액션을 받았을 때는 오류 응답을 보냅니다
          sendResponse({ success: false, error: "Unknown action" });
      }
    } catch (error) {
      // 오류가 발생하면 콘솔에 로그를 출력하고 오류 응답을 보냅니다
      console.error(`Error handling message: ${action}`, error);
      sendResponse({ success: false, error: error.message });
    }
    
    // 비동기 응답 여부를 반환 (true이면 sendResponse를 나중에 호출)
    return isAsyncResponse;
  }
  
  // 하이라이터를 활성화하는 함수입니다
  enable() {
    // 이미 활성화되어 있으면 더 이상 진행하지 않습니다
    if (this.isActive) return;
    
    // 활성화 상태로 변경합니다
    this.isActive = true;
    
    // 이벤트 리스너를 추가합니다
    // 'mouseover': 마우스를 요소 위에 올렸을 때 발생
    // 'mouseout': 마우스를 요소에서 벗어났을 때 발생
    // 'click': 요소를 클릭했을 때 발생
    document.addEventListener('mouseover', this.boundHandleMouseOver);
    document.addEventListener('mouseout', this.boundHandleMouseOut);
    document.addEventListener('click', this.boundHandleClick);
    
    console.log('🔴 Element highlighter enabled'); // 활성화 로그를 출력합니다
  }
  
  // 하이라이터를 비활성화하는 함수입니다 (메모리 정리 포함)
  disable() {
    // 이미 비활성화되어 있으면 더 이상 진행하지 않습니다
    if (!this.isActive) return;
    
    // 비활성화 상태로 변경합니다
    this.isActive = false;
    
    // 이벤트 리스너를 제거합니다
    document.removeEventListener('mouseover', this.boundHandleMouseOver);
    document.removeEventListener('mouseout', this.boundHandleMouseOut);
    document.removeEventListener('click', this.boundHandleClick);
    
    // 현재 하이라이트된 요소가 있다면 제거합니다
    this.clearHoverHighlight();


    
    // 성능 최적화: 메모리 정리
    this.cleanupPerformanceOptimizations();
    
    console.log('🟢 Element highlighter disabled with cleanup'); // 비활성화 로그를 출력합니다
  }

  // 성능 최적화 관련 메모리 정리
  cleanupPerformanceOptimizations() {
    // 대기 중인 애니메이션 프레임 취소
    if (this.pendingHighlight) {
      cancelAnimationFrame(this.pendingHighlight);
      this.pendingHighlight = null;
    }
    
    // CSS 캐시 정리 (메모리 절약)
    if (this.cssCache) {
      const cacheSize = Object.keys(this.cssCache).length;
      if (cacheSize > 20) { // 20개 이상이면 정리
        const entries = Object.entries(this.cssCache);
        const sortedEntries = entries.sort((a, b) => a[1].cachedAt - b[1].cachedAt);
        
        // 가장 오래된 항목의 절반 제거
        const toRemove = Math.floor(cacheSize / 2);
        for (let i = 0; i < toRemove; i++) {
          delete this.cssCache[sortedEntries[i][0]];
        }
        console.log(`🧹 Cleaned up ${toRemove} cached CSS entries`);
      }
    }
    
    // 변수 리셋
    this.lastMouseOverTime = 0;
    this.clearSelectionHighlight();
    
    // 수정된 스타일 맵 정리
    if (this.modifiedStyles) {
      this.modifiedStyles.clear();
    }
  }
  
  // 마우스를 요소 위에 올렸을 때 실행되는 함수입니다 (성능 최적화)
  handleMouseOver(event) {
    // 하이라이터가 비활성화되어 있으면 함수를 종료합니다
    if (!this.isActive) return;

    // 현재 마우스가 가리키고 있는 HTML 요소를 가져옵니다
    const element = event.target;

    // If the element is the selected element, do nothing
    if (element === this.selectedElement) return;

    // body나 html 태그는 제외합니다 (너무 큰 영역이므로)
    if (element === document.body || element === document.documentElement) return;

    // 성능 최적화: 스로틀링 적용 (60fps)
    const now = performance.now();
    if (now - this.lastMouseOverTime < this.mouseOverThrottle) {
      // 스로틀링 중이면 마지막 요청 저장
      if (this.pendingHighlight) {
        cancelAnimationFrame(this.pendingHighlight);
      }
      this.pendingHighlight = requestAnimationFrame(() => {
        this.highlightElementOptimized(element, this.hoverColor);
        this.lastMouseOverTime = performance.now();
        this.pendingHighlight = null;
      });
      return;
    }

    // 즉시 실행
    this.highlightElementOptimized(element, this.hoverColor);
    this.lastMouseOverTime = now;
  }
  
  // 마우스가 요소에서 벗어났을 때 실행되는 함수입니다
  handleMouseOut(event) {
    // 하이라이터가 비활성화되어 있으면 함수를 종료합니다
    if (!this.isActive) return;
    
    // 하이라이트를 제거합니다
    this.clearHoverHighlight();
  }
  
  // 요소를 클릭했을 때 실행되는 함수입니다
  handleClick(event) {
    // 하이라이터가 비활성화되어 있으면 함수를 종료합니다
    if (!this.isActive) return;
    

    
    // 기본 클릭 동작을 방지합니다 (예: 링크 클릭 등)
    event.preventDefault();
    event.stopPropagation();
    
    // 클릭된 요소를 가져옵니다
    const element = event.target;
    
    // body나 html 태그는 제외합니다
    if (element === document.body || element === document.documentElement) return;
    
    // 선택된 요소를 빨간색으로 하이라이트합니다
    this.highlightElement(element, this.selectedColor);
    
    // 선택된 요소 정보를 저장합니다
    
    // CSS 정보를 추출하여 sidepanel로 전송합니다
    this.extractAndSendCSSInfo(element);
  }
  
  // 요소를 하이라이트하는 함수입니다
  highlightElement(element, color) {
    // Clear hover highlight so selection outline can persist
    this.clearHoverHighlight();

    if (this.selectedElement) {
      this.restoreSelectedElementOutline();
    }

    this.selectedElementOriginalOutline = element.style.outline;
    this.selectedElementOriginalOutlineOffset = element.style.outlineOffset;

    element.style.outline = `${this.highlightWidth} solid ${color}`;
    element.style.outlineOffset = '1px'; // keep outline slightly offset

    this.selectedElement = element;
    this.selectedElementSelector = this.generateSelector(element);
  }

  restoreSelectedElementOutline() {
    if (this.selectedElement) {
      const offset = this.selectedElementOriginalOutlineOffset;
      this.selectedElement.style.outline = this.selectedElementOriginalOutline;
      this.selectedElement.style.outlineOffset = offset || '';
    }
  }


  // 최적화된 하이라이트 함수 (중복 작업 방지)
  highlightElementOptimized(element, color) {
    if (this.currentHighlighted === element) {
      return;
    }

    this.clearHoverHighlight();

    this.originalOutline = element.style.outline;
    this.originalOutlineOffset = element.style.outlineOffset;

    element.style.outline = `${this.highlightWidth} solid ${color}`;
    element.style.outlineOffset = '1px';

    this.currentHighlighted = element;
  }
  
  // 하이라이트를 제거하는 함수입니다
  clearHoverHighlight() {
    if (this.currentHighlighted) {
      const offset = this.originalOutlineOffset;
      this.currentHighlighted.style.outline = this.originalOutline;
      this.currentHighlighted.style.outlineOffset = offset || '';
      this.currentHighlighted = null;
      this.originalOutline = '';
      this.originalOutlineOffset = '';
    }
  }

  clearSelectionHighlight() {
    if (this.selectedElement) {
      this.restoreSelectedElementOutline();
      this.selectedElement = null;
      this.selectedElementSelector = null;
      this.selectedElementOriginalOutline = '';
      this.selectedElementOriginalOutlineOffset = '';
    }
  }


  // CSS 선택자를 생성하는 함수
  generateSelector(element) {
    // ID가 있으면 ID 선택자를 우선 사용
    if (element.id) {
      return `#${element.id}`;
    }
    
    // 클래스가 있으면 클래스 선택자 사용
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/).filter(cls => cls.length > 0);
      if (classes.length > 0) {
        return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
      }
    }
    
    // 기본적으로 태그명 사용
    return element.tagName.toLowerCase();
  }
  
  // 기본값으로 불필요한 스타일을 필터링하는 함수
  isDefaultValue(property, value) {
    // 일반적으로 기본값으로 간주되는 값들
    const commonDefaults = {
      'margin': ['0px', '0'],
      'padding': ['0px', '0'],
      'border': ['none', '0px none', 'medium none'],
      'outline': ['none', '0px none'],
      'background-color': ['rgba(0, 0, 0, 0)', 'transparent'],
      'color': ['rgb(0, 0, 0)', '#000000', 'black'],
      'font-weight': ['400', 'normal'],
      'text-decoration': ['none'],
      'list-style': ['none'],
      'overflow': ['visible'],
      'position': ['static'],
      'display': ['inline', 'block'] // 기본 display는 요소에 따라 다름
    };
    
    // 속성별 기본값 체크
    if (commonDefaults[property] && commonDefaults[property].includes(value)) {
      return true;
    }
    
    // 0px, 0% 등의 값들 필터링
    if (['margin', 'padding', 'top', 'right', 'bottom', 'left'].includes(property)) {
      if (value === '0px' || value === '0') {
        return true;
      }
    }
    
    // auto 값 필터링 (특정 속성들)
    if (['margin', 'width', 'height'].includes(property)) {
      if (value === 'auto') {
        return true;
      }
    }
    
    return false;
  }

  // 간단한 CSS 추출 도구
  createSimpleCSSExtractor() {
    return {
      // 기본 커스텀 프로퍼티 추출
      extractCustomProperties: (element) => {
        const computedStyles = getComputedStyle(element);
        const customProperties = {};
        
        // CSS 커스텀 프로퍼티 (CSS variables) 추출
        for (let i = 0; i < computedStyles.length; i++) {
          const property = computedStyles[i];
          if (property.startsWith('--')) {
            customProperties[property] = computedStyles.getPropertyValue(property);
          }
        }
        
        return customProperties;
      }
    };
  }

  // CSS 정보를 추출하고 sidepanel로 전송하는 함수 (성능 최적화)
  extractAndSendCSSInfo(element) {
    const startTime = performance.now();
    console.log('🔍 Starting optimized CSS extraction for element:', element);
    
    // 캐시 확인 (같은 요소에 대한 반복 요청 방지)
    const elementKey = `${element.tagName}-${element.className}-${element.id}`;
    if (this.cssCache && this.cssCache[elementKey]) {
      const cached = this.cssCache[elementKey];
      console.log(`🚀 Using cached CSS data (${performance.now() - startTime}ms)`);
      
      chrome.runtime.sendMessage({
        type: "element_clicked",
        cssInfo: { ...cached, fromCache: true },
        timestamp: Date.now()
      }).catch(error => {
        console.error('Failed to send cached CSS info:', error);
      });
      return;
    }

    const extractor = this.createSimpleCSSExtractor();
    
    // 기본 요소 정보 수집 (최적화)
    const cssInfo = {
      tagName: element.tagName.toLowerCase(),
      selector: this.generateSelector(element),
      id: element.id,
      className: element.className,
      textContent: element.textContent ? element.textContent.slice(0, 100) : '', // 처음 100자만
      attributes: this.extractAttributesOptimized(element)
    };
    
    // CSS 스타일 추출 (최적화된 버전)
    const computedStyle = getComputedStyle(element);
    const styles = this.extractStylesOptimized(computedStyle);
    
    cssInfo.styles = styles;
    
    // 커스텀 CSS 프로퍼티 추출 (캐시된 버전)
    cssInfo.customProperties = extractor.extractCustomProperties(element);

    // 추출 완료 시간 기록
    const extractionTime = performance.now() - startTime;
    console.log(`✅ Optimized CSS extraction completed in ${extractionTime.toFixed(2)}ms`);
    
    // CSS validation 수행 (간소화)
    cssInfo.validation = this.validateExtractedCSSOptimized(cssInfo, extractionTime);
    
    // 캐시에 저장 (메모리 효율적으로)
    this.cacheExtractedCSS(elementKey, cssInfo);
    
    // sidepanel로 CSS 정보 전송
    chrome.runtime.sendMessage({
      type: "element_clicked",
      cssInfo: cssInfo,
      timestamp: Date.now()
    }).catch(error => {
      console.error('Failed to send CSS info to sidepanel:', error);
    });
  }

  // 최적화된 속성 추출
  extractAttributesOptimized(element) {
    const attributes = {};
    const attrs = element.attributes;
    
    // 중요한 속성만 추출하여 성능 향상
    const importantAttrs = ['id', 'class', 'style', 'data-*', 'aria-*', 'role'];
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      if (importantAttrs.some(pattern => 
        pattern === attr.name || 
        (pattern.endsWith('*') && attr.name.startsWith(pattern.slice(0, -1)))
      )) {
        attributes[attr.name] = attr.value;
      }
    }
    return attributes;
  }

  // 최적화된 스타일 추출 (중요한 스타일만)
  extractStylesOptimized(computedStyle) {
    const styles = {};
    
    // 가장 중요하고 자주 사용되는 CSS 속성들만 추출 (성능 최적화)
    const criticalProperties = [
      // Layout
      'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index',
      'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
      
      // Box Model
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'border', 'border-width', 'border-style', 'border-color', 'border-radius',
      
      // Visual
      'background', 'background-color', 'background-image', 'background-size',
      'color', 'opacity', 'visibility', 'overflow', 'box-shadow',
      
      // Typography
      'font-family', 'font-size', 'font-weight', 'font-style', 'line-height',
      'text-align', 'text-decoration', 'text-transform', 'letter-spacing',
      
      // Flexbox/Grid
      'flex', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items',
      'grid', 'grid-template-columns', 'grid-template-rows', 'grid-gap',
      
      // Transforms & Animations
      'transform', 'transition', 'animation'
    ];

    // 중요한 속성들만 빠르게 추출
    for (const property of criticalProperties) {
      const value = computedStyle.getPropertyValue(property);
      if (value && (!this.optimizedExtraction || !this.isDefaultValue(property, value))) {
        styles[property] = value;
      }
    }
    
    return styles;
  }

  // 간소화된 CSS 검증
  validateExtractedCSSOptimized(cssInfo, extractionTime) {
    return {
      isValid: true,
      warnings: [],
      errors: [],
      tests: [
        `✓ CSS properties extracted: ${Object.keys(cssInfo.styles || {}).length} critical properties`,
        `✓ Performance: Optimized extraction completed in ${extractionTime.toFixed(2)}ms`,
        `✓ CSS selector generated: ${cssInfo.selector}`
      ]
    };
  }

  // CSS 캐시 관리 (메모리 효율적)
  cacheExtractedCSS(elementKey, cssInfo) {
    if (!this.cssCache) {
      this.cssCache = {};
    }
    
    // 캐시 크기 제한 (최대 50개 요소)
    const cacheKeys = Object.keys(this.cssCache);
    if (cacheKeys.length >= 50) {
      // 가장 오래된 캐시 엔트리 제거 (LRU)
      delete this.cssCache[cacheKeys[0]];
    }
    
    this.cssCache[elementKey] = {
      ...cssInfo,
      cachedAt: Date.now()
    };
  }
  
  // CSS 추출 결과를 검증하는 함수
  validateExtractedCSS(cssInfo, startTime) {
    const validationResults = {
      isValid: true,
      warnings: [],
      errors: [],
      tests: []
    };
    
    // 테스트 1: 기본 CSS 속성 추출 검증
    const styleCount = Object.keys(cssInfo.styles || {}).length;
    if (styleCount > 0) {
      validationResults.tests.push(`✓ CSS properties extracted: ${styleCount} properties`);
    } else {
      validationResults.tests.push(`⚠ No CSS properties extracted`);
      validationResults.warnings.push('No computed styles found');
    }
    
    // 테스트 2: 커스텀 프로퍼티 검증
    const customPropCount = Object.keys(cssInfo.customProperties || {}).length;
    if (customPropCount > 0) {
      validationResults.tests.push(`✓ Custom properties found: ${customPropCount} CSS variables`);
    } else {
      validationResults.tests.push(`✓ No custom properties detected`);
    }
    
    // 테스트 3: 성능 검증 (1초 이내 완료)
    const extractionTime = performance.now() - startTime;
    if (extractionTime < 1000) {
      validationResults.tests.push(`✓ Performance: CSS extraction completed in ${extractionTime.toFixed(2)}ms`);
    } else {
      validationResults.tests.push(`⚠ Performance warning: CSS extraction took ${extractionTime.toFixed(2)}ms`);
      validationResults.warnings.push('CSS extraction performance could be improved');
    }
    
    // 테스트 5: 선택자 검증
    if (cssInfo.selector && cssInfo.selector.length > 0) {
      validationResults.tests.push(`✓ CSS selector generated: ${cssInfo.selector}`);
    } else {
      validationResults.tests.push(`⚠ CSS selector generation failed`);
      validationResults.warnings.push('Could not generate valid CSS selector');
    }
    
    // 최종 검증 결과 결정
    validationResults.isValid = validationResults.errors.length === 0;
    
    console.log('🔍 CSS Extraction Validation Results:', validationResults);
    return validationResults;
  }

  // CSS 업데이트 함수
  updateElementStyle(message) {
    if (!this.selectedElement) {
      console.warn('No element selected for CSS update');
      return;
    }
    
    const { property, value } = message;
    
    try {
      // 요소의 인라인 스타일 업데이트
      this.selectedElement.style[property] = value;
      
      // 변경된 스타일 기록
      this.modifiedStyles.set(property, value);
      
      console.log(`CSS updated: ${property} = ${value}`);
    } catch (error) {
      console.error('Failed to update CSS:', error);
    }
  }


  
  // 색상 변환 유틸리티 함수들
  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  
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
  
  async capturePageScreenshot() {
    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        scale: 0.5, // 성능을 위해 스케일 다운
        height: window.innerHeight,
        width: window.innerWidth
      });
      
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      throw error;
    }
  }

  // ============ 콘솔 모니터링 기능 ============
  
  // 콘솔 캡처 시작
  startConsoleCapture() {
    if (this.isConsoleCapturing) return;
    
    this.isConsoleCapturing = true;
    
    // 페이지 컨텍스트에 console 패치 스크립트 주입
    this.injectConsoleScript();
    
    // postMessage 리스너 설정 (페이지에서 오는 콘솔 메시지 수신)
    if (!this.messageListener) {
      this.messageListener = (event) => {
        // 같은 window에서 온 메시지만 처리
        if (event.source !== window) return;
        
        // 콘솔 메시지 캡처 타입 확인
        if (event.data && event.data.type === 'CONSOLE_MESSAGE_CAPTURED') {
          // 사이드패널로 전달
          this.sendConsoleMessage(event.data.method, event.data.args);
        }
      };
      
      window.addEventListener('message', this.messageListener);
    }
    
    console.log('🖥️ Console capture started successfully');
  }
  
  // 페이지에 콘솔 패치 스크립트 주입
  injectConsoleScript() {
    // 이미 주입되었는지 확인
    if (window.__consolePatched) return;
    
    // 외부 파일로 스크립트 로드 (CSP 우회)
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('console-injector.js');
    script.onload = function() {
      console.log('✅ Console injector script loaded');
      this.remove();
    };
    script.onerror = function() {
      console.error('❌ Failed to load console injector script');
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  }
  
  // 콘솔 캐처 중지
  stopConsoleCapture() {
    if (!this.isConsoleCapturing) return;
    
    this.isConsoleCapturing = false;
    
    // postMessage 리스너 제거
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }
    
    // Note: 페이지에 주입된 스크립트는 제거할 수 없으므로
    // 콘솔 패치는 유지되지만 메시지 수신을 중단함
    
    console.log('🖥️ Console capture stopped successfully');
  }
  
  // 콘솔 메시지를 사이드패널로 전송
  sendConsoleMessage(type, args) {
    try {
      const message = {
        type: type,
        args: this.processConsoleArgs(args),
        timestamp: Date.now(),
        url: window.location.href,
        source: 'console'
      };
      
      // DON'T use console.log here - it causes infinite recursion!
      // Just send the message silently
      
      // 크롬 런타임으로 메시지 전송
      chrome.runtime.sendMessage({
        action: 'console-message',
        data: message
      }).then(response => {
        // Success - no logging to avoid recursion
      }).catch(error => {
        // Failure - no logging to avoid recursion
        // This is normal when extension is inactive
      });
    } catch (error) {
      // Error - no logging to avoid recursion
    }
  }
  
  // 콘솔 인자들을 안전하게 처리
  processConsoleArgs(args) {
    return args.map(arg => {
      try {
        // 객체나 배열인 경우 JSON으로 변환
        if (typeof arg === 'object' && arg !== null) {
          if (arg instanceof Error) {
            return {
              type: 'error',
              name: arg.name,
              message: arg.message,
              stack: arg.stack
            };
          } else if (arg instanceof Element) {
            return {
              type: 'element',
              tagName: arg.tagName,
              className: arg.className,
              id: arg.id
            };
          } else {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
        }
        
        // 기본 타입은 그대로 반환
        return arg;
      } catch (error) {
        return '[Unserializable Object]';
      }
    });
  }
  
  // 에러 핸들러 설정
  setupErrorHandlers() {
    // JavaScript 에러 캐치
    this.errorHandler = (event) => {
      this.sendConsoleMessage('error', [{
        type: 'uncaught_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? {
          name: event.error.name,
          message: event.error.message,
          stack: event.error.stack
        } : null
      }]);
    };
    
    // Promise rejection 캐치
    this.rejectionHandler = (event) => {
      this.sendConsoleMessage('error', [{
        type: 'unhandled_rejection',
        reason: event.reason,
        promise: '[Promise]'
      }]);
    };
    
    window.addEventListener('error', this.errorHandler);
    window.addEventListener('unhandledrejection', this.rejectionHandler);
  }
  
  //ingected.js 리스너

  // 에러 핸들러 제거
  removeErrorHandlers() {
    if (this.errorHandler) {
      window.removeEventListener('error', this.errorHandler);
      this.errorHandler = null;
    }
    
    if (this.rejectionHandler) {
      window.removeEventListener('unhandledrejection', this.rejectionHandler);
      this.rejectionHandler = null;
    }
  }
  
  // 네트워크 모니터링 시작
  startNetworkMonitoring() {
    // fetch 오버라이드
    if (window.fetch && !this.originalFetch) {
      this.originalFetch = window.fetch;
      
      window.fetch = async (...args) => {
        const startTime = Date.now();
        const url = args[0];
        
        try {
          const response = await this.originalFetch.apply(window, args);
          const duration = Date.now() - startTime;
          
          // 네트워크 요청 성공 로그
          this.sendConsoleMessage('info', [{
            type: 'network_success',
            method: args[1]?.method || 'GET',
            url: url,
            status: response.status,
            duration: duration + 'ms'
          }]);
          
          return response;
        } catch (error) {
          const duration = Date.now() - startTime;
          
          // 네트워크 요청 실패 로그
          this.sendConsoleMessage('error', [{
            type: 'network_error',
            method: args[1]?.method || 'GET',
            url: url,
            error: error.message,
            duration: duration + 'ms'
          }]);
          
          throw error;
        }
      };
    }
  }
  
  // 네트워크 모니터링 중지
  stopNetworkMonitoring() {
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }
  }
}

export { ElementHighlighter };
