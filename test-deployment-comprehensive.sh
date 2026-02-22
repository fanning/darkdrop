#!/bin/bash

# Comprehensive DarkDrop Deployment Health Check
# Tests frontend, API, and checks for enterprise features in built JavaScript

URL="https://darkdrop.com"
API_URL="https://api.darkdrop.com"
OUTPUT_FILE="$HOME/darkdrop/deployment-health.txt"
TEMP_DIR="/tmp/darkdrop-test-$$"

mkdir -p "$TEMP_DIR"

exec > >(tee "$OUTPUT_FILE")

echo "================================================================================"
echo "DARKDROP DEPLOYMENT HEALTH CHECK"
echo "================================================================================"
echo ""
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "URL: $URL"
echo "API: $API_URL"
echo ""

# ==============================================================================
# TEST 1: Frontend Page Load
# ==============================================================================
echo "--------------------------------------------------------------------------------"
echo "TEST 1: FRONTEND PAGE LOAD"
echo "--------------------------------------------------------------------------------"

HTTP_CODE=$(curl -s -o "$TEMP_DIR/index.html" -w "%{http_code}" "$URL")
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$URL")
SIZE=$(curl -s -o /dev/null -w "%{size_download}" "$URL")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Frontend loads successfully"
    echo "  HTTP Status: $HTTP_CODE"
    echo "  Response Time: ${RESPONSE_TIME}s"
    echo "  Content Size: ${SIZE} bytes"
else
    echo "✗ Frontend failed to load"
    echo "  HTTP Status: $HTTP_CODE"
fi

TITLE=$(grep -oP '(?<=<title>).*?(?=</title>)' "$TEMP_DIR/index.html" | head -1)
echo "  Page Title: ${TITLE:-N/A}"

# Check for React SPA structure
if grep -q "id=\"root\"" "$TEMP_DIR/index.html"; then
    echo "  ✓ React root element found"
fi

echo ""

# ==============================================================================
# TEST 2: JavaScript Bundle Analysis
# ==============================================================================
echo "--------------------------------------------------------------------------------"
echo "TEST 2: JAVASCRIPT BUNDLE ANALYSIS"
echo "--------------------------------------------------------------------------------"

# Extract JS bundle URLs
JS_FILES=$(grep -oP '(?<=src=")[^"]*\.js' "$TEMP_DIR/index.html")

if [ -z "$JS_FILES" ]; then
    echo "⚠ No JavaScript bundles found in HTML"
else
    echo "Found JavaScript bundles:"

    for JS_FILE in $JS_FILES; do
        # Handle relative URLs
        if [[ $JS_FILE == /* ]]; then
            JS_URL="${URL}${JS_FILE}"
        else
            JS_URL="${URL}/${JS_FILE}"
        fi

        echo "  - $JS_FILE"

        # Download the JS file
        JS_FILENAME=$(basename "$JS_FILE")
        curl -s "$JS_URL" -o "$TEMP_DIR/$JS_FILENAME" 2>/dev/null

        if [ -f "$TEMP_DIR/$JS_FILENAME" ]; then
            SIZE=$(stat -f%z "$TEMP_DIR/$JS_FILENAME" 2>/dev/null || stat -c%s "$TEMP_DIR/$JS_FILENAME" 2>/dev/null)
            echo "    Downloaded: ${SIZE} bytes"
        fi
    done
fi

echo ""

# ==============================================================================
# TEST 3: Enterprise Features in JavaScript
# ==============================================================================
echo "--------------------------------------------------------------------------------"
echo "TEST 3: ENTERPRISE FEATURES IN JAVASCRIPT CODE"
echo "--------------------------------------------------------------------------------"

# Search for enterprise features in JavaScript bundles
ENCRYPTION_FOUND=0
VERSIONING_FOUND=0
AUDIT_FOUND=0

for JS_FILE in "$TEMP_DIR"/*.js; do
    if [ -f "$JS_FILE" ]; then
        # Check for encryption
        if grep -qi "encrypt\|aes\|crypto" "$JS_FILE" 2>/dev/null; then
            ENCRYPTION_FOUND=1
        fi

        # Check for versioning
        if grep -qi "version\|revision\|history" "$JS_FILE" 2>/dev/null; then
            VERSIONING_FOUND=1
        fi

        # Check for audit
        if grep -qi "audit\|activity.*log\|compliance" "$JS_FILE" 2>/dev/null; then
            AUDIT_FOUND=1
        fi
    fi
done

# Report findings
if [ $ENCRYPTION_FOUND -eq 1 ]; then
    echo "✓ Encryption: References found in JavaScript"
    grep -ioh ".{0,60}encrypt.{0,60}" "$TEMP_DIR"/*.js 2>/dev/null | head -2 | sed 's/^/  Sample: /'
else
    echo "✗ Encryption: NOT FOUND in JavaScript"
fi
echo ""

if [ $VERSIONING_FOUND -eq 1 ]; then
    echo "✓ Versioning: References found in JavaScript"
    grep -ioh ".{0,60}version.{0,60}" "$TEMP_DIR"/*.js 2>/dev/null | head -2 | sed 's/^/  Sample: /'
else
    echo "✗ Versioning: NOT FOUND in JavaScript"
fi
echo ""

if [ $AUDIT_FOUND -eq 1 ]; then
    echo "✓ Audit Logs: References found in JavaScript"
    grep -ioh ".{0,60}audit.{0,60}" "$TEMP_DIR"/*.js 2>/dev/null | head -2 | sed 's/^/  Sample: /'
else
    echo "✗ Audit Logs: NOT FOUND in JavaScript"
fi
echo ""

# ==============================================================================
# TEST 4: API Endpoints
# ==============================================================================
echo "--------------------------------------------------------------------------------"
echo "TEST 4: API ENDPOINTS"
echo "--------------------------------------------------------------------------------"

# Test API base
API_CODE=$(curl -s -o "$TEMP_DIR/api-response.json" -w "%{http_code}" "$API_URL" 2>/dev/null)
echo "API Base ($API_URL): HTTP $API_CODE"

# Test auth endpoint
AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{}' 2>/dev/null)
echo "Auth Login Endpoint: HTTP $AUTH_CODE"

# Test files endpoint (should require auth)
FILES_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/files" 2>/dev/null)
echo "Files Endpoint: HTTP $FILES_CODE"

# Determine API health
if [ "$API_CODE" = "404" ] || [ "$API_CODE" = "200" ]; then
    echo "✓ API server is responding"
else
    echo "⚠ API server returned unexpected code: $API_CODE"
fi

echo ""

# ==============================================================================
# TEST 5: Console Errors Simulation
# ==============================================================================
echo "--------------------------------------------------------------------------------"
echo "TEST 5: STATIC ANALYSIS (Limited without browser)"
echo "--------------------------------------------------------------------------------"

echo "⚠ NOTE: Full console error detection requires a headless browser."
echo "  This test performs static analysis only."
echo ""

# Check for common error patterns in JS
ERROR_PATTERNS="throw new Error|console\.error|\.catch\(|undefined is not"
ERROR_COUNT=$(grep -ci "$ERROR_PATTERNS" "$TEMP_DIR"/*.js 2>/dev/null || echo "0")

echo "Error handling patterns in code: $ERROR_COUNT"
echo "(This is normal - it shows error handling exists)"
echo ""

# Check CSS
CSS_FILES=$(grep -oP '(?<=href=")[^"]*\.css' "$TEMP_DIR/index.html")
if [ -n "$CSS_FILES" ]; then
    echo "✓ CSS files found: $(echo "$CSS_FILES" | wc -l)"
else
    echo "⚠ No CSS files found"
fi

echo ""

# ==============================================================================
# TEST 6: Security Headers
# ==============================================================================
echo "--------------------------------------------------------------------------------"
echo "TEST 6: SECURITY HEADERS"
echo "--------------------------------------------------------------------------------"

HEADERS=$(curl -s -I "$URL" 2>/dev/null)

echo "$HEADERS" | grep -i "x-frame-options\|x-content-type-options\|strict-transport-security\|content-security-policy" || echo "⚠ No security headers detected"

echo ""

# ==============================================================================
# SUMMARY
# ==============================================================================
echo "--------------------------------------------------------------------------------"
echo "SUMMARY"
echo "--------------------------------------------------------------------------------"

FEATURES_FOUND=$((ENCRYPTION_FOUND + VERSIONING_FOUND + AUDIT_FOUND))

echo "Frontend Status:"
if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✓ Page loads successfully (HTTP $HTTP_CODE)"
else
    echo "  ✗ Page load failed (HTTP $HTTP_CODE)"
fi

echo ""
echo "Enterprise Features in JavaScript:"
echo "  - Encryption: $([ $ENCRYPTION_FOUND -eq 1 ] && echo "✓ Found" || echo "✗ Not Found")"
echo "  - Versioning: $([ $VERSIONING_FOUND -eq 1 ] && echo "✓ Found" || echo "✗ Not Found")"
echo "  - Audit Logs: $([ $AUDIT_FOUND -eq 1 ] && echo "✓ Found" || echo "✗ Not Found")"
echo "  Total: $FEATURES_FOUND/3 features detected"

echo ""
echo "API Status:"
if [ "$API_CODE" = "404" ] || [ "$API_CODE" = "200" ]; then
    echo "  ✓ API server responding"
else
    echo "  ✗ API server issues detected"
fi

echo ""
echo "Overall Assessment:"
if [ "$HTTP_CODE" = "200" ] && [ $FEATURES_FOUND -ge 2 ] && { [ "$API_CODE" = "404" ] || [ "$API_CODE" = "200" ]; }; then
    echo "  ✓ DEPLOYMENT APPEARS HEALTHY"
    echo "    - Frontend loads"
    echo "    - Enterprise features present in code"
    echo "    - API accessible"
elif [ "$HTTP_CODE" = "200" ]; then
    echo "  ⚠ DEPLOYMENT FUNCTIONAL BUT INCOMPLETE"
    echo "    - Frontend loads but enterprise features may not be visible"
    echo "    - Recommended: Use headless browser to verify UI visibility"
else
    echo "  ✗ DEPLOYMENT HAS ISSUES"
    echo "    - Frontend or API problems detected"
fi

echo ""
echo "Limitations of this test:"
echo "  • Cannot detect runtime JavaScript errors (needs headless browser)"
echo "  • Cannot verify UI visibility of features (needs browser rendering)"
echo "  • Cannot test user interactions (needs browser automation)"
echo ""
echo "For complete testing, install Puppeteer or Playwright and run a browser-based test."

echo ""
echo "================================================================================"
echo "Report saved to: $OUTPUT_FILE"
echo "Test artifacts in: $TEMP_DIR"
echo "================================================================================"

# Cleanup option (commented out to allow inspection)
# rm -rf "$TEMP_DIR"
