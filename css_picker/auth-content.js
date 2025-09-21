// Content script for backend authentication pages
// Handles communication between web page and extension

console.log('🔐 AUTH CONTENT SCRIPT: Loaded on:', window.location.href);
console.log('🔐 AUTH CONTENT SCRIPT: Extension ID:', chrome.runtime?.id);
console.log('🔐 AUTH CONTENT SCRIPT: Current origin:', window.location.origin);

// Listen for messages from the web page
window.addEventListener('message', async (event) => {
    // Allow both localhost (development) and production domain
    const allowedOrigins = [
        'http://localhost:4242',
        'https://csspickerpro.com'
    ];
    
    if (!allowedOrigins.includes(event.origin)) {
        console.log('🔐 AUTH CONTENT SCRIPT: Rejected message from origin:', event.origin);
        return;
    }

    console.log('🔐 AUTH CONTENT SCRIPT: Received message from', event.origin, ':', event.data);

    if (event.data.type === 'CLERK_AUTH_SUCCESS' && event.data.data) {
        try {
            console.log('🔐 AUTH CONTENT SCRIPT: Attempting to forward auth data to extension...');
            
            // Forward the auth success message to the extension background script
            const response = await chrome.runtime.sendMessage({
                type: 'CLERK_AUTH_SUCCESS',
                data: event.data.data
            });

            console.log('🔐 AUTH CONTENT SCRIPT: Successfully forwarded to extension:', response);

            // Send confirmation back to the web page
            event.source.postMessage({
                type: 'AUTH_FORWARDED_SUCCESS',
                success: true
            }, event.origin);

        } catch (error) {
            console.error('🔐 AUTH CONTENT SCRIPT: Failed to forward auth data to extension:', error);
            
            // Send error back to the web page
            event.source.postMessage({
                type: 'AUTH_FORWARDED_ERROR',
                error: error.message
            }, event.origin);
        }
    }
});

// Let the web page know that the content script is ready
window.addEventListener('load', () => {
    console.log('🔐 AUTH CONTENT SCRIPT: Page loaded, sending ready message');
    // Get current origin for postMessage
    const currentOrigin = window.location.origin;
    window.postMessage({
        type: 'EXTENSION_CONTENT_SCRIPT_READY'
    }, currentOrigin);
    console.log('🔐 AUTH CONTENT SCRIPT: Sent ready message to:', currentOrigin);
});

console.log('🔐 AUTH CONTENT SCRIPT: Setup complete');