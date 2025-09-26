"""
Test script for Playwright integration with CSS Picker app
"""

import requests
import json
import time

# Assuming the Flask app is running locally on port 4242
BASE_URL = "http://localhost:4242"

def test_extract_css():
    """Test the CSS extraction endpoint"""
    print("Testing CSS extraction...")
    
    # Test with a sample URL
    test_url = "https://example.com"
    
    response = requests.post(
        f"{BASE_URL}/api/playwright/extract-css",
        json={"url": test_url},
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        data = response.json()
        print("✓ CSS extraction successful")
        print(f"  - Page title: {data['data']['page_title']}")
        print(f"  - Number of CSS selectors found: {len(data['data']['selectors'])}")
        print(f"  - Number of inline styles found: {len(data['data']['inline_styles'])}")
        return True
    else:
        print(f"✗ CSS extraction failed: {response.status_code} - {response.text}")
        return False

def test_screenshot():
    """Test the screenshot endpoint"""
    print("\nTesting screenshot functionality...")
    
    # Test with a sample URL
    test_url = "https://example.com"
    
    response = requests.post(
        f"{BASE_URL}/api/playwright/screenshot",
        json={"url": test_url, "screenshot_path": "test_screenshot.png"},
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        data = response.json()
        print("✓ Screenshot taken successfully")
        print(f"  - Saved to: {data['screenshot_path']}")
        return True
    else:
        print(f"✗ Screenshot failed: {response.status_code} - {response.text}")
        return False

def test_element_styles():
    """Test getting element styles endpoint"""
    print("\nTesting element styles extraction...")
    
    # Test with a sample URL and selector
    test_url = "https://example.com"
    test_selector = "h1"
    
    response = requests.post(
        f"{BASE_URL}/api/playwright/get-element-styles",
        json={"url": test_url, "selector": test_selector},
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        data = response.json()
        print("✓ Element styles extraction successful")
        print(f"  - Selector: {data['data']['selector']}")
        if data['data']['computed_styles']:
            print(f"  - Number of computed styles: {len(data['data']['computed_styles'])}")
        else:
            print("  - No computed styles found for this element")
        return True
    else:
        print(f"✗ Element styles extraction failed: {response.status_code} - {response.text}")
        return False

def main():
    print("Starting Playwright integration tests...\n")
    
    # Add a small delay to ensure the server is ready
    time.sleep(2)
    
    results = []
    results.append(test_extract_css())
    results.append(test_screenshot())
    results.append(test_element_styles())
    
    print(f"\nTest Results: {sum(results)}/{len(results)} tests passed")
    
    if all(results):
        print("✓ All tests passed!")
    else:
        print("✗ Some tests failed!")

if __name__ == "__main__":
    main()