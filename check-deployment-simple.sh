#!/bin/bash

# DarkDrop Deployment Health Check
# Using curl and basic tools instead of headless browser

URL="https://darkdrop.com"
OUTPUT_FILE="$HOME/darkdrop/deployment-health.txt"
TEMP_HTML="/tmp/darkdrop-page.html"

echo "========================================================================================================" > "$OUTPUT_FILE"
echo "DARKDROP DEPLOYMENT HEALTH CHECK" >> "$OUTPUT_FILE"
echo "========================================================================================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$OUTPUT_FILE"
echo "URL: $URL" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Test basic connectivity
echo "--------------------------------------------------------------------------------" >> "$OUTPUT_FILE"
echo "PAGE LOAD STATUS" >> "$OUTPUT_FILE"
echo "--------------------------------------------------------------------------------" >> "$OUTPUT_FILE"

HTTP_CODE=$(curl -s -o "$TEMP_HTML" -w "%{http_code}" "$URL")
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$URL")
SIZE=$(curl -s -o /dev/null -w "%{size_download}" "$URL")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ SUCCESS - HTTP $HTTP_CODE" >> "$OUTPUT_FILE"
else
    echo "✗ FAILED - HTTP $HTTP_CODE" >> "$OUTPUT_FILE"
fi

echo "Response Time: ${RESPONSE_TIME}s" >> "$OUTPUT_FILE"
echo "Content Size: ${SIZE} bytes" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Check page title
if [ -f "$TEMP_HTML" ]; then
    TITLE=$(grep -oP '(?<=<title>).*?(?=</title>)' "$TEMP_HTML" | head -1)
    echo "Page Title: ${TITLE:-N/A}" >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"

# Check for JavaScript errors in source
echo "--------------------------------------------------------------------------------" >> "$OUTPUT_FILE"
echo "SOURCE CODE ANALYSIS" >> "$OUTPUT_FILE"
echo "--------------------------------------------------------------------------------" >> "$OUTPUT_FILE"

# Check if it's a React/modern app
if grep -q "react" "$TEMP_HTML" 2>/dev/null; then
    echo "✓ React detected in source" >> "$OUTPUT_FILE"
fi

if grep -q "vite" "$TEMP_HTML" 2>/dev/null; then
    echo "✓ Vite build detected" >> "$OUTPUT_FILE"
fi

# Check for error messages in HTML
ERROR_COUNT=$(grep -ci "error\|exception\|failed" "$TEMP_HTML" 2>/dev/null || echo "0")
echo "Potential error references in HTML: $ERROR_COUNT" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Check for enterprise features visibility
echo "--------------------------------------------------------------------------------" >> "$OUTPUT_FILE"
echo "ENTERPRISE FEATURES VISIBILITY" >> "$OUTPUT_FILE"
echo "--------------------------------------------------------------------------------" >> "$OUTPUT_FILE"

# Check for encryption mentions
ENCRYPTION_COUNT=$(grep -ciE "encrypt|encryption|encrypted|security" "$TEMP_HTML" 2>/dev/null || echo "0")
if [ "$ENCRYPTION_COUNT" -gt 0 ]; then
    echo "Encryption: ✓ FOUND ($ENCRYPTION_COUNT references)" >> "$OUTPUT_FILE"
    grep -oiE ".{0,50}encrypt.{0,50}" "$TEMP_HTML" 2>/dev/null | head -3 | sed 's/^/  Sample: /' >> "$OUTPUT_FILE"
else
    echo "Encryption: ✗ NOT FOUND" >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"

# Check for versioning mentions
VERSION_COUNT=$(grep -ciE "version|versioning|history|revision" "$TEMP_HTML" 2>/dev/null || echo "0")
if [ "$VERSION_COUNT" -gt 0 ]; then
    echo "Versioning: ✓ FOUND ($VERSION_COUNT references)" >> "$OUTPUT_FILE"
    grep -oiE ".{0,50}version.{0,50}" "$TEMP_HTML" 2>/dev/null | head -3 | sed 's/^/  Sample: /' >> "$OUTPUT_FILE"
else
    echo "Versioning: ✗ NOT FOUND" >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"

# Check for audit log mentions
AUDIT_COUNT=$(grep -ciE "audit|log|activity|compliance" "$TEMP_HTML" 2>/dev/null || echo "0")
if [ "$AUDIT_COUNT" -gt 0 ]; then
    echo "Audit Logs: ✓ FOUND ($AUDIT_COUNT references)" >> "$OUTPUT_FILE"
    grep -oiE ".{0,50}audit.{0,50}" "$TEMP_HTML" 2>/dev/null | head -3 | sed 's/^/  Sample: /' >> "$OUTPUT_FILE"
else
    echo "Audit Logs: ✗ NOT FOUND" >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"

# Check API endpoint
echo "--------------------------------------------------------------------------------" >> "$OUTPUT_FILE"
echo "API CONNECTIVITY" >> "$OUTPUT_FILE"
echo "--------------------------------------------------------------------------------" >> "$OUTPUT_FILE"

API_URL="https://api.darkdrop.com"
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL")

if [ "$API_CODE" = "200" ] || [ "$API_CODE" = "404" ] || [ "$API_CODE" = "401" ]; then
    echo "✓ API Server Responding - HTTP $API_CODE" >> "$OUTPUT_FILE"
else
    echo "✗ API Server Issue - HTTP $API_CODE" >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"

# Check specific API endpoints
AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/auth/login")
echo "Auth Endpoint (/auth/login): HTTP $AUTH_CODE" >> "$OUTPUT_FILE"

# Test if page has proper meta tags
echo "--------------------------------------------------------------------------------" >> "$OUTPUT_FILE"
echo "SEO & META TAGS" >> "$OUTPUT_FILE"
echo "--------------------------------------------------------------------------------" >> "$OUTPUT_FILE"

META_DESC=$(grep -oP '(?<=<meta name="description" content=").*?(?=")' "$TEMP_HTML" 2>/dev/null | head -1)
if [ -n "$META_DESC" ]; then
    echo "✓ Meta Description: $META_DESC" >> "$OUTPUT_FILE"
else
    echo "⚠ No meta description found" >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"

# Summary
echo "--------------------------------------------------------------------------------" >> "$OUTPUT_FILE"
echo "SUMMARY" >> "$OUTPUT_FILE"
echo "--------------------------------------------------------------------------------" >> "$OUTPUT_FILE"

# Calculate feature visibility
FEATURES_FOUND=0
[ "$ENCRYPTION_COUNT" -gt 0 ] && FEATURES_FOUND=$((FEATURES_FOUND + 1))
[ "$VERSION_COUNT" -gt 0 ] && FEATURES_FOUND=$((FEATURES_FOUND + 1))
[ "$AUDIT_COUNT" -gt 0 ] && FEATURES_FOUND=$((FEATURES_FOUND + 1))

if [ "$HTTP_CODE" = "200" ] && [ "$FEATURES_FOUND" -eq 3 ]; then
    echo "✓ DEPLOYMENT HEALTHY" >> "$OUTPUT_FILE"
    echo "  - Page loads successfully" >> "$OUTPUT_FILE"
    echo "  - All enterprise features mentioned in HTML" >> "$OUTPUT_FILE"
elif [ "$HTTP_CODE" = "200" ]; then
    echo "⚠ DEPLOYMENT PARTIAL" >> "$OUTPUT_FILE"
    echo "  - Page loads successfully" >> "$OUTPUT_FILE"
    echo "  - Only $FEATURES_FOUND/3 enterprise features found in HTML" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "  ⚠ WARNING: Enterprise features may not be visible to users" >> "$OUTPUT_FILE"
else
    echo "✗ DEPLOYMENT HAS ISSUES" >> "$OUTPUT_FILE"
    echo "  - HTTP Status: $HTTP_CODE" >> "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE"
echo "NOTE: This is a static HTML analysis. For full JavaScript execution and console" >> "$OUTPUT_FILE"
echo "error detection, a headless browser (Puppeteer/Playwright) would be needed." >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "HTML snapshot saved to: $TEMP_HTML" >> "$OUTPUT_FILE"
echo "=================================================================================" >> "$OUTPUT_FILE"

# Clean up
echo ""
echo "✓ Health check complete. Report written to: $OUTPUT_FILE"
cat "$OUTPUT_FILE"
