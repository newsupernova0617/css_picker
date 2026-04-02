// 페이지 컨텍스트에 주입될 스크립트
// 이 코드는 실제 웹페이지의 JavaScript 환경에서 실행됩니다
(function() {
  'use strict';
  
  // 이미 패치되었는지 확인
  if (window.__consolePatched) return;
  window.__consolePatched = true;
  
  // 원본 console 메서드들 백업
  const originalMethods = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
    trace: console.trace,
    table: console.table,
    group: console.group,
    groupEnd: console.groupEnd,
    clear: console.clear
  };
  
  // 각 console 메서드를 오버라이드
  Object.keys(originalMethods).forEach(method => {
    console[method] = function(...args) {
      // 원래 콘솔 출력 실행
      originalMethods[method].apply(console, args);
      
      // 메시지를 content script로 전송
      try {
        // args를 안전하게 직렬화
        const serializedArgs = args.map(arg => {
          try {
            if (typeof arg === 'object') {
              return JSON.stringify(arg, null, 2);
            }
            return String(arg);
          } catch (e) {
            return '[Object - Cannot Serialize]';
          }
        });
        
        // postMessage로 content script에 전달
        window.postMessage({
          type: 'CONSOLE_MESSAGE_CAPTURED',
          method: method,
          args: serializedArgs,
          timestamp: Date.now(),
          url: window.location.href,
          stack: (new Error()).stack
        }, '*');
      } catch (error) {
        originalMethods.error('Failed to capture console message:', error);
      }
    };
  });
  
  // 전역 에러 핸들러 추가
  window.addEventListener('error', (event) => {
    window.postMessage({
      type: 'CONSOLE_MESSAGE_CAPTURED',
      method: 'error',
      args: [`Uncaught Error: ${event.message}`],
      timestamp: Date.now(),
      url: window.location.href,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }, '*');
  });
  
  // Promise rejection 핸들러
  window.addEventListener('unhandledrejection', (event) => {
    window.postMessage({
      type: 'CONSOLE_MESSAGE_CAPTURED',
      method: 'error',
      args: [`Unhandled Promise Rejection: ${event.reason}`],
      timestamp: Date.now(),
      url: window.location.href
    }, '*');
  });
  
  // 패치 완료 알림
  originalMethods.log('✅ Console patching completed!');
})();