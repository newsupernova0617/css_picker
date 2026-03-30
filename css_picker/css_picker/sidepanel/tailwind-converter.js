import { TAILWIND_MAPPINGS, SPACING_MAPPINGS, TAILWIND_COLORS } from './config.js';

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

export { TailwindConverter };
