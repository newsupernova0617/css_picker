console.log('===== SIDEPANEL.JS START =====');
console.log('This file is loading at:', new Date().toISOString());
console.log('🚨 HTML inline script moved to sidepanel.js');
console.log('Chrome object exists?', typeof chrome !== 'undefined');
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('Extension ID:', chrome.runtime.id);
}

// ========== CLERK CONFIG INLINE (임시 해결책) ==========
console.log('🔧 Inline clerk config loading...');

const CLERK_CONFIG = {
  publishableKey: 'pk_test_bWVldC13YXJ0aG9nLTgyLmNsZXJrLmFjY291bnRzLmRldiQ',
  frontendApi: 'https://meet-warthog-82.clerk.accounts.dev',
  syncHost: 'http://localhost:4242',
  landingPageUrl: 'http://localhost:4242'
};

// Simple Clerk client implementation for Chrome Extension
class ClerkExtensionClient {
  constructor(config) {
    this.config = config;
    this.user = null;
    this.isLoaded = false;
    this.isSignedIn = false;
    this.sessionToken = null;
    this.init();
  }
  
  async init() {
    try {
      const result = await chrome.storage.local.get(['clerk_session', 'clerk_user']);
      if (result.clerk_session && result.clerk_user) {
        this.sessionToken = result.clerk_session;
        this.user = result.clerk_user;
        const isValid = await this.checkExistingSession();
        this.isSignedIn = isValid;
      }
      this.setupMessageListener();
      this.isLoaded = true;
      this.notifyListeners('loaded');
    } catch (error) {
      console.error('Failed to initialize Clerk client:', error);
      this.isLoaded = true;
    }
  }
  
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'CLERK_AUTH_UPDATE' && message.data) {
        console.log('Received auth update from background:', message.data);
        this.handleAuthSuccess(message.data);
        sendResponse({ success: true });
      }
    });
  }
  
  async handleAuthSuccess(authData) {
    try {
      this.user = authData.user;
      this.sessionToken = authData.sessionToken;
      this.isSignedIn = true;
      await chrome.storage.local.set({
        clerk_session: this.sessionToken,
        clerk_user: this.user
      });
      this.notifyListeners('signIn');
      
      // 로그인 성공 후 plan 동기화 및 UI 업데이트
      if (typeof planManager !== 'undefined') {
        console.log('Syncing plan after login...');
        await planManager.syncPlanStatus();
        console.log('Plan synced:', planManager.currentPlan);
        
        // UI 업데이트 (sidepanel이 있는 경우)
        if (typeof window !== 'undefined' && window.cssSidepanel) {
          await window.cssSidepanel.updatePlanUI();
          // Plan sync 완료 후 premium locks 설정
          await window.cssSidepanel.setupPremiumLocks();
        }
      }
    } catch (error) {
      console.error('Failed to handle auth success:', error);
    }
  }
  
  async signIn() {
    try {
      const extensionId = chrome.runtime.id;
      const authUrl = `${this.config.landingPageUrl}?extension_auth=true&extension_id=${extensionId}`;
      chrome.tabs.create({ url: authUrl });
      return { success: true, redirected: true };
    } catch (error) {
      console.error('Sign in failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  async signOut() {
    try {
      this.user = null;
      this.sessionToken = null;
      this.isSignedIn = false;
      await chrome.storage.local.remove(['clerk_session', 'clerk_user']);
      this.notifyListeners('signOut');
      return { success: true };
    } catch (error) {
      console.error('Sign out failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  async checkExistingSession() {
    try {
      if (this.sessionToken && this.user) {
        const response = await fetch(`${this.config.syncHost}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${this.sessionToken}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          console.log('Existing session is valid');
          return true;
        } else {
          console.log('Existing session is invalid, clearing');
          await this.signOut();
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking existing session:', error);
      return false;
    }
  }
  
  listeners = [];
  addListener(callback) {
    this.listeners.push(callback);
  }
  
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event, this);
      } catch (error) {
        console.error('Listener callback failed:', error);
      }
    });
  }
  
  getUser() {
    return this.user;
  }
  
  getSessionToken() {
    return this.sessionToken;
  }
}

// Initialize Clerk client
const clerkClient = new ClerkExtensionClient(CLERK_CONFIG);
console.log('✅ clerkClient initialized:', clerkClient);

// ========== PLAN MANAGER INLINE ==========
console.log('📋 Inline plan manager loading...');


// ========== 원래 CSS PICKER 코드 시작 ==========
// 드롭다운 선택지가 있는 CSS 속성들 정의
const CSS_DROPDOWN_OPTIONS = {
  'display': ['none', 'block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid', 'table', 'table-row', 'table-cell'],
  'position': ['static', 'relative', 'absolute', 'fixed', 'sticky'],
  'float': ['none', 'left', 'right'],
  'clear': ['none', 'left', 'right', 'both'],
  'visibility': ['visible', 'hidden', 'collapse'],
  'overflow': ['visible', 'hidden', 'scroll', 'auto'],
  'overflow-x': ['visible', 'hidden', 'scroll', 'auto'],
  'overflow-y': ['visible', 'hidden', 'scroll', 'auto'],
  'text-align': ['left', 'right', 'center', 'justify', 'start', 'end'],
  'vertical-align': ['baseline', 'top', 'middle', 'bottom', 'text-top', 'text-bottom', 'super', 'sub'],
  'white-space': ['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line', 'break-spaces'],
  'word-break': ['normal', 'break-all', 'keep-all', 'break-word'],
  'text-decoration': ['none', 'underline', 'overline', 'line-through', 'blink'],
  'text-transform': ['none', 'capitalize', 'uppercase', 'lowercase'],
  'font-style': ['normal', 'italic', 'oblique'],
  'font-weight': ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  'list-style-type': ['none', 'disc', 'circle', 'square', 'decimal', 'decimal-leading-zero', 'lower-roman', 'upper-roman', 'lower-alpha', 'upper-alpha'],
  'cursor': ['auto', 'default', 'pointer', 'crosshair', 'text', 'wait', 'help', 'move', 'not-allowed', 'grab', 'grabbing'],
  'user-select': ['auto', 'none', 'text', 'all'],
  'pointer-events': ['auto', 'none'],
  'box-sizing': ['content-box', 'border-box'],
  'flex-direction': ['row', 'row-reverse', 'column', 'column-reverse'],
  'flex-wrap': ['nowrap', 'wrap', 'wrap-reverse'],
  'justify-content': ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'],
  'align-items': ['stretch', 'flex-start', 'flex-end', 'center', 'baseline'],
  'align-content': ['stretch', 'flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'],
  'align-self': ['auto', 'flex-start', 'flex-end', 'center', 'baseline', 'stretch'],
  'resize': ['none', 'both', 'horizontal', 'vertical'],
  'table-layout': ['auto', 'fixed'],
  'border-collapse': ['separate', 'collapse'],
  'caption-side': ['top', 'bottom'],
  'empty-cells': ['show', 'hide']
};

// CSS 속성 분류 정의
const CSS_CATEGORIES = {
  layout: {
    name: '🎨 Layout & Position',
    properties: ['display', 'position', 'float', 'clear', 'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height', 'z-index', 'top', 'right', 'bottom', 'left', 'overflow', 'visibility']
  },
  boxModel: {
    name: '📦 Box Model',
    properties: ['margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border', 'border-width', 'border-style', 'border-color', 'border-radius', 'box-sizing', 'outline']
  },
  colors: {
    name: '🎨 Colors & Background', 
    properties: ['color', 'background-color', 'background-image', 'background-size', 'background-repeat', 'background-position', 'opacity', 'box-shadow', 'filter']
  },
  typography: {
    name: '✏️ Typography',
    properties: ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'word-spacing', 'text-align', 'text-decoration', 'text-transform', 'white-space', 'word-break']
  },
  flexGrid: {
    name: '🔗 Flexbox & Grid',
    properties: ['flex', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'justify-content', 'align-items', 'align-content', 'align-self', 'grid-template-columns', 'grid-template-rows', 'grid-gap', 'grid-area']
  },
  effects: {
    name: '🎭 Effects & Animation',
    properties: ['transform', 'transition', 'animation', 'cursor', 'pointer-events', 'user-select', 'resize']
  }
};

// Tailwind CSS 변환을 위한 매핑 데이터베이스
const TAILWIND_MAPPINGS = {
  // Layout & Position
  'display': {
    'none': 'hidden',
    'block': 'block', 
    'inline': 'inline',
    'inline-block': 'inline-block',
    'flex': 'flex',
    'inline-flex': 'inline-flex',
    'grid': 'grid',
    'inline-grid': 'inline-grid',
    'table': 'table',
    'table-row': 'table-row',
    'table-cell': 'table-cell'
  },
  
  'position': {
    'static': 'static',
    'relative': 'relative', 
    'absolute': 'absolute',
    'fixed': 'fixed',
    'sticky': 'sticky'
  },

  'visibility': {
    'visible': 'visible',
    'hidden': 'invisible'
  },

  'overflow': {
    'visible': 'overflow-visible',
    'hidden': 'overflow-hidden',
    'scroll': 'overflow-scroll', 
    'auto': 'overflow-auto'
  },

  'overflow-x': {
    'visible': 'overflow-x-visible',
    'hidden': 'overflow-x-hidden',
    'scroll': 'overflow-x-scroll',
    'auto': 'overflow-x-auto'
  },

  'overflow-y': {
    'visible': 'overflow-y-visible', 
    'hidden': 'overflow-y-hidden',
    'scroll': 'overflow-y-scroll',
    'auto': 'overflow-y-auto'
  },

  // Text & Typography
  'text-align': {
    'left': 'text-left',
    'center': 'text-center',
    'right': 'text-right',
    'justify': 'text-justify'
  },

  'font-weight': {
    '100': 'font-thin',
    '200': 'font-extralight',
    '300': 'font-light', 
    '400': 'font-normal',
    '500': 'font-medium',
    '600': 'font-semibold',
    '700': 'font-bold',
    '800': 'font-extrabold',
    '900': 'font-black',
    'normal': 'font-normal',
    'bold': 'font-bold'
  },

  'font-style': {
    'normal': 'not-italic',
    'italic': 'italic'
  },

  'text-decoration': {
    'none': 'no-underline',
    'underline': 'underline',
    'overline': 'overline',
    'line-through': 'line-through'
  },

  'text-transform': {
    'none': 'normal-case',
    'capitalize': 'capitalize',
    'uppercase': 'uppercase',
    'lowercase': 'lowercase'
  },

  'white-space': {
    'normal': 'whitespace-normal',
    'nowrap': 'whitespace-nowrap',
    'pre': 'whitespace-pre',
    'pre-wrap': 'whitespace-pre-wrap',
    'pre-line': 'whitespace-pre-line'
  },

  // Flexbox
  'flex-direction': {
    'row': 'flex-row',
    'row-reverse': 'flex-row-reverse',
    'column': 'flex-col',
    'column-reverse': 'flex-col-reverse'
  },

  'flex-wrap': {
    'nowrap': 'flex-nowrap',
    'wrap': 'flex-wrap',
    'wrap-reverse': 'flex-wrap-reverse'
  },

  'justify-content': {
    'flex-start': 'justify-start',
    'flex-end': 'justify-end',
    'center': 'justify-center',
    'space-between': 'justify-between',
    'space-around': 'justify-around',
    'space-evenly': 'justify-evenly'
  },

  'align-items': {
    'stretch': 'items-stretch',
    'flex-start': 'items-start',
    'flex-end': 'items-end',
    'center': 'items-center',
    'baseline': 'items-baseline'
  },

  'align-content': {
    'stretch': 'content-stretch',
    'flex-start': 'content-start', 
    'flex-end': 'content-end',
    'center': 'content-center',
    'space-between': 'content-between',
    'space-around': 'content-around',
    'space-evenly': 'content-evenly'
  },

  'align-self': {
    'auto': 'self-auto',
    'flex-start': 'self-start',
    'flex-end': 'self-end',
    'center': 'self-center',
    'stretch': 'self-stretch',
    'baseline': 'self-baseline'
  },

  // Miscellaneous
  'cursor': {
    'auto': 'cursor-auto',
    'default': 'cursor-default',
    'pointer': 'cursor-pointer',
    'text': 'cursor-text',
    'move': 'cursor-move',
    'not-allowed': 'cursor-not-allowed',
    'crosshair': 'cursor-crosshair',
    'grab': 'cursor-grab',
    'grabbing': 'cursor-grabbing'
  },

  'user-select': {
    'none': 'select-none',
    'text': 'select-text',
    'all': 'select-all',
    'auto': 'select-auto'
  },

  'pointer-events': {
    'none': 'pointer-events-none',
    'auto': 'pointer-events-auto'
  },

  'box-sizing': {
    'border-box': 'box-border',
    'content-box': 'box-content'
  }
};

// 픽셀 값에서 Tailwind spacing으로 변환하는 매핑
const SPACING_MAPPINGS = {
  '0px': '0', '1px': 'px', '2px': '0.5', '4px': '1', '6px': '1.5',
  '8px': '2', '10px': '2.5', '12px': '3', '14px': '3.5', '16px': '4',
  '18px': '4.5', '20px': '5', '24px': '6', '28px': '7', '32px': '8',
  '36px': '9', '40px': '10', '44px': '11', '48px': '12', '56px': '14',
  '64px': '16', '72px': '18', '80px': '20', '96px': '24'
};

// CSS-to-Tailwind 변환기 클래스
class TailwindConverter {
  constructor() {
    this.conversionResults = {
      converted: [],
      unconverted: []
    };
  }

  // 주어진 CSS 속성들을 Tailwind로 변환
  convertProperties(properties) {
    this.conversionResults = {
      converted: [],
      unconverted: []
    };

    properties.forEach(property => {
      const converted = this.convertSingleProperty(property.name, property.value);
      
      if (converted.success) {
        this.conversionResults.converted.push({
          ...property,
          tailwindClass: converted.tailwindClass,
          originalValue: property.value,
          converted: true
        });
      } else {
        this.conversionResults.unconverted.push({
          ...property,
          converted: false,
          reason: converted.reason
        });
      }
    });

    return this.conversionResults;
  }

  // 단일 CSS 속성을 Tailwind로 변환
  convertSingleProperty(property, value) {
    // 직접 매핑이 있는 경우
    if (TAILWIND_MAPPINGS[property] && TAILWIND_MAPPINGS[property][value]) {
      return {
        success: true,
        tailwindClass: TAILWIND_MAPPINGS[property][value]
      };
    }

    // 특수 케이스 처리
    const specialConversion = this.handleSpecialCases(property, value);
    if (specialConversion.success) {
      return specialConversion;
    }

    // 변환 실패
    return {
      success: false,
      reason: 'No Tailwind mapping available'
    };
  }

  // 특수 케이스 처리 (spacing, colors 등)
  handleSpecialCases(property, value) {
    // Margin 처리
    if (property.startsWith('margin')) {
      const direction = this.getDirectionFromProperty(property, 'margin');
      const spacing = this.convertSpacing(value);
      if (spacing) {
        return {
          success: true,
          tailwindClass: `m${direction}-${spacing}`
        };
      }
    }

    // Padding 처리
    if (property.startsWith('padding')) {
      const direction = this.getDirectionFromProperty(property, 'padding');
      const spacing = this.convertSpacing(value);
      if (spacing) {
        return {
          success: true,
          tailwindClass: `p${direction}-${spacing}`
        };
      }
    }

    // Width/Height 처리
    if (property === 'width' || property === 'height') {
      const size = this.convertSize(value);
      if (size) {
        const prefix = property === 'width' ? 'w' : 'h';
        return {
          success: true,
          tailwindClass: `${prefix}-${size}`
        };
      }
    }

    // Font size 처리
    if (property === 'font-size') {
      const fontSize = this.convertFontSize(value);
      if (fontSize) {
        return {
          success: true,
          tailwindClass: `text-${fontSize}`
        };
      }
    }

    // Colors 처리
    if (property === 'color' || property === 'background-color') {
      const color = this.convertColor(value);
      if (color) {
        const prefix = property === 'color' ? 'text' : 'bg';
        return {
          success: true,
          tailwindClass: `${prefix}-${color}`
        };
      }
    }

    return { success: false, reason: 'Complex property not supported' };
  }

  // 방향성 속성에서 방향 추출 (margin-top -> t)
  getDirectionFromProperty(property, base) {
    const directions = {
      [`${base}-top`]: 't',
      [`${base}-right`]: 'r', 
      [`${base}-bottom`]: 'b',
      [`${base}-left`]: 'l'
    };
    return directions[property] || '';
  }

  // 픽셀 값을 Tailwind spacing으로 변환
  convertSpacing(value) {
    if (SPACING_MAPPINGS[value]) {
      return SPACING_MAPPINGS[value];
    }
    
    // rem 값 처리
    const remMatch = value.match(/^(\d*\.?\d+)rem$/);
    if (remMatch) {
      const remValue = parseFloat(remMatch[1]);
      const pixelEquivalent = remValue * 16; // 1rem = 16px
      return SPACING_MAPPINGS[`${pixelEquivalent}px`];
    }

    return null;
  }

  // 크기 값 변환 (width, height용)
  convertSize(value) {
    // 100% -> full
    if (value === '100%') return 'full';
    if (value === '50%') return '1/2';
    if (value === '33.333333%' || value === '33.33%') return '1/3';
    if (value === '25%') return '1/4';
    if (value === 'auto') return 'auto';

    // 픽셀 값을 spacing으로 변환
    return this.convertSpacing(value);
  }

  // 폰트 크기 변환
  convertFontSize(value) {
    const fontSizes = {
      '12px': 'xs', '14px': 'sm', '16px': 'base', '18px': 'lg',
      '20px': 'xl', '24px': '2xl', '30px': '3xl', '36px': '4xl',
      '48px': '5xl', '60px': '6xl', '72px': '7xl', '96px': '8xl', '128px': '9xl'
    };
    return fontSizes[value] || null;
  }

  // 색상 변환 (기본 색상만)
  convertColor(value) {
    const basicColors = {
      '#000000': 'black', '#ffffff': 'white',
      '#ef4444': 'red-500', '#f97316': 'orange-500', '#eab308': 'yellow-500',
      '#22c55e': 'green-500', '#3b82f6': 'blue-500', '#8b5cf6': 'violet-500',
      '#ec4899': 'pink-500', '#6b7280': 'gray-500'
    };
    
    // RGB to hex 변환이 필요한 경우 여기서 처리
    return basicColors[value.toLowerCase()] || null;
  }

  // 변환 결과 통계
  getConversionStats() {
    const total = this.conversionResults.converted.length + this.conversionResults.unconverted.length;
    const convertedCount = this.conversionResults.converted.length;
    const conversionRate = total > 0 ? Math.round((convertedCount / total) * 100) : 0;

    return {
      total,
      converted: convertedCount,
      unconverted: this.conversionResults.unconverted.length,
      conversionRate
    };
  }
}

// 컬러 샘플링을 위한 유틸리티 클래스
class ColorSampler {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isActive = false;
    this.sampledColors = [];
    this.currentPreviewColor = null;
    // Bind the message handler once to maintain the same reference
    this.boundMessageHandler = this.handleColorSampleMessage.bind(this);
  }

  // 캔버스 기반 색상 샘플링 활성화
  activateSampling() {
    this.isActive = true;
    this.initializeCanvas();
    this.addEventListeners();
  }

  // 색상 샘플링 비활성화
  async deactivateSampling() {
    this.isActive = false;
    this.removeEventListeners();
    this.clearCanvas();
    
    // Send message to content script to disable color sampling
    try {
      const response = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = response[0];
      
      if (activeTab) {
        chrome.tabs.sendMessage(activeTab.id, {
          action: 'disable-color-sampling'
        });
      }
    } catch (error) {
      console.error('Failed to disable color sampling:', error);
    }
  }

  // 캔버스 초기화 (웹페이지 스크린샷 캡처용)
  async initializeCanvas() {
    try {
      // 현재 페이지의 스크린샷을 캡처하기 위해 content script와 통신
      const response = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = response[0];
      
      if (activeTab) {
        // content script에 스크린샷 준비 요청
        chrome.tabs.sendMessage(activeTab.id, {
          action: 'prepare-color-sampling'
        });
      }
    } catch (error) {
      console.error('Failed to initialize color sampling:', error);
    }
  }

  // 이벤트 리스너 추가
  addEventListeners() {
    // content script에서 오는 색상 샘플링 메시지 처리
    chrome.runtime.onMessage.addListener(this.boundMessageHandler);
  }

  // 이벤트 리스너 제거
  removeEventListeners() {
    chrome.runtime.onMessage.removeListener(this.boundMessageHandler);
  }

  // content script에서 오는 모든 메시지 처리 (통합)
  handleColorSampleMessage(message, sender, sendResponse) {
    // 색상 샘플링 메시지 처리
    if (message.action === 'color-sampled') {
      this.processColorSample(message.colorData, message.coordinates);
      sendResponse({ success: true });
      return true;
    }
    
    // 실시간 색상 호버 기능 제거됨 (EyeDropper 기본 사용)
    
    // 콘솔 메시지 처리
    if (message.action === 'console-message') {
      this.consoleManager.addMessage(message.data);
      sendResponse({ success: true });
      return true;
    }
    
    // 기타 메시지 처리 (기존 handleMessage 로직)
    this.handleMessage(message, sender, sendResponse);
    return true;
  }

  // 샘플링된 색상 처리
  processColorSample(colorData, coordinates) {
    if (!colorData) return;

    const color = {
      id: `color_${Date.now()}`,
      hex: this.rgbToHex(colorData.r, colorData.g, colorData.b),
      rgb: {
        r: colorData.r,
        g: colorData.g,
        b: colorData.b,
        a: colorData.a || 1
      },
      hsl: this.rgbToHsl(colorData.r, colorData.g, colorData.b),
      timestamp: Date.now(),
      source: {
        x: coordinates.x,
        y: coordinates.y,
        url: window.location.href
      },
      category: 'sampled'
    };

    // 중복 색상 확인
    const isDuplicate = this.sampledColors.some(existingColor => 
      existingColor.hex === color.hex
    );

    if (!isDuplicate) {
      this.sampledColors.push(color);
      this.saveColorToStorage(color);
      this.notifyColorAdded(color);
    }
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
    const diff = max - min;
    const sum = max + min;
    
    let h = 0;
    let s = 0;
    const l = sum / 2;

    if (diff !== 0) {
      s = l > 0.5 ? diff / (2 - sum) : diff / sum;
      
      switch (max) {
        case r:
          h = ((g - b) / diff) + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / diff + 2;
          break;
        case b:
          h = (r - g) / diff + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
      a: 1
    };
  }

  // HSL을 RGB로 변환
  hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  // 다양한 색상 포맷 생성
  generateColorFormats(color) {
    const { rgb, hsl } = color;
    
    return {
      hex: color.hex,
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      hsla: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${hsl.a})`,
      cssVar: `--color-${Date.now()}: ${color.hex};`
    };
  }

  // 로컬 스토리지에 색상 저장
  saveColorToStorage(color) {
    try {
      const existingColors = this.loadColorsFromStorage();
      existingColors.push(color);
      localStorage.setItem('css-picker-colors', JSON.stringify(existingColors));
    } catch (error) {
      console.error('Failed to save color to storage:', error);
    }
  }

  // 로컬 스토리지에서 색상 로드
  loadColorsFromStorage() {
    try {
      const stored = localStorage.getItem('css-picker-colors');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load colors from storage:', error);
      return [];
    }
  }

  // 색상 팔레트 초기화 (전체 삭제)
  clearColorPalette() {
    this.sampledColors = [];
    localStorage.removeItem('css-picker-colors');
  }

  // 특정 색상 삭제
  removeColor(colorId) {
    this.sampledColors = this.sampledColors.filter(color => color.id !== colorId);
    const updatedColors = this.loadColorsFromStorage().filter(color => color.id !== colorId);
    localStorage.setItem('css-picker-colors', JSON.stringify(updatedColors));
  }

  // 캔버스 정리
  clearCanvas() {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
  }

  // 색상 추가 알림
  notifyColorAdded(color) {
    // 메인 패널에 알림 (나중에 구현될 메서드 호출)
    if (window.sidePanel && window.sidePanel.onColorAdded) {
      window.sidePanel.onColorAdded(color);
    }
  }

  // 색상 대비 계산 (접근성)
  calculateContrast(color1, color2) {
    const getLuminance = (r, g, b) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const lum1 = getLuminance(color1.rgb.r, color1.rgb.g, color1.rgb.b);
    const lum2 = getLuminance(color2.rgb.r, color2.rgb.g, color2.rgb.b);
    
    const contrast = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
    
    return {
      ratio: Math.round(contrast * 100) / 100,
      aa: contrast >= 4.5,
      aaa: contrast >= 7,
      aaLarge: contrast >= 3
    };
  }

  // 색상 하모니 생성 (보색, 유사색 등)
  generateColorHarmony(baseColor, type = 'complementary') {
    const { h, s, l } = baseColor.hsl;
    const harmonies = [];

    switch (type) {
      case 'complementary':
        harmonies.push({
          ...baseColor.hsl,
          h: (h + 180) % 360
        });
        break;
        
      case 'analogous':
        for (let i = 1; i <= 2; i++) {
          harmonies.push({
            ...baseColor.hsl,
            h: (h + (30 * i)) % 360
          });
          harmonies.push({
            ...baseColor.hsl,
            h: (h - (30 * i) + 360) % 360
          });
        }
        break;
        
      case 'triadic':
        harmonies.push({
          ...baseColor.hsl,
          h: (h + 120) % 360
        });
        harmonies.push({
          ...baseColor.hsl,
          h: (h + 240) % 360
        });
        break;
    }

    // HSL을 RGB로 변환하고 전체 색상 객체 생성
    return harmonies.map(hslColor => {
      const rgb = this.hslToRgb(hslColor.h, hslColor.s, hslColor.l);
      return {
        id: `harmony_${Date.now()}_${Math.random()}`,
        hex: this.rgbToHex(rgb.r, rgb.g, rgb.b),
        rgb: { ...rgb, a: 1 },
        hsl: hslColor,
        timestamp: Date.now(),
        category: 'harmony'
      };
    });
  }
}

// Console Manager 클래스 - 콘솔 메시지를 관리하고 표시하는 클래스입니다
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
      'log': '#333',
      'info': '#0dcaf0',
      'warn': '#ffc107',
      'error': '#dc3545',
      'debug': '#6c757d',
      'failed-fetch': '#fd7e14'
    };
    
    this.init();
  }
  
  init() {
    // 메시지 리스너는 메인 클래스에서 통합 처리됨
  }
  
  // 콘솔 모니터링 시작
  startMonitoring() {
    if (this.isActive) return;
    
    this.isActive = true;
    console.log('🖥️ Console monitoring started');
    
    // content script에 시작 신호 전송
    this.sendMessageToActiveTab('startConsoleCapture');
    
    // 성능 모니터링 시작
    this.startPerformanceMonitoring();
    
    // UI 업데이트
    this.updateMonitoringStatus(true);
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
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { action });
      }
    } catch (error) {
      console.error('Failed to send message to active tab:', error);
    }
  }
  
  // 메시지 추가
  addMessage(messageData) {
    if (!this.isActive || this.messages.length >= this.maxMessages) {
      if (this.messages.length >= this.maxMessages) {
        // 오래된 메시지 제거 (FIFO)
        this.messages.shift();
      }
    }
    
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...messageData,
      displayTime: this.formatTimestamp(messageData.timestamp)
    };
    
    this.messages.push(message);
    this.messageCount++;
    
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
    this.filteredMessages = this.messages.filter(message => {
      // 타입 필터
      const typeMatch = this.currentFilter === 'all' || message.type === this.currentFilter;
      
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
    if (!output) return;
    
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
    
    div.innerHTML = `
      <div class="message-header">
        <span class="message-icon">${icon}</span>
        <span class="message-type">${message.type.toUpperCase()}</span>
        <span class="message-time">${message.displayTime}</span>
        <button class="btn btn-sm btn-outline-secondary copy-message-btn" title="Copy Message">📋</button>
      </div>
      <div class="message-content" style="color: ${color};">
        ${this.formatMessageContent(message.args)}
      </div>
      ${message.metadata && Object.keys(message.metadata).length > 0 ? 
        `<div class="message-metadata">
          <small>${this.formatMetadata(message.metadata)}</small>
        </div>` : ''
      }
    `;
    
    // 복사 버튼 이벤트
    const copyBtn = div.querySelector('.copy-message-btn');
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
}

// 사이드패널의 모든 기능을 관리하는 클래스를 정의합니다
// 클래스는 관련된 변수들과 함수들을 하나로 묶어서 관리하는 방법입니다
class SidePanel {
  
  // constructor는 클래스가 생성될 때 가장 먼저 실행되는 함수입니다
  // 초기 설정을 여기서 합니다
  constructor() {
    // 피커가 현재 활성화되어 있는지를 나타내는 변수 (true = 켜짐, false = 꺼짐)
    this.isActive = true;
    
    // HTML에서 상태를 보여주는 요소를 저장할 변수 (나중에 찾아서 넣을 예정)
    // statusIndicator는 이제 toggleButton에 통합됨
    
    // HTML에서 토글 버튼 요소를 저장할 변수 (나중에 찾아서 넣을 예정)
    this.$toggleButton = null;
    
    // 현재 선택된 요소 정보를 저장하는 변수
    this.currentElement = null;
    this.originalStyles = {}; // 원본 스타일 백업용
    this.modifiedStyles = {}; // 수정된 스타일 추적용
    this.currentSelector = null; // 현재 요소의 CSS 선택자
    
    // 새로운 UI 관리 변수들
    this.selectedProperties = new Set(); // 체크된 속성들
    this.categoryStates = new Map(); // 카테고리 접기/펼치기 상태
    this.categorizedProperties = {}; // 분류된 속성들
    this._dropdownEventListenerAdded = false; // 드롭다운 이벤트 리스너 중복 방지
    
    // Asset 관리 변수들
    this.collectedAssets = null; // 수집된 asset 데이터
    this.selectedAssets = new Set(); // 선택된 asset들
    this.assetCategoryStates = new Map(); // Asset 카테고리 접기/펼치기 상태
    
    // Tailwind 변환 관련 변수들
    this.tailwindConverter = new TailwindConverter();
    this.isTailwindView = false; // CSS view vs Tailwind view 토글
    this.tailwindProperties = { converted: [], unconverted: [] }; // 변환된 속성들
    
    // Color Palette 관련 변수들
    this.colorSampler = new ColorSampler();
    this.isColorPaletteMode = false; // Color Palette 모드 상태
    this.isSamplingActive = false; // 샘플링 활성화 상태
    this.sampledColors = []; // 샘플링된 색상 목록
    this.selectedColor = null; // 현재 선택된 색상
    
    // Console Monitor 관련 변수들
    this.consoleManager = new ConsoleManager();
    this.isConsoleMode = false; // Console Monitor 모드 상태
    
    // Authentication 관련 변수들
    this.isSignedIn = false;
    this.currentUser = null;
    this.authState = 'loading'; // loading, signed-out, signed-in
    
    // 기본값으로 모든 카테고리 접힌 상태로 설정
    Object.keys(CSS_CATEGORIES).forEach(categoryKey => {
      this.categoryStates.set(categoryKey, false); // false = 접힌 상태
    });
    
    // 초기화 함수를 호출합니다
    this.init();
  }
  
  // 사이드패널을 초기화하는 함수입니다
  init() {
    // DOM이 로드되었을 때 실행됩니다
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initializeAfterDOM();
      });
    } else {
      this.initializeAfterDOM();
    }
  }
  
  // Wait for external scripts to load
  async waitForScriptsToLoad() {
    const maxWait = 5000; // 5초 최대 대기
    const checkInterval = 100; // 100ms마다 확인
    let waited = 0;
    
    while (waited < maxWait) {
      if (typeof clerkClient !== 'undefined' && typeof planManager !== 'undefined') {
        console.log('✅ Scripts loaded successfully');
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }
    
    console.warn('⚠️ Scripts not loaded within timeout, continuing anyway');
  }
  
  async initializeAfterDOM() {
    // Wait for all scripts to load
    await this.waitForScriptsToLoad();
    
    // HTML 요소들을 찾아서 변수에 저장합니다
    this.setupElements();
    
    // 버튼 클릭 등의 이벤트 리스너를 설정합니다
    this.setupEventListeners();
    
    // CSS 정보 영역을 초기화합니다
    this.initializeCssInfoSection();
    
    // Asset Manager 초기화
    this.initializeAssetManager();
    
    // Authentication 초기화
    this.initializeAuthentication();
    
    // Clerk 초기화 (새로운 Clerk API 사용)
    this.initializeClerkAuth();
    
    // Plan Management 초기화
    this.initializePlanManagement();
    
    // Initialize Home as default view
    this.initializeHomeView();
    
    // 백그라운드 스크립트에게 "사이드패널이 열렸다"고 알려줍니다
    this.notifyOpened();
  }
  
  // HTML에서 필요한 요소들을 찾아서 변수에 저장하는 함수입니다
  setupElements() {
    // vanilla JavaScript의 getElementById는 특정 id를 가진 요소를 찾는 함수입니다
    // statusIndicator는 이제 사용하지 않음 (버튼에 통합됨)
    
    // "toggleBtn" id를 가진 버튼을 찾아서 저장합니다
    this.toggleButton = document.getElementById("toggleBtn");
    
    // CSS 정보 관련 요소들
    this.cssInfoSection = document.getElementById("cssInfoSection");
    this.instructionsSection = document.getElementById("instructionsSection");
    this.elementSelector = document.getElementById("elementSelector");
    this.copySelectorBtn = document.getElementById("copySelectorBtn");
    this.propertiesAccordion = document.getElementById("propertiesAccordion");
    this.selectAllCheckbox = document.getElementById("selectAllCheckbox");
    this.pickerMessage = document.getElementById("pickerMessage");
    this.closeCssInfo = document.getElementById("closeCssInfo");
    this.resetStyles = document.getElementById("resetStyles");
    this.copyCssDropdown = document.getElementById("copyCssBtn");
    
    // Tailwind 변환 관련 요소들
    this.propertiesTitle = document.getElementById("propertiesTitle");
    this.convertToTailwindBtn = document.getElementById("convertToTailwindBtn");
    this.backToCssBtn = document.getElementById("backToCssBtn");
    this.copyTailwindDropdown = document.getElementById("copyTailwindDropdown");
    this.copyTailwindBtn = document.getElementById("copyTailwindBtn");
    
    // Asset Manager 요소들
    this.assetManager = document.getElementById("assetManager");
    this.assetSummary = document.getElementById("assetSummary");
    this.refreshAssetsBtn = document.getElementById("refreshAssetsBtn");
    this.downloadSelectedBtn = document.getElementById("downloadSelectedBtn");
    this.downloadZipBtn = document.getElementById("downloadZipBtn");
    this.selectAllAssetsBtn = document.getElementById("selectAllAssetsBtn");
    this.selectNoneAssetsBtn = document.getElementById("selectNoneAssetsBtn");
    this.assetCategories = document.getElementById("assetCategories");
    
    // Color Palette 요소들
    // 드롭다운 메뉴 아이템으로 변경
    this.colorPaletteMenuItem = document.getElementById("colorPaletteMenuItem");
    this.colorPaletteSection = document.getElementById("colorPaletteSection");
    this.samplingStatus = document.getElementById("samplingStatus");
    this.exitColorModeBtn = document.getElementById("exitColorModeBtn");
    this.clearPaletteBtn = document.getElementById("clearPaletteBtn");
    this.exportPaletteBtn = document.getElementById("exportPaletteBtn");
    this.toggleSamplingBtn = document.getElementById("toggleSamplingBtn");
    this.colorSwatches = document.getElementById("colorSwatches");
    this.selectedColorInfo = document.getElementById("selectedColorInfo");
    this.selectedColorSwatch = document.getElementById("selectedColorSwatch");
    this.selectedColorName = document.getElementById("selectedColorName");
    this.selectedColorFormats = document.getElementById("selectedColorFormats");
    this.deleteColorBtn = document.getElementById("deleteColorBtn");
    this.colorHarmony = document.getElementById("colorHarmony");
    this.harmonyType = document.getElementById("harmonyType");
    this.generateHarmonyBtn = document.getElementById("generateHarmonyBtn");
    this.harmonySwatches = document.getElementById("harmonySwatches");
    
    // Console Monitor 요소들
    // 드롭다운 메뉴 아이템으로 변경
    this.consoleMenuItem = document.getElementById("consoleMenuItem");
    this.consoleSection = document.getElementById("consoleSection");
    this.toggleConsoleBtn = document.getElementById("toggleConsoleBtn");
    this.clearConsoleBtn = document.getElementById("clearConsoleBtn");
    this.exportConsoleBtn = document.getElementById("exportConsoleBtn");
    this.closeConsoleBtn = document.getElementById("closeConsoleBtn");
    this.consoleSearchInput = document.getElementById("consoleSearchInput");
    this.consoleSearchBtn = document.getElementById("consoleSearchBtn");
    this.consoleMessageCount = document.getElementById("consoleMessageCount");
    this.consoleStatus = document.getElementById("consoleStatus");
    this.consolePerformanceInfo = document.getElementById("consolePerformanceInfo");
    this.consoleOutput = document.getElementById("consoleOutput");
    
    // 실시간 색상 프리뷰 요소들
    // 실시간 색상 프리뷰 요소들 제거됨
    
    // Authentication 요소들
    this.authSection = document.getElementById("authSection");
    this.authSignedOut = document.getElementById("authSignedOut");
    this.authSignedIn = document.getElementById("authSignedIn");
    this.signInBtn = document.getElementById("signInBtn");
    this.signOutBtn = document.getElementById("signOutBtn");
    this.authLoading = document.getElementById("authLoading");
    this.userName = document.getElementById("userName");
    this.userEmail = document.getElementById("userEmail");
    this.userAvatar = document.getElementById("userAvatar");
    
    // Plan Management 요소들 (간소화됨)
    this.upgradeBtn = document.getElementById("upgradeBtn");
    this.upgradeModal = document.getElementById("upgradeModal");
    this.upgradeMessage = document.getElementById("upgradeMessage");
    this.benefitsList = document.getElementById("benefitsList");
    this.upgradeNowBtn = document.getElementById("upgradeNowBtn");
    
    // Home Screen 요소들
    this.homeSection = document.getElementById("homeSection");
    this.generalHelpBtn = document.getElementById("generalHelpBtn");
    
    // Header Welcome 요소들 (이제 header에 있음)
    this.homeWelcomeTitle = document.getElementById("homeWelcomeTitle");
    this.homeWelcomeMessage = document.getElementById("homeWelcomeMessage");
    this.homeAuthPrompt = document.getElementById("homeAuthPrompt");
    this.homeToCSSSelectorCard = document.getElementById("homeToCSSSelectorCard");
    this.homeToColorPaletteCard = document.getElementById("homeToColorPaletteCard");
    this.homeToConsoleCard = document.getElementById("homeToConsoleCard");
    this.homeToAssetManagerCard = document.getElementById("homeToAssetManagerCard");
    
    // Navigation 요소들 (Home 버튼들)
    this.cssHomeBtn = document.getElementById("cssHomeBtn");
    this.colorPaletteHomeBtn = document.getElementById("colorPaletteHomeBtn");
    this.consoleHomeBtn = document.getElementById("consoleHomeBtn");
    this.assetManagerHomeBtn = document.getElementById("assetManagerHomeBtn");
    
    // Help 버튼들
    this.cssHelpBtn = document.getElementById("cssHelpBtn");
    this.colorPaletteHelpBtn = document.getElementById("colorPaletteHelpBtn");
    this.consoleHelpBtn = document.getElementById("consoleHelpBtn");
    this.assetManagerHelpBtn = document.getElementById("assetManagerHelpBtn");
    
    // Help Modal
    this.featureHelpModal = document.getElementById("featureHelpModal");
    this.featureHelpModalLabel = document.getElementById("featureHelpModalLabel");
    this.featureHelpContent = document.getElementById("featureHelpContent");
    
    // Current section state
    this.currentSection = 'home';
  }
  
  // 각종 이벤트 리스너들을 설정하는 함수입니다
  // 이벤트 리스너는 "특정 상황이 발생했을 때 실행할 함수"를 등록하는 것입니다
  setupEventListeners() {
    // Home Screen Navigation
    this.setupHomeNavigation();
    
    // vanilla JavaScript의 .addEventListener()로 클릭 이벤트를 등록합니다
    this.toggleButton.addEventListener('click', () => {
      this.togglePicker(); // 피커를 켜거나 끄는 함수를 호출합니다
    });
    
    // beforeunload는 창이나 탭이 닫히기 직전에 발생하는 이벤트입니다
    window.addEventListener("beforeunload", () => {
      // 사이드패널이 닫힐 때 백그라운드에게 알려줍니다
      this.notifyClosed();
    });
    
    // 메시지 리스너 등록 (element_clicked 메시지 처리를 위해)
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      return this.handleMessage(message, sender, sendResponse);
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
      this.updateStatus("🟢 Active Picker", "active"); // 화면에 "활성" 상태를 표시합니다
    } else {
      // 피커가 꺼진 상태라면
      this.notifyClosed(); // 백그라운드에게 "꺼짐"을 알리고
      this.updateStatus("🔴 Inactive Picker", "inactive"); // 화면에 "비활성" 상태를 표시합니다
    }
  }
  
  // 다른 기능 사용 시 CSS Picker 비활성화
  deactivatePickerForOtherFeatures() {
    if (this.isActive) {
      console.log('Deactivating CSS Picker for other feature usage');
      this.isActive = false;
      this.notifyClosed(); // 백그라운드에게 "꺼짐"을 알리고
      this.updateStatus("🔴 Inactive Picker", "inactive"); // 화면에 "비활성" 상태를 표시
    }
  }

  // 모든 활성 기능들을 종료하는 통합 함수
  deactivateAllFeatures() {
    console.log('Deactivating all active features');
    
    // CSS Picker 비활성화
    this.deactivatePickerForOtherFeatures();
    
    // Color Palette 모드 종료
    if (this.isColorPaletteMode) {
      console.log('Exiting Color Palette mode');
      this.exitColorPaletteMode();
    }
    
    // Console 모드 종료  
    if (this.isConsoleMode) {
      console.log('Exiting Console mode');
      this.exitConsoleMode();
    }
    
    // Asset Manager 닫기
    if (this.assetManager && this.assetManager.style.display !== 'none') {
      console.log('Closing Asset Manager');
      this.closeAssetManager();
    }
  }

  // 화면에 표시되는 상태를 업데이트하는 함수입니다
  updateStatus(text, state) {
    // toggleButton의 텍스트와 클래스를 업데이트합니다
    if (!this.toggleButton) return;
    
    // 버튼 텍스트를 변경합니다
    this.toggleButton.innerHTML = text;
    
    // 버튼 클래스를 업데이트합니다 (상태에 따라 다른 색상)
    // 일관성을 위해 success = 활성, secondary = 비활성 사용
    if (state === "active") {
      this.toggleButton.className = "btn btn-primary btn-sm";
    } else {
      this.toggleButton.className = "btn btn-secondary btn-sm";
    }
  }
  
  // 백그라운드 스크립트에게 "사이드패널이 열렸다"고 알려주는 함수입니다
  notifyOpened() {
    try {
      // try-catch는 오류가 발생할 수 있는 코드를 안전하게 실행하는 방법입니다
      // chrome.runtime.sendMessage는 다른 스크립트에게 메시지를 보내는 함수입니다
      chrome.runtime.sendMessage({ 
        type: "sidepanel_opened", // 메시지 종류를 "사이드패널 열림"으로 설정
        timestamp: Date.now() // 현재 시간을 함께 보냅니다
      }).catch(error => {
        console.error("Failed to send opened message:", error);
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
      }).catch(error => {
        console.error("Failed to send closed message:", error);
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
    
    // 실시간 색상 호버 기능 제거됨
  }
  
  // Home Navigation Setup
  setupHomeNavigation() {
    // Home Screen Feature Cards
   if (this.homeToCSSSelectorCard) {
      this.homeToCSSSelectorCard.addEventListener('click', () => {
        this.navigateToFeature('css');
      });
    }

    if (this.homeToColorPaletteCard) {
      this.homeToColorPaletteCard.addEventListener('click', () => {
        this.navigateToFeature('colorpalette');
      });
    }

    if (this.homeToConsoleCard) {
      this.homeToConsoleCard.addEventListener('click', () => {
        this.navigateToFeature('console');
      });
    }

    if (this.homeToAssetManagerCard) {
      this.homeToAssetManagerCard.addEventListener('click', () => {
        this.navigateToFeature('assetmanager');
      });
    }
    
    // Home buttons from each feature
    if (this.cssHomeBtn) {
      this.cssHomeBtn.addEventListener('click', () => {
        this.navigateToHome();
      });
    }
    
    if (this.colorPaletteHomeBtn) {
      this.colorPaletteHomeBtn.addEventListener('click', () => {
        this.navigateToHome();
      });
    }
    
    if (this.consoleHomeBtn) {
      this.consoleHomeBtn.addEventListener('click', () => {
        this.navigateToHome();
      });
    }
    
    if (this.assetManagerHomeBtn) {
      this.assetManagerHomeBtn.addEventListener('click', () => {
        this.navigateToHome();
      });
    }
    
    // Help buttons
    if (this.cssHelpBtn) {
      this.cssHelpBtn.addEventListener('click', () => {
        this.showFeatureHelp('css');
      });
    }
    
    if (this.colorPaletteHelpBtn) {
      this.colorPaletteHelpBtn.addEventListener('click', () => {
        this.showFeatureHelp('colorpalette');
      });
    }
    
    if (this.consoleHelpBtn) {
      this.consoleHelpBtn.addEventListener('click', () => {
        this.showFeatureHelp('console');
      });
    }
    
    if (this.assetManagerHelpBtn) {
      this.assetManagerHelpBtn.addEventListener('click', () => {
        this.showFeatureHelp('assetmanager');
      });
    }
    
    // General Help button
    if (this.generalHelpBtn) {
      this.generalHelpBtn.addEventListener('click', () => {
        this.showGeneralHelp();
      });
    }
  }
  
  // Navigate to specific feature
  async navigateToFeature(featureName) {
    // Check premium access for premium features
    const premiumFeatures = ['colorpalette', 'console', 'assetmanager'];
    if (premiumFeatures.includes(featureName)) {
      if (!(await this.checkFeatureAccess(this.getFeatureKey(featureName)))) {
        return; // Access denied, modal shown
      }
    }
    
    // Deactivate all features first
    this.deactivateAllFeatures();
    
    // Hide Home screen
    this.homeSection.style.display = 'none';
    
    // Show the requested feature
    this.currentSection = featureName;
    
    switch (featureName) {
      case 'css':
        // Show CSS picker but don't activate until user wants to select element
        this.showInstructions();
        break;
      case 'colorpalette':
        this.showColorPaletteSection();
        break;
      case 'console':
        this.showConsoleSection();
        break;
      case 'assetmanager':
        this.showAssetManagerSection();
        break;
    }
    
    // Update header to show we're not in home mode
    this.updateHeaderForFeature(featureName);
  }
  
  // Navigate back to Home
  navigateToHome() {
    // Deactivate all features
    this.deactivateAllFeatures();
    
    // Hide all feature sections
    this.hideAllFeatureSections();
    
    // Show Home screen
    this.homeSection.style.display = 'block';
    this.currentSection = 'home';
    
    // Reset header to initial state
    this.updateHeaderForHome();
    
    // Update home welcome message
    this.updateHomeWelcomeMessage();
  }
  
  // Hide all feature sections
  hideAllFeatureSections() {
    if (this.cssInfoSection) this.cssInfoSection.style.display = 'none';
    if (this.colorPaletteSection) this.colorPaletteSection.style.display = 'none';
    if (this.consoleSection) this.consoleSection.style.display = 'none';
    if (this.assetManager) this.assetManager.style.display = 'none';
  }
  
  // Update header for specific feature
  updateHeaderForFeature(featureName) {
    if (!this.homeWelcomeTitle || !this.homeWelcomeMessage) return;
    
    // Hide auth prompt when in feature screens
    if (this.homeAuthPrompt) {
      this.homeAuthPrompt.style.display = 'none';
    }
    
    const featureHeaders = {
      css: {
        title: '🎯 CSS Picker',
        message: 'Select elements and analyze their CSS properties'
      },
      colorpalette: {
        title: '🎨 Color Palette',
        message: 'Sample colors and create beautiful palettes'
      },
      console: {
        title: '🖥️ Console Monitor',
        message: 'Track console messages and network errors'
      },
      assetmanager: {
        title: '📦 Asset Manager',
        message: 'Collect and download page assets'
      }
    };
    
    const header = featureHeaders[featureName];
    if (header) {
      this.homeWelcomeTitle.textContent = header.title;
      this.homeWelcomeMessage.textContent = header.message;
    }
  }
  
  // Update header for Home
  updateHeaderForHome() {
    // Update home welcome message (handles signed in/out states)
    this.updateHomeWelcomeMessage();
  }
  
  // Show instructions (used for CSS picker default state)
  showInstructions() {
    // This method might already exist, but ensuring CSS info is ready
    this.hideAllFeatureSections();
    // Show CSS info section for CSS picker feature
    this.cssInfoSection.style.display = 'block';
    
    // Auto-activate CSS Picker for better UX
    if (!this.isActive) {
      this.isActive = true;
      this.notifyOpened(); // Notify background script
      this.updateStatus("🟢 Active Picker", "active"); // Update button state
    }
    
    // Show helpful English message for users
    this.showActivePickerMessage();
  }
  
  // Show active picker guidance message
  showActivePickerMessage() {
    if (this.pickerMessage) {
      this.pickerMessage.style.display = 'block';
      
      // Auto-hide message after 8 seconds
      setTimeout(() => {
        if (this.pickerMessage) {
          this.pickerMessage.style.opacity = '0';
          this.pickerMessage.style.transition = 'opacity 0.5s ease';
          setTimeout(() => {
            if (this.pickerMessage) {
              this.pickerMessage.style.display = 'none';
              this.pickerMessage.style.opacity = '1';
            }
          }, 500);
        }
      }, 8000);
    }
  }
  
  // Hide picker message when element is clicked
  hidePickerMessage() {
    if (this.pickerMessage && this.pickerMessage.style.display !== 'none') {
      this.pickerMessage.style.opacity = '0';
      this.pickerMessage.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        if (this.pickerMessage) {
          this.pickerMessage.style.display = 'none';
          this.pickerMessage.style.opacity = '1';
        }
      }, 300);
    }
  }
  
  // Get feature key for premium access checking
  getFeatureKey(featureName) {
    const featureMap = {
      'colorpalette': 'color_sampling',
      'console': 'console_monitoring',
      'assetmanager': 'asset_management'
    };
    return featureMap[featureName];
  }
  
  // Show feature help modal
  showFeatureHelp(featureName) {
    const helpContent = this.getFeatureHelpContent(featureName);
    this.featureHelpModalLabel.textContent = helpContent.title;
    this.featureHelpContent.innerHTML = helpContent.content;
    
    // Show modal using Bootstrap
    const modal = new bootstrap.Modal(this.featureHelpModal, {
    backdrop: false
  });
    modal.show();
  }
  
  // Show general extension help modal
  showGeneralHelp() {
    if (!this.featureHelpModal || !this.featureHelpModalLabel || !this.featureHelpContent) {
      return;
    }
    
    const generalHelpContent = this.getGeneralHelpContent();
    this.featureHelpModalLabel.textContent = generalHelpContent.title;
    this.featureHelpContent.innerHTML = generalHelpContent.content;
    
    // Show modal using Bootstrap
    const modal = new bootstrap.Modal(this.featureHelpModal, {
    backdrop: false
  });
    modal.show();
  }
  
  // Get help content for each feature
  getFeatureHelpContent(featureName) {
    const helpContents = {
      css: {
        title: '🎯 CSS Picker Help',
        content: `
          <div class="help-section">
            <h5>How to Use CSS Picker</h5>
            <ul class="help-steps">
              <li>
                <span class="step-number">1</span>
                <span class="step-content">Click the "Active Picker" button to start selecting elements</span>
              </li>
              <li>
                <span class="step-number">2</span>
                <span class="step-content">Move your cursor over page elements to see blue hover highlights</span>
              </li>
              <li>
                <span class="step-number">3</span>
                <span class="step-content">Click on any element to view its CSS properties</span>
              </li>
              <li>
                <span class="step-number">4</span>
                <span class="step-content">Edit CSS values directly in the properties panel</span>
              </li>
              <li>
                <span class="step-number">5</span>
                <span class="step-content">Use "Select All" to choose which properties to copy</span>
              </li>
              <li>
                <span class="step-number">6</span>
                <span class="step-content">Convert to Tailwind classes for utility-first development</span>
              </li>
            </ul>
          </div>
        `
      },
      colorpalette: {
        title: '🎨 Color Palette Help',
        content: `
          <div class="help-section">
            <h5>How to Use Color Palette</h5>
            <ul class="help-steps">
              <li>
                <span class="step-number">1</span>
                <span class="step-content">Click anywhere on the webpage to open the native color picker</span>
              </li>
              <li>
                <span class="step-number">2</span>
                <span class="step-content">Select colors using the eyedropper tool</span>
              </li>
              <li>
                <span class="step-number">3</span>
                <span class="step-content">Collected colors will appear in your palette</span>
              </li>
              <li>
                <span class="step-number">4</span>
                <span class="step-content">Click on any color swatch to copy it in different formats</span>
              </li>
              <li>
                <span class="step-number">5</span>
                <span class="step-content">Export your palette or generate color harmonies</span>
              </li>
            </ul>
          </div>
        `
      },
      console: {
        title: '🖥️ Console Monitor Help',
        content: `
          <div class="help-section">
            <h5>How to Use Console Monitor</h5>
            <ul class="help-steps">
              <li>
                <span class="step-number">1</span>
                <span class="step-content">Click "Start Monitor" to begin capturing console messages</span>
              </li>
              <li>
                <span class="step-number">2</span>
                <span class="step-content">Filter messages by type: Errors, Warnings, Info, Debug</span>
              </li>
              <li>
                <span class="step-number">3</span>
                <span class="step-content">Use the search box to find specific messages</span>
              </li>
              <li>
                <span class="step-number">4</span>
                <span class="step-content">Monitor network errors and failed requests</span>
              </li>
              <li>
                <span class="step-number">5</span>
                <span class="step-content">Export console logs for debugging or reporting</span>
              </li>
            </ul>
          </div>
        `
      },
      assetmanager: {
        title: '📦 Asset Manager Help',
        content: `
          <div class="help-section">
            <h5>How to Use Asset Manager</h5>
            <ul class="help-steps">
              <li>
                <span class="step-number">1</span>
                <span class="step-content">Asset collection starts automatically when you open this tool</span>
              </li>
              <li>
                <span class="step-number">2</span>
                <span class="step-content">Browse assets by category: Images, Fonts, CSS, JavaScript</span>
              </li>
              <li>
                <span class="step-number">3</span>
                <span class="step-content">Select individual assets or use "Select All" for bulk operations</span>
              </li>
              <li>
                <span class="step-number">4</span>
                <span class="step-content">Download selected assets individually or as a ZIP file</span>
              </li>
              <li>
                <span class="step-number">5</span>
                <span class="step-content">Use "Refresh" to scan for new assets on the current page</span>
              </li>
            </ul>
          </div>
        `
      }
    };
    
    return helpContents[featureName] || { title: 'Help', content: 'No help available.' };
  }
  
  // Get general extension help content
  getGeneralHelpContent() {
    return {
      title: '❓ How to Use This Extension',
      content: `
        <div class="help-section">
          <h5>Getting Started</h5>
          <ul class="help-steps">
            <li>
              <span class="step-number">1</span>
              <span class="step-content">Choose a tool from the cards on the home screen</span>
            </li>
            <li>
              <span class="step-number">2</span>
              <span class="step-content">Each tool provides specific functionality for web analysis</span>
            </li>
            <li>
              <span class="step-number">3</span>
              <span class="step-content">Click the Home button (🏠) from any tool to return here</span>
            </li>
            <li>
              <span class="step-number">4</span>
              <span class="step-content">Use the "?" button in each tool for specific help</span>
            </li>
          </ul>
          
          <h5 style="margin-top: 20px;">Available Tools</h5>
          <div style="margin-bottom: 12px;">
            <strong>🎯 CSS Picker</strong><br>
            <small>Select and analyze CSS properties of any element on the webpage</small>
          </div>
          <div style="margin-bottom: 12px;">
            <strong>🎨 Color Palette</strong><br>
            <small>Sample colors from the webpage and create beautiful palettes (Premium)</small>
          </div>
          <div style="margin-bottom: 12px;">
            <strong>🖥️ Console Monitor</strong><br>
            <small>Track console messages and network errors in real-time (Premium)</small>
          </div>
          <div style="margin-bottom: 12px;">
            <strong>📦 Asset Manager</strong><br>
            <small>Collect and download page assets like images and fonts (Premium)</small>
          </div>
          
          <h5 style="margin-top: 20px;">Premium Features</h5>
          <p style="font-size: 13px; color: #6c757d; margin-bottom: 8px;">
            Sign in to unlock advanced tools and unlimited usage. Premium features are marked with color coding in the interface.
          </p>
        </div>
      `
    };
  }
  
  // Initialize Home View as Default
  initializeHomeView() {
    // Hide all feature sections initially
    this.hideAllFeatureSections();
    
    // Show Home section
    if (this.homeSection) {
      this.homeSection.style.display = 'block';
      this.currentSection = 'home';
    }
    
    // Reset toggle button to initial state (not active)
    if (this.toggleButton) {
      this.updateStatus('비활성', 'inactive');
    }
    
    // Update home welcome message based on auth state
    this.updateHomeWelcomeMessage();
  }
  
  // Update Home welcome message based on authentication state
  updateHomeWelcomeMessage() {
    if (!this.homeWelcomeTitle || !this.homeWelcomeMessage) {
      return;
    }
    
    // Check if user is signed in
    const isSignedIn = this.authSignedIn && this.authSignedIn.style.display !== 'none';
    
    if (isSignedIn && this.currentUser) {
      // Signed in: personalized welcome
      this.homeWelcomeTitle.textContent = `🏠 Welcome back, ${this.currentUser.firstName || 'User'}!`;
      this.homeWelcomeMessage.textContent = 'Choose a tool to continue your web development analysis';
      
      // Hide auth prompts when signed in
      if (this.homeAuthPrompt) {
        this.homeAuthPrompt.style.display = 'none';
      }
    } else {
      // Signed out: show auth prompts
      this.homeWelcomeTitle.textContent = '🏠 CSS Picker Extension';
      this.homeWelcomeMessage.textContent = 'Choose a tool to get started with web development analysis';
      
      // Show auth prompt when signed out (only on home screen)
      if (this.currentSection === 'home') {
        if (this.homeAuthPrompt) {
          this.homeAuthPrompt.style.display = 'block';
        }
      }
    }
  }
  
  // CSS 정보 영역을 초기화하는 함수입니다
  initializeCssInfoSection() {
    // 이벤트 위임이 이미 설정되었는지 확인
    if (this._dropdownEventListenerAdded) {
      // 이미 추가된 경우 다른 초기화 작업만 수행
      this.initializeCssInfoBasic();
      return;
    }
    // 닫기 버튼 이벤트 리스너 설정
    if (this.closeCssInfo) {
      this.closeCssInfo.addEventListener('click', () => {
        this.hideCssInfo();
      });
    }
    
    // 리셋 버튼 이벤트 리스너 설정
    if (this.resetStyles) {
      this.resetStyles.addEventListener('click', () => {
        this.resetAllStyles();
      });
    }
    
    // Copy CSS 드롭다운 메뉴 아이템들은 이벤트 위임으로 처리됨 (2027-2037줄 참조)
    
    // 새로운 UI 요소들의 이벤트 리스너
    if (this.copySelectorBtn) {
      this.copySelectorBtn.addEventListener('click', () => {
        this.copySelectorToClipboard();
      });
    }
    
    if (this.selectAllCheckbox) {
      this.selectAllCheckbox.addEventListener('change', () => {
        if (this.selectAllCheckbox.checked) {
          this.selectAllProperties();
        } else {
          this.selectNoneProperties();
        }
      });
    }
    
    // Tailwind 변환 관련 이벤트 리스너
    if (this.convertToTailwindBtn) {
      this.convertToTailwindBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Premium 기능 권한 체크
        if (!(await this.checkFeatureAccess('tailwind_conversion'))) {
          return; // 권한 없으면 모달 표시 후 종료
        }
        
        this.convertToTailwindView();
      });
    }
    
    if (this.backToCssBtn) {
      this.backToCssBtn.addEventListener('click', () => {
        this.backToCssView();
      });
    }
    
    // 드롭다운 메뉴 아이템들은 제거되었음 - 홈 기반 네비게이션으로 대체됨
    
    // Exit Color Mode 버튼 이벤트 리스너
    if (this.exitColorModeBtn) {
      this.exitColorModeBtn.addEventListener('click', () => {
        this.exitColorPaletteMode();
      });
    }
    
    if (this.clearPaletteBtn) {
      this.clearPaletteBtn.addEventListener('click', () => {
        this.clearColorPalette();
      });
    }
    
    if (this.exportPaletteBtn) {
      this.exportPaletteBtn.addEventListener('click', () => {
        this.exportColorPalette();
      });
    }
    
    if (this.toggleSamplingBtn) {
      this.toggleSamplingBtn.addEventListener('click', () => {
        this.toggleColorSampling();
      });
    }
    
    if (this.deleteColorBtn) {
      this.deleteColorBtn.addEventListener('click', () => {
        this.deleteSelectedColor();
      });
    }
    
    if (this.generateHarmonyBtn) {
      this.generateHarmonyBtn.addEventListener('click', () => {
        this.generateColorHarmony();
      });
    }
    
    // Console 메뉴 아이템은 제거되었음 - 홈 기반 네비게이션으로 대체됨
    
    // Console 관련 버튼들
    if (this.toggleConsoleBtn) {
      this.toggleConsoleBtn.addEventListener('click', () => {
        this.toggleConsoleMonitoring();
      });
    }
    
    if (this.clearConsoleBtn) {
      this.clearConsoleBtn.addEventListener('click', () => {
        this.clearConsoleMessages();
      });
    }
    
    if (this.exportConsoleBtn) {
      this.exportConsoleBtn.addEventListener('click', () => {
        this.exportConsoleMessages();
      });
    }
    
    if (this.closeConsoleBtn) {
      this.closeConsoleBtn.addEventListener('click', () => {
        this.exitConsoleMode();
      });
    }
    
    if (this.consoleSearchBtn) {
      this.consoleSearchBtn.addEventListener('click', () => {
        this.searchConsoleMessages();
      });
    }
    
    if (this.consoleSearchInput) {
      this.consoleSearchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          this.searchConsoleMessages();
        }
      });
      
      this.consoleSearchInput.addEventListener('input', (e) => {
        this.searchConsoleMessages();
      });
    }
    
    // 필터 버튼 이벤트 리스너 (이벤트 위임 사용)
    document.addEventListener('click', (e) => {
      if (e.target.matches('.filter-btn')) {
        const filter = e.target.dataset.filter;
        this.setConsoleFilter(filter);
      }
    });
    
    // 간단한 복사 버튼 이벤트 리스너 설정
    this.initializeCopyButtons();
    
    // 이벤트 리스너가 추가되었음을 표시
    this._dropdownEventListenerAdded = true;
    
    // 기본 초기화 작업 수행
    this.initializeCssInfoBasic();
  }
  
  // 간단한 복사 버튼 초기화
  initializeCopyButtons() {
    // Copy CSS 버튼 이벤트 리스너
    if (this.copyCssDropdown) {
      this.copyCssDropdown.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Copy CSS button clicked'); // 디버깅용
        
        // CSS Rule 형태로 복사
        this.copyCssToClipboard('css');
      });
    }
    
    // Copy Tailwind 버튼 이벤트 리스너
    const copyTailwindBtn = document.getElementById('copyTailwindBtn');
    if (copyTailwindBtn) {
      copyTailwindBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Copy Tailwind button clicked'); // 디버깅용
        
        // Tailwind Classes 형태로 복사
        this.copyTailwindToClipboard('tailwind-classes');
      });
    }
  }
  
  // CSS 정보 섹션의 기본 초기화 작업
  initializeCssInfoBasic() {
    // 추가적인 초기화 작업이 필요한 경우 여기에 추가
  }
  
  // CSS 요소 정보를 화면에 표시하는 함수입니다
  displayElementInfo(cssInfo) {
    try {
      // Hide the picker guidance message when element is clicked
      this.hidePickerMessage();
      
      // 현재 선택된 요소 정보 저장
      this.currentElement = {
        tagName: cssInfo.tagName,
        className: cssInfo.className,
        id: cssInfo.id
      };
      
      // CSS 선택자 생성 및 표시
      this.currentSelector = this.generateCssSelector(this.currentElement);
      this.elementSelector.textContent = this.currentSelector;
      
      // CSS 속성들을 분류
      this.categorizedProperties = this.categorizeProperties(cssInfo.properties);
      
      // 기본적으로 모든 속성 선택
      this.selectedProperties.clear();
      Object.keys(cssInfo.properties).forEach(property => {
        this.selectedProperties.add(property);
      });
      
      // Accordion UI 생성
      this.buildAccordionUI();
      
      // Select All 체크박스를 기본적으로 체크 상태로 설정
      if (this.selectAllCheckbox) {
        this.selectAllCheckbox.checked = true;
        this.selectAllCheckbox.indeterminate = false;
      }
      
      // 원본 스타일 백업
      this.backupOriginalStyles(cssInfo.properties);
      
      // 수정된 스타일 초기화
      this.modifiedStyles = {};
      
      // CSS 정보 섹션 보이기 및 설명 섹션 숨기기
      this.showCssInfo();
      
      console.log('CSS info displayed:', cssInfo);
    } catch (error) {
      console.error('Failed to display CSS info:', error);
    }
  }
  
  // CSS 정보 섹션을 보여주는 함수입니다
  showCssInfo() {
    this.cssInfoSection.style.display = 'block';
    this.instructionsSection.style.display = 'none';
  }
  
  // CSS 정보 섹션을 숨기는 함수입니다
  hideCssInfo() {
    this.cssInfoSection.style.display = 'none';
    this.instructionsSection.style.display = 'block';
    // 편집 중인 상태 정리
    this.currentElement = null;
    this.originalStyles = {};
    this.selectedProperties.clear();
    this.categorizedProperties = {};
  }
  
  // CSS 속성들을 카테고리별로 분류하는 함수
  categorizeProperties(properties) {
    const categorized = {};
    
    // 각 카테고리 초기화
    Object.keys(CSS_CATEGORIES).forEach(categoryKey => {
      categorized[categoryKey] = {};
    });
    
    // 속성들을 카테고리별로 분류
    Object.entries(properties).forEach(([property, value]) => {
      let categorized_flag = false;
      
      // 각 카테고리에서 해당 속성이 있는지 확인
      for (const [categoryKey, category] of Object.entries(CSS_CATEGORIES)) {
        if (category.properties.includes(property)) {
          categorized[categoryKey][property] = value;
          categorized_flag = true;
          break;
        }
      }
      
      // 분류되지 않은 속성은 effects 카테고리에 추가
      if (!categorized_flag) {
        categorized.effects[property] = value;
      }
    });
    
    return categorized;
  }
  
  // Accordion UI를 생성하는 함수
  buildAccordionUI() {
    this.propertiesAccordion.innerHTML = '';
    
    Object.entries(CSS_CATEGORIES).forEach(([categoryKey, category]) => {
      const categoryProperties = this.categorizedProperties[categoryKey];
      const propertyCount = Object.keys(categoryProperties).length;
      
      if (propertyCount === 0) return; // 속성이 없으면 스킵
      
      // 카테고리 아이템 생성
      const categoryItem = this.createCategoryItem(categoryKey, category, categoryProperties);
      this.propertiesAccordion.appendChild(categoryItem);
    });
  }
  
  // 카테고리 아이템을 생성하는 함수
  createCategoryItem(categoryKey, category, properties) {
    const propertyCount = Object.keys(properties).length;
    const selectedCount = Object.keys(properties).filter(prop => this.selectedProperties.has(prop)).length;
    const isExpanded = this.categoryStates.get(categoryKey);
    
    // div 요소 생성
    const categoryItem = document.createElement('div');
    categoryItem.className = 'category-item';
    categoryItem.setAttribute('data-category', categoryKey);
    
    // HTML 문자열로 내부 콘텐츠 생성
    categoryItem.innerHTML = `
      <button class="category-header ${isExpanded ? 'expanded' : ''}" type="button">
        <input type="checkbox" class="category-checkbox" ${selectedCount === propertyCount ? 'checked' : ''}>
        <span class="category-title">${category.name}</span>
        <span class="category-count">${selectedCount}/${propertyCount}</span>
        <span class="category-toggle ${isExpanded ? 'expanded' : ''}">▶</span>
      </button>
      <div class="category-content ${isExpanded ? 'expanded' : ''}">
        ${this.createPropertiesHTML(properties)}
      </div>
    `;
    
    // 카테고리 헤더 클릭 이벤트
    const categoryHeader = categoryItem.querySelector('.category-header');
    categoryHeader.addEventListener('click', (e) => {
      // 체크박스 클릭이면 토글하지 않음
      if (e.target.type === 'checkbox') return;
      this.toggleCategory(categoryKey);
    });
    
    // 카테고리 체크박스 이벤트
    const categoryCheckbox = categoryItem.querySelector('.category-checkbox');
    categoryCheckbox.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleCategorySelection(categoryKey, e.target.checked);
    });
    
    // 속성 체크박스 이벤트 (이벤트 위임 사용)
    categoryItem.addEventListener('click', (e) => {
      if (e.target.matches('.property-checkbox')) {
        e.stopPropagation();
        const propertyItem = e.target.closest('.property-item-accordion');
        const property = propertyItem.getAttribute('data-property');
        if (e.target.checked) {
          this.selectedProperties.add(property);
        } else {
          this.selectedProperties.delete(property);
        }
        this.updateUI();
      }
    });
    
    // 속성값 편집 이벤트
    categoryItem.addEventListener('click', (e) => {
      if (e.target.matches('.property-value-accordion')) {
        const valueSpan = e.target;
        const propertyItem = valueSpan.closest('.property-item-accordion');
        const property = propertyItem.getAttribute('data-property');
        const currentValue = valueSpan.getAttribute('data-original-value');
        this.startEditingAccordion(valueSpan, property, currentValue);
      }
    });
    
    return categoryItem;
  }
  
  // 속성들의 HTML을 생성하는 함수
  createPropertiesHTML(properties) {
    return Object.entries(properties).map(([property, value]) => {
      const isSelected = this.selectedProperties.has(property);
      return `
        <div class="property-item-accordion" data-property="${property}">
          <input type="checkbox" class="property-checkbox" ${isSelected ? 'checked' : ''}>
          <span class="property-name-accordion">${property}</span>
          <span class="property-value-accordion" data-original-value="${value}">${value}</span>
        </div>
      `;
    }).join('');
  }
  
  // 편집 가능한 CSS 속성 아이템을 생성하는 함수입니다
  createEditablePropertyItem(property, value) {
    const propertyItem = document.createElement('div');
    propertyItem.className = 'property-item';
    propertyItem.setAttribute('data-property', property);
    
    propertyItem.innerHTML = `
      <span class="property-name">${property}</span>
      <span class="property-value editable" data-original-value="${value}">${value}</span>
      <span class="edit-icon">✏️</span>
    `;
    
    // 속성값 클릭 시 편집 모드로 전환
    const propertyValue = propertyItem.querySelector('.property-value');
    propertyValue.addEventListener('click', (e) => {
      this.startEditing(e.target, property, value);
    });
    
    // 편집 아이콘 클릭 시 편집 모드로 전환
    const editIcon = propertyItem.querySelector('.edit-icon');
    editIcon.addEventListener('click', (e) => {
      const valueSpan = propertyItem.querySelector('.property-value');
      this.startEditing(valueSpan, property, value);
    });
    
    return propertyItem;
  }
  
  // 편집 모드를 시작하는 함수입니다
  startEditing(valueSpan, property, currentValue) {
    // 이미 편집 중인 다른 항목이 있다면 취소
    this.cancelAllEditing();
    
    // 편집 중 표시
    valueSpan.classList.add('editing');
    
    // 입력 필드 생성
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'property-input';
    input.value = currentValue;
    
    // 원본 텍스트 숨기고 입력 필드 표시
    valueSpan.style.display = 'none';
    valueSpan.parentNode.insertBefore(input, valueSpan.nextSibling);
    input.focus();
    input.select();
    
    // 실시간 업데이트를 위한 이벤트 리스너
    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.applyStyleChange(property, input.value);
      }, 300); // 300ms 디바운싱
    });
    
    // Enter 키로 확정
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.confirmEdit(valueSpan, input, property);
      } else if (e.key === 'Escape') {
        this.cancelEdit(valueSpan, input, property);
      }
    });
    
    // 포커스 잃으면 확정
    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (input.style.display !== 'none') {
          this.confirmEdit(valueSpan, input, property);
        }
      }, 100);
    });
  }
  
  // 편집을 확정하는 함수입니다
  confirmEdit(valueSpan, input, property) {
    const newValue = input.value;
    
    // 최종 스타일 적용
    this.applyStyleChange(property, newValue);
    
    // UI 업데이트
    valueSpan.textContent = newValue;
    valueSpan.classList.remove('editing');
    valueSpan.style.display = '';
    input.remove();
  }
  
  // 편집을 취소하는 함수입니다
  cancelEdit(valueSpan, input, property) {
    // 원본값으로 되돌리기
    const originalValue = valueSpan.getAttribute('data-original-value');
    this.applyStyleChange(property, originalValue);
    
    // UI 복원
    valueSpan.classList.remove('editing');
    valueSpan.style.display = '';
    input.remove();
  }
  
  // 모든 편집 상태를 취소하는 함수입니다
  cancelAllEditing() {
    const inputs = document.querySelectorAll('.property-input');
    inputs.forEach(input => {
      const valueSpan = input.previousElementSibling;
      const propertyItem = input.closest('.property-item');
      const property = propertyItem ? propertyItem.getAttribute('data-property') : null;
      
      if (valueSpan && property) {
        this.cancelEdit(valueSpan, input, property);
      }
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
      
      // 수정된 스타일 추적
      this.modifiedStyles[property] = value.trim();
      
      console.log('🔍 Attempting to apply style change:', {
        property: property,
        value: value.trim(),
        elementInfo: this.currentElement
      });
      
      // Method 1: Chrome extension 메시지 통신 시도
      this.sendCssUpdateMessage(property, value.trim());
      
      // Method 2: Content script injection 방법 (대체 방안)
      this.injectCssUpdate(property, value.trim());
      
    } catch (error) {
      console.error('Failed to apply style change:', error);
      this.showError('Failed to apply style change.');
    }
  }
  
  // 메시지 통신을 통한 CSS 업데이트
  sendCssUpdateMessage(property, value) {
    try {
      chrome.runtime.sendMessage({
        type: 'update_css',
        property: property,
        value: value,
        elementInfo: this.currentElement,
        timestamp: Date.now()
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Message communication failed:', chrome.runtime.lastError);
          console.log('Falling back to injection method...');
        } else {
          console.log('✅ Message sent successfully, response:', response);
        }
      });
    } catch (error) {
      console.error('Message sending failed:', error);
    }
  }
  
  // Script injection을 통한 직접 CSS 조작 (대체 방안)
  injectCssUpdate(property, value) {
    try {
      if (!this.currentElement) {
        console.error('No current element for injection method');
        return;
      }
      
      // CSS 선택자 생성
      const selector = this.generateCssSelector(this.currentElement);
      console.log('🚀 Using injection method with selector:', selector);
      
      // 스크립트 주입 - 직접 함수로 실행
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) {
          chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            func: (selectorParam, propertyParam, valueParam) => {
              try {
                console.log('🔧 Injection script executing...');
                console.log('Parameters:', { selector: selectorParam, property: propertyParam, value: valueParam });
                
                // 여러 방법으로 요소 찾기
                let targetElement = null;
                
                // Method 1: CSS 선택자로 찾기
                const elements = document.querySelectorAll(selectorParam);
                if (elements.length > 0) {
                  targetElement = elements[0];
                  console.log('Found element via selector:', targetElement);
                }
                
                // Method 2: 현재 하이라이트된 요소 찾기 (outline이 있는 요소)
                if (!targetElement) {
                  const highlightedElements = document.querySelectorAll('[style*="outline"]');
                  if (highlightedElements.length > 0) {
                    targetElement = highlightedElements[highlightedElements.length - 1]; // 마지막 요소
                    console.log('Found highlighted element:', targetElement);
                  }
                }
                
                if (targetElement) {
                  // CSS 스타일 적용
                  targetElement.style.setProperty(propertyParam, valueParam, 'important');
                  console.log('✅ Successfully applied style:', propertyParam + ': ' + valueParam);
                  console.log('Element style after injection:', targetElement.style.cssText);
                  
                  // 시각적 확인을 위해 잠깐 배경색 변경
                  const originalBg = targetElement.style.backgroundColor;
                  targetElement.style.backgroundColor = '#ffff99';
                  setTimeout(() => {
                    if (originalBg) {
                      targetElement.style.backgroundColor = originalBg;
                    } else {
                      targetElement.style.removeProperty('background-color');
                    }
                  }, 500);
                  
                  return true;
                } else {
                  console.error('Could not find target element');
                  return false;
                }
              } catch (err) {
                console.error('Injection script error:', err);
                return false;
              }
            },
            args: [selector, property, value]
          }).then((results) => {
            console.log('Script injection result:', results);
          }).catch((error) => {
            console.error('Script injection failed:', error);
          });
        }
      });
      
    } catch (error) {
      console.error('Injection method failed:', error);
    }
  }
  
  // 에러 메시지를 표시하는 함수입니다
  showError(message) {
    // 간단한 에러 표시
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-sm';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'margin-top: 10px; padding: 8px; font-size: 0.8rem;';
    
    // 기존 에러 메시지 제거
    const existingAlerts = this.propertiesAccordion.parentNode.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // 새 에러 메시지 추가
    this.propertiesAccordion.parentNode.insertBefore(errorDiv, this.propertiesAccordion);
    
    // 3초 후 자동 제거
    setTimeout(() => {
      errorDiv.style.opacity = '0';
      errorDiv.style.transition = 'opacity 0.3s';
      setTimeout(() => errorDiv.remove(), 300);
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
    
    // 수정된 스타일 초기화
    this.modifiedStyles = {};
    
    // UI도 원본값으로 업데이트
    const propertyValues = document.querySelectorAll('.property-value-accordion');
    propertyValues.forEach(element => {
      const propertyItem = element.closest('.property-item-accordion');
      const property = propertyItem ? propertyItem.getAttribute('data-property') : null;
      const originalValue = this.originalStyles[property];
      if (originalValue) {
        element.textContent = originalValue;
        element.setAttribute('data-original-value', originalValue);
      }
    });
  }
  
  // 드롭다운 관련 함수들은 Bootstrap이 자동으로 처리하므로 제거됨
  
  // CSS 선택자를 생성하는 함수입니다
  generateCssSelector(elementInfo) {
    // ID가 있으면 ID 사용
    if (elementInfo.id && elementInfo.id !== '(none)') {
      return `#${elementInfo.id}`;
    }
    
    // 클래스가 있으면 클래스 사용
    if (elementInfo.className && elementInfo.className !== '(none)') {
      const classes = elementInfo.className.split(' ').filter(cls => cls.trim());
      if (classes.length > 0) {
        return `.${classes.join('.')}`;
      }
    }
    
    // 태그명만 사용
    return elementInfo.tagName;
  }
  
  // CSS를 클립보드로 복사하는 함수입니다
  async copyCssToClipboard(format) {
    try {
      if (!this.currentElement || !this.currentSelector) {
        this.showError('No element selected to copy CSS from.');
        return;
      }
      
      let cssCode = '';
      
      switch (format) {
        case 'css':
          cssCode = this.generateCssRule();
          break;
        case 'inline':
          cssCode = this.generateInlineStyle();
          break;
        case 'js':
          cssCode = this.generateJsObject();
          break;
        case 'tailwind':
          cssCode = this.generateTailwindClasses();
          break;
        case 'modified':
          cssCode = this.generateModifiedOnlyCss();
          break;
        default:
          cssCode = this.generateCssRule();
      }
      
      // 클립보드에 복사
      await navigator.clipboard.writeText(cssCode);
      
      // 성공 피드백
      this.showSuccessMessage(`CSS copied to clipboard! (${format.toUpperCase()})`);
      
      console.log('Copied CSS:', cssCode);
    } catch (error) {
      console.error('Failed to copy CSS:', error);
      this.showError('Failed to copy CSS to clipboard.');
    }
  }
  
  // CSS Rule 형식 생성
  generateCssRule() {
    const styles = this.getCombinedStyles();
    let css = `${this.currentSelector} {\n`;
    
    Object.entries(styles).forEach(([property, value]) => {
      css += `  ${property}: ${value};\n`;
    });
    
    css += '}';
    return css;
  }
  
  // Inline Style 형식 생성
  generateInlineStyle() {
    const styles = this.getCombinedStyles();
    const styleStr = Object.entries(styles)
      .map(([property, value]) => `${property}: ${value}`)
      .join('; ');
    
    return `style="${styleStr}"`;
  }
  
  // JavaScript Object 형식 생성
  generateJsObject() {
    const styles = this.getCombinedStyles();
    let js = '{\n';
    
    Object.entries(styles).forEach(([property, value]) => {
      // CSS 속성명을 camelCase로 변환
      const camelCaseProperty = property.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
      js += `  ${camelCaseProperty}: '${value}',\n`;
    });
    
    js += '}';
    return js;
  }
  
  // Tailwind Classes 형식 생성
  generateTailwindClasses() {
    const styles = this.getCombinedStyles();
    const tailwindClasses = [];
    const cssProperties = [];
    
    Object.entries(styles).forEach(([property, value]) => {
      const tailwindClass = this.cssToTailwind(property, value);
      if (tailwindClass) {
        if (Array.isArray(tailwindClass)) {
          tailwindClasses.push(...tailwindClass);
        } else {
          tailwindClasses.push(tailwindClass);
        }
      } else {
        cssProperties.push(`  ${property}: ${value};`);
      }
    });
    
    let result = '';
    
    // Tailwind 클래스가 있으면 추가
    if (tailwindClasses.length > 0) {
      result += `class="${tailwindClasses.join(' ')}"`;
    }
    
    // CSS로만 처리해야 하는 속성들을 CSS 형태로 추가
    if (cssProperties.length > 0) {
      if (result) {
        result += '\n\n/* Tailwind로 변환할 수 없는 속성들 */\n';
      }
      result += `${this.currentSelector || '.element'} {\n${cssProperties.join('\n')}\n}`;
    }
    
    // 둘 다 없으면 메시지 출력
    if (!result) {
      result = '/* 변환 가능한 속성이 없습니다 */';
    }
    
    return result;
  }
  
  // 수정된 속성만 CSS 생성
  generateModifiedOnlyCss() {
    if (Object.keys(this.modifiedStyles).length === 0) {
      return '/* No modifications made */';
    }
    
    let css = `${this.currentSelector} {\n`;
    Object.entries(this.modifiedStyles).forEach(([property, value]) => {
      css += `  ${property}: ${value};\n`;
    });
    css += '}';
    
    return css;
  }
  
  // CSS 속성을 Tailwind 클래스로 변환하는 함수
  cssToTailwind(property, value) {
    // 값 정리
    value = value.trim();
    
    switch (property) {
      // Display
      case 'display':
        switch (value) {
          case 'block': return 'block';
          case 'inline': return 'inline';
          case 'inline-block': return 'inline-block';
          case 'flex': return 'flex';
          case 'inline-flex': return 'inline-flex';
          case 'grid': return 'grid';
          case 'inline-grid': return 'inline-grid';
          case 'hidden': return 'hidden';
          case 'none': return 'hidden';
          default: return null;
        }
      
      // Position
      case 'position':
        switch (value) {
          case 'static': return 'static';
          case 'fixed': return 'fixed';
          case 'absolute': return 'absolute';
          case 'relative': return 'relative';
          case 'sticky': return 'sticky';
          default: return null;
        }
      
      // Width & Height
      case 'width':
        return this.convertSizeToTailwind(value, 'w');
      case 'height':
        return this.convertSizeToTailwind(value, 'h');
      case 'max-width':
        return this.convertSizeToTailwind(value, 'max-w');
      case 'max-height':
        return this.convertSizeToTailwind(value, 'max-h');
      case 'min-width':
        return this.convertSizeToTailwind(value, 'min-w');
      case 'min-height':
        return this.convertSizeToTailwind(value, 'min-h');
      
      // Margin & Padding
      case 'margin':
        return this.convertSpacingToTailwind(value, 'm');
      case 'margin-top':
        return this.convertSpacingToTailwind(value, 'mt');
      case 'margin-right':
        return this.convertSpacingToTailwind(value, 'mr');
      case 'margin-bottom':
        return this.convertSpacingToTailwind(value, 'mb');
      case 'margin-left':
        return this.convertSpacingToTailwind(value, 'ml');
      case 'padding':
        return this.convertSpacingToTailwind(value, 'p');
      case 'padding-top':
        return this.convertSpacingToTailwind(value, 'pt');
      case 'padding-right':
        return this.convertSpacingToTailwind(value, 'pr');
      case 'padding-bottom':
        return this.convertSpacingToTailwind(value, 'pb');
      case 'padding-left':
        return this.convertSpacingToTailwind(value, 'pl');
      
      // Colors
      case 'color':
        return this.convertColorToTailwind(value, 'text');
      case 'background-color':
        return this.convertColorToTailwind(value, 'bg');
      
      // Font
      case 'font-size':
        return this.convertFontSizeToTailwind(value);
      case 'font-weight':
        return this.convertFontWeightToTailwind(value);
      case 'text-align':
        switch (value) {
          case 'left': return 'text-left';
          case 'center': return 'text-center';
          case 'right': return 'text-right';
          case 'justify': return 'text-justify';
          default: return null;
        }
      
      // Flex
      case 'flex-direction':
        switch (value) {
          case 'row': return 'flex-row';
          case 'row-reverse': return 'flex-row-reverse';
          case 'column': return 'flex-col';
          case 'column-reverse': return 'flex-col-reverse';
          default: return null;
        }
      case 'justify-content':
        switch (value) {
          case 'flex-start': return 'justify-start';
          case 'flex-end': return 'justify-end';
          case 'center': return 'justify-center';
          case 'space-between': return 'justify-between';
          case 'space-around': return 'justify-around';
          case 'space-evenly': return 'justify-evenly';
          default: return null;
        }
      case 'align-items':
        switch (value) {
          case 'flex-start': return 'items-start';
          case 'flex-end': return 'items-end';
          case 'center': return 'items-center';
          case 'stretch': return 'items-stretch';
          case 'baseline': return 'items-baseline';
          default: return null;
        }
      
      // Border
      case 'border-radius':
        return this.convertBorderRadiusToTailwind(value);
      
      // Overflow
      case 'overflow':
        switch (value) {
          case 'visible': return 'overflow-visible';
          case 'hidden': return 'overflow-hidden';
          case 'scroll': return 'overflow-scroll';
          case 'auto': return 'overflow-auto';
          default: return null;
        }
      
      default:
        return null;
    }
  }
  
  // 크기 변환 도우미 함수
  convertSizeToTailwind(value, prefix) {
    if (value === 'auto') return `${prefix}-auto`;
    if (value === '100%') return `${prefix}-full`;
    if (value === '50%') return `${prefix}-1/2`;
    if (value === '33.333333%') return `${prefix}-1/3`;
    if (value === '66.666667%') return `${prefix}-2/3`;
    if (value === '25%') return `${prefix}-1/4`;
    if (value === '75%') return `${prefix}-3/4`;
    
    // 픽셀 값 변환
    const pixelMatch = value.match(/^(\d+(?:\.\d+)?)px$/);
    if (pixelMatch) {
      const pixels = parseFloat(pixelMatch[1]);
      if (pixels % 4 === 0) {
        return `${prefix}-${pixels / 4}`;
      } else {
        return `${prefix}-[${value}]`;
      }
    }
    
    return `${prefix}-[${value}]`;
  }
  
  // 간격 변환 도우미 함수
  convertSpacingToTailwind(value, prefix) {
    if (value === '0px' || value === '0') return `${prefix}-0`;
    
    const pixelMatch = value.match(/^(\d+(?:\.\d+)?)px$/);
    if (pixelMatch) {
      const pixels = parseFloat(pixelMatch[1]);
      const spacing = pixels / 4;
      if (spacing === Math.floor(spacing) && spacing <= 96) {
        return `${prefix}-${spacing}`;
      }
    }
    
    return `${prefix}-[${value}]`;
  }
  
  // 색상 변환 도우미 함수
  convertColorToTailwind(value, prefix) {
    const colorMap = {
      'rgb(0, 0, 0)': `${prefix}-black`,
      'rgb(255, 255, 255)': `${prefix}-white`,
      'rgb(239, 68, 68)': `${prefix}-red-500`,
      'rgb(34, 197, 94)': `${prefix}-green-500`,
      'rgb(59, 130, 246)': `${prefix}-blue-500`,
      'rgb(168, 85, 247)': `${prefix}-purple-500`,
      'rgb(234, 179, 8)': `${prefix}-yellow-500`,
      'rgb(6, 182, 212)': `${prefix}-cyan-500`,
    };
    
    return colorMap[value] || `${prefix}-[${value}]`;
  }
  
  // 폰트 크기 변환 도우미 함수
  convertFontSizeToTailwind(value) {
    const sizeMap = {
      '12px': 'text-xs',
      '14px': 'text-sm',
      '16px': 'text-base',
      '18px': 'text-lg',
      '20px': 'text-xl',
      '24px': 'text-2xl',
      '30px': 'text-3xl',
      '36px': 'text-4xl',
      '48px': 'text-5xl',
    };
    
    return sizeMap[value] || `text-[${value}]`;
  }
  
  // 폰트 굵기 변환 도우미 함수
  convertFontWeightToTailwind(value) {
    const weightMap = {
      '100': 'font-thin',
      '200': 'font-extralight',
      '300': 'font-light',
      '400': 'font-normal',
      '500': 'font-medium',
      '600': 'font-semibold',
      '700': 'font-bold',
      '800': 'font-extrabold',
      '900': 'font-black',
      'normal': 'font-normal',
      'bold': 'font-bold',
    };
    
    return weightMap[value] || `font-[${value}]`;
  }
  
  // 보더 라디우스 변환 도우미 함수
  convertBorderRadiusToTailwind(value) {
    const radiusMap = {
      '0px': 'rounded-none',
      '2px': 'rounded-sm',
      '4px': 'rounded',
      '6px': 'rounded-md',
      '8px': 'rounded-lg',
      '12px': 'rounded-xl',
      '16px': 'rounded-2xl',
      '24px': 'rounded-3xl',
      '9999px': 'rounded-full',
      '50%': 'rounded-full',
    };
    
    return radiusMap[value] || `rounded-[${value}]`;
  }
  
  // 카테고리 펼침/접힘 토글 함수
  toggleCategory(categoryKey) {
    const currentState = this.categoryStates.get(categoryKey);
    const newState = !currentState;
    this.categoryStates.set(categoryKey, newState);
    
    const categoryItem = document.querySelector(`.category-item[data-category="${categoryKey}"]`);
    const header = categoryItem.querySelector('.category-header');
    const content = categoryItem.querySelector('.category-content');
    const toggle = categoryItem.querySelector('.category-toggle');
    
    if (newState) {
      header.classList.add('expanded');
      content.classList.add('expanded');
      toggle.classList.add('expanded');
    } else {
      header.classList.remove('expanded');
      content.classList.remove('expanded');
      toggle.classList.remove('expanded');
    }
  }
  
  // 카테고리 전체 선택/해제 함수
  toggleCategorySelection(categoryKey, isChecked) {
    const categoryProperties = this.categorizedProperties[categoryKey];
    
    Object.keys(categoryProperties).forEach(property => {
      if (isChecked) {
        this.selectedProperties.add(property);
      } else {
        this.selectedProperties.delete(property);
      }
    });
    
    this.updateUI();
  }
  
  // UI 업데이트 함수
  updateUI() {
    // 각 카테고리의 체크박스 상태 업데이트
    Object.keys(CSS_CATEGORIES).forEach(categoryKey => {
      const categoryProperties = this.categorizedProperties[categoryKey];
      if (!categoryProperties) return;
      
      const propertyCount = Object.keys(categoryProperties).length;
      const selectedCount = Object.keys(categoryProperties).filter(prop => 
        this.selectedProperties.has(prop)
      ).length;
      
      const categoryItem = document.querySelector(`.category-item[data-category="${categoryKey}"]`);
      if (!categoryItem) return;
      
      const categoryCheckbox = categoryItem.querySelector('.category-checkbox');
      const categoryCount = categoryItem.querySelector('.category-count');
      
      // 체크박스 상태 설정
      if (selectedCount === 0) {
        categoryCheckbox.checked = false;
        categoryCheckbox.indeterminate = false;
      } else if (selectedCount === propertyCount) {
        categoryCheckbox.checked = true;
        categoryCheckbox.indeterminate = false;
      } else {
        categoryCheckbox.checked = false;
        categoryCheckbox.indeterminate = true;
      }
      
      // 카운트 업데이트
      categoryCount.textContent = `${selectedCount}/${propertyCount}`;
      
      // 개별 속성 체크박스 업데이트
      const propertyItems = categoryItem.querySelectorAll('.property-item-accordion');
      propertyItems.forEach(element => {
        const property = element.getAttribute('data-property');
        const propertyCheckbox = element.querySelector('.property-checkbox');
        if (propertyCheckbox) {
          propertyCheckbox.checked = this.selectedProperties.has(property);
        }
      });
    });
    
    // Select All 체크박스 상태 업데이트
    this.updateSelectAllCheckbox();
  }
  
  // Select All 체크박스 상태를 업데이트하는 함수
  updateSelectAllCheckbox() {
    if (!this.selectAllCheckbox) return;
    
    // 전체 속성 개수와 선택된 속성 개수 계산
    const totalProperties = Object.values(this.categorizedProperties)
      .reduce((total, categoryProperties) => total + Object.keys(categoryProperties).length, 0);
    const selectedPropertiesCount = this.selectedProperties.size;
    
    // 체크박스 상태 설정
    if (selectedPropertiesCount === 0) {
      this.selectAllCheckbox.checked = false;
      this.selectAllCheckbox.indeterminate = false;
    } else if (selectedPropertiesCount === totalProperties) {
      this.selectAllCheckbox.checked = true;
      this.selectAllCheckbox.indeterminate = false;
    } else {
      this.selectAllCheckbox.checked = false;
      this.selectAllCheckbox.indeterminate = true;
    }
  }
  
  // 모든 속성 선택 함수
  selectAllProperties() {
    if (this.isTailwindView && this.tailwindProperties) {
      // Tailwind view: select all converted and unconverted properties
      this.tailwindProperties.converted.forEach(prop => {
        this.selectedProperties.add(prop.name);
      });
      this.tailwindProperties.unconverted.forEach(prop => {
        this.selectedProperties.add(prop.name);
      });
    } else {
      // Regular CSS view: select all categorized properties
      Object.values(this.categorizedProperties).forEach(categoryProperties => {
        Object.keys(categoryProperties).forEach(property => {
          this.selectedProperties.add(property);
        });
      });
    }
    this.updateUI();
  }
  
  // 모든 속성 선택 해제 함수
  selectNoneProperties() {
    this.selectedProperties.clear();
    this.updateUI();
  }
  
  // 선택자 복사 함수
  async copySelectorToClipboard() {
    try {
      await navigator.clipboard.writeText(this.currentSelector);
      this.showSuccessMessage('Selector copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy selector:', error);
      this.showError('Failed to copy selector to clipboard.');
    }
  }
  
  // 드롭다운 입력 요소 생성
  createDropdownInput(property, currentValue) {
    const select = document.createElement('select');
    select.className = 'property-input-accordion dropdown-input';
    select.style.cssText = 'width: 100%; padding: 2px 4px; font-family: inherit; font-size: inherit;';
    
    const options = CSS_DROPDOWN_OPTIONS[property];
    
    // 현재 값이 옵션에 없다면 첫 번째에 추가
    if (!options.includes(currentValue)) {
      const currentOption = document.createElement('option');
      currentOption.value = currentValue;
      currentOption.textContent = currentValue;
      currentOption.selected = true;
      select.appendChild(currentOption);
    }
    
    // 모든 옵션 추가
    options.forEach(optionValue => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionValue;
      if (optionValue === currentValue) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    
    return select;
  }
  
  // 텍스트 입력 요소 생성
  createTextInput(currentValue) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'property-input-accordion text-input';
    input.value = currentValue;
    input.style.cssText = 'width: 100%; padding: 2px 4px; font-family: inherit; font-size: inherit;';
    input.select();
    return input;
  }
  
  // 입력 요소의 이벤트 리스너 설정
  setupInputEventListeners(inputElement, valueSpan, property, isDropdown) {
    const eventType = isDropdown ? 'change' : 'input';
    let debounceTimer;
    
    // 값 변경 이벤트
    inputElement.addEventListener(eventType, () => {
      if (isDropdown) {
        // 드롭다운은 즉시 적용
        this.applyStyleChange(property, inputElement.value);
        valueSpan.setAttribute('data-original-value', inputElement.value);
      } else {
        // 텍스트 입력은 디바운싱
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.applyStyleChange(property, inputElement.value);
          valueSpan.setAttribute('data-original-value', inputElement.value);
        }, 300);
      }
    });
    
    // 키보드 이벤트 (Enter/Escape)
    inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.confirmEditAccordion(valueSpan, inputElement, property);
      } else if (e.key === 'Escape') {
        this.cancelEditAccordion(valueSpan, inputElement, property);
      }
    });
    
    // 포커스 잃을 때 확정
    inputElement.addEventListener('blur', () => {
      setTimeout(() => {
        if (inputElement.style.display !== 'none') {
          this.confirmEditAccordion(valueSpan, inputElement, property);
        }
      }, 100);
    });
  }

  // Accordion에서 속성 편집을 시작하는 함수
  startEditingAccordion(valueSpan, property, currentValue) {
    // 이미 편집 중인 다른 항목이 있다면 취소
    this.cancelAllEditingAccordion();
    
    // 편집 중 표시
    valueSpan.classList.add('editing');
    
    // 드롭다운 옵션이 있는 속성인지 확인
    const hasDropdownOptions = CSS_DROPDOWN_OPTIONS.hasOwnProperty(property);
    
    let inputElement;
    
    if (hasDropdownOptions) {
      // 드롭다운 생성
      inputElement = this.createDropdownInput(property, currentValue);
    } else {
      // 텍스트 입력 필드 생성
      inputElement = this.createTextInput(currentValue);
    }
    
    // 원본 텍스트 숨기고 입력 필드 표시
    valueSpan.style.display = 'none';
    valueSpan.parentNode.insertBefore(inputElement, valueSpan.nextSibling);
    inputElement.focus();
    
    // 이벤트 리스너 설정
    this.setupInputEventListeners(inputElement, valueSpan, property, hasDropdownOptions);
  }
  
  // Accordion에서 편집을 확정하는 함수
  confirmEditAccordion(valueSpan, input, property) {
    const newValue = input.value;
    
    // 최종 스타일 적용
    this.applyStyleChange(property, newValue);
    
    // UI 업데이트
    valueSpan.textContent = newValue;
    valueSpan.setAttribute('data-original-value', newValue);
    valueSpan.classList.remove('editing');
    valueSpan.style.display = '';
    input.remove();
    
    // modifiedStyles에도 반영
    this.modifiedStyles[property] = newValue;
  }
  
  // Accordion에서 편집을 취소하는 함수
  cancelEditAccordion(valueSpan, input, property) {
    // 원본값으로 되돌리기
    const originalValue = this.originalStyles[property];
    if (originalValue) {
      this.applyStyleChange(property, originalValue);
      valueSpan.textContent = originalValue;
      valueSpan.setAttribute('data-original-value', originalValue);
    }
    
    // UI 복원
    valueSpan.classList.remove('editing');
    valueSpan.style.display = '';
    input.remove();
  }
  
  // 모든 Accordion 편집 상태를 취소하는 함수
  cancelAllEditingAccordion() {
    const inputs = this.propertiesAccordion.querySelectorAll('.property-input-accordion');
    inputs.forEach(input => {
      const valueSpan = input.previousElementSibling;
      const propertyItem = input.closest('.property-item-accordion');
      const property = propertyItem ? propertyItem.getAttribute('data-property') : null;
      
      if (valueSpan && property) {
        this.cancelEditAccordion(valueSpan, input, property);
      }
    });
  }
  
  // 선택된 속성만 반환하는 함수
  getSelectedStyles() {
    const selectedStyles = {};
    this.selectedProperties.forEach(property => {
      if (this.modifiedStyles[property] !== undefined) {
        selectedStyles[property] = this.modifiedStyles[property];
      } else if (this.originalStyles[property] !== undefined) {
        selectedStyles[property] = this.originalStyles[property];
      }
    });
    return selectedStyles;
  }
  
  // 수정된 스타일과 원본 스타일을 결합하는 함수 (선택된 것만)
  getCombinedStyles() {
    return this.getSelectedStyles();
  }
  
  // 성공 메시지를 표시하는 함수입니다
  showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success alert-sm';
    successDiv.innerHTML = `<strong>✅ ${message}</strong>`;
    successDiv.style.cssText = 'margin-top: 10px; padding: 8px; font-size: 0.8rem;';
    
    // 기존 메시지 제거
    const existingAlerts = this.propertiesAccordion.parentNode.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // 새 성공 메시지 추가
    this.propertiesAccordion.parentNode.insertBefore(successDiv, this.propertiesAccordion);
    
    // 2초 후 자동 제거
    setTimeout(() => {
      successDiv.style.opacity = '0';
      successDiv.style.transition = 'opacity 0.3s';
      setTimeout(() => successDiv.remove(), 300);
    }, 2000);
  }

  // ========== Tailwind 변환 관련 메서드들 ==========
  
  // CSS 뷰를 Tailwind 뷰로 변환
  async convertToTailwindView() {
    if (!this.currentElement || Object.keys(this.categorizedProperties).length === 0) {
      this.showError('No CSS properties to convert. Please select an element first.');
      return;
    }

    try {
      // 현재 속성들을 평면화하여 변환용 배열로 만들기
      const allProperties = [];
      Object.entries(this.categorizedProperties).forEach(([categoryName, categoryProps]) => {
        // categoryProps는 객체이므로 Object.entries를 사용
        Object.entries(categoryProps).forEach(([propertyName, propertyValue]) => {
          allProperties.push({
            name: propertyName,
            value: propertyValue,
            category: categoryName
          });
        });
      });

      // Tailwind 변환 실행
      this.tailwindProperties = this.tailwindConverter.convertProperties(allProperties);
      
      // 변환 통계 얻기
      const stats = this.tailwindConverter.getConversionStats();
      
      // 변환 불가능한 속성들이 있을 경우 경고 표시
      if (stats.unconverted > 0) {
        this.showWarningAlert(`Warning: ${stats.unconverted} properties could not be converted to Tailwind CSS. They will remain as regular CSS properties.`);
      }

      // UI를 Tailwind 뷰로 전환
      this.switchToTailwindUI();
      
      // Tailwind 속성들을 기본 선택 상태로 설정
      this.initializeTailwindSelection();
      
      // Tailwind 속성들을 UI에 렌더링
      this.renderTailwindProperties();
      
      // Select All 체크박스를 기본적으로 체크 상태로 설정
      if (this.selectAllCheckbox) {
        this.selectAllCheckbox.checked = true;
        this.selectAllCheckbox.indeterminate = false;
      }
      
      // 성공 메시지 표시
      this.showSuccessMessage(`Converted ${stats.converted} properties to Tailwind CSS (${stats.conversionRate}% success rate)`);
      
    } catch (error) {
      console.error('Tailwind conversion failed:', error);
      this.showError('Failed to convert properties to Tailwind CSS.');
    }
  }

  // Tailwind 뷰를 CSS 뷰로 되돌리기
  backToCssView() {
    // UI를 CSS 뷰로 전환
    this.switchToCssUI();
    
    // 기존 CSS 속성들을 다시 렌더링
    this.renderCssProperties();
    
    // Tailwind 상태 초기화
    this.isTailwindView = false;
    this.tailwindProperties = { converted: [], unconverted: [] };
  }

  // UI를 Tailwind 뷰로 전환
  switchToTailwindUI() {
    this.isTailwindView = true;
    
    // 제목 변경
    this.propertiesTitle.textContent = '🎨 Tailwind Classes';
    
    // 버튼 표시/숨김
    this.convertToTailwindBtn.style.display = 'none';
    this.backToCssBtn.style.display = 'inline-block';
    
    // CSS 복사 버튼 숨기고 Tailwind 복사 버튼 표시
    this.copyCssDropdown.style.display = 'none';
    document.getElementById('copyTailwindBtn').style.display = 'inline-block';
  }

  // UI를 CSS 뷰로 전환
  switchToCssUI() {
    this.isTailwindView = false;
    
    // 제목 변경
    this.propertiesTitle.textContent = 'CSS Properties';
    
    // 버튼 표시/숨김
    this.convertToTailwindBtn.style.display = 'inline-block';
    this.backToCssBtn.style.display = 'none';
    
    // Tailwind 복사 버튼 숨기고 CSS 복사 버튼 표시
    document.getElementById('copyTailwindBtn').style.display = 'none';
    this.copyCssDropdown.style.display = 'inline-block';
  }

  // 경고 알림 표시
  showWarningAlert(message) {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'alert alert-warning alert-sm';
    warningDiv.innerHTML = `<strong>⚠️ ${message}</strong>`;
    warningDiv.style.cssText = 'margin-top: 10px; padding: 8px; font-size: 0.8rem;';
    
    // 기존 알림 메시지 제거
    const existingAlerts = this.propertiesAccordion.parentNode.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // 새 경고 메시지 추가
    this.propertiesAccordion.parentNode.insertBefore(warningDiv, this.propertiesAccordion);
    
    // 5초 후 자동 제거
    setTimeout(() => {
      warningDiv.style.opacity = '0';
      warningDiv.style.transition = 'opacity 0.3s';
      setTimeout(() => warningDiv.remove(), 300);
    }, 5000);
  }

  // Tailwind 속성들을 기본 선택 상태로 초기화
  initializeTailwindSelection() {
    // 선택된 속성들을 초기화
    this.selectedProperties.clear();
    
    // 변환된 Tailwind 속성들을 모두 선택
    this.tailwindProperties.converted.forEach(prop => {
      this.selectedProperties.add(prop.name);
    });
    
    // 변환되지 않은 CSS 속성들도 모두 선택
    this.tailwindProperties.unconverted.forEach(prop => {
      this.selectedProperties.add(prop.name);
    });
    
    console.log(`Initialized ${this.selectedProperties.size} Tailwind properties as selected`);
  }

  // Tailwind 속성들을 UI에 렌더링
  renderTailwindProperties() {
    // accordion 초기화
    this.propertiesAccordion.innerHTML = '';
    
    // Tailwind 변환된 속성들을 카테고리별로 그룹화
    const tailwindCategories = this.groupTailwindPropertiesByCategory();
    
    // 각 카테고리 렌더링
    Object.entries(tailwindCategories).forEach(([categoryKey, properties]) => {
      if (properties.length > 0) {
        const categoryElement = this.createTailwindCategoryElement(categoryKey, properties);
        this.propertiesAccordion.appendChild(categoryElement);
      }
    });
  }

  // Tailwind 속성들을 카테고리별로 그룹화
  groupTailwindPropertiesByCategory() {
    const categories = {};
    
    // 모든 CSS 카테고리 초기화
    Object.keys(CSS_CATEGORIES).forEach(key => {
      categories[key] = [];
    });
    
    // 변환된 속성들 분류
    this.tailwindProperties.converted.forEach(prop => {
      const category = this.findPropertyCategory(prop.name);
      if (categories[category]) {
        categories[category].push({
          ...prop,
          isTailwind: true
        });
      }
    });
    
    // 변환되지 않은 속성들 분류
    this.tailwindProperties.unconverted.forEach(prop => {
      const category = this.findPropertyCategory(prop.name);
      if (categories[category]) {
        categories[category].push({
          ...prop,
          isTailwind: false
        });
      }
    });
    
    return categories;
  }

  // 속성이 속한 카테고리 찾기
  findPropertyCategory(propertyName) {
    for (const [categoryKey, categoryData] of Object.entries(CSS_CATEGORIES)) {
      if (categoryData.properties.includes(propertyName)) {
        return categoryKey;
      }
    }
    return 'effects'; // 기본 카테고리
  }

  // Tailwind 카테고리 요소 생성
  createTailwindCategoryElement(categoryKey, properties) {
    const categoryData = CSS_CATEGORIES[categoryKey];
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category-item';
    
    // 카테고리 헤더
    const headerButton = document.createElement('button');
    headerButton.className = 'category-header';
    headerButton.innerHTML = `
      <input type="checkbox" class="category-checkbox" data-category="${categoryKey}" checked>
      <span class="category-title">${categoryData.name}</span>
      <span class="category-count">${properties.length}</span>
      <span class="category-toggle">▶</span>
    `;
    
    // 카테고리 내용
    const contentDiv = document.createElement('div');
    contentDiv.className = 'category-content';
    
    // 각 속성 렌더링
    properties.forEach(property => {
      const propertyElement = this.createTailwindPropertyElement(property);
      contentDiv.appendChild(propertyElement);
    });
    
    categoryDiv.appendChild(headerButton);
    categoryDiv.appendChild(contentDiv);
    
    // 카테고리 토글 이벤트
    headerButton.addEventListener('click', (e) => {
      if (e.target.type !== 'checkbox') {
        this.toggleTailwindCategory(categoryKey, headerButton, contentDiv);
      }
    });
    
    return categoryDiv;
  }

  // Tailwind 속성 요소 생성
  createTailwindPropertyElement(property) {
    const propertyDiv = document.createElement('div');
    
    // Tailwind 변환된 속성과 일반 CSS 속성을 시각적으로 구분
    if (property.isTailwind) {
      propertyDiv.className = 'property-item-accordion tailwind-converted';
    } else {
      propertyDiv.className = 'property-item-accordion css-unconverted';
    }
    
    const displayValue = property.isTailwind ? property.tailwindClass : property.value;
    const displayName = property.isTailwind ? 'class' : property.name;
    
    propertyDiv.innerHTML = `
      <input type="checkbox" class="property-checkbox" data-property="${property.name}" checked>
      <span class="property-name-accordion">${displayName}:</span>
      <span class="property-value-accordion" data-property="${property.name}" data-original="${property.value}">
        ${displayValue}
      </span>
    `;
    
    return propertyDiv;
  }

  // Tailwind 카테고리 토글
  toggleTailwindCategory(categoryKey, headerButton, contentDiv) {
    const isExpanded = this.categoryStates.get(categoryKey) || false;
    const newState = !isExpanded;
    
    this.categoryStates.set(categoryKey, newState);
    
    if (newState) {
      headerButton.classList.add('expanded');
      contentDiv.classList.add('expanded');
      headerButton.querySelector('.category-toggle').style.transform = 'rotate(90deg)';
    } else {
      headerButton.classList.remove('expanded');
      contentDiv.classList.remove('expanded');
      headerButton.querySelector('.category-toggle').style.transform = 'rotate(0deg)';
    }
  }

  // Tailwind 형식으로 클립보드에 복사
  async copyTailwindToClipboard(format) {
    if (!this.isTailwindView || !this.tailwindProperties) {
      this.showError('No Tailwind properties to copy.');
      return;
    }

    try {
      let contentToCopy = '';
      
      switch (format) {
        case 'tailwind-classes':
          contentToCopy = this.generateTailwindClasses();
          break;
        case 'mixed-format':
          contentToCopy = this.generateMixedFormat();
          break;
        case 'tailwind-selected':
          contentToCopy = this.generateSelectedTailwindClasses();
          break;
        default:
          throw new Error('Unknown Tailwind format');
      }

      await navigator.clipboard.writeText(contentToCopy);
      this.showSuccessMessage(`Tailwind code copied to clipboard! (${format.replace('-', ' ').toUpperCase()})`);
      
      console.log('Copied Tailwind code:', contentToCopy);
    } catch (error) {
      console.error('Failed to copy Tailwind code:', error);
      this.showError('Failed to copy Tailwind code to clipboard.');
    }
  }

  // Tailwind 클래스들만 생성
  generateTailwindClasses() {
    const tailwindClasses = [];
    
    this.tailwindProperties.converted.forEach(prop => {
      if (prop.tailwindClass) {
        tailwindClasses.push(prop.tailwindClass);
      }
    });
    
    return tailwindClasses.join(' ');
  }

  // 혼합 형식 생성 (Tailwind 클래스 + 남은 CSS)
  generateMixedFormat() {
    const tailwindClasses = [];
    const remainingCss = [];
    
    // Tailwind 변환된 속성들
    this.tailwindProperties.converted.forEach(prop => {
      if (prop.tailwindClass) {
        tailwindClasses.push(prop.tailwindClass);
      }
    });
    
    // 변환되지 않은 CSS 속성들
    this.tailwindProperties.unconverted.forEach(prop => {
      remainingCss.push(`${prop.name}: ${prop.value};`);
    });
    
    let mixedCode = '';
    
    if (tailwindClasses.length > 0) {
      mixedCode += `class="${tailwindClasses.join(' ')}"`;
    }
    
    if (remainingCss.length > 0) {
      if (mixedCode) mixedCode += '\n\n';
      mixedCode += `style={\n  ${remainingCss.join('\n  ')}\n}`;
    }
    
    return mixedCode;
  }

  // 선택된 Tailwind 클래스들만 생성
  generateSelectedTailwindClasses() {
    const selectedClasses = [];
    
    // 선택된 속성들만 필터링
    this.tailwindProperties.converted.forEach(prop => {
      if (prop.tailwindClass && this.selectedProperties.has(prop.name)) {
        selectedClasses.push(prop.tailwindClass);
      }
    });
    
    // 선택된 변환되지 않은 속성들도 포함
    this.tailwindProperties.unconverted.forEach(prop => {
      if (this.selectedProperties.has(prop.name)) {
        selectedClasses.push(`/* ${prop.name}: ${prop.value}; */`);
      }
    });
    
    return selectedClasses.join(' ');
  }

  // ========== Color Palette 관련 메서드들 ==========
  
  // Color Palette 모드 토글
  toggleColorPaletteMode() {
    if (this.isColorPaletteMode) {
      this.exitColorPaletteMode();
    } else {
      this.enterColorPaletteMode();
    }
  }
  
  // Color Palette 모드 진입
  async enterColorPaletteMode() {
    this.isColorPaletteMode = true;
    this.isSamplingActive = true;
    
    // UI 상태 업데이트
    this.showColorPaletteSection();
    this.hideOtherSections();
    this.updateColorPaletteButtonState(true);
    
    // 색상 샘플링 활성화
    await this.activateColorSampling();
    
    // 저장된 색상들 로드
    this.loadSavedColors();
    
    // UI 업데이트
    this.renderColorSwatches();
    this.updateSamplingStatus('📸 Sampling Active - Click anywhere to sample colors');
    
    console.log("Color Palette mode activated");
  }
  
  // Color Palette 모드 종료
  async exitColorPaletteMode() {
    this.isColorPaletteMode = false;
    this.isSamplingActive = false;
    
    // 색상 샘플링 비활성화
    await this.deactivateColorSampling();
    
    // UI 상태 업데이트
    this.hideColorPaletteSection();
    this.showInstructionsSection();  // showOtherSections 대신 showInstructionsSection 사용
    this.updateColorPaletteButtonState(false);
    
    // 선택된 색상 정보 숨기기
    this.hideSelectedColorInfo();
    
    console.log("Color Palette mode deactivated");
  }

  // EyeDropper는 이제 기본 클릭 동작으로 통합됨
  
  // 색상 샘플링 활성화
  async activateColorSampling() {
    await this.colorSampler.activateSampling();
    
    // ColorSampler 이벤트 리스너 설정
    window.sidePanel = this; // ColorSampler가 참조할 수 있도록 전역 설정
  }
  
  // 색상 샘플링 비활성화
  async deactivateColorSampling() {
    await this.colorSampler.deactivateSampling();
    
    // 전역 참조 제거
    if (window.sidePanel === this) {
      window.sidePanel = null;
    }
  }
  
  // 색상 추가 콜백 (ColorSampler에서 호출)
  onColorAdded(color) {
    this.sampledColors.push(color);
    this.renderColorSwatches();
    this.showSuccessMessage(`Color sampled: ${color.hex}`);
  }
  
  // UI 섹션 표시/숨김 관리
  showColorPaletteSection() {
    this.colorPaletteSection.style.display = 'block';
  }
  
  hideColorPaletteSection() {
    this.colorPaletteSection.style.display = 'none';
  }
  
  hideOtherSections() {
    this.cssInfoSection.style.display = 'none';
    this.instructionsSection.style.display = 'none';
    this.assetManager.style.display = 'none';
    this.consoleSection.style.display = 'none';
  }
  
  showOtherSections() {
    this.instructionsSection.style.display = 'block';
    // Asset Manager는 기본적으로 숨김
    // this.assetManager.style.display = 'block';
  }
  
  // Asset Manager 토글 함수 추가
  toggleAssetManager() {
    // 모든 다른 섹션 숨기기
    this.cssInfoSection.style.display = 'none';
    this.instructionsSection.style.display = 'none';
    this.colorPaletteSection.style.display = 'none';
    this.consoleSection.style.display = 'none';
    
    // Asset Manager 토글
    if (this.assetManager.style.display === 'none' || !this.assetManager.style.display) {
      this.assetManager.style.display = 'block';
      // Asset Manager가 열릴 때 자산 새로고침
      this.initializeAssetManager();
    } else {
      this.assetManager.style.display = 'none';
      this.instructionsSection.style.display = 'block';
    }
  }
  
  // Asset Manager 닫기 함수 추가
  closeAssetManager() {
    this.assetManager.style.display = 'none';
    this.showInstructionsSection();
  }
  
  // Color Palette 버튼 상태 업데이트
  updateColorPaletteButtonState(isActive) {
    if (isActive) {
      // 드롭다운 메뉴 아이템이므로 클래스 변경 제거
      // this.colorPaletteMenuItem은 이제 드롭다운 메뉴 아이템
    } else {
      // 드롭다운 메뉴 아이템이므로 클래스 변경 제거
    }
  }
  
  // 샘플링 상태 텍스트 업데이트
  updateSamplingStatus(message) {
    if (this.samplingStatus) {
      this.samplingStatus.textContent = message;
      
      if (this.isSamplingActive) {
        this.samplingStatus.classList.add('sampling-mode-active');
      } else {
        this.samplingStatus.classList.remove('sampling-mode-active');
      }
    }
  }
  
  // 저장된 색상들 로드
  loadSavedColors() {
    const savedColors = this.colorSampler.loadColorsFromStorage();
    this.sampledColors = savedColors;
  }
  
  // 색상 스워치들 렌더링
  renderColorSwatches() {
    const container = this.colorSwatches.querySelector('.swatches-container');
    
    if (this.sampledColors.length === 0) {
      container.innerHTML = `
        <div class="empty-palette-message">
          <p>🎨 No colors sampled yet</p>
          <small>Click anywhere on the webpage to start sampling colors!</small>
        </div>
      `;
      return;
    }
    
    container.innerHTML = '';
    
    this.sampledColors.forEach(color => {
      const swatch = this.createColorSwatch(color);
      container.appendChild(swatch);
    });
  }
  
  // 색상 스워치 생성
  createColorSwatch(color) {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color.hex;
    swatch.setAttribute('data-hex', color.hex);
    swatch.setAttribute('data-color-id', color.id);
    
    swatch.addEventListener('click', () => {
      this.selectColor(color);
    });
    
    return swatch;
  }
  
  // 색상 선택
  selectColor(color) {
    this.selectedColor = color;
    
    // 모든 스워치에서 선택 상태 제거
    this.colorSwatches.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.classList.remove('selected');
    });
    
    // 선택된 스워치에 선택 상태 추가
    const selectedSwatch = this.colorSwatches.querySelector(`[data-color-id="${color.id}"]`);
    if (selectedSwatch) {
      selectedSwatch.classList.add('selected');
    }
    
    // 색상 정보 표시
    this.showSelectedColorInfo(color);
    
    // 색상 하모니 표시
    this.showColorHarmony(color);
  }
  
  // 선택된 색상 정보 표시
  showSelectedColorInfo(color) {
    this.selectedColorInfo.style.display = 'block';
    
    // 색상 스워치 업데이트
    this.selectedColorSwatch.style.backgroundColor = color.hex;
    
    // 색상 이름 업데이트
    this.selectedColorName.textContent = color.hex;
    
    // 색상 포맷 업데이트
    const formats = this.colorSampler.generateColorFormats(color);
    this.selectedColorFormats.textContent = `${formats.rgb} | ${formats.hsl}`;
    
    // 복사 버튼 이벤트 설정
    this.setupColorCopyButtons(formats);
  }
  
  // 선택된 색상 정보 숨기기
  hideSelectedColorInfo() {
    this.selectedColorInfo.style.display = 'none';
    this.colorHarmony.style.display = 'none';
    this.selectedColor = null;
  }
  
  // 색상 복사 버튼 설정
  setupColorCopyButtons(formats) {
    const copyButtons = this.selectedColorInfo.querySelectorAll('[data-copy]');
    
    copyButtons.forEach(button => {
      const format = button.getAttribute('data-copy');
      button.onclick = () => this.copyColorFormat(formats, format);
    });
  }
  
  // 색상 포맷 복사
  async copyColorFormat(formats, format) {
    try {
      let textToCopy = '';
      
      switch (format) {
        case 'hex':
          textToCopy = formats.hex;
          break;
        case 'rgb':
          textToCopy = formats.rgb;
          break;
        case 'hsl':
          textToCopy = formats.hsl;
          break;
      }
      
      await navigator.clipboard.writeText(textToCopy);
      this.showSuccessMessage(`${format.toUpperCase()} copied: ${textToCopy}`);
    } catch (error) {
      console.error('Failed to copy color:', error);
      this.showError('Failed to copy color to clipboard');
    }
  }
  
  // 색상 팔레트 초기화
  clearColorPalette() {
    if (confirm('Are you sure you want to clear all colors from the palette?')) {
      this.colorSampler.clearColorPalette();
      this.sampledColors = [];
      this.renderColorSwatches();
      this.hideSelectedColorInfo();
      this.showSuccessMessage('Color palette cleared');
    }
  }
  
  // 선택된 색상 삭제
  deleteSelectedColor() {
    if (!this.selectedColor) return;
    
    if (confirm(`Are you sure you want to delete ${this.selectedColor.hex}?`)) {
      this.colorSampler.removeColor(this.selectedColor.id);
      this.sampledColors = this.sampledColors.filter(c => c.id !== this.selectedColor.id);
      this.renderColorSwatches();
      this.hideSelectedColorInfo();
      this.showSuccessMessage('Color deleted');
    }
  }
  
  // 색상 샘플링 토글
  toggleColorSampling() {
    this.isSamplingActive = !this.isSamplingActive;
    
    if (this.isSamplingActive) {
      this.activateColorSampling();
      this.toggleSamplingBtn.innerHTML = '⏸️ Pause Sampling';
      this.updateSamplingStatus('📸 Sampling Active - Click anywhere to sample colors');
    } else {
      this.deactivateColorSampling();
      this.toggleSamplingBtn.innerHTML = '▶️ Resume Sampling';
      this.updateSamplingStatus('⏸️ Sampling Paused - Click Resume to continue');
    }
  }
  
  // 색상 하모니 표시
  showColorHarmony(color) {
    this.colorHarmony.style.display = 'block';
    this.generateColorHarmony();
  }
  
  // 색상 하모니 생성
  generateColorHarmony() {
    if (!this.selectedColor) return;
    
    const harmonyType = this.harmonyType.value;
    const harmonies = this.colorSampler.generateColorHarmony(this.selectedColor, harmonyType);
    
    // 하모니 스워치 렌더링
    this.harmonySwatches.innerHTML = '';
    
    harmonies.forEach(harmonyColor => {
      const swatch = document.createElement('div');
      swatch.className = 'harmony-swatch';
      swatch.style.backgroundColor = harmonyColor.hex;
      swatch.title = harmonyColor.hex;
      
      swatch.addEventListener('click', () => {
        // 하모니 색상을 팔레트에 추가
        this.onColorAdded(harmonyColor);
      });
      
      this.harmonySwatches.appendChild(swatch);
    });
  }
  
  // 색상 팔레트 내보내기
  exportColorPalette() {
    if (this.sampledColors.length === 0) {
      this.showError('No colors to export');
      return;
    }
    
    const exportData = {
      name: `CSS-Picker-Palette-${new Date().toISOString().slice(0, 10)}`,
      colors: this.sampledColors.map(color => ({
        hex: color.hex,
        rgb: color.rgb,
        hsl: color.hsl,
        timestamp: color.timestamp
      })),
      created: new Date().toISOString(),
      version: '1.0'
    };
    
    // JSON 파일로 다운로드
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportData.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showSuccessMessage(`Exported ${this.sampledColors.length} colors`);
  }

  // Console Mode 관련 메서드들
  toggleConsoleMode() {
    if (this.isConsoleMode) {
      this.exitConsoleMode();
    } else {
      this.enterConsoleMode();
    }
  }
  
  // Console 모드 진입
  enterConsoleMode() {
    this.isConsoleMode = true;
    
    // UI 표시
    this.showConsoleSection();
    this.hideOtherSections();  // hideInstructionsSection 대신 hideOtherSections 사용
    this.updateConsoleButtonState(true);
    
    console.log('🖥️ Entered Console Monitor mode');
  }
  
  // Console 모드 종료
  exitConsoleMode() {
    this.isConsoleMode = false;
    
    // Console 모니터링 중지
    if (this.consoleManager.isActive) {
      this.consoleManager.stopMonitoring();
    }
    
    // UI 숨김
    this.hideConsoleSection();
    this.showInstructionsSection();
    this.updateConsoleButtonState(false);
    
    console.log('🖥️ Exited Console Monitor mode');
  }
  
  // Console 섹션 표시
  showConsoleSection() {
    this.consoleSection.style.display = 'block';
  }
  
  // Console 섹션 숨김
  hideConsoleSection() {
    this.consoleSection.style.display = 'none';
  }
  
  // Asset Manager 섹션 보임
  showAssetManagerSection() {
    this.assetManager.style.display = 'block';
  }
  
  // Asset Manager 섹션 숨김
  hideAssetManagerSection() {
    this.assetManager.style.display = 'none';
  }
  
  // 기존 sections 보이기 함수 (인스트럭션 화면으로 돌아가기)
  showInstructionsSection() {
    this.instructionsSection.style.display = 'block';
    this.cssInfoSection.style.display = 'none';
    this.colorPaletteSection.style.display = 'none';
    this.consoleSection.style.display = 'none';
    this.assetManager.style.display = 'none';
  }
  
  // 실시간 색상 프리뷰 기능 제거됨 (EyeDropper 기본 사용)
  
  // Console 버튼 상태 업데이트
  updateConsoleButtonState(isActive) {
    if (isActive) {
      // 드롭다운 메뉴 아이템이므로 클래스 변경 제거
      // this.consoleMenuItem은 이제 드롭다운 메뉴 아이템
    } else {
      // 드롭다운 메뉴 아이템이므로 클래스 변경 제거
    }
  }
  
  // Console 모니터링 토글
  toggleConsoleMonitoring() {
    if (this.consoleManager.isActive) {
      this.consoleManager.stopMonitoring();
    } else {
      this.consoleManager.startMonitoring();
    }
  }
  
  // Console 메시지 클리어
  clearConsoleMessages() {
    if (this.consoleManager) {
      this.consoleManager.clearMessages();
      console.log('🗑️ Console messages cleared');
    }
  }
  
  // Console 메시지 내보내기
  exportConsoleMessages() {
    if (this.consoleManager) {
      this.consoleManager.exportMessages();
      console.log('📤 Console messages exported');
    }
  }
  
  // Console 메시지 검색
  searchConsoleMessages() {
    const searchTerm = this.consoleSearchInput.value.trim();
    if (this.consoleManager) {
      this.consoleManager.setSearchTerm(searchTerm);
    }
  }
  
  // Console 필터 설정
  setConsoleFilter(filter) {
    if (this.consoleManager) {
      this.consoleManager.setFilter(filter);
    }
  }

  // Asset Manager 초기화 함수
  initializeAssetManager() {
    // Asset Manager 버튼 이벤트 리스너 설정
    this.refreshAssetsBtn.addEventListener('click', () => {
      this.collectAssets();
    });
    
    this.downloadSelectedBtn.addEventListener('click', () => {
      this.downloadSelectedAssets();
    });
    
    this.downloadZipBtn.addEventListener('click', () => {
      this.downloadSelectedAssetsAsZip();
    });
    
    this.selectAllAssetsBtn.addEventListener('click', () => {
      this.selectAllAssets();
    });
    
    this.selectNoneAssetsBtn.addEventListener('click', () => {
      this.selectNoneAssets();
    });

    // 초기 asset 수집
    setTimeout(() => {
      this.collectAssets();
    }, 1000);
  }

  // Asset 수집 함수
  async collectAssets() {
    try {
      this.assetSummary.textContent = 'Collecting assets...';
      
      // 현재 활성 탭에서 asset 수집
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        try {
          const response = await chrome.tabs.sendMessage(tabs[0].id, { 
            action: "collect_assets" 
          });
          
          if (response && response.success) {
            this.collectedAssets = response.assets;
            this.displayAssets();
          } else {
            this.assetSummary.textContent = 'Failed to collect assets';
          }
        } catch (messageError) {
          // 컨텐츠 스크립트가 로드되어 있지 않으면 주입하고 다시 시도
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              files: ['content.js']
            });
            
            // 주입 후 메시지 재전송
            const response = await chrome.tabs.sendMessage(tabs[0].id, { 
              action: "collect_assets" 
            });
            
            if (response && response.success) {
              this.collectedAssets = response.assets;
              this.displayAssets();
            } else {
              this.assetSummary.textContent = 'Failed to collect assets';
            }
          } catch (scriptError) {
            console.error('Failed to inject content script:', scriptError);
            this.assetSummary.textContent = 'Cannot access this page';
          }
        }
      }
    } catch (error) {
      console.error('Asset collection failed:', error);
      this.assetSummary.textContent = 'Error collecting assets';
    }
  }

  // Asset 표시 함수
  displayAssets() {
    if (!this.collectedAssets) return;

    const assetTypes = [
      { key: 'images', name: '🖼️ Images', icon: '🖼️' },
      { key: 'stylesheets', name: '🎨 Stylesheets', icon: '🎨' },
      { key: 'scripts', name: '⚡ Scripts', icon: '⚡' },
      { key: 'fonts', name: '🔤 Fonts', icon: '🔤' },
      { key: 'videos', name: '🎬 Videos', icon: '🎬' },
      { key: 'audio', name: '🎵 Audio', icon: '🎵' }
    ];

    let totalAssets = 0;
    assetTypes.forEach(type => {
      totalAssets += this.collectedAssets[type.key].length;
    });

    this.assetSummary.textContent = `Total: ${totalAssets} assets`;
    this.assetCategories.innerHTML = '';

    assetTypes.forEach(type => {
      const assets = this.collectedAssets[type.key];
      if (assets.length > 0) {
        const categoryElement = this.createAssetCategory(type, assets);
        this.assetCategories.appendChild(categoryElement);
      }
    });

    this.updateDownloadButton();
  }

  // Asset 카테고리 생성
  createAssetCategory(type, assets) {
    const isExpanded = this.assetCategoryStates.get(type.key) !== false;
    
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'asset-category';
    categoryDiv.setAttribute('data-category', type.key);

    categoryDiv.innerHTML = `
      <div class="asset-category-header ${isExpanded ? 'expanded' : ''}" data-category="${type.key}">
        <div class="category-info">
          <input type="checkbox" class="category-checkbox" data-category="${type.key}">
          <span class="category-title">${type.name} (${assets.length})</span>
        </div>
        <span class="category-toggle ${isExpanded ? 'expanded' : ''}">▶</span>
      </div>
      <div class="asset-category-content ${isExpanded ? 'expanded' : ''}">
        <div class="asset-list" data-category="${type.key}">
          ${assets.map(asset => this.createAssetItem(asset)).join('')}
        </div>
      </div>
    `;

    // 이벤트 리스너 설정
    const header = categoryDiv.querySelector('.asset-category-header');
    header.addEventListener('click', (e) => {
      if (e.target.type !== 'checkbox') {
        this.toggleAssetCategory(type.key);
      }
    });

    const categoryCheckbox = categoryDiv.querySelector('.category-checkbox');
    categoryCheckbox.addEventListener('change', (e) => {
      this.toggleAssetCategorySelection(type.key, e.target.checked);
    });

    // 개별 asset 체크박스 이벤트
    categoryDiv.addEventListener('change', (e) => {
      if (e.target.matches('.asset-checkbox')) {
        const assetId = e.target.getAttribute('data-asset');
        if (e.target.checked) {
          this.selectedAssets.add(assetId);
        } else {
          this.selectedAssets.delete(assetId);
        }
        this.updateDownloadButton();
        this.updateCategoryCheckbox(type.key);
      }
    });

    return categoryDiv;
  }

  // Asset 아이템 생성
  createAssetItem(asset) {
    const isSelected = this.selectedAssets.has(asset.id);
    const displayName = asset.filename || 'unnamed';
    const sizeDisplay = asset.size ? this.formatFileSize(asset.size) : '';

    return `
      <div class="asset-item" data-asset="${asset.id}">
        <input type="checkbox" class="asset-checkbox" data-asset="${asset.id}" ${isSelected ? 'checked' : ''}>
        <div class="asset-info">
          <div class="asset-name" title="${asset.url}">${displayName}</div>
          <div class="asset-details">
            <span class="asset-type">.${asset.extension || 'unknown'}</span>
            ${sizeDisplay ? `<span class="asset-size">${sizeDisplay}</span>` : ''}
          </div>
        </div>
        <button class="btn btn-outline-primary btn-sm download-single-btn" data-asset="${asset.id}" title="Download">
          ⬇️
        </button>
      </div>
    `;
  }

  // Asset 카테고리 토글
  toggleAssetCategory(categoryKey) {
    const currentState = this.assetCategoryStates.get(categoryKey) !== false;
    const newState = !currentState;
    this.assetCategoryStates.set(categoryKey, newState);

    const categoryElement = document.querySelector(`[data-category="${categoryKey}"]`);
    const header = categoryElement.querySelector('.asset-category-header');
    const content = categoryElement.querySelector('.asset-category-content');
    const toggle = categoryElement.querySelector('.category-toggle');

    if (newState) {
      header.classList.add('expanded');
      content.classList.add('expanded');
      toggle.classList.add('expanded');
    } else {
      header.classList.remove('expanded');
      content.classList.remove('expanded');
      toggle.classList.remove('expanded');
    }
  }

  // Asset 카테고리 전체 선택/해제
  toggleAssetCategorySelection(categoryKey, isChecked) {
    const assets = this.collectedAssets[categoryKey];
    assets.forEach(asset => {
      if (isChecked) {
        this.selectedAssets.add(asset.id);
      } else {
        this.selectedAssets.delete(asset.id);
      }
    });

    // 체크박스 UI 업데이트
    const checkboxes = document.querySelectorAll(`[data-category="${categoryKey}"] .asset-checkbox`);
    checkboxes.forEach(checkbox => {
      checkbox.checked = isChecked;
    });

    this.updateDownloadButton();
  }

  // 모든 Asset 선택
  selectAllAssets() {
    if (!this.collectedAssets) return;

    Object.values(this.collectedAssets).forEach(assetArray => {
      assetArray.forEach(asset => {
        this.selectedAssets.add(asset.id);
      });
    });

    // 모든 체크박스 체크
    const allCheckboxes = document.querySelectorAll('.asset-checkbox, .category-checkbox');
    allCheckboxes.forEach(checkbox => {
      checkbox.checked = true;
    });

    this.updateDownloadButton();
  }

  // Asset 선택 해제
  selectNoneAssets() {
    this.selectedAssets.clear();

    // 모든 체크박스 해제
    const allCheckboxes = document.querySelectorAll('.asset-checkbox, .category-checkbox');
    allCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    this.updateDownloadButton();
  }

  // 카테고리 체크박스 상태 업데이트
  updateCategoryCheckbox(categoryKey) {
    const assets = this.collectedAssets[categoryKey];
    const selectedCount = assets.filter(asset => this.selectedAssets.has(asset.id)).length;
    const categoryCheckbox = document.querySelector(`.category-checkbox[data-category="${categoryKey}"]`);

    if (selectedCount === 0) {
      categoryCheckbox.checked = false;
      categoryCheckbox.indeterminate = false;
    } else if (selectedCount === assets.length) {
      categoryCheckbox.checked = true;
      categoryCheckbox.indeterminate = false;
    } else {
      categoryCheckbox.checked = false;
      categoryCheckbox.indeterminate = true;
    }
  }

  // 다운로드 버튼 상태 업데이트
  updateDownloadButton() {
    const hasSelection = this.selectedAssets.size > 0;
    this.downloadSelectedBtn.disabled = !hasSelection;
    this.downloadSelectedBtn.textContent = hasSelection ? 
      `📥 Download Selected (${this.selectedAssets.size})` : 
      '📥 Download Selected';
    
    // ZIP 다운로드 버튼도 같은 상태로 업데이트
    this.downloadZipBtn.disabled = !hasSelection;
    this.downloadZipBtn.textContent = hasSelection ? 
      `🗜️ Download as ZIP (${this.selectedAssets.size})` : 
      '🗜️ Download as ZIP';
  }

  // 선택된 Asset 다운로드
  async downloadSelectedAssets() {
    if (this.selectedAssets.size === 0) return;

    const selectedAssetObjects = this.getSelectedAssetObjects();
    
    try {
      // Background script에 다운로드 요청
      const response = await chrome.runtime.sendMessage({
        type: 'download_assets',
        assets: selectedAssetObjects
      });

      if (response.success) {
        this.showSuccessMessage(`Started downloading ${selectedAssetObjects.length} assets`);
      } else {
        this.showError('Failed to start downloads');
      }
    } catch (error) {
      console.error('Download failed:', error);
      this.showError('Download failed');
    }
  }

  // 선택된 Asset들을 ZIP으로 다운로드
  async downloadSelectedAssetsAsZip() {
    if (this.selectedAssets.size === 0) return;

    const selectedAssetObjects = this.getSelectedAssetObjects();
    
    try {
      // JSZip이 로드되었는지 확인
      if (typeof JSZip === 'undefined') {
        throw new Error('JSZip library not loaded');
      }

      this.showSuccessMessage('Preparing ZIP download...');
      
      const zip = new JSZip();
      const failedAssets = [];
      let successCount = 0;

      // 각 asset을 ZIP에 추가
      for (const asset of selectedAssetObjects) {
        try {
          // Asset 데이터를 fetch로 가져오기
          const response = await fetch(asset.url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const blob = await response.blob();
          
          // 파일명 생성
          const url = new URL(asset.url);
          const pathParts = url.pathname.split('/');
          let filename = pathParts[pathParts.length - 1] || 'download';
          
          // 확장자가 없으면 asset 타입에 따라 추가
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

          // ZIP에 파일 추가 (폴더별로 구분)
          zip.folder(asset.type + 's').file(filename, blob);
          successCount++;
          
        } catch (error) {
          console.error(`Failed to add ${asset.url} to ZIP:`, error);
          failedAssets.push({
            url: asset.url,
            error: error.message
          });
        }
      }

      if (successCount === 0) {
        throw new Error('No assets could be added to ZIP');
      }

      // ZIP 생성 및 다운로드
      const zipBlob = await zip.generateAsync({type: 'blob'});
      
      // 다운로드 URL 생성
      const url = URL.createObjectURL(zipBlob);
      
      // 현재 사이트의 도메인으로 파일명 생성
      const hostname = window.location.hostname || 'website';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `${hostname}-assets-${timestamp}.zip`;
      
      // 다운로드 링크 생성 및 클릭
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // URL 객체 정리
      URL.revokeObjectURL(url);

      // 결과 메시지 표시
      if (failedAssets.length === 0) {
        this.showSuccessMessage(`ZIP download started with ${successCount} assets`);
      } else {
        this.showSuccessMessage(`ZIP download started with ${successCount} assets (${failedAssets.length} failed)`);
      }
      
    } catch (error) {
      console.error('ZIP download failed:', error);
      this.showError(`ZIP download failed: ${error.message}`);
    }
  }

  // 선택된 Asset 객체들 반환
  getSelectedAssetObjects() {
    const selectedAssets = [];
    
    Object.values(this.collectedAssets).forEach(assetArray => {
      assetArray.forEach(asset => {
        if (this.selectedAssets.has(asset.id)) {
          selectedAssets.push(asset);
        }
      });
    });
    
    return selectedAssets;
  }

  // 파일 크기 포맷
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
  
  // Authentication 관련 메서드들
  
  // Authentication 초기화
  initializeAuthentication() {
    // Clerk client 로드 확인
    if (typeof clerkClient === 'undefined') {
      console.error('Clerk client not loaded');
      this.updateAuthUI('error');
      return;
    }
    
    // Authentication 이벤트 리스너 설정
    this.setupAuthEventListeners();
    
    // Clerk client 상태 확인
    clerkClient.addListener((event, client) => {
      this.handleAuthStateChange(event, client);
    });
    
    // 초기 상태 확인
    this.checkInitialAuthState();
  }
  
  // Authentication 상태 확인
  async checkInitialAuthState() {
    try {
      // Clerk client가 로드될 때까지 대기
      await this.waitForClerkClient();
      
      if (clerkClient.isLoaded && clerkClient.isSignedIn) {
        this.isSignedIn = true;
        this.currentUser = clerkClient.getUser();
        this.authState = 'signed-in';
      } else {
        this.isSignedIn = false;
        this.currentUser = null;
        this.authState = 'signed-out';
      }
      
      this.updateAuthUI(this.authState);
    } catch (error) {
      console.error('Failed to check auth state:', error);
      this.authState = 'error';
      this.updateAuthUI('error');
    }
  }
  
  // Clerk client 로드 대기
  waitForClerkClient() {
    return new Promise((resolve, reject) => {
      if (clerkClient && clerkClient.isLoaded) {
        resolve();
        return;
      }
      
      let attempts = 0;
      const maxAttempts = 50; // 5초 최대 대기
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        if (clerkClient && clerkClient.isLoaded) {
          clearInterval(checkInterval);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          reject(new Error('Clerk client failed to load'));
        }
      }, 100);
    });
  }
  
  // Authentication 이벤트 리스너 설정
  setupAuthEventListeners() {
    if (this.signInBtn) {
      this.signInBtn.addEventListener('click', () => {
        this.handleSignIn();
      });
    }
    
    if (this.signOutBtn) {
      this.signOutBtn.addEventListener('click', () => {
        this.handleSignOut();
      });
    }
  }
  
  // 로그인 처리
  async handleSignIn() {
    try {
      this.showAuthLoading(true);
      
      // Show login modal with direct Clerk integration
      this.showClerkLoginModal();
      
    } catch (error) {
      console.error('Sign in error:', error);
      this.showError('Sign in failed. Please try again.');
    } finally {
      this.showAuthLoading(false);
    }
  }
  
  // Show Clerk login - redirect to backend auth page
  async showClerkLoginModal() {
    try {
      const extensionId = chrome.runtime.id;
      const authUrl = `${CLERK_CONFIG.landingPageUrl}?extension_auth=true&extension_id=${extensionId}`;
      
      console.log('Opening authentication page:', authUrl);
      
      // Open backend authentication page in new tab
      await chrome.tabs.create({ 
        url: authUrl,
        active: true 
      });
      
      return { success: true, redirected: true };
    } catch (error) {
      console.error('Failed to open authentication page:', error);
      return { success: false, error: error.message };
    }
  }


  // Handle successful Clerk authentication
  async handleClerkAuthSuccess() {
    try {
      const user = window.Clerk.user;
      const session = window.Clerk.session;
      
      if (!user || !session) {
        throw new Error('인증 정보를 가져올 수 없습니다');
      }

      // Get session token for API calls
      const token = await session.getToken();
      
      // Create user profile data
      const userData = {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          emailAddress: user.primaryEmailAddress?.emailAddress,
          createdAt: user.createdAt
        },
        sessionToken: token
      };

      // Store authentication data
      await chrome.storage.local.set({
        clerk_session: token,
        clerk_user: userData.user
      });

      // Update UI state
      this.isSignedIn = true;
      this.currentUser = userData.user;
      this.authState = 'signed-in';
      this.updateAuthUI('signed-in');

      // Initialize plan management
      await this.initializePlanManagement();

      // Create user profile in backend if needed
      await this.createUserProfile(token);

      console.log('Clerk authentication successful:', userData);
    } catch (error) {
      console.error('Failed to handle Clerk auth success:', error);
      throw error;
    }
  }

  // Create user profile in backend
  async createUserProfile(token) {
    try {
      const response = await fetch(`${CLERK_CONFIG.syncHost}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('User profile created/retrieved:', userData);
      } else {
        console.error('Failed to create user profile:', response.status);
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  }

  // Initialize Clerk authentication (using existing ClerkExtensionClient)
  async initializeClerkAuth() {
    try {
      // Use existing ClerkExtensionClient instead of direct Clerk SDK
      console.log('Using existing ClerkExtensionClient for authentication');
      
      // The existing clerkClient handles everything through background script
      // and auth-content.js, so no additional initialization needed here
      
    } catch (error) {
      console.error('Failed to initialize Clerk auth:', error);
    }
  }
  
  
  // 로그아웃 처리
  async handleSignOut() {
    try {
      this.showAuthLoading(true);
      
      const result = await clerkClient.signOut();
      
      if (result.success) {
        this.isSignedIn = false;
        this.currentUser = null;
        this.authState = 'signed-out';
        this.updateAuthUI('signed-out');
        console.log('Sign out successful');
      } else {
        throw new Error(result.error || 'Sign out failed');
      }
    } catch (error) {
      console.error('Sign out error:', error);
      this.showError('Sign out failed. Please try again.');
    } finally {
      this.showAuthLoading(false);
    }
  }
  
  // Auth 상태 변경 처리
  handleAuthStateChange(event, client) {
    switch (event) {
      case 'loaded':
        this.checkInitialAuthState();
        break;
      case 'signIn':
        this.isSignedIn = true;
        this.currentUser = client.getUser();
        this.authState = 'signed-in';
        this.updateAuthUI('signed-in');
        break;
      case 'signOut':
        this.isSignedIn = false;
        this.currentUser = null;
        this.authState = 'signed-out';
        this.updateAuthUI('signed-out');
        break;
    }
  }
  
  // Authentication UI 업데이트
  updateAuthUI(state) {
    if (!this.authSignedOut || !this.authSignedIn) {
      return;
    }
    
    switch (state) {
      case 'loading':
        this.authSignedOut.style.display = 'block';
        this.authSignedIn.style.display = 'none';
        break;
        
      case 'signed-out':
        this.authSignedOut.style.display = 'block';
        this.authSignedIn.style.display = 'none';
        break;
        
      case 'signed-in':
        this.authSignedOut.style.display = 'none';
        this.authSignedIn.style.display = 'block';
        this.updateUserInfo();
        break;
        
      case 'error':
        this.authSignedOut.style.display = 'block';
        this.authSignedIn.style.display = 'none';
        if (this.signInBtn) {
          this.signInBtn.textContent = 'Sign In (Error - Retry)';
          this.signInBtn.classList.add('btn-warning');
          this.signInBtn.classList.remove('btn-primary');
        }
        break;
    }
    
    // Update home welcome message when auth state changes
    this.updateHomeWelcomeMessage();
  }
  
  // 사용자 정보 업데이트
  updateUserInfo() {
    if (!this.currentUser) return;
    
    if (this.userName) {
      const fullName = `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim();
      this.userName.textContent = fullName || 'User';
    }
    
    if (this.userEmail) {
      this.userEmail.textContent = this.currentUser.emailAddress || 'No email';
    }
    
    if (this.userAvatar) {
      // 이름의 첫 글자를 아바타로 사용
      const initials = this.getInitials(this.currentUser.firstName, this.currentUser.lastName);
      this.userAvatar.textContent = initials;
    }
  }
  
  // 이름 이니셜 생성
  getInitials(firstName, lastName) {
    const first = (firstName || '').charAt(0).toUpperCase();
    const last = (lastName || '').charAt(0).toUpperCase();
    return first + last || '👤';
  }
  
  // 로딩 상태 표시/숨기기
  showAuthLoading(show) {
    if (this.authLoading && this.signInBtn) {
      if (show) {
        this.authLoading.style.display = 'flex';
        this.signInBtn.style.display = 'none';
      } else {
        this.authLoading.style.display = 'none';
        this.signInBtn.style.display = 'block';
      }
    }
  }
  
  // Authentication 상태 확인 (외부에서 호출 가능)
  getAuthState() {
    return {
      isSignedIn: this.isSignedIn,
      user: this.currentUser,
      state: this.authState
    };
  }
  
  // Debug: View current login data
  async debugAuthData() {
    console.log('=== LOGIN DATA DEBUG ===');
    console.log('Memory State:', this.getAuthState());
    
    try {
      const stored = await chrome.storage.local.get(['clerk_session', 'clerk_user']);
      console.log('Chrome Storage:', stored);
    } catch (error) {
      console.error('Failed to read storage:', error);
    }
    
    if (typeof clerkClient !== 'undefined') {
      console.log('Clerk Client State:', {
        isLoaded: clerkClient.isLoaded,
        isSignedIn: clerkClient.isSignedIn,
        user: clerkClient.user,
        sessionToken: clerkClient.sessionToken
      });
    }
  }
  
  // 인증이 필요한 기능 확인
  requireAuth(featureName) {
    if (!this.isSignedIn) {
      this.showError(`${featureName} requires authentication. Please sign in first.`);
      return false;
    }
    return true;
  }
  
  // Plan Management 관련 메서드들
  
  // Plan Management 초기화
  async initializePlanManagement() {
    // PlanManager 로드 확인
    if (typeof planManager === 'undefined') {
      console.error('Plan Manager not loaded');
      return;
    }
    
    // 로그인 후 plan 동기화 (백엔드에서 최신 플랜 상태 가져오기)
    console.log('Syncing plan status after login...');
    await planManager.syncPlanStatus();
    console.log('Plan synced:', planManager.currentPlan);
    
    // Plan 상태 UI 업데이트
    await this.updatePlanUI();
    
    // Plan Management 이벤트 리스너 설정
    this.setupPlanEventListeners();
    
    // Premium 기능 잠금 설정 (async)
    this.setupPremiumLocks().catch(error => {
      console.error('Failed to setup premium locks in init:', error);
    });
  }
  
  // Plan UI 업데이트
  async updatePlanUI() {
    try {
      const currentPlan = planManager.getCurrentPlan();
      
      if (this.upgradeBtn) {
        if (planManager.needsUpgrade()) {
          this.upgradeBtn.style.display = 'block';
        } else {
          this.upgradeBtn.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Failed to update plan UI:', error);
    }
  }
  
  // Plan 이벤트 리스너 설정
  setupPlanEventListeners() {
    // Upgrade button click
    if (this.upgradeBtn) {
      this.upgradeBtn.addEventListener('click', () => {
        this.showUpgradeModal('general');
      });
    }
    
    // Upgrade modal - Upgrade Now button
    if (this.upgradeNowBtn) {
      this.upgradeNowBtn.addEventListener('click', () => {
        this.handleUpgradeClick();
      });
    }
  }
  
  // Premium 기능 잠금 설정
  async setupPremiumLocks(retryCount = 0) {
    const maxRetries = 3;
    
    try {
      console.log(`Setting up premium locks... (attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      // Wait for plan manager to be ready
      if (window.planManager) {
        await window.planManager.waitForReady();
      } else if (typeof planManager !== 'undefined') {
        await planManager.waitForReady();
      } else {
        console.warn('planManager not found, using fallback delay');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const features = [
        ['colorPaletteMenuItem', 'color_sampling', 'Color Palette'],
        ['assetManagerMenuItem', 'asset_management', 'Asset Manager'],
        ['consoleMenuItem', 'console_monitoring', 'Console Monitor'],
        ['convertToTailwindBtn', 'tailwind_conversion', 'Tailwind Conversion'],
        ['exportPaletteBtn', 'export_features', 'Export Features'],
        ['exportConsoleBtn', 'export_features', 'Export Features']
      ];
      
      // Process features with individual error handling
      const results = await Promise.allSettled(
        features.map(([elementId, featureName, displayName]) => 
          this.setupFeatureLock(elementId, featureName, displayName)
        )
      );
      
      const failed = results.filter(result => result.status === 'rejected');
      if (failed.length > 0) {
        console.warn(`${failed.length} feature locks failed to setup:`, failed);
      }
      
      console.log(`Premium locks setup completed (${results.length - failed.length}/${results.length} successful)`);
    } catch (error) {
      console.error(`Failed to setup premium locks (attempt ${retryCount + 1}):`, error);
      
      // Retry if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`Retrying premium locks setup in ${delay}ms...`);
        setTimeout(() => {
          this.setupPremiumLocks(retryCount + 1);
        }, delay);
      } else {
        console.error('Max retries exceeded for premium locks setup');
      }
    }
  }
  
  // 개별 기능 잠금 설정
  async setupFeatureLock(elementId, featureName, displayName) {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        console.warn(`Element not found: ${elementId}`);
        return;
      }
      
      // 기존 lock 제거
      const existingLock = element.querySelector('.premium-lock-overlay');
      if (existingLock) {
        existingLock.remove();
      }
      
      // Check if planManager is available
      if (!window.planManager && typeof planManager === 'undefined') {
        console.error('planManager not available, assuming feature requires premium');
        // Fallback behavior - assume feature requires premium
        this.addPremiumLockOverlay(element, displayName || 'Premium Feature');
        return;
      }
      
      const manager = window.planManager || planManager;
      const canUse = await manager.canUseFeature(featureName);
      console.log(`Feature ${featureName}: ${canUse.allowed ? '✅ Unlocked' : '🔒 Locked'}`);
    
    // 메인 메뉴 아이템들과 이미 권한 체크가 있는 버튼들은
    // 이미 메인 이벤트 리스너에서 checkFeatureAccess()를 호출하므로 
    // 여기서는 시각적 표시만 관리하고 추가 이벤트 리스너는 붙이지 않음
    const mainMenuItems = ['colorPaletteMenuItem', 'assetManagerMenuItem', 'consoleMenuItem', 'convertToTailwindBtn'];
    
    if (!canUse.allowed) {
      // 메인 메뉴 아이템이 아닌 경우에만 클릭 이벤트 추가
      if (!mainMenuItems.includes(elementId)) {
        element.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showUpgradeModal(featureName, displayName);
        });
      }
      
      // 시각적 잠금 표시 추가
      this.addPremiumLockOverlay(element, displayName);
    } else {
      // Premium 사용자인 경우 lock 제거
      element.classList.remove('disabled');
      element.style.pointerEvents = 'auto';
      element.style.opacity = '1';
    }
    } catch (error) {
      console.error(`Failed to setup feature lock for ${elementId}:`, error);
      // Fallback: assume feature requires premium (safe default)
      const element = document.getElementById(elementId);
      if (element) {
        this.addPremiumLockOverlay(element, displayName || 'Premium Feature');
      }
    }
  }
  
  // Premium 잠금 오버레이 추가
  addPremiumLockOverlay(element, displayName) {
    // 이미 오버레이가 있으면 건너뛰기
    if (element.querySelector('.premium-lock-overlay')) return;
    
    // 상대 위치 설정
    const originalPosition = getComputedStyle(element).position;
    if (originalPosition === 'static') {
      element.style.position = 'relative';
    }
    
    // 오버레이 생성
    const overlay = document.createElement('div');
    overlay.className = 'premium-lock-overlay';
    overlay.innerHTML = `
      <div class="premium-lock-content">

      <div class="premium-lock-subtext">Premium Only</div>
      </div>
    `;
    
    // 오버레이 클릭 이벤트
    overlay.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showUpgradeModal(displayName.toLowerCase().replace(/\s+/g, '_'), displayName);
    });
    
    element.appendChild(overlay);
  }
  
  // Upgrade 모달 표시
  showUpgradeModal(featureName, displayName = null) {
    if (!this.upgradeModal) return;
    
    try {
      const upgradeInfo = planManager.showUpgradePrompt(featureName);
      
      if (this.upgradeMessage && displayName) {
        this.upgradeMessage.textContent = `${displayName} is available in Premium plan only.`;
      }
      
      // Bootstrap 모달 표시
      const modal = new bootstrap.Modal(this.upgradeModal, {
    backdrop: false
  });
      modal.show();
      
      // 현재 기능명 저장 (업그레이드 버튼용)
      this.upgradeModal.dataset.feature = featureName;
      
    } catch (error) {
      console.error('Failed to show upgrade modal:', error);
    }
  }
  
  // 업그레이드 버튼 클릭 처리
  handleUpgradeClick() {
    try {
      const upgradeUrl = planManager.getUpgradeUrl();
      
      // 새 탭에서 업그레이드 페이지 열기
      chrome.tabs.create({ url: upgradeUrl });
      
      // 모달 닫기
      const modal = bootstrap.Modal.getInstance(this.upgradeModal);
      if (modal) {
        modal.hide();
      }
      
    } catch (error) {
      console.error('Failed to handle upgrade click:', error);
      // 백업: 직접 URL 열기
      window.open('https://your-landing-page.com/upgrade', '_blank');
    }
  }
  
  // Premium 기능 접근 권한 체크
  async checkFeatureAccess(featureName) {
    try {
      const canUse = await planManager.canUseFeature(featureName);
      
      if (!canUse.allowed) {
        // 업그레이드 모달 표시
        this.showUpgradeModal(featureName);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to check feature access:', error);
      return false;
    }
  }

  // Premium 기능 체크 및 사용 추적
  async checkAndTrackFeature(featureName, callback) {
    try {
      const canUse = await planManager.canUseFeature(featureName);
      
      if (canUse.allowed) {
        // 기능 사용 추적
        await planManager.trackUsage(featureName);
        // 콜백 실행
        if (callback && typeof callback === 'function') {
          callback();
        }
        return true;
      } else {
        // 업그레이드 모달 표시
        this.showUpgradeModal(featureName);
        return false;
      }
    } catch (error) {
      console.error('Failed to check feature access:', error);
      return false;
    }
  }
  
  // Plan 상태 동기화
  async syncPlanStatus() {
    try {
      await planManager.syncPlanStatus();
      await this.updatePlanUI();
      await this.setupPremiumLocks();
    } catch (error) {
      console.error('Failed to sync plan status:', error);
    }
  }
}

// SidePanel 클래스의 인스턴스(실제 객체)를 생성합니다
// new 키워드를 사용하면 클래스를 실제로 실행 가능한 객체로 만들어줍니다
// 이렇게 하면 위에서 정의한 모든 함수들이 실행됩니다
// 글로벌 변수로 저장하여 ClerkExtensionClient에서 접근 가능하도록 함
window.cssSidepanel = new SidePanel();
