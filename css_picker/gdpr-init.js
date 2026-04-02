// GDPR Modal Event Listeners - Extracted from inline script
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔧 Setting up immediate GDPR modal event listeners...');
  
  // 필수 동의 체크박스 상태 업데이트 함수
  function updateAcceptButton() {
    const requiredConsents = ['requiredDataConsent', 'websiteResponsibilityConsent'];
    const acceptBtn = document.getElementById('acceptConsentBtn');
    
    if (!acceptBtn) return;
    
    const allRequired = requiredConsents.every(id => {
      const checkbox = document.getElementById(id);
      return checkbox && checkbox.checked;
    });
    
    acceptBtn.disabled = !allRequired;
  }
  
  // 체크박스 이벤트 리스너
  ['requiredDataConsent', 'websiteResponsibilityConsent'].forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.addEventListener('change', updateAcceptButton);
    }
  });
  
  // Accept 버튼 이벤트 리스너
  const acceptBtn = document.getElementById('acceptConsentBtn');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', function() {
      console.log('✅ GDPR Accept 버튼 클릭됨');
      
      // 동의 정보 저장 (간단 버전)
      const consentData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        required: {
          dataCollection: document.getElementById('requiredDataConsent').checked,
          websiteResponsibility: document.getElementById('websiteResponsibilityConsent').checked
        },
        optional: {
          analytics: document.getElementById('analyticsConsent').checked,
          marketing: document.getElementById('marketingConsent').checked
        }
      };
      
      // Chrome Storage에 저장
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ gdpr_consent: consentData });
      }
      
      // 모달 닫기
      const modal = document.getElementById('gdprConsentModal');
      const bootstrapModal = bootstrap.Modal.getInstance(modal);
      if (bootstrapModal) {
        bootstrapModal.hide();
      } else {
        // 백업: 직접 모달 숨기기
        modal.style.display = 'none';
        modal.classList.remove('show');
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
      }
      
      console.log('✅ GDPR 모달 닫기 완료');
    });
  }
  
  // Decline 버튼 이벤트 리스너
  const declineBtn = document.getElementById('declineConsentBtn');
  if (declineBtn) {
    declineBtn.addEventListener('click', function() {
      console.log('❌ GDPR Decline 버튼 클릭됨');
      // 확장 프로그램 비활성화 또는 종료
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.getCurrent(tab => {
          if (tab) chrome.tabs.remove(tab.id);
        });
      }
    });
  }
  
  // 초기 버튼 상태 설정
  updateAcceptButton();
});