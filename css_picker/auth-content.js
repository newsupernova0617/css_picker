// Content script for backend authentication pages
// Handles communication between web page and extension

console.log('Auth content script loaded on:', window.location.href);

// Listen for messages from the web page
window.addEventListener('message', async (event) => {
    // Make sure the message is from our backend
    if (event.origin !== 'http://localhost:4242') {
        return;
    }

    console.log('Auth content script received message:', event.data);

    if (event.data.type === 'CLERK_AUTH_SUCCESS' && event.data.data) {
        try {
            // Forward the auth success message to the extension background script
            const response = await chrome.runtime.sendMessage({
                type: 'CLERK_AUTH_SUCCESS',
                data: event.data.data
            });

            console.log('Auth data forwarded to extension:', response);

            // Send confirmation back to the web page
            event.source.postMessage({
                type: 'AUTH_FORWARDED_SUCCESS',
                success: true
            }, event.origin);

        } catch (error) {
            console.error('Failed to forward auth data to extension:', error);
            
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
    window.postMessage({
        type: 'EXTENSION_CONTENT_SCRIPT_READY'
    }, 'http://localhost:4242');
});

console.log('Auth content script setup complete');