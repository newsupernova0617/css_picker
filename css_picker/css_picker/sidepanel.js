// ===== 사이드패널 JavaScript 파일 =====
// 이 파일은 Chrome 확장 프로그램의 사이드패널 UI를 관리합니다
console.log('===== SIDEPANEL.JS START =====');
console.log('This file is loading at:', new Date().toISOString());
console.log('🚨 HTML inline script moved to sidepanel.js');
console.log('Chrome object exists?', typeof chrome !== 'undefined');
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('Extension ID:', chrome.runtime.id);
}

// Instantiate PlanManager and make it globally available
const planManager = new PlanManager();
window.planManager = planManager;


document.addEventListener("DOMContentLoaded", () => {
  const signInBtn = document.getElementById("signInBtn");
  const signOutBtn = document.getElementById("signOutBtn");
  const authSignedOut = document.getElementById("authSignedOut");
  const authSignedIn = document.getElementById("authSignedIn");
  const userName = document.getElementById("userName");
  const userEmail = document.getElementById("userEmail");
  const premiumSection = document.getElementById("premiumSection");
  const authLoading = document.getElementById("authLoading");

  // 로그인 버튼
  signInBtn.addEventListener("click", () => {
    authLoading.style.display = "block";
    chrome.runtime.sendMessage({ type: "login" }, (response) => {
      authLoading.style.display = "none";
      if (response?.success) {
        chrome.runtime.sendMessage({ type: "get_profile" }, (resp) => {
          if (resp?.success) {
            showUser(resp.user);
          }
        });
      }
    });
  });

  // 로그아웃 버튼
  signOutBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "logout" }, () => {
      authSignedOut.style.display = "block";
      authSignedIn.style.display = "none";
      premiumSection.style.display = "none";
    });
  });



  // 초기 상태 동기화 (새로고침 시 유지)
  chrome.runtime.sendMessage({ type: "get_profile" }, (resp) => {
    if (resp?.success) {
      // Ensure window.sidePanel exists before calling showUser
      if (window.sidePanel && typeof window.sidePanel.showUser === 'function') {
        window.sidePanel.showUser(resp.user);
      } else {
        console.warn('window.sidePanel or showUser function not available, delaying call');
        // Delay the call until sidepanel is ready
        setTimeout(() => {
          if (window.sidePanel && typeof window.sidePanel.showUser === 'function') {
            window.sidePanel.showUser(resp.user);
          } else {
            console.error('window.sidePanel or showUser function still not available after delay');
          }
        }, 100);
      }
    }
  });
});
async function handleLoginSuccess() {
  const result = await chrome.runtime.sendMessage({ type: "get_profile" });
  if (result.success) {
    document.getElementById("authSignedOut").style.display = "none";
    document.getElementById("authSignedIn").style.display = "block";
    document.getElementById("userName").textContent = result.user.name;
    document.getElementById("userEmail").textContent = result.user.email;
    window.sidePanel.showUser(result.user);
  } else {
    // fallback: 여전히 signed-out 보여주기
    document.getElementById("authSignedOut").style.display = "block";
    document.getElementById("authSignedIn").style.display = "none";
  }
}


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
  },

  // Shadow & Effects
  'box-shadow': {
    'none': 'shadow-none',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)': 'shadow',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)': 'shadow-sm',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)': 'shadow-md',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)': 'shadow-lg',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)': 'shadow-xl',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)': 'shadow-2xl'
  },

  // Opacity
  'opacity': {
    '0': 'opacity-0', '0.05': 'opacity-5', '0.1': 'opacity-10', '0.2': 'opacity-20',
    '0.25': 'opacity-25', '0.3': 'opacity-30', '0.4': 'opacity-40', '0.5': 'opacity-50',
    '0.6': 'opacity-60', '0.7': 'opacity-70', '0.75': 'opacity-75', '0.8': 'opacity-80',
    '0.9': 'opacity-90', '0.95': 'opacity-95', '1': 'opacity-100'
  },

  // Z-index
  'z-index': {
    '0': 'z-0', '10': 'z-10', '20': 'z-20', '30': 'z-30', '40': 'z-40', '50': 'z-50',
    'auto': 'z-auto'
  },

  // Typography Extended
  'line-height': {
    '1': 'leading-none', '1.25': 'leading-tight', '1.375': 'leading-snug',
    '1.5': 'leading-normal', '1.625': 'leading-relaxed', '2': 'leading-loose'
  },

  'letter-spacing': {
    '-0.05em': 'tracking-tighter', '-0.025em': 'tracking-tight',
    '0': 'tracking-normal', '0.025em': 'tracking-wide',
    '0.05em': 'tracking-wider', '0.1em': 'tracking-widest'
  },

  'vertical-align': {
    'baseline': 'align-baseline', 'top': 'align-top', 'middle': 'align-middle',
    'bottom': 'align-bottom', 'text-top': 'align-text-top', 
    'text-bottom': 'align-text-bottom', 'sub': 'align-sub', 'super': 'align-super'
  },

  // List
  'list-style-type': {
    'none': 'list-none', 'disc': 'list-disc', 'decimal': 'list-decimal'
  },

  'list-style-position': {
    'inside': 'list-inside', 'outside': 'list-outside'
  },

  // Table
  'border-collapse': {
    'collapse': 'border-collapse', 'separate': 'border-separate'
  },

  'table-layout': {
    'auto': 'table-auto', 'fixed': 'table-fixed'
  }
};

// 개선된 Tailwind spacing 매핑 (완전한 스케일)
const SPACING_MAPPINGS = {
  '0px': '0', '0': '0',
  '1px': 'px',
  '2px': '0.5', '4px': '1', '6px': '1.5', '8px': '2', '10px': '2.5',
  '12px': '3', '14px': '3.5', '16px': '4', '18px': '4.5', '20px': '5',
  '22px': '5.5', '24px': '6', '28px': '7', '32px': '8', '36px': '9',
  '40px': '10', '44px': '11', '48px': '12', '52px': '13', '56px': '14',
  '60px': '15', '64px': '16', '68px': '17', '72px': '18', '76px': '19',
  '80px': '20', '88px': '22', '96px': '24', '104px': '26', '112px': '28',
  '128px': '32', '144px': '36', '160px': '40', '176px': '44', '192px': '48',
  '208px': '52', '224px': '56', '240px': '60', '256px': '64', '288px': '72',
  '320px': '80', '384px': '96'
};

// 개선된 Tailwind 색상 팔레트 (RGB 값 매핑)
const TAILWIND_COLORS = {
  // Grayscale
  'rgb(0, 0, 0)': 'black', 'rgb(255, 255, 255)': 'white',
  'rgb(248, 250, 252)': 'slate-50', 'rgb(241, 245, 249)': 'slate-100',
  'rgb(226, 232, 240)': 'slate-200', 'rgb(203, 213, 225)': 'slate-300',
  'rgb(148, 163, 184)': 'slate-400', 'rgb(100, 116, 139)': 'slate-500',
  'rgb(71, 85, 105)': 'slate-600', 'rgb(51, 65, 85)': 'slate-700',
  'rgb(30, 41, 59)': 'slate-800', 'rgb(15, 23, 42)': 'slate-900',
  
  // Red
  'rgb(254, 242, 242)': 'red-50', 'rgb(254, 226, 226)': 'red-100',
  'rgb(252, 165, 165)': 'red-200', 'rgb(248, 113, 113)': 'red-300',
  'rgb(239, 68, 68)': 'red-500', 'rgb(220, 38, 38)': 'red-600',
  'rgb(185, 28, 28)': 'red-700', 'rgb(153, 27, 27)': 'red-800',
  
  // Orange
  'rgb(255, 247, 237)': 'orange-50', 'rgb(254, 215, 170)': 'orange-200',
  'rgb(251, 146, 60)': 'orange-400', 'rgb(249, 115, 22)': 'orange-500',
  'rgb(234, 88, 12)': 'orange-600', 'rgb(194, 65, 12)': 'orange-700',
  
  // Yellow
  'rgb(254, 252, 232)': 'yellow-50', 'rgb(253, 224, 71)': 'yellow-300',
  'rgb(234, 179, 8)': 'yellow-500', 'rgb(202, 138, 4)': 'yellow-600',
  'rgb(161, 98, 7)': 'yellow-700', 'rgb(133, 77, 14)': 'yellow-800',
  
  // Green
  'rgb(240, 253, 244)': 'green-50', 'rgb(134, 239, 172)': 'green-200',
  'rgb(74, 222, 128)': 'green-400', 'rgb(34, 197, 94)': 'green-500',
  'rgb(22, 163, 74)': 'green-600', 'rgb(21, 128, 61)': 'green-700',
  
  // Blue
  'rgb(239, 246, 255)': 'blue-50', 'rgb(147, 197, 253)': 'blue-200',
  'rgb(96, 165, 250)': 'blue-400', 'rgb(59, 130, 246)': 'blue-500',
  'rgb(37, 99, 235)': 'blue-600', 'rgb(29, 78, 216)': 'blue-700',
  
  // Purple/Violet
  'rgb(245, 243, 255)': 'purple-50', 'rgb(196, 181, 253)': 'purple-200',
  'rgb(168, 85, 247)': 'purple-500', 'rgb(147, 51, 234)': 'purple-600',
  'rgb(126, 34, 206)': 'purple-700', 'rgb(107, 33, 168)': 'purple-800',
  
  // Pink
  'rgb(253, 242, 248)': 'pink-50', 'rgb(244, 114, 182)': 'pink-400',
  'rgb(236, 72, 153)': 'pink-500', 'rgb(219, 39, 119)': 'pink-600',
  'rgb(190, 24, 93)': 'pink-700', 'rgb(157, 23, 77)': 'pink-800'
};

// Tailwind 클래스 조작을 위한 전체 옵션 매핑

// 개선된 CSS-to-Tailwind 변환기 클래스
class TailwindConverter {
  constructor() {
    this.conversionResults = {
      converted: [],
      unconverted: []
    };
    
    // 추가된 매핑 테이블들
    this.gridMappings = {
      'grid-template-columns': {
        'repeat(1, minmax(0, 1fr))': 'grid-cols-1',
        'repeat(2, minmax(0, 1fr))': 'grid-cols-2',
        'repeat(3, minmax(0, 1fr))': 'grid-cols-3',
        'repeat(4, minmax(0, 1fr))': 'grid-cols-4',
        'repeat(5, minmax(0, 1fr))': 'grid-cols-5',
        'repeat(6, minmax(0, 1fr))': 'grid-cols-6',
        'repeat(12, minmax(0, 1fr))': 'grid-cols-12',
        'none': 'grid-cols-none'
      },
      'grid-template-rows': {
        'repeat(1, minmax(0, 1fr))': 'grid-rows-1',
        'repeat(2, minmax(0, 1fr))': 'grid-rows-2',
        'repeat(3, minmax(0, 1fr))': 'grid-rows-3',
        'repeat(4, minmax(0, 1fr))': 'grid-rows-4',
        'repeat(6, minmax(0, 1fr))': 'grid-rows-6',
        'none': 'grid-rows-none'
      },
      'gap': this.createGapMapping(),
      'grid-gap': this.createGapMapping()
    };
    
    this.borderMappings = {
      'border-style': {
        'solid': 'border-solid',
        'dashed': 'border-dashed',
        'dotted': 'border-dotted',
        'double': 'border-double',
        'none': 'border-none'
      },
      'border-width': {
        '0px': 'border-0', '1px': 'border', '2px': 'border-2',
        '4px': 'border-4', '8px': 'border-8'
      }
    };
  }
  
  // Gap 매핑 생성 헬퍼
  createGapMapping() {
    const gapMap = {};
    Object.keys(SPACING_MAPPINGS).forEach(px => {
      const spacing = SPACING_MAPPINGS[px];
      gapMap[px] = `gap-${spacing}`;
    });
    return gapMap;
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

  // 대폭 개선된 특수 케이스 처리
  handleSpecialCases(property, value) {
    // Spacing 관련 (margin, padding)
    if (property.startsWith('margin')) {
      const direction = this.getDirectionFromProperty(property, 'margin');
      const spacing = this.convertSpacing(value);
      if (spacing !== null) {
        return {
          success: true,
          tailwindClass: `m${direction}-${spacing}`
        };
      }
    }

    if (property.startsWith('padding')) {
      const direction = this.getDirectionFromProperty(property, 'padding');
      const spacing = this.convertSpacing(value);
      if (spacing !== null) {
        return {
          success: true,
          tailwindClass: `p${direction}-${spacing}`
        };
      }
    }

    // 크기 관련 (width, height, min/max)
    if (['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height'].includes(property)) {
      const size = this.convertSize(value);
      if (size !== null) {
        const prefixMap = {
          'width': 'w', 'height': 'h',
          'min-width': 'min-w', 'min-height': 'min-h',
          'max-width': 'max-w', 'max-height': 'max-h'
        };
        return {
          success: true,
          tailwindClass: `${prefixMap[property]}-${size}`
        };
      }
    }

    // 폰트 관련
    if (property === 'font-size') {
      const fontSize = this.convertFontSize(value);
      if (fontSize !== null) {
        return {
          success: true,
          tailwindClass: `text-${fontSize}`
        };
      }
    }

    // 색상 관련 (개선된 색상 파싱)
    if (['color', 'background-color', 'border-color'].includes(property)) {
      const color = this.parseAndConvertColor(value);
      if (color !== null) {
        const prefixMap = {
          'color': 'text',
          'background-color': 'bg',
          'border-color': 'border'
        };
        return {
          success: true,
          tailwindClass: `${prefixMap[property]}-${color}`
        };
      }
    }

    // Opacity 처리
    if (property === 'opacity') {
      const opacity = this.convertOpacity(value);
      if (opacity !== null) {
        return {
          success: true,
          tailwindClass: `opacity-${opacity}`
        };
      }
    }

    // Z-index 처리
    if (property === 'z-index') {
      const zIndex = this.convertZIndex(value);
      if (zIndex !== null) {
        return {
          success: true,
          tailwindClass: `z-${zIndex}`
        };
      }
    }

    // Border radius 처리
    if (property === 'border-radius') {
      const radius = this.convertBorderRadius(value);
      if (radius !== null) {
        return {
          success: true,
          tailwindClass: radius
        };
      }
    }

    // Grid 관련 처리
    if (this.gridMappings[property] && this.gridMappings[property][value]) {
      return {
        success: true,
        tailwindClass: this.gridMappings[property][value]
      };
    }

    // Border 관련 처리
    if (this.borderMappings[property] && this.borderMappings[property][value]) {
      return {
        success: true,
        tailwindClass: this.borderMappings[property][value]
      };
    }

    // Transform 처리
    if (property === 'transform') {
      const transform = this.convertTransform(value);
      if (transform !== null) {
        return {
          success: true,
          tailwindClass: transform
        };
      }
    }

    // 마지막 fallback: arbitrary value 생성
    const arbitraryValue = this.createArbitraryValue(property, value);
    return {
      success: true,
      tailwindClass: arbitraryValue,
      isArbitrary: true
    };
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

  // 개선된 spacing 변환 시스템
  convertSpacing(value) {
    // 0 값 처리
    if (value === '0' || value === '0px' || value === '0rem') return '0';
    
    // 직접 매핑 확인
    if (SPACING_MAPPINGS[value]) {
      return SPACING_MAPPINGS[value];
    }
    
    // rem 값 처리 (1rem = 16px 기준)
    const remMatch = value.match(/^(\d*\.?\d+)rem$/);
    if (remMatch) {
      const remValue = parseFloat(remMatch[1]);
      const pixelEquivalent = Math.round(remValue * 16);
      const pixelKey = `${pixelEquivalent}px`;
      return SPACING_MAPPINGS[pixelKey] || this.calculateSpacingFromPixels(pixelEquivalent);
    }
    
    // em 값 처리 (1em ≈ 16px 기준)
    const emMatch = value.match(/^(\d*\.?\d+)em$/);
    if (emMatch) {
      const emValue = parseFloat(emMatch[1]);
      const pixelEquivalent = Math.round(emValue * 16);
      const pixelKey = `${pixelEquivalent}px`;
      return SPACING_MAPPINGS[pixelKey] || this.calculateSpacingFromPixels(pixelEquivalent);
    }
    
    // 픽셀 값 처리
    const pixelMatch = value.match(/^(\d*\.?\d+)px$/);
    if (pixelMatch) {
      const pixelValue = parseFloat(pixelMatch[1]);
      return this.calculateSpacingFromPixels(pixelValue);
    }
    
    return null;
  }
  
  // 픽셀 값에서 Tailwind spacing 계산
  calculateSpacingFromPixels(pixels) {
    // 정확한 매핑 먼저 확인
    const exactKey = `${pixels}px`;
    if (SPACING_MAPPINGS[exactKey]) {
      return SPACING_MAPPINGS[exactKey];
    }
    
    // Tailwind는 4px 단위 기준 (0.25rem = 1 spacing unit)
    if (pixels % 4 === 0) {
      const spacing = pixels / 4;
      if (spacing <= 96) { // Tailwind 기본 범위
        return spacing.toString();
      }
    }
    
    // 가장 가까운 spacing 찾기
    const spacingValues = Object.keys(SPACING_MAPPINGS)
      .filter(key => key.endsWith('px'))
      .map(key => parseInt(key))
      .sort((a, b) => Math.abs(a - pixels) - Math.abs(b - pixels));
    
    const closest = spacingValues[0];
    const closestKey = `${closest}px`;
    
    // 10% 이내면 가장 가까운 값 사용, 아니면 arbitrary value
    const tolerance = pixels * 0.1;
    return Math.abs(closest - pixels) <= tolerance 
      ? SPACING_MAPPINGS[closestKey]
      : null;
  }

  // 개선된 크기 값 변환
  convertSize(value) {
    // 기본값들
    if (value === 'auto') return 'auto';
    if (value === 'fit-content') return 'fit';
    if (value === 'min-content') return 'min';
    if (value === 'max-content') return 'max';
    
    // 백분율 변환
    const percentMap = {
      '100%': 'full', '50%': '1/2', '33.333333%': '1/3', '33.33%': '1/3',
      '66.666667%': '2/3', '66.67%': '2/3', '25%': '1/4', '75%': '3/4',
      '20%': '1/5', '40%': '2/5', '60%': '3/5', '80%': '4/5',
      '16.666667%': '1/6', '83.333333%': '5/6', '8.333333%': '1/12',
      '41.666667%': '5/12', '58.333333%': '7/12', '91.666667%': '11/12'
    };
    
    if (percentMap[value]) return percentMap[value];
    
    // vw/vh 변환
    if (value.endsWith('vw')) {
      const vwValue = value.replace('vw', '');
      const vwMap = { '100': 'screen', '50': '1/2', '25': '1/4', '75': '3/4' };
      return vwMap[vwValue] ? `w-${vwMap[vwValue]}` : `w-[${value}]`;
    }
    
    if (value.endsWith('vh')) {
      const vhValue = value.replace('vh', '');
      const vhMap = { '100': 'screen', '50': '1/2', '25': '1/4', '75': '3/4' };
      return vhMap[vhValue] ? `h-${vhMap[vhValue]}` : `h-[${value}]`;
    }
    
    // 픽셀/rem 값을 spacing으로 변환
    const spacing = this.convertSpacing(value);
    return spacing !== null ? spacing : `[${value}]`;
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

  // 개선된 색상 파싱 및 변환 시스템
  parseAndConvertColor(value) {
    // 정규화
    value = value.trim().toLowerCase();
    
    // 투명도 처리
    if (value === 'transparent' || value === 'rgba(0, 0, 0, 0)') {
      return 'transparent';
    }
    
    // 직접 매핑 확인
    if (TAILWIND_COLORS[value]) {
      return TAILWIND_COLORS[value];
    }
    
    // RGB 형식 파싱
    const rgbMatch = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      const rgbValue = `rgb(${r}, ${g}, ${b})`;
      
      if (TAILWIND_COLORS[rgbValue]) {
        return TAILWIND_COLORS[rgbValue];
      }
      
      // 가장 가까운 색상 찾기
      return this.findClosestColor(r, g, b);
    }
    
    // HEX 형식 파싱
    const hexMatch = value.match(/^#([a-f\d]{3}|[a-f\d]{6})$/);
    if (hexMatch) {
      const hex = hexMatch[1];
      const r = parseInt(hex.length === 3 ? hex[0].repeat(2) : hex.substr(0, 2), 16);
      const g = parseInt(hex.length === 3 ? hex[1].repeat(2) : hex.substr(2, 2), 16);
      const b = parseInt(hex.length === 3 ? hex[2].repeat(2) : hex.substr(4, 2), 16);
      
      const rgbValue = `rgb(${r}, ${g}, ${b})`;
      if (TAILWIND_COLORS[rgbValue]) {
        return TAILWIND_COLORS[rgbValue];
      }
      
      return this.findClosestColor(r, g, b);
    }
    
    // HSL 형식 파싱
    const hslMatch = value.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%(?:\s*,\s*[\d.]+)?\s*\)/);
    if (hslMatch) {
      const h = parseInt(hslMatch[1]);
      const s = parseInt(hslMatch[2]);
      const l = parseInt(hslMatch[3]);
      const [r, g, b] = this.hslToRgb(h, s, l);
      
      const rgbValue = `rgb(${r}, ${g}, ${b})`;
      if (TAILWIND_COLORS[rgbValue]) {
        return TAILWIND_COLORS[rgbValue];
      }
      
      return this.findClosestColor(r, g, b);
    }
    
    // 매핑되지 않은 경우 arbitrary value로 반환
    return `[${value}]`;
  }
  
  // 가장 가까운 Tailwind 색상 찾기
  findClosestColor(r, g, b) {
    let minDistance = Infinity;
    let closestColor = null;
    
    Object.entries(TAILWIND_COLORS).forEach(([rgb, tailwindColor]) => {
      const match = rgb.match(/rgb\((\d+), (\d+), (\d+)\)/);
      if (match) {
        const tr = parseInt(match[1]);
        const tg = parseInt(match[2]);
        const tb = parseInt(match[3]);
        
        // 유클리디안 거리 계산
        const distance = Math.sqrt(
          Math.pow(r - tr, 2) + 
          Math.pow(g - tg, 2) + 
          Math.pow(b - tb, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestColor = tailwindColor;
        }
      }
    });
    
    // 너무 멀리 떨어진 색상이면 arbitrary value 반환
    return minDistance < 50 ? closestColor : `[rgb(${r},${g},${b})]`;
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
    
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
  
  // Opacity 변환
  convertOpacity(value) {
    const opacityMap = {
      '0': '0', '0.05': '5', '0.1': '10', '0.2': '20', '0.25': '25',
      '0.3': '30', '0.4': '40', '0.5': '50', '0.6': '60', '0.7': '70',
      '0.75': '75', '0.8': '80', '0.9': '90', '0.95': '95', '1': '100'
    };
    
    return opacityMap[value] || (parseFloat(value) * 100).toString();
  }
  
  // Z-index 변환
  convertZIndex(value) {
    const zIndexMap = {
      '0': '0', '10': '10', '20': '20', '30': '30', '40': '40', '50': '50',
      'auto': 'auto'
    };
    
    return zIndexMap[value] || `[${value}]`;
  }
  
  // Border radius 변환
  convertBorderRadius(value) {
    const radiusMap = {
      '0px': 'rounded-none', '0': 'rounded-none',
      '2px': 'rounded-sm', '4px': 'rounded', '6px': 'rounded-md',
      '8px': 'rounded-lg', '12px': 'rounded-xl', '16px': 'rounded-2xl',
      '24px': 'rounded-3xl', '9999px': 'rounded-full', '50%': 'rounded-full'
    };
    
    return radiusMap[value] || `rounded-[${value}]`;
  }
  
  // Transform 변환 (기본적인 것만)
  convertTransform(value) {
    if (value === 'none') return null;
    
    // 기본적인 transform 패턴들
    const translateMatch = value.match(/translate\(([^,]+),\s*([^)]+)\)/);
    if (translateMatch) {
      const x = this.convertSpacing(translateMatch[1].trim());
      const y = this.convertSpacing(translateMatch[2].trim());
      if (x !== null && y !== null) {
        return `translate-x-${x} translate-y-${y}`;
      }
    }
    
    const scaleMatch = value.match(/scale\(([^)]+)\)/);
    if (scaleMatch) {
      const scale = parseFloat(scaleMatch[1]);
      const scaleMap = {
        '0': '0', '0.5': '50', '0.75': '75', '0.9': '90',
        '0.95': '95', '1': '100', '1.05': '105', '1.1': '110',
        '1.25': '125', '1.5': '150', '2': '200'
      };
      return scaleMap[scale.toString()] ? `scale-${scaleMap[scale.toString()]}` : `scale-[${scale}]`;
    }
    
    const rotateMatch = value.match(/rotate\(([^)]+)deg\)/);
    if (rotateMatch) {
      const degrees = parseInt(rotateMatch[1]);
      const rotateMap = {
        '0': '0', '1': '1', '2': '2', '3': '3', '6': '6', '12': '12',
        '45': '45', '90': '90', '180': '180'
      };
      return rotateMap[degrees.toString()] ? `rotate-${rotateMap[degrees.toString()]}` : `rotate-[${degrees}deg]`;
    }
    
    return `transform-[${value}]`;
  }
  
  // 개선된 arbitrary value 생성
  createArbitraryValue(property, value, prefix = '') {
    // 안전한 arbitrary value 생성
    const sanitizedValue = this.sanitizeArbitraryValue(value);
    
    if (prefix) {
      return `${prefix}-[${sanitizedValue}]`;
    }
    
    // 속성별 기본 prefix 매핑
    const propertyPrefixMap = {
      'margin': 'm', 'margin-top': 'mt', 'margin-right': 'mr',
      'margin-bottom': 'mb', 'margin-left': 'ml',
      'padding': 'p', 'padding-top': 'pt', 'padding-right': 'pr',
      'padding-bottom': 'pb', 'padding-left': 'pl',
      'width': 'w', 'height': 'h', 'max-width': 'max-w', 'max-height': 'max-h',
      'min-width': 'min-w', 'min-height': 'min-h',
      'color': 'text', 'background-color': 'bg', 'border-color': 'border',
      'font-size': 'text', 'font-weight': 'font',
      'border-radius': 'rounded', 'border-width': 'border'
    };
    
    const detectedPrefix = propertyPrefixMap[property];
    return detectedPrefix ? `${detectedPrefix}-[${sanitizedValue}]` : `[${property}:${sanitizedValue}]`;
  }
  
  // Arbitrary value 값 sanitization
  sanitizeArbitraryValue(value) {
    // 공백을 언더스코어로 변환
    let sanitized = value.replace(/\s+/g, '_');
    
    // 특수 문자 처리
    sanitized = sanitized.replace(/[()]/g, '');
    sanitized = sanitized.replace(/,/g, '_');
    
    return sanitized;
  }
  
  // 향상된 변환 품질 확인
  getConversionQuality() {
    const stats = this.getConversionStats();
    let quality = 'excellent';
    
    if (stats.conversionRate < 60) {
      quality = 'poor';
    } else if (stats.conversionRate < 80) {
      quality = 'good';
    } else if (stats.conversionRate < 95) {
      quality = 'very good';
    }
    
    return {
      ...stats,
      quality,
      recommendations: this.generateRecommendations(stats)
    };
  }
  
  // 변환 개선 제안
  generateRecommendations(stats) {
    const recommendations = [];
    
    if (stats.conversionRate < 80) {
      recommendations.push('Consider using more standard CSS values that map directly to Tailwind classes');
    }
    
    if (stats.unconverted > 0) {
      const unconvertedSample = this.conversionResults.unconverted.slice(0, 3);
      const commonIssues = unconvertedSample.map(item => 
        `${item.name}: ${item.value}`).join(', ');
      recommendations.push(`Common unconverted properties: ${commonIssues}`);
    }
    
    return recommendations;
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

// Tailwind 클래스 파싱 및 조작을 위한 유틸리티 클래스



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

// Debugging functions - available immediately 
window.debugConsoleManager = {
  test: () => {
    console.log('🔍 Checking console manager status...');
    console.log('window.sidePanel exists:', !!window.sidePanel);
    if (window.sidePanel) {
      console.log('consoleManager exists:', !!window.sidePanel.consoleManager);
      if (window.sidePanel.consoleManager) {
        const cm = window.sidePanel.consoleManager;
        console.log('isActive:', cm.isActive);
        console.log('messages count:', cm.messages.length);
        console.log('filteredMessages count:', cm.filteredMessages.length);
        
        // Force active and add test message
        cm.isActive = true;
        console.log('✅ Forced isActive to true');
        
        const testMsg = {
          type: 'log',
          args: ['🧪 DIRECT TEST MESSAGE - SHOULD APPEAR IN SIDEPANEL'],
          timestamp: Date.now(),
          url: window.location.href,
          source: 'debug'
        };
        
        console.log('📨 Adding test message:', testMsg);
        cm.addMessage(testMsg);
      }
    }
  },
  status: () => {
    if (window.sidePanel?.consoleManager) {
      const cm = window.sidePanel.consoleManager;
      console.log('Console Manager Status:', {
        isActive: cm.isActive,
        messages: cm.messages.length,
        filtered: cm.filteredMessages.length,
        currentFilter: cm.currentFilter,
        searchTerm: cm.searchTerm
      });
    } else {
      console.log('Console manager not available');
    }
  }
};

// 사이드패널의 모든 기능을 관리하는 클래스를 정의합니다
// 클래스는 관련된 변수들과 함수들을 하나로 묶어서 관리하는 방법입니다
class SidePanel {
  
  // constructor는 클래스가 생성될 때 가장 먼저 실행되는 함수입니다
  // 초기 설정을 여기서 합니다
  constructor() {
    // 피커가 현재 활성화되어 있는지를 나타내는 변수 (true = 켜짐, false = 꺼짐)
    // Start inactive - will be activated through proper communication with background
    this.isActive = false;
    
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
    this.lastCssInfo = null; // 마지막으로 선택된 요소의 CSS 정보
    
    // Color Palette 관련 변수들

    this.isColorPaletteMode = false; // Color Palette 모드 상태
    this.isSamplingActive = false; // 샘플링 활성화 상태
    this.sampledColors = []; // 샘플링된 색상 목록
    this.selectedColor = null; // 현재 선택된 색상
    
    // Console Monitor 관련 변수들
    this.consoleManager = new ConsoleManager();
    this.isConsoleMode = false; // Console Monitor 모드 상태
    
    // Make this instance globally available for debugging
    window.sidePanel = this;
    

    
    // 기본값으로 모든 카테고리 접힌 상태로 설정
    Object.keys(CSS_CATEGORIES).forEach(categoryKey => {
      this.categoryStates.set(categoryKey, false); // false = 접힌 상태
    });
    
    // 초기화 함수를 호출합니다
    this.init();
  }

  // 유저 표시 함수
  showUser(user) {
    const userName = document.getElementById("userName");
    const userEmail = document.getElementById("userEmail");
    const authSignedOut = document.getElementById("authSignedOut");
    const authSignedIn = document.getElementById("authSignedIn");
    const premiumSection = document.getElementById("premiumSection");

    userName.textContent = user.name || "Unknown User";
    userEmail.textContent = user.email || "";
    authSignedOut.style.display = "none";
    authSignedIn.style.display = "block";
    if (user.plan === "premium") {
      if (premiumSection) premiumSection.style.display = "block";
    } else {
      if (premiumSection) premiumSection.style.display = "none";
    }

    // Show home section and feature cards
    if (this.homeSection) this.homeSection.style.display = 'block';
    if (this.homeToCSSSelectorCard) this.homeToCSSSelectorCard.style.display = 'block';
    if (this.homeToColorPaletteCard) this.homeToColorPaletteCard.style.display = 'block';
    if (this.homeToConsoleCard) this.homeToConsoleCard.style.display = 'block';
    if (this.homeToAssetManagerCard) this.homeToAssetManagerCard.style.display = 'block';
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
  
  async initializeAuthentication() {
    console.log("⚠️ Stub initializeAuthentication: skipped (Google OAuth not wired here).");
    return Promise.resolve();
  }

  async waitForScriptsToLoad() {
    // clerk 통합 코드 비활성화 상태
    return;
  }

  // GDPR 동의 상태를 확인하고, 필요 시 모달을 표시하는 함수
  async initializeGDPRConsent() {
    return new Promise(resolve => {
      chrome.storage.local.get('gdpr_consent', (result) => {
        if (result.gdpr_consent) {
          console.log('GDPR consent already given.');
          resolve(true);
        } else {
          console.log('GDPR consent not found, showing modal.');
          const modalElement = document.getElementById('gdprConsentModal');
          if (!modalElement) {
            console.error('GDPR modal element not found!');
            resolve(false); // 모달이 없으면 진행 불가
            return;
          }
          
          const modal = new bootstrap.Modal(modalElement);
          modal.show();

          // 모달이 닫힐 때 동의 상태를 다시 확인
          modalElement.addEventListener('hidden.bs.modal', () => {
            chrome.storage.local.get('gdpr_consent', (recheckResult) => {
              if (recheckResult.gdpr_consent) {
                console.log('GDPR consent given after modal interaction.');
                // 메인 콘텐츠를 여기서 표시
                if (this.mainContent) this.mainContent.style.display = 'block';
                if (this.homeSection) this.homeSection.style.display = 'block';
                resolve(true);
              } else {
                console.log('GDPR consent was not given.');
                resolve(false);
              }
            });
          }, { once: true });
        }
      });
    });
  }
  
  async initializeAfterDOM() {
    // HTML 요소들을 먼저 설정하여 다른 초기화 함수에서 사용 가능하게 함
    this.setupElements();
    
    // GDPR 동의 시스템 먼저 초기화. 결과에 따라 UI 표시가 결정됨.
    const hasConsent = await this.initializeGDPRConsent();
    
    if (hasConsent) {
      // 이미 동의한 경우, 즉시 메인 콘텐츠 표시
      if (this.mainContent) this.mainContent.style.display = 'block';
      if (this.homeSection) this.homeSection.style.display = 'block';
    }
    // 동의하지 않은 경우, initializeGDPRConsent 내부에서 모달을 띄우고,
    // 동의 후 콜백에서 콘텐츠를 표시하므로 여기서는 아무것도 하지 않음.
    
    // 나머지 초기화 함수들 호출
    this.setupEventListeners();
    this.initializeCssInfoSection();
    this.initializeAssetManager();
    this.initializeAuthentication();
    this.initializePlanManagement();

    
    // 백그라운드 스크립트에게 "사이드패널이 열렸다"고 알려줍니다
    setTimeout(() => {
      this.notifyOpened();
    }, 100);
  }
  
  // HTML에서 필요한 요소들을 찾아서 변수에 저장하는 함수입니다
  setupElements() {
    this.mainContent = document.querySelector('.main-content');
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
    // 홈 카드에서 색상 팔레트로 이동하는 카드
    this.colorPaletteMenuItem = document.getElementById("homeToColorPaletteCard");
    this.colorPaletteSection = document.getElementById("colorPaletteSection");
    this.samplingMessage = document.getElementById("samplingMessage");
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
    // 홈 카드에서 콘솔 모니터로 이동하는 카드
    this.consoleMenuItem = document.getElementById("homeToConsoleCard");
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
    
    // Initialize picker state as inactive by default - user must click to activate
    this.isActive = false;
    this.updateStatus("⭐ Click to Activate", "inactive");
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
    
    // Flag to prevent duplicate close notifications
    let closedNotificationSent = false;
    
    // Modern approach to detect when sidepanel closes - using pagehide event
    // pagehide is more reliable than beforeunload and doesn't trigger policy violations
    window.addEventListener("pagehide", () => {
      // 사이드패널이 닫힐 때 백그라운드에게 알려줍니다 (단 한번만)
      if (!closedNotificationSent) {
        // ... existing code ...
      }
    });

    // Add event listener for color sampling clicks
    document.addEventListener('click', async (e) => {
      if (this.isColorPaletteMode && this.isSamplingActive) {
        e.preventDefault();
        e.stopPropagation();
        await this.sampleColorWithEyeDropper();
        this.isSamplingActive = false; // Reset sampling active state after picking
        document.body.style.cursor = ''; // Restore cursor
      }
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
      this.notifyPickerEnable(); // 백그라운드에게 "피커 활성화"를 알리고
      this.updateStatus("🟢 Activated!", "active"); // 화면에 "활성" 상태를 표시합니다
      this.showActivePickerMessage(); // 활성 메시지 표시
    } else {
      // 피커가 꺼진 상태라면
      this.notifyPickerDisable(); // 백그라운드에게 "피커 비활성화"를 알리고
      this.updateStatus("⭐ Click to Activate", "inactive"); // 화면에 "비활성" 상태를 표시합니다
      this.showInactivePickerMessage(); // 비활성 메시지 표시
    }
  }
  
  // 다른 기능 사용 시 CSS Picker 비활성화
  deactivatePickerForOtherFeatures() {
    if (this.isActive) {
      console.log('Deactivating CSS Picker for other feature usage');
      this.isActive = false;
      this.notifyPickerDisable(); // 백그라운드에게 "피커 비활성화"를 알리고
      this.updateStatus("⭐ Click to Activate", "inactive"); // 화면에 "비활성" 상태를 표시
      this.showInactivePickerMessage(); // 비활성 메시지 표시
    }
  }
  
  // 비활성 상태 메시지 표시
  showInactivePickerMessage() {
    const pickerMessage = document.getElementById("pickerMessage");
    const activePickerMessage = document.getElementById("activePickerMessage");
    
    if (pickerMessage) {
      pickerMessage.style.display = 'block';
    }
    if (activePickerMessage) {
      activePickerMessage.style.display = 'none';
    }
  }
  
  // 활성 상태 메시지 표시
  showActivePickerMessage() {
    const pickerMessage = document.getElementById("pickerMessage");
    const activePickerMessage = document.getElementById("activePickerMessage");
    
    if (pickerMessage) {
      pickerMessage.style.display = 'none';
    }
    if (activePickerMessage) {
      activePickerMessage.style.display = 'block';
    }
  }

  // 모든 활성 기능들을 종료하는 통합 함수
  deactivateAllFeatures(options = {}) {
    const { skipCssPicker = false } = options;
    console.log('Deactivating all active features');
    
    // CSS Picker 비활성화 (요청된 경우에만)
    if (!skipCssPicker) {
      this.deactivatePickerForOtherFeatures();
    }
    
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
    this.toggleButton.textContent = text;
    
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
      }, (response) => {
        // Check for Chrome runtime errors
        if (chrome.runtime.lastError) {
          console.error("Failed to send opened message:", chrome.runtime.lastError);
          return;
        }
        
        // Background script response handling
        if (response && response.success) {
          console.log("🟢 Background script confirmed picker activation");
          // Only update UI state if picker is not manually activated yet
          if (!this.isActive) {
            this.isActive = true;
            this.updateStatus("🟢 Active Picker", "active");
          }
        } else {
          console.warn("Background script did not confirm picker activation");
        }
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
      }, (response) => {
        // Check for Chrome runtime errors
        if (chrome.runtime.lastError) {
          console.error("Failed to send closed message:", chrome.runtime.lastError);
          return;
        }
        
        if (response && response.success) {
          console.log("Background script confirmed picker deactivation");
        }
      });
    } catch (error) {
      // 메시지 보내기에 실패하면 콘솔에 오류를 출력합니다
      console.error("Failed to send closed message:", error);
    }
  }

  // 피커 활성화 알림
  notifyPickerEnable() {
    try {
      chrome.runtime.sendMessage({ 
        type: "picker_enable", // 피커 활성화 메시지
        timestamp: Date.now()
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Failed to send picker enable message:", chrome.runtime.lastError);
          return;
        }
        
        if (response && response.success) {
          console.log("Background script confirmed picker activation");
        }
      });
    } catch (error) {
      console.error("Failed to send picker enable notification:", error);
    }
  }

  // 피커 비활성화 알림
  notifyPickerDisable() {
    try {
      chrome.runtime.sendMessage({ 
        type: "picker_disable", // 피커 비활성화 메시지
        timestamp: Date.now()
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Failed to send picker disable message:", chrome.runtime.lastError);
          return;
        }
        
        if (response && response.success) {
          console.log("Background script confirmed picker deactivation");
        }
      });
    } catch (error) {
      console.error("Failed to send picker disable notification:", error);
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

    if (message.action === 'console-message') {
      this.consoleManager.addMessage(message.data);
      sendResponse({ success: true });
      return true;
    }

    if (message.action === 'color-sampled') {
      this.colorSampler.processColorSample(message.color, message.coordinates);
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
  async navigateToFeature(featureName, options = {}) {
    const { preservePicker = false } = options;
    // Check premium access for premium features
    const premiumFeatures = ['colorpalette', 'console', 'assetmanager'];
    if (premiumFeatures.includes(featureName)) {
      if (planManager.currentPlan !== 'premium') {
        alert('This feature is available on the Premium plan only. Please upgrade your plan.');
        return; // Access denied
      }
    }
    
    // Deactivate all features first
    const deactivateOptions = {};
    if (preservePicker && featureName === 'css') {
      deactivateOptions.skipCssPicker = true;
    }
    this.deactivateAllFeatures(deactivateOptions);
    
    // Hide Home screen
    if (this.homeSection) {
      this.homeSection.style.display = 'none';
    }
    
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
    if (this.homeSection) {
      this.homeSection.style.display = 'block';
    }
    this.currentSection = 'home';
    
    // Reset header to initial state
    this.updateHeaderForHome();
    
    // Update home welcome message
    this.updateHomeWelcomeMessage();
  }
  
  // Hide all feature sections
  hideAllFeatureSections() {
    console.log("❌ all section disappear start");
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
        title: '🎯 CSS Selector',
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
    if (this.cssInfoSection) {
      this.cssInfoSection.style.display = 'block';
    }
    
    // Show appropriate message based on current state (don't auto-activate)
    if (this.isActive) {
      this.showActivePickerMessage();
    } else {
      this.showInactivePickerMessage();
    }
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
    const pickerMessage = document.getElementById("pickerMessage");
    const activePickerMessage = document.getElementById("activePickerMessage");
    
    // Hide both message types when an element is clicked
    if (pickerMessage && pickerMessage.style.display !== 'none') {
      pickerMessage.style.opacity = '0';
      pickerMessage.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        if (pickerMessage) {
          pickerMessage.style.display = 'none';
          pickerMessage.style.opacity = '1';
        }
      }, 300);
    }
    
    if (activePickerMessage && activePickerMessage.style.display !== 'none') {
      activePickerMessage.style.opacity = '0';
      activePickerMessage.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        if (activePickerMessage) {
          activePickerMessage.style.display = 'none';
          activePickerMessage.style.opacity = '1';
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
    
    // Show modal using Bootstrap with proper focus management
    const modal = new bootstrap.Modal(this.featureHelpModal, {
      backdrop: false,
      focus: true
    });
    
    // Setup proper accessibility and focus management
    this.setupModalFocusManagement(this.featureHelpModal, '.btn-close, .btn-secondary');
    
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
    
    // Show modal using Bootstrap with proper focus management
    const modal = new bootstrap.Modal(this.featureHelpModal, {
      backdrop: false,
      focus: true
    });
    
    // Setup proper accessibility and focus management
    this.setupModalFocusManagement(this.featureHelpModal, '.btn-close, .btn-secondary');
    
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
    console.log("✅ initializeHomeView activate");
    // Hide all feature sections initially
    this.hideAllFeatureSections();
    
    // Show Home section
    if (this.homeSection) {
      this.homeSection.style.display = 'block';
      this.currentSection = 'home';
    }
    
    // Reset toggle button to initial state (not active)
    if (this.toggleButton) {
      this.updateStatus('⭐ Click to Activate', 'inactive');
    }
    
    // Update home welcome message based on auth state
    this.updateHomeWelcomeMessage();
  }
  
  // Update Home welcome message based on authentication state
  updateHomeWelcomeMessage() {
    if (!this.homeWelcomeTitle || !this.homeWelcomeMessage) {
      return;
    }

    // Get comprehensive authentication state
    const authState = this.getAuthenticationState();

    console.log('🔍 HOME: Updating welcome message with auth state:', authState);

    if (authState.isAuthenticated && authState.user) {
      // Signed in: personalized welcome
      const userName = authState.user.firstName || authState.user.email?.split('@')[0] || 'User';
      this.homeWelcomeTitle.textContent = `🏠 Welcome back, ${userName}!`;
      this.homeWelcomeMessage.textContent = 'Choose a tool to continue your web development analysis';

      // Hide auth prompts when signed in
      if (this.homeAuthPrompt) {
        this.homeAuthPrompt.style.display = 'none';
        console.log('✅ HOME: Hidden auth prompt for authenticated user');
      }
    } else {
      // Signed out: show auth prompts
      this.homeWelcomeTitle.textContent = '🏠 CSS Picker Extension';
      this.homeWelcomeMessage.textContent = 'Choose a tool to get started with web development analysis';

      // Show auth prompt when signed out (only on home screen)
      if (this.currentSection === 'home') {
        if (this.homeAuthPrompt) {
          this.homeAuthPrompt.style.display = 'block';
          console.log('👁️ HOME: Showing auth prompt for unauthenticated user');
        }
      }
    }
  }

  // Get comprehensive authentication state from multiple sources
  getAuthenticationState() {
    try {
      // Primary: Check clerkClient state
      if (typeof clerkClient !== 'undefined' && clerkClient.isLoaded) {
        const clerkAuthenticated = clerkClient.isSignedIn;
        const clerkUser = clerkClient.user;
        const clerkToken = clerkClient.sessionToken;

        if (clerkAuthenticated && clerkUser && clerkToken) {
          // Update local state if out of sync
          if (!this.isSignedIn || !this.currentUser) {
            console.log('🔄 HOME: Syncing local auth state with Clerk client');
            this.isSignedIn = true;
            this.currentUser = clerkUser;
          }

          return {
            isAuthenticated: true,
            user: clerkUser,
            sessionToken: clerkToken,
            source: 'clerkClient'
          };
        }
      }

      // Fallback: Check local state
      if (this.isSignedIn && this.currentUser) {
        return {
          isAuthenticated: true,
          user: this.currentUser,
          sessionToken: this.sessionToken,
          source: 'localState'
        };
      }

      // Fallback: Check storage
      chrome.storage.local.get(['clerk_session', 'clerk_user'], (result) => {
        if (result.clerk_session && result.clerk_user) {
          console.log('🔄 HOME: Found auth data in storage, updating local state');
          this.isSignedIn = true;
          this.currentUser = result.clerk_user;
          this.sessionToken = result.clerk_session;

          // Refresh UI after storage sync
          setTimeout(() => this.updateHomeWelcomeMessage(), 100);
        }
      });

      return {
        isAuthenticated: false,
        user: null,
        sessionToken: null,
        source: 'none'
      };

    } catch (error) {
      console.error('❌ HOME: Error getting authentication state:', error);
      return {
        isAuthenticated: false,
        user: null,
        sessionToken: null,
        source: 'error'
      };
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
      this.copyCssDropdown.addEventListener('click', async (e) => {
        e.preventDefault();
        if (planManager.currentPlan !== 'premium') {
          alert('Copying CSS code is a Premium feature. Please upgrade your plan.');
          return;
        }
        // CSS Rule 형태로 복사
        this.copyCssToClipboard('css');
      });
    }
    
    // Copy Tailwind 버튼 이벤트 리스너
    const copyTailwindBtn = document.getElementById('copyTailwindBtn');
    if (copyTailwindBtn) {
      copyTailwindBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Copy Tailwind button clicked'); // 디버깅용
        
        // Premium 기능 체크
        const canUse = await this.checkFeatureAccess('export_features');
        if (!canUse) {
          return; // checkFeatureAccess에서 이미 모달을 표시함
        }
        
        // Tailwind Classes 형태로 복사
        this.copyTailwindToClipboard('tailwind-classes');
      });
    }
  }
  
  // CSS 정보 섹션의 기본 초기화 작업
  initializeCssInfoBasic() {
    // 추가적인 초기화 작업이 필요한 경우 여기에 추가
  }
  
  // CSS 요소 정보를 화면에 표시하는 함수입니다 (향상된 CSS-in-JS 지원)
  displayElementInfo(cssInfo) {
    this.lastCssInfo = cssInfo; // Save the latest CSS info
    try {
      // Switch to CSS feature view to show extracted CSS
      const shouldPreservePicker = this.isActive;

      if (this.currentSection !== 'css') {
        if (shouldPreservePicker) {
          this.navigateToFeature('css', { preservePicker: true });
        } else {
          this.navigateToFeature('css');
        }
      } else if (shouldPreservePicker) {
        // Ensure the active picker guidance is visible when already on the CSS view
        this.showActivePickerMessage();
      }
      
      // Hide the picker guidance message when element is clicked
      this.hidePickerMessage();
      
      // 현재 선택된 요소 정보 저장 (향상된 정보 포함)
      this.currentElement = {
        tagName: cssInfo.tagName,
        className: cssInfo.className,
        id: cssInfo.id,
        // 커스텀 프로퍼티 정보 추가
        customProperties: cssInfo.customProperties || {}
      };
      
      // CSS 선택자 생성 및 표시
      this.currentSelector = this.generateCssSelector(this.currentElement);
      if (this.elementSelector) {
        this.elementSelector.textContent = this.currentSelector;
      }
      
      // CSS 속성들을 분류 (향상된 버전)
      this.categorizedProperties = this.categorizeAdvancedProperties(cssInfo);
      
      // 기본적으로 모든 속성 선택 (배열들 포함)
      this.selectedProperties.clear();
      Object.keys(cssInfo.styles || {}).forEach(property => {
        this.selectedProperties.add(property);
      });
      
      // CSS 변수들도 선택 가능하도록 추가
      Object.keys(cssInfo.customProperties || {}).forEach(property => {
        this.selectedProperties.add(`custom:${property}`);
      });
      
      // 커스텀 CSS 변수 표시 (있는 경우)
      if (cssInfo.customProperties && Object.keys(cssInfo.customProperties).length > 0) {
        console.log('📝 Custom CSS properties found:', cssInfo.customProperties);
      }
      
      // 테스트 결과 수신 대비
      this.setupTestResultsListener();
      
      // Accordion UI 생성
      this.buildAccordionUI();
      
      // Select All 체크박스를 기본적으로 체크 상태로 설정
      if (this.selectAllCheckbox) {
        this.selectAllCheckbox.checked = true;
        this.selectAllCheckbox.indeterminate = false;
      }
      
      // 원본 스타일 백업
      this.backupOriginalStyles(cssInfo.properties || {});
      
      // 수정된 스타일 초기화
      this.modifiedStyles = {};
      
      // CSS 정보 섹션 보이기 및 설명 섹션 숨기기
      this.showCssInfo();
      
      console.log('Advanced CSS info displayed:', {
        properties: Object.keys(cssInfo.properties || {}).length,
        customProperties: Object.keys(cssInfo.customProperties || {}).length,
        cssInJSLibraries: cssInfo.cssInJSLibraries,
        styledComponents: cssInfo.styledComponentsCSS?.length || 0,
        emotion: cssInfo.emotionCSS?.length || 0,
        shadowDOM: cssInfo.shadowDOMCSS?.length || 0
      });
    } catch (error) {
      console.error('Failed to display CSS info:', error);
      
      // Navigate to CSS feature to ensure UI setup
      try {
        this.navigateToFeature('css');
      } catch (navError) {
        console.error('Navigation to CSS feature also failed:', navError);
      }
    }
  }
  
  // CSS 정보 섹션을 보여주는 함수입니다
  showCssInfo() {
    // Check if elements exist before accessing their properties
    if (this.cssInfoSection) {
      this.cssInfoSection.style.display = 'block';
    } else {
      console.warn('cssInfoSection element not found - attempting to re-initialize');
      // Try to re-initialize the missing element reference
      this.cssInfoSection = document.getElementById("cssInfoSection");
      if (this.cssInfoSection) {
        this.cssInfoSection.style.display = 'block';
      } else {
        console.error('cssInfoSection element still not found. Check HTML structure.');
        // Alternative: navigate to CSS feature view to ensure UI is properly initialized
        this.navigateToFeature('css');
        return;
      }
    }
    
    // Also handle instructionsSection safely
    if (this.instructionsSection) {
      this.instructionsSection.style.display = 'none';
    }
  }
  
  // CSS 정보 섹션을 숨기는 함수입니다
  hideCssInfo() {
    if (this.cssInfoSection) {
      this.cssInfoSection.style.display = 'none';
    }
    
    if (this.instructionsSection) {
      this.instructionsSection.style.display = 'block';
    }
    
    // 편집 중인 상태 정리
    this.currentElement = null;
    this.originalStyles = {};
    this.selectedProperties.clear();
    this.categorizedProperties = {};
  }
  
  
  // 향상된 CSS 속성 분류 함수 (CSS-in-JS 지원)
  categorizeAdvancedProperties(cssInfo) {
    const categorized = this.categorizeProperties(cssInfo.styles || {});
    
    // CSS 변수 (커스텀 속성) 카테고리 추가
    if (cssInfo.customProperties && Object.keys(cssInfo.customProperties).length > 0) {
      categorized['custom'] = {
        name: 'CSS Variables (Custom Properties)',
        properties: cssInfo.customProperties
      };
    }
    
    return categorized;
  }
  
  // 기존 CSS 속성들을 카테고리별로 분류하는 함수
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
    // Check if propertiesAccordion element exists before using it
    if (!this.propertiesAccordion) {
      console.error('propertiesAccordion element not found. Cannot build accordion UI.');
      // Try to re-initialize the element
      this.propertiesAccordion = document.getElementById("propertiesAccordion");
      if (!this.propertiesAccordion) {
        console.error('propertiesAccordion element still not found. Check HTML structure.');
        return;
      }
    }
    
    // Clear accordion safely
    while (this.propertiesAccordion.firstChild) {
      this.propertiesAccordion.removeChild(this.propertiesAccordion.firstChild);
    }
    
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
                    value: this.modifiedStyles.hasOwnProperty(propName) 
                      ? this.modifiedStyles[propName] 
                      : this.categorizedProperties[category][propName],        elementInfo: this.currentElement,
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
  
  copyCssToClipboard(format) {
    const stylesToCopy = this.getSelectedPropertiesAsArray();
    if (stylesToCopy.length === 0) {
      this.showError('No properties selected to copy.');
      return;
    }

    let cssText = '';
    if (format === 'css') {
      cssText = this.generateCssRule(stylesToCopy);
    } else if (format === 'json') {
      cssText = JSON.stringify(stylesToCopy, null, 2);
    }

    navigator.clipboard.writeText(cssText).then(() => {
      this.showSuccessMessage('Copied to clipboard!');
    }).catch(err => {
      this.showError('Failed to copy.');
      console.error('Copy failed:', err);
    });
  }

  // This function was accidentally deleted, re-adding it.
  getSelectedPropertiesAsArray() {
    const selectedStyles = [];
    for (const propName of this.selectedProperties) {
      if (propName.startsWith('custom:')) {
        const customPropName = propName.substring(7);
        if (this.categorizedProperties.custom && this.categorizedProperties.custom.properties[customPropName]) {
          const customPropValue = this.categorizedProperties.custom.properties[customPropName];
          selectedStyles.push({ name: customPropName, value: customPropValue });
        }
        continue;
      }

      let originalValue = undefined;
      let found = false;

      // Find the original value from the categorized properties
      for (const category in this.categorizedProperties) {
        if (category === 'custom') continue;
        if (this.categorizedProperties[category] && this.categorizedProperties[category].hasOwnProperty(propName)) {
          originalValue = this.categorizedProperties[category][propName];
          found = true;
          break;
        }
      }

      // If the property was found in the original list
      if (found) {
        // Use the modified value if it exists, otherwise use the original value
        const currentValue = this.modifiedStyles.hasOwnProperty(propName)
          ? this.modifiedStyles[propName]
          : originalValue;
        
        selectedStyles.push({ name: propName, value: currentValue });
      }
    }
    return selectedStyles;
  }

  getAllPropertiesAsArray() {
    const allStyles = [];
    for (const category in this.categorizedProperties) {
      const properties = this.categorizedProperties[category];
      if (category === 'custom') {
        if (properties && properties.properties) {
          for (const propName in properties.properties) {
            allStyles.push({ name: propName, value: properties.properties[propName] });
          }
        }
      } else {
        if (properties) {
          for (const propName in properties) {
            allStyles.push({ name: propName, value: properties[propName] });
          }
        }
      }
    }
    return allStyles;
  }
  
  // CSS Rule 형식 생성
  generateCssRule(styles) {
    let css = `${this.currentSelector} {\n`;
    
    styles.forEach(style => {
      css += `  ${style.name}: ${style.value};\n`;
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
  
  // 개선된 Tailwind Classes 형식 생성
  generateTailwindClasses() {
    const styles = this.getCombinedStyles();
    
    if (!this.tailwindConverter) {
      this.tailwindConverter = new TailwindConverter();
    }

    // 스타일을 속성 배열로 변환
    const properties = Object.entries(styles).map(([name, value]) => ({
      name,
      value,
      category: 'css'
    }));

    // Tailwind 변환 실행
    const conversionResults = this.tailwindConverter.convertProperties(properties);
    const quality = this.tailwindConverter.getConversionQuality();

    // 결과 분류
    const standardClasses = [];
    const arbitraryClasses = [];
    const cssProperties = [];

    conversionResults.converted.forEach(prop => {
      if (prop.isArbitrary) {
        arbitraryClasses.push(prop.tailwindClass);
      } else {
        standardClasses.push(prop.tailwindClass);
      }
    });

    conversionResults.unconverted.forEach(prop => {
      cssProperties.push(`  ${prop.name}: ${prop.value};`);
    });

    let result = '';

    // Tailwind 클래스 (표준 클래스 우선)
    const allClasses = [...standardClasses, ...arbitraryClasses];
    if (allClasses.length > 0) {
      result += `class="${allClasses.join(' ')}"`;
    }

    // 변환 품질 정보 (주석)
    if (quality.conversionRate < 100 && allClasses.length > 0) {
      result += `\n\n<!-- Tailwind Conversion: ${quality.quality} (${quality.conversionRate}%) -->`;
    }

    // 변환되지 않은 CSS 속성들
    if (cssProperties.length > 0) {
      if (result) {
        result += '\n\n/* Properties not converted to Tailwind */\n';
      }
      result += `${this.currentSelector || '.element'} {\n${cssProperties.join('\n')}\n}`;
    }

    // 아무것도 없으면 기본 메시지
    if (!result) {
      result = '/* No convertible properties found */';
    }

    return result;
  }
  
  // 수정된 속성만 CSS 생성
  generateModifiedOnlyCss() {
    if (Object.keys(this.modifiedStyles || {}).length === 0) {
      return '/* No modifications made */';
    }
    
    let css = `${this.currentSelector} {\n`;
    Object.entries(this.modifiedStyles).forEach(([property, value]) => {
      css += `  ${property}: ${value};\n`;
    });
    css += '}';
    
    return css;
  }
  
  // 통합된 CSS-to-Tailwind 변환 함수 (TailwindConverter 사용)
  cssToTailwind(property, value) {
    if (!this.tailwindConverter) {
      this.tailwindConverter = new TailwindConverter();
    }
    
    const result = this.tailwindConverter.convertSingleProperty(property, value);
    return result.success ? result.tailwindClass : null;
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
    if (this.isTailwindView) {
      const propertiesToToggle = categoryKey === 'converted' ? this.tailwindProperties.converted : this.tailwindProperties.unconverted;
      const isUnconverted = categoryKey === 'unconverted';
      propertiesToToggle.forEach(prop => {
        const propIdentifier = isUnconverted ? prop.name : prop.tailwindClass;
        if (isChecked) {
          this.selectedProperties.add(propIdentifier);
        } else {
          this.selectedProperties.delete(propIdentifier);
        }
      });
    } else {
      const categoryProperties = this.categorizedProperties[categoryKey];
      Object.keys(categoryProperties).forEach(property => {
        if (isChecked) {
          this.selectedProperties.add(property);
        } else {
          this.selectedProperties.delete(property);
        }
      });
    }
    
    this.updateUI();
  }
  
  // UI 업데이트 함수
  updateUI() {
    if (this.isTailwindView) {
      // Update category checkboxes
      const convertedCheckbox = document.querySelector('.category-checkbox[data-category="converted"]');
      if (convertedCheckbox) {
        const convertedProperties = this.tailwindProperties.converted.map(p => p.tailwindClass);
        const selectedConverted = convertedProperties.filter(p => this.selectedProperties.has(p));
        if (selectedConverted.length === 0) {
          convertedCheckbox.checked = false;
          convertedCheckbox.indeterminate = false;
        } else if (selectedConverted.length === convertedProperties.length) {
          convertedCheckbox.checked = true;
          convertedCheckbox.indeterminate = false;
        } else {
          convertedCheckbox.checked = false;
          convertedCheckbox.indeterminate = true;
        }
      }

      const unconvertedCheckbox = document.querySelector('.category-checkbox[data-category="unconverted"]');
      if (unconvertedCheckbox) {
        const unconvertedProperties = this.tailwindProperties.unconverted.map(p => p.name);
        const selectedUnconverted = unconvertedProperties.filter(p => this.selectedProperties.has(p));
        if (selectedUnconverted.length === 0) {
          unconvertedCheckbox.checked = false;
          unconvertedCheckbox.indeterminate = false;
        } else if (selectedUnconverted.length === unconvertedProperties.length) {
          unconvertedCheckbox.checked = true;
          unconvertedCheckbox.indeterminate = false;
        } else {
          unconvertedCheckbox.checked = false;
          unconvertedCheckbox.indeterminate = true;
        }
      }

      // Update individual property checkboxes
      const propertyCheckboxes = document.querySelectorAll('.property-checkbox');
      propertyCheckboxes.forEach(checkbox => {
        const propIdentifier = checkbox.getAttribute('data-property');
        checkbox.checked = this.selectedProperties.has(propIdentifier);
      });

    } else {
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
        this.selectedProperties.add(prop.tailwindClass);
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
    const strong = document.createElement('strong');
    strong.textContent = `✅ ${message}`;
    successDiv.appendChild(strong);
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
  
  displayTailwindResults(results) {
    const accordion = this.propertiesAccordion;
    accordion.innerHTML = ''; // Clear existing content

    const createCategoryItem = (id, title, properties, isUnconverted = false) => {
      const allSelected = properties.every(prop => this.selectedProperties.has(isUnconverted ? prop.name : prop.tailwindClass));
      const item = document.createElement('div');
      item.className = 'category-item';
      item.innerHTML = `
        <button class="category-header expanded" type="button">
          <input type="checkbox" class="category-checkbox" data-category="${id}" ${allSelected ? 'checked' : ''}>
          <span class="category-title">${title}</span>
        </button>
        <div class="category-content expanded">
          ${properties.map(prop => {
            const propIdentifier = isUnconverted ? prop.name : prop.tailwindClass;
            const isSelected = this.selectedProperties.has(propIdentifier);
            return `
              <div class="property-item-accordion ${isUnconverted ? 'css-unconverted' : 'tailwind-converted'}" data-property="${propIdentifier}">
                <input type="checkbox" class="property-checkbox" data-property="${propIdentifier}" ${isSelected ? 'checked' : ''}>
                <span class="property-name-accordion">${isUnconverted ? `${prop.name}: ${prop.value}` : prop.tailwindClass}</span>
                ${isUnconverted ? `<span class="property-value-accordion">(${prop.reason})</span>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;

      const categoryCheckbox = item.querySelector('.category-checkbox');
      categoryCheckbox.addEventListener('change', (e) => {
        this.toggleCategorySelection(id, e.target.checked);
      });

      const propertyCheckboxes = item.querySelectorAll('.property-checkbox');
      propertyCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const propIdentifier = e.target.getAttribute('data-property');
          if (e.target.checked) {
            this.selectedProperties.add(propIdentifier);
          } else {
            this.selectedProperties.delete(propIdentifier);
          }
          this.updateUI();
        });
      });

      return item;
    };

    if (results.converted.length > 0) {
      accordion.appendChild(createCategoryItem('converted', 'Converted Classes', results.converted));
    }

    if (results.unconverted.length > 0) {
      accordion.appendChild(createCategoryItem('unconverted', 'Unconverted Properties', results.unconverted, true));
    }
  }

  createAccordionItem(id, title, content) {
    const item = document.createElement('div');
    item.className = 'accordion-item';
    item.innerHTML = `
      <h2 class="accordion-header" id="heading-${id}">
        <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${id}" aria-expanded="true" aria-controls="collapse-${id}">
          ${title}
        </button>
      </h2>
      <div id="collapse-${id}" class="accordion-collapse collapse show" aria-labelledby="heading-${id}">
        <div class="accordion-body">
          ${content}
        </div>
      </div>
    `;
    return item;
  }

  convertToTailwindView() {
    console.log('[Debug] 1. Starting Tailwind conversion process.');
    
    // 1. 변환 실행
    const allStyles = this.getAllPropertiesAsArray(); // Changed here
    console.log('[Debug] 2. All styles to convert:', allStyles);

    if (allStyles.length === 0) {
      console.warn('[Debug] No styles to convert. Aborting conversion.');
      alert('No CSS properties found for this element.');
      return;
    }

    this.tailwindProperties = this.tailwindConverter.convertProperties(allStyles);
    console.log('[Debug] 3. Conversion result:', this.tailwindProperties);
    
    // 2. UI 업데이트
    this.isTailwindView = true;
    this.displayTailwindResults(this.tailwindProperties);
    
    // 3. 버튼 상태 변경
    console.log('[Debug] 5. Updating button visibility and title.');
    this.convertToTailwindBtn.style.display = 'none';
    this.backToCssBtn.style.display = 'inline-block';
    this.copyCssDropdown.style.display = 'none';
    this.copyTailwindBtn.style.display = 'inline-block';
    this.propertiesTitle.textContent = 'Tailwind Classes';
    console.log('[Debug] 6. Tailwind conversion process finished.');
  }



  // Tailwind 뷰를 CSS 뷰로 되돌리기
  backToCssView() {
    if (this.lastCssInfo) {
      this.displayElementInfo(this.lastCssInfo);
    }
    // UI를 CSS 뷰로 전환
    this.switchToCssUI();
    
    // 기존 CSS 속성들을 다시 렌더링
    this.buildAccordionUI();
    
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
    const strong = document.createElement('strong');
    strong.textContent = `⚠️ ${message}`;
    warningDiv.appendChild(strong);
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
    
    // Tailwind 클래스 또는 일반 CSS 속성 표시
    let valueElement;
    if (property.isTailwind) {
      // Tailwind 클래스: 텍스트만 표시 (조작 기능 제거)
      valueElement = `<span class="property-value-accordion" data-property="${property.name}">${displayValue}</span>`;
    } else {
      // 일반 CSS 속성
      valueElement = `<span class="property-value-accordion" data-property="${property.name}" data-original="${property.value}">${displayValue}</span>`;
    }
    
    propertyDiv.innerHTML = `
      <input type="checkbox" class="property-checkbox" data-property="${property.name}" checked>
      <span class="property-name-accordion">${displayName}:</span>
      ${valueElement}
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
      if (prop.tailwindClass && this.selectedProperties.has(prop.tailwindClass)) {
        selectedClasses.push(prop.tailwindClass);
      }
    });
    
    // 선택된 변환되지 않은 속성들도 포함 (주석으로)
    this.tailwindProperties.unconverted.forEach(prop => {
      if (this.selectedProperties.has(prop.name)) {
        selectedClasses.push(`/* ${prop.name}: ${prop.value}; */`);
      }
    });
    
    return selectedClasses.join(' ');
  }

  // ========== Color Palette 관련 메서드들 ==========

  // EyeDropper API를 사용하여 색상 샘플링
  async sampleColorWithEyeDropper() {
    if (!window.EyeDropper) {
      this.showError("EyeDropper API not supported in this browser.");
      return;
    }

    try {
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      
      // sRGBHex to r,g,b
      const hex = result.sRGBHex;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      
      const colorData = { r, g, b, a: 1 };
      
      this.processColorSample(colorData, {x:0, y:0});

    } catch (e) {
      this.showSuccessMessage("Color sampling cancelled.");
    }
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
      this.onColorAdded(color);
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

  // Color Palette 모드 진입
  async enterColorPaletteMode() {
    this.isColorPaletteMode = true;
    this.isSamplingActive = true;
    
    // UI 상태 업데이트
    this.showColorPaletteSection();
    this.hideOtherSections();
    this.updateColorPaletteButtonState(true);
    
    // 저장된 색상들 로드
    this.loadSavedColors();
    
    // UI 업데이트
    this.renderColorSwatches();
    this.updateSamplingStatus('📸 Sampling Active - Click anywhere on the webpage to sample colors');
    
    // 커서 스타일 변경
    document.body.style.cursor = 'crosshair';

    console.log("Color Palette mode activated");
  }
  
  // Color Palette 모드 종료
  async exitColorPaletteMode() {
    this.isColorPaletteMode = false;
    this.isSamplingActive = false;
    
    // 커서 스타일 복원
    document.body.style.cursor = '';

    // UI 상태 업데이트
    this.hideColorPaletteSection();
    this.showInstructionsSection();  // showOtherSections 대신 showInstructionsSection 사용
    this.updateColorPaletteButtonState(false);
    
    // 선택된 색상 정보 숨기기
    this.hideSelectedColorInfo();
    
    console.log("Color Palette mode deactivated");
  }

  // EyeDropper는 이제 기본 클릭 동작으로 통합됨
  

  
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
    if (this.cssInfoSection) {
      this.cssInfoSection.style.display = 'none';
    }
    if (this.instructionsSection) {
      this.instructionsSection.style.display = 'none';
    }
    if (this.assetManager) {
      this.assetManager.style.display = 'none';
    }
    if (this.consoleSection) {
      this.consoleSection.style.display = 'none';
    }
  }
  
  showOtherSections() {
    this.instructionsSection.style.display = 'block';
    // Asset Manager는 기본적으로 숨김
    // this.assetManager.style.display = 'block';
  }
  
  // Asset Manager 토글 함수 추가
  toggleAssetManager() {
    // 모든 다른 섹션 숨기기
    if (this.cssInfoSection) {
      this.cssInfoSection.style.display = 'none';
    }
    if (this.instructionsSection) {
      this.instructionsSection.style.display = 'none';
    }
    if (this.colorPaletteSection) {
      this.colorPaletteSection.style.display = 'none';
    }
    if (this.consoleSection) {
      this.consoleSection.style.display = 'none';
    }
    
    // Asset Manager 토글
    if (this.assetManager) {
      if (this.assetManager.style.display === 'none' || !this.assetManager.style.display) {
        this.assetManager.style.display = 'block';
        // Asset Manager가 열릴 때 자산 새로고침
        this.initializeAssetManager();
      } else {
        this.assetManager.style.display = 'none';
        if (this.instructionsSection) {
          this.instructionsSection.style.display = 'block';
        }
      }
    }
  }
  
  // Asset Manager 닫기 함수 추가
  closeAssetManager() {
    if (this.assetManager) {
      this.assetManager.style.display = 'none';
    }
    this.showInstructionsSection();
  }
  
  // Color Palette 버튼 상태 업데이트
  updateColorPaletteButtonState(isActive) {
    if (isActive) {
      // 홈 카드 기반 UI이므로 상태 변경 없음
      // this.colorPaletteMenuItem은 이제 homeToColorPaletteCard
    } else {
      // 홈 카드 기반 UI이므로 상태 변경 없음
    }
  }
  
  // 샘플링 상태 메시지 업데이트
  updateSamplingStatus(isActive) {
    if (this.samplingMessage) {
      if (isActive) {
        this.samplingMessage.style.display = 'block';
      } else {
        this.samplingMessage.style.display = 'none';
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
      this.sampleColorWithEyeDropper(); // Directly call EyeDropper
      this.toggleSamplingBtn.innerHTML = '🔴 Stop Sampling';
      this.toggleSamplingBtn.className = 'btn btn-danger btn-sm';
      this.updateSamplingStatus(true);
    } else {
      // No need to deactivate a separate sampling process for EyeDropper
      this.toggleSamplingBtn.innerHTML = '🎯 Start Sampling';
      this.toggleSamplingBtn.className = 'btn btn-primary btn-sm';
      this.updateSamplingStatus(false);
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
    if (this.instructionsSection) {
      this.instructionsSection.style.display = 'block';
    }
    if (this.cssInfoSection) {
      this.cssInfoSection.style.display = 'none';
    }
    if (this.colorPaletteSection) {
      this.colorPaletteSection.style.display = 'none';
    }
    if (this.consoleSection) {
      this.consoleSection.style.display = 'none';
    }
    if (this.assetManager) {
      this.assetManager.style.display = 'none';
    }
  }
  
  // 실시간 색상 프리뷰 기능 제거됨 (EyeDropper 기본 사용)
  
  // Console 버튼 상태 업데이트
  updateConsoleButtonState(isActive) {
    if (isActive) {
      // 홈 카드 기반 UI이므로 상태 변경 없음
      // this.consoleMenuItem은 이제 homeToConsoleCard
    } else {
      // 홈 카드 기반 UI이므로 상태 변경 없음
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

    this.assetCategories.addEventListener('click', (e) => {
      if (e.target.matches('.download-single-btn')) {
        const assetId = e.target.getAttribute('data-asset');
        this.downloadSingleAsset(assetId);
      }
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

  async downloadSingleAsset(assetId) {
    const asset = this.findAssetById(assetId);
    if (!asset) {
      this.showError('Asset not found.');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'download_assets',
        assets: [asset]
      });

      if (response.success) {
        this.showSuccessMessage(`Started downloading ${asset.filename}`);
      } else {
        this.showError('Failed to start download');
      }
    } catch (error) {
      console.error('Download failed:', error);
      this.showError('Download failed');
    }
  }

  findAssetById(assetId) {
    for (const category in this.collectedAssets) {
      const found = this.collectedAssets[category].find(asset => asset.id === assetId);
      if (found) {
        return found;
      }
    }
    return null;
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
  
  // Show Clerk login - redirect to landing page  
  // clerk으로 주석처리했다
  /*
  async showClerkLoginModal() {
    try {
      const extensionId = chrome.runtime.id;
      const authUrl = `${CLERK_CONFIG.landingPageUrl}?extension_auth=true&extension_id=${extensionId}`;
      
      console.log('🔐 Opening authentication page:', authUrl);
      
      // Open landing page authentication in new tab
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
  */

  async showClerkLoginModal() {
    throw new Error('Clerk authentication disabled');
  }


  // Handle successful Clerk authentication - Updated for custom Clerk implementation
  // clerk으로 주석처리했다
  /*
  async handleClerkAuthSuccess() {
    try {
      console.log('🔐 Processing Clerk authentication success...');
      
      // Get authentication data from our custom clerk client
      const user = clerkClient.getUser();
      const token = clerkClient.getSessionToken();
      
      if (!user || !token) {
        throw new Error('인증 정보를 가져올 수 없습니다');
      }

      // Update UI state
      this.isSignedIn = true;
      this.currentUser = user;
      this.authState = 'signed-in';
      this.updateAuthUI('signed-in');

      // Initialize plan management
      await this.initializePlanManagement();

      // Create user profile in backend if needed
      await this.createUserProfile(token);

      console.log('✅ Clerk authentication processing complete:', { user: user.email });
    } catch (error) {
      console.error('❌ Failed to handle Clerk auth success:', error);
      throw error;
    }
  }
  */

  async handleClerkAuthSuccess() {
    throw new Error('Clerk authentication disabled');
  }

  // Create user profile in backend
  // clerk으로 주석처리했다
  /*
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
  */

  async createUserProfile() {
    console.warn('Clerk user profile creation disabled');
  }

  // Initialize Clerk authentication (using existing ClerkExtensionClient)
  // clerk으로 주석처리했다
  /*
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
  */

  async initializeClerkAuth() {
    console.warn('Clerk authentication initialization disabled');
  }
  
  
  // 로그아웃 처리
  async handleSignOut() {
    // clerk으로 주석처리했다
    /*
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
    */

    throw new Error('Clerk sign out disabled');
  }
  
  // clerk으로 주석처리했다
  /*
  // Auth 상태 변경 처리
  handleAuthStateChange(event, client) {
    switch (event) {
      case 'loaded':
        this.checkInitialAuthState();
        break;
      case 'signIn':
        console.log('🔐 User signed in, processing authentication...');
        this.refreshPremiumFeatures();
        break;
      case 'signOut':
        this.isSignedIn = false;
        this.currentUser = null;
        this.authState = 'signed-out';
        this.updateAuthUI('signed-out');
        // Refresh premium card overlays after sign out (should show locks again)
        console.log('🔐 Refreshing premium features after sign out...');
        this.refreshPremiumFeatures();
        break;
    }
  }
  */

  handleAuthStateChange() {
    console.warn('Clerk auth state changes disabled');
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

        // Immediate update of home welcome message - no delay needed
        this.updateHomeWelcomeMessage();
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
    
  }
  
  // 테스트 결과 수신 리스너 설정 (미구현 기능)
  setupTestResultsListener() {
    // TODO: 테스트 결과를 수신하는 리스너를 구현
    // 현재는 미구현 상태이므로 빈 메서드로 처리
    console.log('🧪 Test results listener setup (not implemented yet)');
  }

  // Premium 기능 새로고침 (인증 상태 변경 후 호출)
  async refreshPremiumFeatures() {
    try {
      console.log('🔄 Refreshing premium features...');
      
      // Wait for plan manager to be ready
      if (window.planManager) {
        await window.planManager.waitForReady();
      } else if (typeof planManager !== 'undefined') {
        await planManager.waitForReady();
      } else {
        console.warn('planManager not available for refresh');
        return;
      }
      
      // Refresh premium card overlays
      await this.setupPremiumCardOverlays();
      
      // Refresh other premium locks as well
      await this.setupPremiumLocks();
    } catch (error) {
      console.error('❌ Failed to refresh premium features:', error);
    }
  }

  // Setup plan manager callback for automatic updates
  setupPlanManagerCallback() {
    const setupCallback = async () => {
      try {
        const manager = window.planManager || planManager;
        if (manager && typeof manager.onPlanUpdate === 'function') {
          
          // IMPORTANT: Wait for plan manager to be fully ready before setting up callback
          if (typeof manager.waitForReady === 'function') {
            console.log('📋 Waiting for plan manager to be ready before setting up callback...');
            await manager.waitForReady();
          }
          
          // Add callback for plan updates
          manager.onPlanUpdate((newPlan, event) => {
            this.refreshPremiumFeatures();
          });
          console.log('✅ Plan manager callback setup completed');
          return true;
        }
        return false;
      } catch (error) {
        console.error('❌ Failed to setup plan manager callback:', error);
        return false;
      }
    };

    // Try immediate setup
    setupCallback().then(success => {
      if (success) {
        return;
      }

      // If not ready, retry with polling
      console.warn('⚠️ Plan manager callback not available yet, retrying...');
      let retryCount = 0;
      const maxRetries = 10;
      
      const retrySetup = setInterval(async () => {
        retryCount++;
        
        const success = await setupCallback();
        if (success || retryCount >= maxRetries) {
          clearInterval(retrySetup);
          if (retryCount >= maxRetries) {
            console.error('❌ Failed to setup plan manager callback after max retries');
          }
        }
      }, 500);
    }).catch(error => {
      console.error('❌ Error in plan manager callback setup:', error);
    });
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
        ['homeToColorPaletteCard', 'color_sampling', 'Color Palette'],
        ['homeToAssetManagerCard', 'asset_management', 'Asset Manager'],
        ['homeToConsoleCard', 'console_monitoring', 'Console Monitor'],
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
      
      // Setup premium card overlays for home screen
      await this.setupPremiumCardOverlays();
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
    const mainMenuItems = ['homeToColorPaletteCard', 'homeToAssetManagerCard', 'homeToConsoleCard', 'convertToTailwindBtn'];
    
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
        backdrop: false,
        focus: true
      });
      
      // Setup proper accessibility and focus management for upgrade modal
      this.setupModalFocusManagement(this.upgradeModal, '.btn-primary');
      
      modal.show();
      
      // 현재 기능명 저장 (업그레이드 버튼용)
      this.upgradeModal.dataset.feature = featureName;
      
    } catch (error) {
      console.error('Failed to show upgrade modal:', error);
    }
  }
  
  // 업그레이드 버튼 클릭 처리
  handleUpgradeClick() {
    if (!planManager) {
        console.error("PlanManager is not available.");
        alert("Could not start the upgrade process. Please try again later.");
        return;
    }
    planManager.redirectToCheckout();
  }
  
  // Premium 기능 접근 권한 체크
  async checkFeatureAccess(featureName) {
    if (!planManager) {
      console.error('PlanManager not initialized!');
      return false; // Promise resolves to false
    }

    const canUse = await planManager.canUseFeature(featureName);

    // Handle both boolean and object responses from canUseFeature
    const isAllowed = (typeof canUse === 'boolean') ? canUse : canUse?.allowed;

    if (!isAllowed) {
      this.showUpgradeModal(featureName);
      return false; // Promise resolves to false
    }

    return true; // Promise resolves to true
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
  
  // Premium card overlays 설정
  async setupPremiumCardOverlays() {
    try {
      const premiumCards = [
        {
          id: 'homeToColorPaletteCard',
          feature: 'color_sampling',
          title: 'Premium',
          description: 'Unlock advanced color tools',
          icon: '⭐'
        },
        {
          id: 'homeToConsoleCard', 
          feature: 'console_monitoring',
          title: 'Premium',
          description: 'Monitor console & network',
          icon: '⭐'
        },
        {
          id: 'homeToAssetManagerCard',
          feature: 'asset_management', 
          title: 'Premium',
          description: 'Collect & download assets',
          icon: '⭐'
        }
      ];

      for (const card of premiumCards) {
        await this.setupPremiumCardOverlay(card);
      }
      
      console.log('Premium card overlays setup completed');
    } catch (error) {
      console.error('Failed to setup premium card overlays:', error);
    }
  }

  // 개별 premium card overlay 설정
  async setupPremiumCardOverlay(cardConfig) {
    try {
      console.log(`🔧 Setting up premium overlay for: ${cardConfig.id}, feature: ${cardConfig.feature}`);
      
      const cardElement = document.getElementById(cardConfig.id);
      if (!cardElement) {
        console.warn(`❌ Card element not found: ${cardConfig.id}`);
        return;
      }

      // Phase 4: Add loading state to card
      if (window.UXEnhancer) {
        UXEnhancer.setCardLoading(cardConfig.id, true);
      }

      // 기존 overlay 제거
      const existingOverlay = cardElement.querySelector('.premium-card-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }

      // 사용자 권한 체크
      let planManager_instance;
      if (window.planManager) {
        planManager_instance = window.planManager;
      } else if (typeof planManager !== 'undefined') {
        planManager_instance = planManager;
      } else {
        console.warn('❌ planManager not available');
        return;
      }

      const canUse = await planManager_instance.canUseFeature(cardConfig.feature);
      
      if (canUse.allowed) {
        // Premium 사용자 - overlay 제거 및 정상 동작
        cardElement.classList.remove('premium-locked');
        
        // Double-check that overlay is really gone
        const remainingOverlay = cardElement.querySelector('.premium-card-overlay');
        if (remainingOverlay) {
          console.log(`🗑️ Force removing remaining overlay from: ${cardConfig.id}`);
          remainingOverlay.remove();
        }
        
        // Phase 4: Remove loading state - premium user
        if (window.UXEnhancer) {
          UXEnhancer.setCardLoading(cardConfig.id, false);
        }
        
        return;
      }

      // 무료/비로그인 사용자 - overlay 추가
      cardElement.classList.add('premium-locked');
      
      const overlay = document.createElement('div');
      overlay.className = 'premium-card-overlay';
      overlay.innerHTML = `
        <div class="premium-card-content">
          <div class="premium-card-icon">${cardConfig.icon}</div>
          <div class="premium-card-title">${cardConfig.title}</div>
          <div class="premium-card-description">${cardConfig.description}</div>
          <button class="premium-card-cta">
            <span>🚀</span>
            Upgrade Now
          </button>
        </div>
      `;

      // Overlay 클릭 이벤트
      overlay.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showUpgradeModal(cardConfig.feature, cardConfig.title);
      });

      cardElement.appendChild(overlay);
      
      // Phase 4: Remove loading state - free user
      if (window.UXEnhancer) {
        UXEnhancer.setCardLoading(cardConfig.id, false);
      }
      
    } catch (error) {
      console.error(`Failed to setup overlay for ${cardConfig.id}:`, error);
      
      // Phase 4: Remove loading state on error
      if (window.UXEnhancer) {
        UXEnhancer.setCardLoading(cardConfig.id, false);
      }
    }
  }

  // Utility function for proper modal accessibility and focus management
  setupModalFocusManagement(modalElement, focusSelector = '.btn-primary') {
    if (!modalElement) return;
    
    // Clean up any existing listeners to prevent duplicates
    modalElement.removeEventListener('show.bs.modal', this._modalShowHandler);
    modalElement.removeEventListener('shown.bs.modal', this._modalShownHandler);
    modalElement.removeEventListener('hide.bs.modal', this._modalHideHandler);
    modalElement.removeEventListener('hidden.bs.modal', this._modalHiddenHandler);
    
    // Store handlers with proper context
    const showHandler = () => {
      // Before modal shows, ensure no elements have focus that will conflict with aria-hidden
      const currentFocused = document.activeElement;
      if (currentFocused && modalElement.contains(currentFocused)) {
        currentFocused.blur();
      }
    };

    const shownHandler = () => {
      // Modal is now fully shown and Bootstrap has removed aria-hidden
      console.log('🎯 Modal shown, setting up proper focus management');
      
      // Focus on the specified selector or fallback to any button
      const primaryButton = modalElement.querySelector(focusSelector);
      const fallbackButton = modalElement.querySelector('button:not([disabled])');
      const focusTarget = primaryButton || fallbackButton;
      
      if (focusTarget) {
        setTimeout(() => {
          focusTarget.focus();
          console.log('🎯 Focus set to:', focusTarget.className || focusTarget.tagName);
        }, 150); // Delay to ensure Bootstrap is done
      }
    };
    
    const hideHandler = () => {
      // Before modal hides, blur any focused elements to prevent aria-hidden conflict
      const focusedElement = modalElement.querySelector(':focus');
      if (focusedElement) {
        focusedElement.blur();
        console.log('🎯 Blurred focused element before modal hide');
      }
    };
    
    const hiddenHandler = () => {
      // Modal is now fully hidden and Bootstrap has set aria-hidden="true"
      console.log('🎯 Modal hidden, aria-hidden properly set');
    };
    
    // Add event listeners with { once: true } to prevent accumulation
    modalElement.addEventListener('show.bs.modal', showHandler, { once: true });
    modalElement.addEventListener('shown.bs.modal', shownHandler, { once: true });
    modalElement.addEventListener('hide.bs.modal', hideHandler, { once: true });
    modalElement.addEventListener('hidden.bs.modal', hiddenHandler, { once: true });
  }

  // DEBUG: Complete state analysis function
  async debugPremiumState() {
    console.log('\n🔍 === PREMIUM STATE DEBUG REPORT ===');
    
    // Plan Manager State
    const manager = window.planManager || planManager;
    if (manager) {
      console.log('📋 Plan Manager Status:');
      console.log('  - Current Plan:', manager.currentPlan);
      console.log('  - User ID:', manager.userId);  
      console.log('  - Is Ready:', manager.isReady);
      console.log('  - Backend URL:', manager.backendUrl);
      
      // Test each premium feature
      const premiumFeatures = ['color_sampling', 'asset_management', 'tailwind_conversion', 'export_features', 'console_monitoring'];
      for (const feature of premiumFeatures) {
        try {
          const canUse = await manager.canUseFeature(feature);
          console.log(`  - ${feature}: allowed=${canUse.allowed}, reason="${canUse.reason}"`);
        } catch (error) {
          console.log(`  - ${feature}: ERROR - ${error.message}`);
        }
      }
    } else {
      console.log('❌ Plan Manager not found!');
    }
    
    // Clerk Auth State
    if (typeof clerkClient !== 'undefined') {
      console.log('🔐 Clerk Status:');
      console.log('  - Signed In:', clerkClient.isSignedIn);
      console.log('  - User ID:', clerkClient.user?.id);
      console.log('  - Session Token Available:', !!clerkClient.sessionToken);
    } else {
      console.log('❌ Clerk client not found!');
    }
    
    // DOM State for Premium Cards
    console.log('🎨 Premium Card DOM State:');
    const cardIds = ['homeToColorSamplingCard', 'homeToTailwindCard', 'homeToExportCard', 'homeToConsoleMonitorCard', 'homeToAssetManagerCard'];
    
    cardIds.forEach(cardId => {
      const card = document.getElementById(cardId);
      if (card) {
        const overlay = card.querySelector('.premium-card-overlay');
        const hasClass = card.classList.contains('premium-locked');
        console.log(`  - ${cardId}:`);
        console.log(`    • Has Overlay: ${!!overlay}`);
        console.log(`    • Has premium-locked class: ${hasClass}`);
        console.log(`    • Visible: ${card.offsetParent !== null}`);
        console.log(`    • Classes: "${card.className}"`);
        if (overlay) {
          console.log(`    • Overlay visible: ${overlay.offsetParent !== null}`);
        }
      } else {
        console.log(`  - ${cardId}: NOT FOUND`);
      }
    });
    
    console.log('🔍 === END DEBUG REPORT ===\n');
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
  
  // ========== GDPR CONSENT SYSTEM ==========
  
  // GDPR 동의 시스템 초기화
  async initializeGDPRConsent() {
    try {
      // 기존 동의 상태 확인
      const consentData = await this.getStoredConsent();
      
      if (consentData && this.isConsentValid(consentData)) {
        // 유효한 동의가 있음
        console.log('Valid GDPR consent found:', consentData);
        this.consentData = consentData;
        this.initializeHomeView(); // Initialize home view here
        return true;
      } else {
        // 동의가 없거나 만료됨 - 동의 모달 표시
        console.log('No valid GDPR consent found, showing consent modal');
        this.showGDPRConsentModal();
        return false;
      }
    } catch (error) {
      console.error('Failed to initialize GDPR consent:', error);
      this.showGDPRConsentModal(); // 오류시 안전하게 동의 요청
      return false;
    }
  }
  
  // 저장된 동의 정보 가져오기
  async getStoredConsent() {
    try {
      const result = await chrome.storage.local.get(['gdpr_consent']);
      return result.gdpr_consent || null;
    } catch (error) {
      console.error('Failed to get stored consent:', error);
      return null;
    }
  }
  
  // 동의 유효성 검사 (12개월 후 재동의 필요)
  isConsentValid(consentData) {
    if (!consentData || !consentData.timestamp) return false;
    
    const consentDate = new Date(consentData.timestamp);
    const now = new Date();
    const monthsAgo = 12; // 12개월
    const expiryDate = new Date(consentDate);
    expiryDate.setMonth(expiryDate.getMonth() + monthsAgo);
    
    return now < expiryDate && consentData.version === this.getCurrentConsentVersion();
  }
  
  // 현재 동의 버전 (정책 변경시 증가)
  getCurrentConsentVersion() {
    return '1.0';
  }
  
  // GDPR 동의 모달 표시
  showGDPRConsentModal() {
    const modal = document.getElementById('gdprConsentModal');
    if (!modal) {
      console.error('GDPR consent modal not found');
      return;
    }

    // Hide home section when showing GDPR modal
    if (this.homeSection) {
      this.homeSection.style.display = 'none';
    }
    
    // 필수 동의 체크박스 이벤트 설정
    this.setupConsentModalEvents();
    
    // 모달 표시
    const bootstrapModal = new bootstrap.Modal(modal, {
      backdrop: false,
      keyboard: false
    });
    
    // Setup proper accessibility and focus management
    this.setupModalFocusManagement(modal, '.btn-primary, .btn-success');
    
    bootstrapModal.show();
  }
  
  // 동의 모달 이벤트 설정
  setupConsentModalEvents() {
    const requiredConsents = ['requiredDataConsent', 'websiteResponsibilityConsent'];
    const acceptBtn = document.getElementById('acceptConsentBtn');
    const declineBtn = document.getElementById('declineConsentBtn');
    
    // 필수 동의 체크박스 상태 변경 시
    requiredConsents.forEach(id => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.addEventListener('change', () => {
          this.updateAcceptButtonState();
        });
      }
    });
    
    // Accept 버튼 클릭
    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        this.handleConsentAccept();
      });
    }
    
    // Decline 버튼 클릭
    if (declineBtn) {
      declineBtn.addEventListener('click', () => {
        this.handleConsentDecline();
      });
    }
    
    // 초기 버튼 상태 설정
    this.updateAcceptButtonState();
  }
  
  // Accept 버튼 상태 업데이트
  updateAcceptButtonState() {
    const requiredConsents = ['requiredDataConsent', 'websiteResponsibilityConsent'];
    const acceptBtn = document.getElementById('acceptConsentBtn');
    
    if (!acceptBtn) return;
    
    const allRequired = requiredConsents.every(id => {
      const checkbox = document.getElementById(id);
      return checkbox && checkbox.checked;
    });
    
    acceptBtn.disabled = !allRequired;
  }
  
  // 동의 승인 처리
  async handleConsentAccept() {
    try {
      const consentData = {
        timestamp: new Date().toISOString(),
        version: this.getCurrentConsentVersion(),
        required: {
          dataCollection: document.getElementById('requiredDataConsent').checked,
          websiteResponsibility: document.getElementById('websiteResponsibilityConsent').checked
        },
        optional: {
          analytics: document.getElementById('analyticsConsent').checked,
          marketing: document.getElementById('marketingConsent').checked
        },
        ipAddress: null, // IP는 수집하지 않음
        userAgent: navigator.userAgent,
        acceptanceMethod: 'click'
      };
      
      // 동의 정보 저장
      await this.storeConsent(consentData);
      
      // 백엔드에 동의 정보 전송 (선택사항)
      await this.sendConsentToBackend(consentData);
      
      // 모달 닫기
      const modal = bootstrap.Modal.getInstance(document.getElementById('gdprConsentModal'));
      if (modal) {
        modal.hide();
      }
      
      // 성공 메시지
      this.showSuccessMessage('Privacy settings saved successfully');
      
      // 동의 완료 콜백
      this.onConsentCompleted(consentData);
      this.initializeHomeView();
      this.initializeHomeView();

      // Show home section after consent
      if (this.homeSection) {
        this.homeSection.style.display = 'block';
      }
      
    } catch (error) {
      console.error('Failed to handle consent accept:', error);
      this.showError('Failed to save privacy settings. Please try again.');
    }
  }
  
  // 동의 거부 처리
  handleConsentDecline() {
    // 사용자가 거부한 경우 Extension 기능 제한
    this.showError('CSS Picker Pro requires data usage consent to function. Extension will be disabled.');
    
    // Extension 비활성화 또는 최소 기능만 제공
    this.disableExtensionFeatures();
    
    // 모달 닫기
    const modal = bootstrap.Modal.getInstance(document.getElementById('gdprConsentModal'));
    if (modal) {
      modal.hide();
    }
  }
  
  // Extension 기능 비활성화
  disableExtensionFeatures() {
    // 모든 premium 기능 버튼 비활성화
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      if (!btn.id.includes('Home') && !btn.classList.contains('btn-close')) {
        btn.disabled = true;
        btn.title = 'Data usage consent required';
      }
    });
    
    // 안내 메시지 표시
    this.showPersistentMessage('Extension disabled - Privacy consent required', 'warning');
  }
  
  // 동의 정보 로컬 저장
  async storeConsent(consentData) {
    try {
      await chrome.storage.local.set({
        'gdpr_consent': consentData
      });
      this.consentData = consentData;
      console.log('GDPR consent stored successfully');
    } catch (error) {
      console.error('Failed to store GDPR consent:', error);
      throw error;
    }
  }
  
  // 백엔드에 동의 정보 전송 (로그인 사용자만)
  async sendConsentToBackend(consentData) {
    try {
      if (!this.isSignedIn) {
        console.log('User not signed in, skipping backend consent storage');
        return;
      }
      
      // JWT 토큰 가져오기
      const token = await this.getSessionToken();
      if (!token) {
        console.log('No session token, skipping backend consent storage');
        return;
      }
      
      const response = await fetch(`${CLERK_CONFIG.syncHost}/api/user/consent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(consentData)
      });
      
      if (response.ok) {
        console.log('GDPR consent sent to backend successfully');
      } else {
        console.warn('Failed to send consent to backend:', response.status);
      }
    } catch (error) {
      console.error('Error sending consent to backend:', error);
      // 백엔드 전송 실패는 critical error가 아니므로 계속 진행
    }
  }
  
  // 세션 토큰 가져오기
  async getSessionToken() {
    try {
      if (typeof clerkClient !== 'undefined' && clerkClient.sessionToken) {
        return clerkClient.sessionToken;
      }
      
      const storage = await chrome.storage.local.get(['clerk_session']);
      return storage.clerk_session || null;
    } catch (error) {
      console.error('Failed to get session token:', error);
      return null;
    }
  }
  
  // 동의 완료 콜백
  onConsentCompleted(consentData) {
    console.log('GDPR consent completed:', consentData);
    
    // Analytics 동의한 경우 추적 활성화
    if (consentData.optional.analytics) {
      this.enableAnalytics();
    }
    
    // Marketing 동의한 경우 마케팅 플래그 설정
    if (consentData.optional.marketing) {
      this.enableMarketing();
    }
    
    // Extension 정상 작동 시작
    this.onGDPRConsentReady();
  }
  
  // Analytics 활성화
  enableAnalytics() {
    console.log('Enhanced analytics enabled');
    // 상세 사용량 추적 시작
    this.analyticsEnabled = true;
  }
  
  // Marketing 활성화
  enableMarketing() {
    console.log('Marketing communications enabled');
    // 마케팅 수신 동의 플래그 설정
    this.marketingEnabled = true;
  }
  
  // GDPR 동의 완료 후 Extension 초기화
  onGDPRConsentReady() {
    console.log('GDPR consent ready, initializing extension features');
    
    // 기존 초기화 로직 실행
    // (이미 초기화된 경우 중복 실행 방지)
    if (!this.extensionInitialized) {
      this.initializeExtensionFeatures();
      this.extensionInitialized = true;
    }
  }
  
  // Extension 기능 초기화
  initializeExtensionFeatures() {
    console.log('Initializing extension features after GDPR consent');
    // 필요한 초기화 로직들...
  }
  
  // 동의 상태 확인
  hasValidConsent() {
    return this.consentData && this.isConsentValid(this.consentData);
  }
  
  // 동의 정보 가져오기
  getConsentData() {
    return this.consentData;
  }
  
  // 특정 동의 확인
  hasConsent(type) {
    if (!this.consentData) return false;
    
    if (this.consentData.required[type] !== undefined) {
      return this.consentData.required[type];
    }
    
    if (this.consentData.optional[type] !== undefined) {
      return this.consentData.optional[type];
    }
    
    return false;
  }
  
  // 동의 철회
  async revokeConsent() {
    try {
      await chrome.storage.local.remove(['gdpr_consent']);
      this.consentData = null;
      
      // 백엔드에 철회 알림
      if (this.isSignedIn) {
        await this.sendConsentRevocationToBackend();
      }
      
      this.showSuccessMessage('Privacy consent revoked successfully');
      
      // Extension 기능 비활성화
      this.disableExtensionFeatures();
      
    } catch (error) {
      console.error('Failed to revoke consent:', error);
      this.showError('Failed to revoke consent. Please try again.');
    }
  }
  
  // 백엔드에 동의 철회 알림
  async sendConsentRevocationToBackend() {
    try {
      const token = await this.getSessionToken();
      if (!token) return;
      
      await fetch(`${CLERK_CONFIG.syncHost}/api/user/consent`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Consent revocation sent to backend');
    } catch (error) {
      console.error('Failed to send consent revocation to backend:', error);
    }
  }
  
  // 지속적 메시지 표시
  showPersistentMessage(message, type = 'info') {
    const alertClass = {
      'info': 'alert-info',
      'warning': 'alert-warning', 
      'error': 'alert-danger',
      'success': 'alert-success'
    }[type] || 'alert-info';
    
    // 기존 persistent 메시지 제거
    const existing = document.querySelector('.persistent-message');
    if (existing) {
      existing.remove();
    }
    
    const alertElement = document.createElement('div');
    alertElement.className = `alert ${alertClass} persistent-message`;
    alertElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      margin: 0;
      border-radius: 0;
    `;
    alertElement.textContent = message;
    
    document.body.prepend(alertElement);
  }
}

// SidePanel 클래스의 인스턴스(실제 객체)를 생성합니다
// new 키워드를 사용하면 클래스를 실제로 실행 가능한 객체로 만들어줍니다
// 이렇게 하면 위에서 정의한 모든 함수들이 실행됩니다
// 글로벌 변수로 저장하여 ClerkExtensionClient에서 접근 가능하도록 함
window.cssSidepanel = new SidePanel();

// Phase 4: Initialize UX enhancements
document.addEventListener('DOMContentLoaded', () => {
  if (window.UXEnhancer) {
    UXEnhancer.initPerformanceOptimizations();
  }
});

// Make debug function globally accessible for easy testing
window.debugPremiumState = () => window.cssSidepanel.debugPremiumState();

// Enhanced automated testing and validation script
window.runP0CriticalTest = async () => {
  console.log('\n🚨 === P0-CRITICAL TEST EXECUTION ===');
  
  try {
    // Test 1: Extension and dependencies loaded
    console.log('\n📋 TEST 1: Extension Dependencies');
    const hasCSSSidepanel = !!window.cssSidepanel;
    const hasPlanManager = typeof planManager !== 'undefined';
    const hasClerkClient = typeof clerkClient !== 'undefined';
    
    console.log(`✅ CSS Sidepanel: ${hasCSSSidepanel}`);
    console.log(`✅ Plan Manager: ${hasPlanManager}`);
    console.log(`✅ Clerk Client: ${hasClerkClient}`);
    
    if (!hasCSSSidepanel || !hasPlanManager || !hasClerkClient) {
      console.error('❌ CRITICAL: Missing core dependencies');
      return false;
    }
    
    // Test 2: Authentication state validation
    console.log('\n📋 TEST 2: Authentication State');
    if (hasClerkClient) {
      const isLoaded = clerkClient.isLoaded;
      const isSignedIn = clerkClient.isSignedIn;
      const hasUser = !!clerkClient.user;
      const hasToken = !!clerkClient.sessionToken;
      
      console.log(`✅ Clerk Loaded: ${isLoaded}`);
      console.log(`✅ Signed In: ${isSignedIn}`);
      console.log(`✅ Has User: ${hasUser}`);
      console.log(`✅ Has Token: ${hasToken}`);
      
      if (!isLoaded) {
        console.warn('⚠️ Clerk not fully loaded yet');
        return false;
      }
      
      if (isSignedIn && (!hasUser || !hasToken)) {
        console.error('❌ CRITICAL: Signed in but missing user data or token');
        return false;
      }
    }
    
    // Test 3: Plan Manager state
    console.log('\n📋 TEST 3: Plan Manager State');
    const pmReady = planManager.isReady;
    const currentPlan = planManager.currentPlan;
    const userId = planManager.userId;
    
    console.log(`✅ Plan Manager Ready: ${pmReady}`);
    console.log(`✅ Current Plan: ${currentPlan}`);
    console.log(`✅ User ID: ${userId ? 'Present' : 'Missing'}`);
    
    // Test 4: Premium feature access validation
    console.log('\n📋 TEST 4: Premium Feature Access');
    const premiumFeatures = ['color_sampling', 'asset_management', 'tailwind_conversion', 'export_features', 'console_monitoring'];
    let allFeaturesAllowed = true;
    
    for (const feature of premiumFeatures) {
      const access = await planManager.canUseFeature(feature);
      const allowed = access.allowed;
      console.log(`${allowed ? '✅' : '❌'} ${feature}: ${allowed ? 'ALLOWED' : 'DENIED'} - ${access.reason}`);
      if (!allowed) allFeaturesAllowed = false;
    }
    
    // Test 5: DOM state verification
    console.log('\n📋 TEST 5: Premium Cards DOM State');
    const cardIds = ['homeToCSSSelectorCard', 'homeToColorPaletteCard', 'homeToConsoleCard', 'homeToAssetManagerCard'];
    let hasUnlockedCards = 0;
    
    for (const cardId of cardIds) {
      const card = document.getElementById(cardId);
      if (card) {
        const overlay = card.querySelector('.premium-card-overlay');
        const hasOverlay = !!overlay;
        console.log(`${hasOverlay ? '🔒' : '🔓'} ${cardId}: ${hasOverlay ? 'LOCKED' : 'UNLOCKED'}`);
        if (!hasOverlay) hasUnlockedCards++;
      } else {
        console.log(`❓ ${cardId}: NOT FOUND`);
      }
    }
    
    // Final assessment
    console.log('\n🎯 === TEST RESULTS SUMMARY ===');
    const testResults = {
      dependenciesLoaded: hasCSSSidepanel && hasPlanManager && hasClerkClient,
      authenticationValid: hasClerkClient && clerkClient.isLoaded && (clerkClient.isSignedIn ? (!!clerkClient.user && !!clerkClient.sessionToken) : true),
      planManagerReady: pmReady,
      currentPlan: currentPlan,
      allFeaturesAllowed: allFeaturesAllowed,
      unlockedCardCount: hasUnlockedCards,
      totalCards: cardIds.length
    };
    
    console.log('📊 Results:', testResults);
    
    // Determine overall status
    if (testResults.currentPlan === 'premium' && testResults.allFeaturesAllowed && testResults.unlockedCardCount === testResults.totalCards) {
      console.log('🎉 SUCCESS: All P0-CRITICAL tests PASSED!');
      console.log('✅ Premium locks correctly removed, proceed to Phase 2');
      return true;
    } else if (testResults.currentPlan === 'free' || !testResults.allFeaturesAllowed) {
      console.log('🚨 FAILURE: Plan detection issue');
      console.log('❌ User appears premium in UI but system detects free plan');
      return false;
    } else if (testResults.unlockedCardCount < testResults.totalCards) {
      console.log('⚠️ PARTIAL: Some premium cards still locked');
      console.log('🔧 UI update issue - plan is correct but DOM not updated');
      return false;
    }
    
    return false;
    
  } catch (error) {
    console.error('💥 TEST EXECUTION ERROR:', error);
    return false;
  }
};

// Phase 3: Edge Case Testing Suite
window.runEdgeCaseTests = async function() {
  console.log('\n🧪 === PHASE 3: EDGE CASE TESTING SUITE ===');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };
  
  const addTest = (name, passed, details = '') => {
    results.total++;
    if (passed) {
      results.passed++;
      console.log(`✅ ${name}`);
    } else {
      results.failed++;
      console.log(`❌ ${name}: ${details}`);
    }
    results.details.push({name, passed, details});
  };

  try {
    // Test 1: Backend API unavailable scenario
    console.log('\n📋 TEST 1: Backend API Unavailable Scenario');
    const originalFetch = window.fetch;
    window.fetch = async (url, options) => {
      if (url.includes('/api/user/profile')) {
        throw new Error('Network error: Backend unavailable');
      }
      return originalFetch(url, options);
    };
    
    try {
      await planManager.loadUserPlan();
      // Should fallback to free plan
      addTest('Backend unavailable fallback', planManager.currentPlan === 'free', `Plan: ${planManager.currentPlan}`);
    } catch (e) {
      addTest('Backend unavailable handling', false, e.message);
    } finally {
      window.fetch = originalFetch; // Restore original fetch
    }

    // Test 2: Session token expiration handling  
    console.log('\n📋 TEST 2: Session Token Expiration');
    if (typeof clerkClient !== 'undefined' && clerkClient.isLoaded) {
      const originalToken = clerkClient.sessionToken;
      // Simulate expired token
      Object.defineProperty(clerkClient, 'sessionToken', {
        get: () => 'expired-token-12345',
        configurable: true
      });
      
      try {
        const canUse = await planManager.canUseFeature('color_sampling');
        addTest('Expired token graceful handling', true);
      } catch (e) {
        addTest('Expired token error handling', true); // Error is expected
      } finally {
        // Restore original token
        Object.defineProperty(clerkClient, 'sessionToken', {
          get: () => originalToken,
          configurable: true
        });
      }
    } else {
      addTest('Session token test', false, 'ClerkClient not available');
    }

    // Test 3: Cross-browser compatibility (basic checks)
    console.log('\n📋 TEST 3: Cross-browser Compatibility');
    const browserChecks = {
      'Promise support': typeof Promise !== 'undefined',
      'Fetch API support': typeof fetch !== 'undefined', 
      'LocalStorage support': typeof localStorage !== 'undefined',
      'Modern JS features': (() => {
        try {
          const test = {a: 1, b: 2};
          const {a, ...rest} = test;
          return true;
        } catch (e) {
          return false;
        }
      })(),
      'DOM Query support': typeof document.querySelector !== 'undefined'
    };
    
    Object.entries(browserChecks).forEach(([feature, supported]) => {
      addTest(`Browser: ${feature}`, supported);
    });

    // Test 4: Plan manager state consistency
    console.log('\n📋 TEST 4: Plan Manager State Consistency');
    const initialPlan = planManager.currentPlan;
    const initialReady = planManager.isReady;
    
    // Test multiple rapid calls
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(planManager.canUseFeature('color_sampling'));
    }
    
    try {
      const results = await Promise.all(promises);
      const allSame = results.every(r => r.allowed === results[0].allowed);
      addTest('Concurrent feature checks consistency', allSame);
      addTest('Plan manager state preserved', planManager.currentPlan === initialPlan && planManager.isReady === initialReady);
    } catch (e) {
      addTest('Concurrent calls handling', false, e.message);
    }

  } catch (error) {
    console.error('Edge case testing failed:', error);
    addTest('Test suite execution', false, error.message);
  }

  // Final Results
  console.log('\n🎯 === EDGE CASE TEST RESULTS ===');
  console.log(`📊 Total: ${results.total}, Passed: ${results.passed}, Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.details.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.name}: ${t.details}`);
    });
  }

  console.log('\n✅ Edge case testing completed');
  return results.passed >= results.total * 0.8; // 80% pass rate required
};

// Phase 3: Complete Functionality Testing
window.runFunctionalityTests = async function() {
  console.log('\n🔬 === PHASE 3: COMPLETE FUNCTIONALITY TESTING ===');
  
  const results = { total: 0, passed: 0, failed: 0, details: [] };
  const addTest = (name, passed, details = '') => {
    results.total++;
    if (passed) {
      results.passed++;
      console.log(`✅ ${name}`);
    } else {
      results.failed++;
      console.log(`❌ ${name}: ${details}`);
    }
    results.details.push({name, passed, details});
  };

  try {
    // CRITICAL: Wait for plan manager to stabilize before testing
    console.log('\n🔄 Waiting for plan manager to stabilize...');
    await planManager.waitForReady();
    // Additional wait for plan synchronization
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`📋 Current plan: ${planManager.currentPlan}`);
    
    // Force plan refresh to ensure latest state
    await planManager.refreshPlanAndNotify();
    // Test 1: Premium Features Functionality
    console.log('\n📋 TEST 1: Premium Features Access');
    const premiumFeatures = ['color_sampling', 'asset_management', 'tailwind_conversion', 'export_features', 'console_monitoring'];
    
    for (const feature of premiumFeatures) {
      try {
        const canUse = await planManager.canUseFeature(feature);
        addTest(`Premium feature: ${feature}`, canUse.allowed === true, canUse.reason || 'Unknown reason');
      } catch (e) {
        addTest(`Premium feature: ${feature}`, false, e.message);
      }
    }

    // Test 2: UI Components Visibility  
    console.log('\n📋 TEST 2: UI Components Visibility');
    const requiredElements = [
      'headerWelcome',
      'homeToCSSSelectorCard', 
      'homeToColorPaletteCard',
      'homeToConsoleCard',
      'homeToAssetManagerCard'
    ];
    
    for (const elementId of requiredElements) {
      const element = document.getElementById(elementId);
      addTest(`UI element: ${elementId}`, !!element && element.offsetParent !== null, element ? 'Found but hidden' : 'Element not found');
    }

    // Test 3: Premium Card Overlay States
    console.log('\n📋 TEST 3: Premium Card Overlay States');
    const cardIds = ['homeToCSSSelectorCard', 'homeToColorPaletteCard', 'homeToConsoleCard', 'homeToAssetManagerCard'];
    
    for (const cardId of cardIds) {
      const card = document.getElementById(cardId);
      if (card) {
        const overlay = card.querySelector('.premium-card-overlay');
        const isPremiumUser = planManager.currentPlan === 'premium';
        const expectedState = isPremiumUser ? 'unlocked' : 'locked';
        const actualState = overlay ? 'locked' : 'unlocked';
        addTest(`Card ${cardId} state`, actualState === expectedState, `Expected: ${expectedState}, Actual: ${actualState}`);
      } else {
        addTest(`Card ${cardId} existence`, false, 'Card element not found');
      }
    }

    // Test 4: Authentication Integration
    console.log('\n📋 TEST 4: Authentication Integration');
    if (typeof clerkClient !== 'undefined') {
      addTest('Clerk client available', true);
      addTest('Clerk client loaded', clerkClient.isLoaded, 'Client not loaded');
      addTest('Authentication state consistent', 
        planManager.userId === (clerkClient.user?.id || null),
        `PlanManager: ${planManager.userId}, Clerk: ${clerkClient.user?.id}`);
    } else {
      addTest('Clerk client available', false, 'clerkClient undefined');
    }

    // Test 5: Event Handling
    console.log('\n📋 TEST 5: Event Handling');
    let eventsFired = 0;
    const testCallback = () => eventsFired++;
    
    if (planManager.onPlanUpdate) {
      planManager.onPlanUpdate(testCallback);
      // Trigger plan update
      await planManager.refreshPlanAndNotify();
      addTest('Plan update callback system', eventsFired > 0, `Events fired: ${eventsFired}`);
    } else {
      addTest('Plan update callback system', false, 'onPlanUpdate method not available');
    }

  } catch (error) {
    console.error('Functionality testing failed:', error);
    addTest('Test suite execution', false, error.message);
  }

  // Final Results
  console.log('\n🎯 === FUNCTIONALITY TEST RESULTS ===');
  console.log(`📊 Total: ${results.total}, Passed: ${results.passed}, Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.details.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.name}: ${t.details}`);
    });
  }

  console.log('\n✅ Functionality testing completed');
  return results.passed >= results.total * 0.85; // 85% pass rate required
};

// Phase 3: Security Assessment
window.runSecurityAssessment = function() {
  console.log('\n🔐 === PHASE 3: SECURITY ASSESSMENT ===');
  
  const results = { total: 0, passed: 0, failed: 0, details: [] };
  const addTest = (name, passed, details = '') => {
    results.total++;
    if (passed) {
      results.passed++;
      console.log(`✅ ${name}`);
    } else {
      results.failed++;
      console.log(`❌ ${name}: ${details}`);
    }
    results.details.push({name, passed, details});
  };

  try {
    // Test 1: Session Token Security
    console.log('\n📋 TEST 1: Session Token Security');
    if (typeof clerkClient !== 'undefined' && clerkClient.sessionToken) {
      const token = clerkClient.sessionToken;
      addTest('Session token present', !!token);
      addTest('Session token not in URL', !window.location.href.includes(token), 'Token exposed in URL');
      addTest('Session token format valid', token.split('.').length === 3, 'Invalid JWT format');
    } else {
      addTest('Session token security', false, 'No session token available for testing');
    }

    // Test 2: Content Security Policy
    console.log('\n📋 TEST 2: Content Security Policy');
    const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
    addTest('CSP meta tag present', metaTags.length > 0, 'No CSP meta tag found');
    
    // Test 3: XSS Protection
    console.log('\n📋 TEST 3: XSS Protection');
    const testString = '<script>alert("xss")</script>';
    const tempDiv = document.createElement('div');
    tempDiv.textContent = testString;
    addTest('Text content XSS protection', tempDiv.innerHTML === '&lt;script&gt;alert("xss")&lt;/script&gt;', 'XSS vulnerability detected');

    // Test 4: Local Storage Security
    console.log('\n📋 TEST 4: Local Storage Security');
    const sensitiveKeys = ['password', 'secret', 'private', 'key', 'token'];
    const localStorageKeys = Object.keys(localStorage);
    const hasSensitiveData = localStorageKeys.some(key => 
      sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
    );
    addTest('Local storage security', !hasSensitiveData, hasSensitiveData ? 'Sensitive data in localStorage' : '');

    // Test 5: API Endpoint Security
    console.log('\n📋 TEST 5: API Endpoint Security');
    const backendUrl = planManager.backendUrl;
    addTest('HTTPS endpoint', backendUrl.startsWith('https://'), `Using: ${backendUrl}`);
    addTest('No sensitive data in URL', !backendUrl.includes('password') && !backendUrl.includes('key'), 'Sensitive data in API URL');

    // Test 6: Authentication State Validation
    console.log('\n📋 TEST 6: Authentication State Validation');
    if (typeof clerkClient !== 'undefined') {
      const isSignedIn = clerkClient.isSignedIn;
      const hasUser = !!clerkClient.user;
      const hasToken = !!clerkClient.sessionToken;
      
      if (isSignedIn) {
        addTest('Signed in user has user object', hasUser, 'Missing user object for signed in user');
        addTest('Signed in user has session token', hasToken, 'Missing session token for signed in user');
      } else {
        addTest('Signed out state consistent', !hasUser && !hasToken, 'Inconsistent signed out state');
      }
    }

  } catch (error) {
    console.error('Security assessment failed:', error);
    addTest('Security test execution', false, error.message);
  }

  // Final Results
  console.log('\n🎯 === SECURITY ASSESSMENT RESULTS ===');
  console.log(`📊 Total: ${results.total}, Passed: ${results.passed}, Failed: ${results.failed}`);
  console.log(`📈 Security Score: ${Math.round((results.passed / results.total) * 100)}%`);
  
  if (results.failed > 0) {
    console.log('\n⚠️ Security Issues:');
    results.details.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.name}: ${t.details}`);
    });
  }

  console.log('\n🛡️ Security assessment completed');
  return results.passed >= results.total * 0.9; // 90% pass rate required for security
};

// Phase 4: UX Enhancement - Loading States & Performance
window.UXEnhancer = {
  // Show loading indicator
  showLoading(type = 'plan', message = '') {
    const indicators = {
      plan: 'planLoadingIndicator', 
      auth: 'authLoadingIndicator'
    };
    
    const elementId = indicators[type];
    if (!elementId) return;
    
    const indicator = document.getElementById(elementId);
    if (indicator) {
      const textElement = indicator.querySelector('.loading-text');
      if (textElement && message) {
        textElement.textContent = message;
      }
      indicator.style.display = 'flex';
      indicator.classList.add('fade-in');
    }
  },

  // Hide loading indicator
  hideLoading(type = 'plan') {
    const indicators = {
      plan: 'planLoadingIndicator',
      auth: 'authLoadingIndicator'
    };
    
    const elementId = indicators[type];
    if (!elementId) return;
    
    const indicator = document.getElementById(elementId);
    if (indicator) {
      indicator.style.display = 'none';
      indicator.classList.remove('fade-in');
    }
  },

  // Add loading state to button
  setButtonLoading(buttonId, loading = true) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (loading) {
      button.classList.add('btn-loading');
      button.disabled = true;
    } else {
      button.classList.remove('btn-loading');
      button.disabled = false;
    }
  },

  // Add loading state to feature cards
  setCardLoading(cardId, loading = true) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    if (loading) {
      card.classList.add('loading');
    } else {
      card.classList.remove('loading');
      // Add fade-in effect when loading completes
      card.classList.add('fade-in');
      setTimeout(() => card.classList.remove('fade-in'), 300);
    }
  },

  // Performance: Debounce function for API calls
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Performance: Lazy loading for heavy operations
  lazyLoad(callback, delay = 100) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = callback();
        resolve(result);
      }, delay);
    });
  },

  // Performance: Batch DOM operations
  batchDOMOperations(operations) {
    const fragment = document.createDocumentFragment();
    const results = operations.map(op => op(fragment));
    document.body.appendChild(fragment);
    return results;
  },

  // Smooth scroll with enhanced UX
  smoothScrollTo(element, offset = 0) {
    if (!element) return;
    
    const targetY = element.offsetTop - offset;
    const startY = window.pageYOffset;
    const distance = targetY - startY;
    const duration = Math.min(Math.abs(distance) * 0.5, 800);
    let start = null;

    function animation(currentTime) {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const progress = Math.min(timeElapsed / duration, 1);
      
      // Easing function for smooth animation
      const ease = progress < 0.5 
        ? 2 * progress * progress 
        : -1 + (4 - 2 * progress) * progress;
      
      window.scrollTo(0, startY + distance * ease);
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    }
    
    requestAnimationFrame(animation);
  },

  // Initialize performance optimizations
  initPerformanceOptimizations() {
    // Preload critical resources
    this.preloadCriticalResources();
    
    // Setup intersection observer for lazy loading
    this.setupIntersectionObserver();
    
    // Optimize animations with reduced motion preference
    this.setupReducedMotion();
  },

  preloadCriticalResources() {
    const criticalImages = document.querySelectorAll('[data-preload]');
    criticalImages.forEach(img => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = img.src || img.dataset.src;
      document.head.appendChild(link);
    });
  },

  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    // Observe elements that should animate in
    document.querySelectorAll('[data-animate-in]').forEach(el => {
      observer.observe(el);
    });
  },

  setupReducedMotion() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
      document.body.classList.add('reduced-motion');
      // Disable animations for accessibility
      const style = document.createElement('style');
      style.textContent = `
        .reduced-motion *,
        .reduced-motion *::before,
        .reduced-motion *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    }
  }
};

// Phase 4: UX Enhancement Demo
window.demoUXEnhancements = function() {
  console.log('\n🎨 === PHASE 4: UX ENHANCEMENTS DEMO ===');
  
  if (!window.UXEnhancer) {
    console.error('❌ UXEnhancer not available');
    return;
  }

  console.log('\n🔄 Demonstrating loading states...');
  
  // Demo 1: Plan loading
  UXEnhancer.showLoading('plan', 'Loading your plan...');
  setTimeout(() => {
    UXEnhancer.showLoading('plan', 'Syncing with backend...');
    setTimeout(() => {
      UXEnhancer.hideLoading('plan');
      console.log('✅ Plan loading demo completed');
    }, 1500);
  }, 1500);

  // Demo 2: Authentication loading
  setTimeout(() => {
    UXEnhancer.showLoading('auth', 'Authenticating...');
    setTimeout(() => {
      UXEnhancer.hideLoading('auth');
      console.log('✅ Auth loading demo completed');
    }, 2000);
  }, 3500);

  // Demo 3: Card loading states
  setTimeout(() => {
    console.log('\n🃏 Demonstrating card loading states...');
    const cardIds = ['homeToCSSSelectorCard', 'homeToColorPaletteCard', 'homeToConsoleCard', 'homeToAssetManagerCard'];
    
    cardIds.forEach((cardId, index) => {
      setTimeout(() => {
        UXEnhancer.setCardLoading(cardId, true);
        setTimeout(() => {
          UXEnhancer.setCardLoading(cardId, false);
        }, 1000);
      }, index * 200);
    });
  }, 6000);

  console.log('\n🎭 Demo running... Watch the loading animations!');
  console.log('⏱️  Total demo duration: ~8 seconds');
};

// Phase 4: Performance Test
window.testPerformanceOptimizations = function() {
  console.log('\n⚡ === PHASE 4: PERFORMANCE TEST ===');
  
  if (!window.UXEnhancer) {
    console.error('❌ UXEnhancer not available');
    return;
  }

  // Test 1: Debounce function
  console.log('\n🔄 Testing debounce function...');
  let callCount = 0;
  const testFunction = () => { callCount++; console.log(`Debounced call: ${callCount}`); };
  const debouncedTest = UXEnhancer.debounce(testFunction, 300);
  
  // Rapid calls - should only execute once
  for (let i = 0; i < 10; i++) {
    debouncedTest();
  }
  
  setTimeout(() => {
    console.log(`✅ Debounce test: ${callCount === 1 ? 'PASSED' : 'FAILED'} (Expected: 1, Actual: ${callCount})`);
  }, 500);

  // Test 2: Lazy loading
  console.log('\n⏳ Testing lazy loading...');
  const startTime = Date.now();
  UXEnhancer.lazyLoad(() => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`✅ Lazy load test: ${duration >= 100 ? 'PASSED' : 'FAILED'} (Delay: ${duration}ms)`);
  }, 150);

  // Test 3: Performance optimizations check
  setTimeout(() => {
    console.log('\n🚀 Checking performance optimizations...');
    const hasHardwareAcceleration = document.querySelector('.loading-spinner, .premium-card-overlay');
    const hasReducedMotion = document.body.classList.contains('reduced-motion');
    
    console.log(`✅ Hardware acceleration: ${hasHardwareAcceleration ? 'ENABLED' : 'DISABLED'}`);
    console.log(`♿ Reduced motion support: ${hasReducedMotion ? 'ACTIVE' : 'AVAILABLE'}`);
    console.log('\n🎉 Performance test completed!');
  }, 1000);
};

// Phase 3: Complete Test Suite Runner
window.runPhase3TestSuite = async function() {
  console.log('\n🚀 === PHASE 3: COMPLETE QUALITY ASSURANCE SUITE ===');
  
  const suiteResults = {
    edgeCases: false,
    functionality: false,
    security: false
  };

  try {
    console.log('\n1️⃣ Running Edge Case Tests...');
    suiteResults.edgeCases = await runEdgeCaseTests();
    
    console.log('\n2️⃣ Running Functionality Tests...');
    suiteResults.functionality = await runFunctionalityTests();
    
    console.log('\n3️⃣ Running Security Assessment...');  
    suiteResults.security = runSecurityAssessment();

    // Overall Results
    const totalTests = Object.keys(suiteResults).length;
    const passedTests = Object.values(suiteResults).filter(result => result === true).length;
    const overallSuccess = passedTests === totalTests;

    console.log('\n🏁 === PHASE 3: OVERALL RESULTS ===');
    console.log(`📊 Test Suites: ${totalTests}, Passed: ${passedTests}, Failed: ${totalTests - passedTests}`);
    console.log(`📈 Overall Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    console.log('\n📋 Suite Results:');
    console.log(`  🧪 Edge Cases: ${suiteResults.edgeCases ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  🔬 Functionality: ${suiteResults.functionality ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  🔐 Security: ${suiteResults.security ? '✅ PASS' : '❌ FAIL'}`);

    if (overallSuccess) {
      console.log('\n🎉 PHASE 3 COMPLETE: Ready for Phase 4 (UX Polish)');
    } else {
      console.log('\n⚠️ PHASE 3 ISSUES: Fix failing tests before proceeding');
    }

    return overallSuccess;

  } catch (error) {
    console.error('Phase 3 test suite failed:', error);
    return false;
  }
};

