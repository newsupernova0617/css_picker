// 웹페이지의 HTML 요소들에 마우스를 올렸을 때 테두리를 그어주는 클래스입니다
// 이 스크립트는 모든 웹페이지에 삽입되어 실행됩니다 (content script)
class ElementHighlighter {
  
  // 클래스가 생성될 때 실행되는 초기화 함수입니다
  constructor() {
    // 현재 하이라이트(테두리 표시)되고 있는 HTML 요소를 저장하는 변수
    this.$currentHighlighted = null;
    
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
    
    // 초기화 함수를 호출합니다
    this.init();
  }
  
  // 컨텐츠 스크립트를 초기화하는 함수입니다
  init() {
    // 백그라운드 스크립트에서 메시지가 올 때를 처리하는 리스너를 등록합니다
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse); // 메시지를 처리하는 함수를 호출합니다
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
          
        default:
          // 알 수 없는 액션인 경우
          sendResponse({ success: false, error: "Unknown action" }); // 오류 응답을 보냅니다
      }
    } catch (error) {
      // 오류가 발생하면 콘솔에 출력하고 오류 응답을 보냅니다
      console.error("Error handling message:", error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  // 요소 하이라이터를 활성화하는 함수입니다
  enable() {
    // 이미 활성화되어 있다면 함수를 종료합니다
    if (this.isActive) return;
    
    // 활성화 상태로 변경합니다
    this.isActive = true;
    
    // jQuery를 사용해서 document에 이벤트 리스너를 등록합니다
    // .on()의 세 번째 매개변수 true는 capturing 모드를 의미합니다
    $(document).on("mouseover.highlighter", this.boundHandleMouseOver);
    $(document).on("mouseout.highlighter", this.boundHandleMouseOut);
    $(document).on("click.highlighter", this.boundHandleClick);
    
    // 콘솔에 활성화 메시지를 출력합니다
    console.log("Element highlighter enabled");
  }
  
  // 요소 하이라이터를 비활성화하는 함수입니다
  disable() {
    // 이미 비활성화되어 있다면 함수를 종료합니다
    if (!this.isActive) return;
    
    // 비활성화 상태로 변경합니다
    this.isActive = false;
    
    // jQuery를 사용해서 이벤트 리스너를 제거합니다
    // .highlighter 네임스페이스를 사용해서 해당 이벤트들만 제거합니다
    $(document).off(".highlighter");
    
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
    
    // CSS 편집 모드일 때는 이미 선택된 요소가 있더라도 다른 요소로 hover 가능하게 함
    
    // 이벤트 버블링을 중지합니다 (부모 요소로 이벤트가 전파되는 것을 막습니다)
    event.stopPropagation();
    
    // 이전에 하이라이트된 요소가 있다면 하이라이트를 제거합니다
    this.clearHighlight();
    
    // 마우스가 올라간 요소를 가져옵니다
    const target = event.target;
    
    // 이 요소가 하이라이트해도 되는 요소인지 확인합니다
    if (this.shouldHighlight(target)) {
      this.highlightElement(target); // 요소를 하이라이트합니다
    }
  }
  
  // 마우스가 요소에서 벗어났을 때 실행되는 함수입니다
  handleMouseOut(event) {
    // 하이라이터가 비활성화 상태라면 함수를 종료합니다
    if (!this.isActive) return;
    
    // 이벤트 버블링을 중지합니다
    event.stopPropagation();
    
    // 마우스가 벗어난 요소가 현재 하이라이트된 요소와 같다면
    if (this.$currentHighlighted && this.$currentHighlighted[0] === event.target) {
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
    // jQuery 객체로 변환해서 현재 하이라이트된 요소로 저장합니다
    this.$currentHighlighted = $(element);
    
    // jQuery의 .css()를 사용해서 원래 outline 스타일을 저장합니다
    this.originalOutline = this.$currentHighlighted.css('outline') || '';
    
    // jQuery의 .css()를 사용해서 하이라이트 스타일을 적용합니다
    this.$currentHighlighted.css({
      outline: `${this.highlightWidth} solid ${this.highlightColor}`,
      outlineOffset: '1px'
    });
  }
  
  // 현재 하이라이트된 요소의 하이라이트를 제거하는 함수입니다
  clearHighlight() {
    // 현재 하이라이트된 요소가 있는지 확인합니다
    if (this.$currentHighlighted && this.$currentHighlighted.length > 0) {
      // jQuery의 .css()를 사용해서 스타일을 원래대로 복원합니다
      this.$currentHighlighted.css({
        outline: this.originalOutline,
        outlineOffset: ''
      });
      
      // 현재 하이라이트된 요소 변수를 비웁니다
      this.$currentHighlighted = null;
      
      // 저장된 원래 outline 스타일도 비웁니다
      this.originalOutline = '';
    }
    
    // 편집 모드는 클릭할 때만 활성화되므로 clearHighlight에서는 해제하지 않음
  }
  
  // 클릭 이벤트를 처리하는 함수입니다
  handleClick(event) {
    // 하이라이터가 비활성화 상태라면 함수를 종료합니다
    if (!this.isActive) return;
    
    // 현재 하이라이트된 요소가 없다면 함수를 종료합니다
    if (!this.$currentHighlighted || this.$currentHighlighted.length === 0) return;
    
    // 이벤트 전파를 중지합니다
    event.preventDefault();
    event.stopPropagation();
    
    // 편집 모드 활성화 (요소를 클릭했을 때만)
    this.isEditingMode = true;
    
    // 클릭된 요소의 CSS 정보를 추출합니다
    const cssInfo = this.extractCSSProperties(event.target);
    
    // 사이드패널로 CSS 정보를 전송합니다
    this.sendElementInfo(cssInfo, event.target);
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
      className: element.className || '(none)',
      id: element.id || '(none)',
      properties: {}
    };
    
    // 각 속성의 값을 추출합니다
    importantProperties.forEach(property => {
      const value = computedStyles.getPropertyValue(property);
      // 값이 있고, 기본값이 아닌 경우에만 저장합니다
      if (value && value !== 'auto' && value !== 'normal' && value !== 'none' && value !== '0px') {
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
      
      // Chrome extension 메시징 API를 사용해서 사이드패널로 정보를 전송합니다
      chrome.runtime.sendMessage({
        type: 'element_clicked',
        cssInfo: cssInfo,
        timestamp: Date.now()
      });
      
      console.log('Element info sent:', cssInfo);
    } catch (error) {
      console.error('Failed to send element info:', error);
    }
  }
  
  // 요소의 CSS 선택자를 생성하는 함수입니다
  generateElementSelector(element) {
    // ID가 있으면 ID를 사용
    if (element.id) {
      return `#${element.id}`;
    }
    
    // 고유한 클래스 조합을 찾아보기
    if (element.className) {
      const classes = element.className.split(' ').filter(cls => cls.trim());
      if (classes.length > 0) {
        const selector = element.tagName.toLowerCase() + '.' + classes.join('.');
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
      
      if (!this.selectedElement) {
        console.error('No element selected for styling');
        return;
      }
      
      // 스타일 직접 적용 (inline style이 가장 높은 우선순위를 가짐)
      this.selectedElement.style.setProperty(property, value, 'important');
      
      // 변경된 스타일 기록 저장
      if (!this.modifiedStyles) {
        this.modifiedStyles = new Map();
      }
      
      if (!this.modifiedStyles.has(this.selectedElement)) {
        this.modifiedStyles.set(this.selectedElement, new Map());
      }
      
      this.modifiedStyles.get(this.selectedElement).set(property, value);
      
      console.log(`Updated ${property}: ${value} on element`, this.selectedElement);
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
    if (this.$currentHighlighted && this.$currentHighlighted.length > 0) {
      this.$currentHighlighted.css('outline', `${this.highlightWidth} solid ${this.highlightColor}`);
    }
  }
}

// ElementHighlighter 클래스의 인스턴스(실제 객체)를 생성합니다
// 이렇게 하면 요소 하이라이터가 시작됩니다
new ElementHighlighter();
