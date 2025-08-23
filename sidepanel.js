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
  }

  // 캔버스 기반 색상 샘플링 활성화
  activateSampling() {
    this.isActive = true;
    this.initializeCanvas();
    this.addEventListeners();
  }

  // 색상 샘플링 비활성화
  deactivateSampling() {
    this.isActive = false;
    this.removeEventListeners();
    this.clearCanvas();
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
    chrome.runtime.onMessage.addListener(this.handleColorSampleMessage.bind(this));
  }

  // 이벤트 리스너 제거
  removeEventListeners() {
    chrome.runtime.onMessage.removeListener(this.handleColorSampleMessage.bind(this));
  }

  // content script에서 오는 메시지 처리
  handleColorSampleMessage(message, sender, sendResponse) {
    if (message.action === 'color-sampled') {
      this.processColorSample(message.colorData, message.coordinates);
      sendResponse({ success: true });
    }
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
    // 메시지 리스너 등록
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'console-message') {
        this.addMessage(message.data);
        sendResponse({ success: true });
      }
    });
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
    this.$statusIndicator = null;
    
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
  
  initializeAfterDOM() {
    // HTML 요소들을 찾아서 변수에 저장합니다
    this.setupElements();
    
    // 버튼 클릭 등의 이벤트 리스너를 설정합니다
    this.setupEventListeners();
    
    // CSS 정보 영역을 초기화합니다
    this.initializeCssInfoSection();
    
    // Asset Manager 초기화
    this.initializeAssetManager();
    
    // 백그라운드 스크립트에게 "사이드패널이 열렸다"고 알려줍니다
    this.notifyOpened();
  }
  
  // HTML에서 필요한 요소들을 찾아서 변수에 저장하는 함수입니다
  setupElements() {
    // vanilla JavaScript의 getElementById는 특정 id를 가진 요소를 찾는 함수입니다
    // "statusIndicator" id를 가진 요소를 찾아서 저장합니다
    this.statusIndicator = document.getElementById("statusIndicator");
    
    // "toggleBtn" id를 가진 버튼을 찾아서 저장합니다
    this.toggleButton = document.getElementById("toggleBtn");
    
    // CSS 정보 관련 요소들
    this.cssInfoSection = document.getElementById("cssInfoSection");
    this.instructionsSection = document.getElementById("instructionsSection");
    this.elementSelector = document.getElementById("elementSelector");
    this.copySelectorBtn = document.getElementById("copySelectorBtn");
    this.propertiesAccordion = document.getElementById("propertiesAccordion");
    this.selectAllBtn = document.getElementById("selectAllBtn");
    this.selectNoneBtn = document.getElementById("selectNoneBtn");
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
    this.colorPaletteBtn = document.getElementById("colorPaletteBtn");
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
    this.consoleMonitorBtn = document.getElementById("consoleMonitorBtn");
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
  }
  
  // 각종 이벤트 리스너들을 설정하는 함수입니다
  // 이벤트 리스너는 "특정 상황이 발생했을 때 실행할 함수"를 등록하는 것입니다
  setupEventListeners() {
    // vanilla JavaScript의 .addEventListener()로 클릭 이벤트를 등록합니다
    this.toggleButton.addEventListener('click', () => {
      this.togglePicker(); // 피커를 켜거나 끄는 함수를 호출합니다
    });
    
    // beforeunload는 창이나 탭이 닫히기 직전에 발생하는 이벤트입니다
    window.addEventListener("beforeunload", () => {
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
    // 요소 존재 여부를 확인합니다
    if (!this.statusIndicator) return;
    
    // textContent로 텍스트를 변경합니다
    this.statusIndicator.textContent = text;
    
    // className으로 클래스 속성을 변경합니다
    this.statusIndicator.className = `status-indicator status-${state}`;
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
    this.closeCssInfo.addEventListener('click', () => {
      this.hideCssInfo();
    });
    
    // 리셋 버튼 이벤트 리스너 설정
    this.resetStyles.addEventListener('click', () => {
      this.resetAllStyles();
    });
    
    // Copy CSS 드롭다운 이벤트 리스너 설정
    this.copyCssDropdown.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleDropdown();
    });
    
    // 새로운 UI 요소들의 이벤트 리스너
    this.copySelectorBtn.addEventListener('click', () => {
      this.copySelectorToClipboard();
    });
    
    this.selectAllBtn.addEventListener('click', () => {
      this.selectAllProperties();
    });
    
    this.selectNoneBtn.addEventListener('click', () => {
      this.selectNoneProperties();
    });
    
    // Tailwind 변환 관련 이벤트 리스너
    this.convertToTailwindBtn.addEventListener('click', () => {
      this.convertToTailwindView();
    });
    
    this.backToCssBtn.addEventListener('click', () => {
      this.backToCssView();
    });
    
    // Color Palette 관련 이벤트 리스너
    this.colorPaletteBtn.addEventListener('click', () => {
      this.toggleColorPaletteMode();
    });
    
    this.exitColorModeBtn.addEventListener('click', () => {
      this.exitColorPaletteMode();
    });
    
    this.clearPaletteBtn.addEventListener('click', () => {
      this.clearColorPalette();
    });
    
    this.exportPaletteBtn.addEventListener('click', () => {
      this.exportColorPalette();
    });
    
    this.toggleSamplingBtn.addEventListener('click', () => {
      this.toggleColorSampling();
    });
    
    this.deleteColorBtn.addEventListener('click', () => {
      this.deleteSelectedColor();
    });
    
    this.generateHarmonyBtn.addEventListener('click', () => {
      this.generateColorHarmony();
    });
    
    // Console Monitor 관련 이벤트 리스너
    this.consoleMonitorBtn.addEventListener('click', () => {
      this.toggleConsoleMode();
    });
    
    this.toggleConsoleBtn.addEventListener('click', () => {
      this.toggleConsoleMonitoring();
    });
    
    this.clearConsoleBtn.addEventListener('click', () => {
      this.clearConsoleMessages();
    });
    
    this.exportConsoleBtn.addEventListener('click', () => {
      this.exportConsoleMessages();
    });
    
    this.closeConsoleBtn.addEventListener('click', () => {
      this.exitConsoleMode();
    });
    
    this.consoleSearchBtn.addEventListener('click', () => {
      this.searchConsoleMessages();
    });
    
    this.consoleSearchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        this.searchConsoleMessages();
      }
    });
    
    this.consoleSearchInput.addEventListener('input', (e) => {
      this.searchConsoleMessages();
    });
    
    // 필터 버튼 이벤트 리스너 (이벤트 위임 사용)
    document.addEventListener('click', (e) => {
      if (e.target.matches('.filter-btn')) {
        const filter = e.target.dataset.filter;
        this.setConsoleFilter(filter);
      }
    });
    
    // 드롭다운 항목 클릭 이벤트 (이벤트 위임 사용)
    document.addEventListener('click', (e) => {
      if (e.target.matches('.dropdown-item[data-format]')) {
        e.preventDefault();
        const format = e.target.getAttribute('data-format');
        
        // Tailwind 형식인지 확인
        if (format.startsWith('tailwind-') || format === 'mixed-format') {
          this.copyTailwindToClipboard(format);
        } else {
          this.copyCssToClipboard(format);
        }
        
        this.hideDropdown();
      }
    });
    
    // 드롭다운 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.copy-css-dropdown') && !e.target.closest('.copy-tailwind-dropdown')) {
        this.hideDropdown();
      }
    });
  }
  
  // CSS 요소 정보를 화면에 표시하는 함수입니다
  displayElementInfo(cssInfo) {
    try {
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
  
  // 드롭다운 토글 함수
  toggleDropdown() {
    const dropdown = document.querySelector('.copy-css-dropdown');
    dropdown.classList.toggle('show');
  }
  
  // 드롭다운 숨기기 함수
  hideDropdown() {
    const dropdown = document.querySelector('.copy-css-dropdown');
    dropdown.classList.remove('show');
  }
  
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
  }
  
  // 모든 속성 선택 함수
  selectAllProperties() {
    Object.values(this.categorizedProperties).forEach(categoryProperties => {
      Object.keys(categoryProperties).forEach(property => {
        this.selectedProperties.add(property);
      });
    });
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
      Object.values(this.categorizedProperties).forEach(categoryProps => {
        categoryProps.forEach(prop => {
          allProperties.push({
            name: prop.property,
            value: prop.value,
            category: prop.category
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
      
      // Tailwind 속성들을 UI에 렌더링
      this.renderTailwindProperties();
      
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
    
    // CSS 복사 드롭다운 숨기고 Tailwind 복사 드롭다운 표시
    this.copyCssDropdown.parentNode.style.display = 'none';
    this.copyTailwindDropdown.style.display = 'block';
  }

  // UI를 CSS 뷰로 전환
  switchToCssUI() {
    this.isTailwindView = false;
    
    // 제목 변경
    this.propertiesTitle.textContent = 'CSS Properties';
    
    // 버튼 표시/숨김
    this.convertToTailwindBtn.style.display = 'inline-block';
    this.backToCssBtn.style.display = 'none';
    
    // Tailwind 복사 드롭다운 숨기고 CSS 복사 드롭다운 표시
    this.copyTailwindDropdown.style.display = 'none';
    this.copyCssDropdown.parentNode.style.display = 'block';
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
      <input type="checkbox" class="category-checkbox" data-category="${categoryKey}">
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
      <input type="checkbox" class="property-checkbox" data-property="${property.name}">
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
    this.showOtherSections();
    this.updateColorPaletteButtonState(false);
    
    // 선택된 색상 정보 숨기기
    this.hideSelectedColorInfo();
    
    console.log("Color Palette mode deactivated");
  }
  
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
  }
  
  showOtherSections() {
    this.instructionsSection.style.display = 'block';
    this.assetManager.style.display = 'block';
  }
  
  // Color Palette 버튼 상태 업데이트
  updateColorPaletteButtonState(isActive) {
    if (isActive) {
      this.colorPaletteBtn.classList.add('mode-active');
      this.colorPaletteBtn.textContent = '✅ Color Palette';
    } else {
      this.colorPaletteBtn.classList.remove('mode-active');
      this.colorPaletteBtn.textContent = '🎨 Color Palette';
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
    
    // 다른 모드들 종료
    if (this.isColorPaletteMode) {
      this.exitColorPaletteMode();
    }
    
    // UI 표시
    this.showConsoleSection();
    this.hideInstructionsSection();
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
  
  // Console 버튼 상태 업데이트
  updateConsoleButtonState(isActive) {
    if (isActive) {
      this.consoleMonitorBtn.classList.add('mode-active');
      this.consoleMonitorBtn.textContent = '✅ Console';
    } else {
      this.consoleMonitorBtn.classList.remove('mode-active');
      this.consoleMonitorBtn.textContent = '🖥️ Console';
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
        const response = await chrome.tabs.sendMessage(tabs[0].id, { 
          action: "collect_assets" 
        });
        
        if (response.success) {
          this.collectedAssets = response.assets;
          this.displayAssets();
        } else {
          this.assetSummary.textContent = 'Failed to collect assets';
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
}

// SidePanel 클래스의 인스턴스(실제 객체)를 생성합니다
// new 키워드를 사용하면 클래스를 실제로 실행 가능한 객체로 만들어줍니다
// 이렇게 하면 위에서 정의한 모든 함수들이 실행됩니다
new SidePanel();
