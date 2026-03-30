// Asset 수집 클래스
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
      throw error;
    } finally {
      this.isCollecting = false;
    }
  }

  // 이미지 수집
  async collectImages() {
    const images = [];
    const imgElements = document.querySelectorAll('img[src], img[data-src]');

    for (const img of imgElements) {
      const src = img.src || img.dataset.src;
      if (src && this.isValidUrl(src)) {
        const assetObj = this.createAssetObject(
          src,
          'image',
          this.extractFilename(src),
          this.getFileExtension(src),
          img,
          {
            alt: img.alt || '',
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height
          }
        );
        images.push(assetObj);
      }
    }

    // CSS background images 수집
    await this.collectBackgroundImages(images);

    return this.deduplicateAssets(images);
  }

  // CSS background image 수집 (성능 최적화)
  async collectBackgroundImages(images) {
    console.log('🚀 Starting optimized background image collection...');
    const startTime = performance.now();

    // 성능 최적화: 특정 태그만 대상으로 하여 DOM 순회 최소화
    const targetSelectors = [
      'div', 'section', 'header', 'footer', 'article', 'aside', 'main',
      'nav', 'figure', 'body', 'span', 'a', 'button', 'li', 'td', 'th'
    ];

    const elements = [];
    for (const selector of targetSelectors) {
      elements.push(...document.querySelectorAll(selector));
    }

    console.log(`Checking ${elements.length} elements for background images...`);

    // 배치로 처리하여 메인 스레드 블로킹 방지
    const batchSize = 100;
    for (let i = 0; i < elements.length; i += batchSize) {
      const batch = elements.slice(i, i + batchSize);

      // 각 배치를 처리
      for (const element of batch) {
        try {
          const computedStyle = window.getComputedStyle(element);
          const backgroundImage = computedStyle.backgroundImage;

          if (backgroundImage && backgroundImage !== 'none') {
            const urlMatch = backgroundImage.match(/url\(['"]?([^'")]+)['"]?\)/);
            if (urlMatch) {
              const url = urlMatch[1];
              if (this.isValidUrl(url)) {
                const assetObj = this.createAssetObject(
                  url,
                  'image',
                  this.extractFilename(url),
                  this.getFileExtension(url),
                  element,
                  { source: 'css-background' }
                );
                images.push(assetObj);
              }
            }
          }
        } catch (error) {
          // 개별 요소 오류는 무시하고 계속 진행
          console.warn('Error processing element for background images:', error);
        }
      }

      // 메인 스레드에 잠시 제어권을 돌려줌 (UI 응답성 향상)
      if (i + batchSize < elements.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    const processingTime = performance.now() - startTime;
    console.log(`✅ Background image collection completed in ${processingTime.toFixed(2)}ms`);
  }

  // Stylesheet 수집
  collectStylesheets() {
    const stylesheets = [];
    const linkElements = document.querySelectorAll('link[rel="stylesheet"]');

    linkElements.forEach(link => {
      if (link.href && this.isValidUrl(link.href)) {
        const assetObj = this.createAssetObject(
          link.href,
          'stylesheet',
          this.extractFilename(link.href),
          this.getFileExtension(link.href),
          link,
          {
            media: link.media || 'all'
          }
        );
        stylesheets.push(assetObj);
      }
    });

    return this.deduplicateAssets(stylesheets);
  }

  // Script 수집
  collectScripts() {
    const scripts = [];
    const scriptElements = document.querySelectorAll('script[src]');

    scriptElements.forEach(script => {
      if (script.src && this.isValidUrl(script.src)) {
        const assetObj = this.createAssetObject(
          script.src,
          'script',
          this.extractFilename(script.src),
          this.getFileExtension(script.src),
          script,
          {
            type: script.type || 'text/javascript',
            async: script.async,
            defer: script.defer
          }
        );
        scripts.push(assetObj);
      }
    });

    return this.deduplicateAssets(scripts);
  }

  // Video 수집
  collectVideos() {
    const videos = [];
    const videoElements = document.querySelectorAll('video[src], video source');

    videoElements.forEach(video => {
      const src = video.src || (video.parentNode && video.parentNode.src);
      if (src && this.isValidUrl(src)) {
        const assetObj = this.createAssetObject(
          src,
          'video',
          this.extractFilename(src),
          this.getFileExtension(src),
          video,
          {
            controls: video.controls,
            autoplay: video.autoplay,
            loop: video.loop
          }
        );
        videos.push(assetObj);
      }
    });

    return this.deduplicateAssets(videos);
  }

  // Audio 수집
  collectAudio() {
    const audio = [];
    const audioElements = document.querySelectorAll('audio[src], audio source');

    audioElements.forEach(audioEl => {
      const src = audioEl.src || (audioEl.parentNode && audioEl.parentNode.src);
      if (src && this.isValidUrl(src)) {
        const assetObj = this.createAssetObject(
          src,
          'audio',
          this.extractFilename(src),
          this.getFileExtension(src),
          audioEl,
          {
            controls: audioEl.controls,
            autoplay: audioEl.autoplay,
            loop: audioEl.loop
          }
        );
        audio.push(assetObj);
      }
    });

    return this.deduplicateAssets(audio);
  }

  // Font 수집 (Web Fonts API 사용)
  async collectFonts() {
    const fonts = [];

    try {
      if ('fonts' in document) {
        const fontFaces = Array.from(document.fonts);

        fontFaces.forEach(fontFace => {
          if (fontFace.status === 'loaded') {
            // CSS에서 font URL 추출 시도
            const styleSheets = Array.from(document.styleSheets);
            styleSheets.forEach(sheet => {
              try {
                const rules = Array.from(sheet.cssRules || sheet.rules || []);
                rules.forEach(rule => {
                  if (rule instanceof CSSFontFaceRule) {
                    const src = rule.style.getPropertyValue('src');
                    if (src) {
                      const urlMatch = src.match(/url\(['"]?([^'")]+)['"]?\)/);
                      if (urlMatch) {
                        const url = urlMatch[1];
                        if (this.isValidUrl(url)) {
                          const assetObj = this.createAssetObject(
                            url,
                            'font',
                            this.extractFilename(url),
                            this.getFileExtension(url),
                            rule,
                            {
                              family: fontFace.family,
                              style: fontFace.style,
                              weight: fontFace.weight
                            }
                          );
                          fonts.push(assetObj);
                        }
                      }
                    }
                  }
                });
              } catch (e) {
                // CORS 에러 등으로 스타일시트에 접근할 수 없는 경우 무시
              }
            });
          }
        });
      }
    } catch (error) {
      console.warn('Font collection failed:', error);
    }

    return this.deduplicateAssets(fonts);
  }

  // Asset 객체 생성 (표준 형식)
  createAssetObject(url, type, filename, extension, element, metadata = {}) {
    return {
      url,
      type,
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
      const filename = pathname.split('/').pop();
      return filename || 'unnamed';
    } catch (error) {
      return 'unnamed';
    }
  }

  // 파일 확장자 추출
  getFileExtension(url) {
    try {
      const filename = this.extractFilename(url);
      const parts = filename.split('.');
      return parts.length > 1 ? parts.pop().toLowerCase() : 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  // URL 유효성 검사
  isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;

    // 데이터 URL은 제외
    if (url.startsWith('data:')) return false;
    if (url.startsWith('blob:')) return false;
    if (url.startsWith('javascript:')) return false;

    try {
      new URL(url, window.location.href);
      return true;
    } catch {
      return false;
    }
  }

  // 중복 Asset 제거
  deduplicateAssets(assets) {
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

export { AssetCollector };
