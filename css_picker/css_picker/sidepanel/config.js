// ===== CSS Picker Configuration Constants =====
// This file contains all CSS configuration constants extracted from sidepanel.js
// including dropdown options, CSS categories, Tailwind mappings, and spacing mappings

// Dropdown selections for CSS properties with predefined options
export const CSS_DROPDOWN_OPTIONS = {
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

// CSS properties organized by category with display names
export const CSS_CATEGORIES = {
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

// Tailwind CSS conversion mappings for CSS properties and values
export const TAILWIND_MAPPINGS = {
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

// Tailwind spacing scale mappings (pixel to Tailwind unit conversions)
export const SPACING_MAPPINGS = {
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

// Tailwind color palette RGB value mappings
export const TAILWIND_COLORS = {
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
