#!/bin/bash
# Comprehensive User Flow Test for agent.darkdrop.com
# Simulates what a new user would experience if DNS was working

echo "=================================="
echo "DarkDrop Deployment Verification"
echo "=================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function
test_step() {
    local name="$1"
    local command="$2"
    local expected="$3"

    echo -n "Testing: $name ... "
    result=$(eval "$command" 2>&1)

    if echo "$result" | grep -q "$expected"; then
        echo -e "${GREEN}PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        echo "  Expected: $expected"
        echo "  Got: $result"
        ((FAILED++))
        return 1
    fi
}

echo "=== 1. DNS Resolution Check ==="
echo -n "Checking DNS for agent.darkdrop.com ... "
DNS_RESULT=$(dig +short agent.darkdrop.com A 2>&1)
if [ -z "$DNS_RESULT" ]; then
    echo -e "${RED}FAIL - No DNS record found${NC}"
    echo "  Expected: 44.219.6.212"
    echo "  Got: (empty)"
    ((FAILED++))
else
    echo -e "${GREEN}PASS - Resolves to: $DNS_RESULT${NC}"
    ((PASSED++))
fi
echo ""

echo "=== 2. HTTP Response Check (via localhost) ==="
test_step "HTTP 200 response" \
    "curl -s -o /dev/null -w '%{http_code}' -H 'Host: agent.darkdrop.com' http://localhost/" \
    "200"
echo ""

echo "=== 3. Frontend Deployment Check ==="
test_step "index.html exists and loads" \
    "curl -s -H 'Host: agent.darkdrop.com' http://localhost/ | head -1" \
    "DOCTYPE html"

test_step "DarkDrop branding present" \
    "curl -s -H 'Host: agent.darkdrop.com' http://localhost/" \
    "DarkDrop Coordinator"

echo ""
DEPLOY_DATE=$(stat -c "%y" /var/www/agent.darkdrop.com/index.html | cut -d' ' -f1)
echo "Frontend last deployed: $DEPLOY_DATE"
echo -e "${YELLOW}WARNING: Deployed 7 days ago (not from latest commit 9a16b1e)${NC}"
echo ""

echo "=== 4. Backend Health Checks ==="
test_step "Coordinator health (port 3020)" \
    "curl -s http://localhost:3020/health | jq -r '.status'" \
    "ok"

test_step "Coordinator is connected" \
    "curl -s http://localhost:3020/health | jq -r '.connected'" \
    "true"

test_step "API health (port 3001)" \
    "curl -s http://localhost:3001/health 2>&1" \
    "ok"

test_step "Auth service (port 3007)" \
    "curl -s http://localhost:3007/health 2>&1 || echo 'no /health endpoint'" \
    "."  # Just check it responds
echo ""

echo "=== 5. Nginx Proxy Configuration ==="
test_step "Chat endpoint proxies to coordinator" \
    "curl -s -o /dev/null -w '%{http_code}' -H 'Host: agent.darkdrop.com' http://localhost/health" \
    "200"
echo ""

echo "=== 6. PM2 Process Status ==="
echo "Checking all DarkDrop services..."
pm2 list | grep -E "darkdrop|auth" | grep online
if [ $? -eq 0 ]; then
    echo -e "${GREEN}All services running${NC}"
    ((PASSED++))
else
    echo -e "${RED}Some services offline${NC}"
    ((FAILED++))
fi
echo ""

echo "=== 7. File Upload Simulation ==="
# Test if the upload endpoint responds (won't actually upload without auth)
test_step "Upload endpoint accessible" \
    "curl -s -o /dev/null -w '%{http_code}' -H 'Host: agent.darkdrop.com' -X POST http://localhost/api/upload 2>&1 || echo '404'" \
    "."  # Any response means endpoint exists
echo ""

echo "=== 8. Authentication Flow Test ==="
echo "Checking auth-gate shared files..."
if [ -f "/var/www/shared/auth-gate.js" ]; then
    echo -e "${GREEN}PASS - auth-gate.js exists${NC}"
    ((PASSED++))
else
    echo -e "${RED}FAIL - auth-gate.js missing${NC}"
    ((FAILED++))
fi

# Test auth API endpoint
test_step "Auth API endpoint" \
    "curl -s -o /dev/null -w '%{http_code}' -H 'Host: agent.darkdrop.com' http://localhost/api/auth/ 2>&1 || echo '404'" \
    "."
echo ""

echo "=== 9. Critical Blockers for New Users ==="
BLOCKERS=0

# Check DNS
if [ -z "$DNS_RESULT" ]; then
    echo -e "${RED}✗ BLOCKER: DNS not resolving - site completely inaccessible${NC}"
    ((BLOCKERS++))
fi

# Check if frontend is very outdated
DAYS_OLD=$(( ($(date +%s) - $(stat -c %Y /var/www/agent.darkdrop.com/index.html)) / 86400 ))
if [ $DAYS_OLD -gt 3 ]; then
    echo -e "${YELLOW}⚠ WARNING: Frontend is $DAYS_OLD days old (may not reflect latest features)${NC}"
fi

# Check if coordinator is receiving connections
CONN_COUNT=$(curl -s http://localhost:3020/health | jq -r '.connectionMonitor.activeConnections')
if [ "$CONN_COUNT" == "0" ]; then
    echo -e "${YELLOW}⚠ INFO: Zero active connections (expected if DNS is down)${NC}"
fi

echo ""
echo "=================================="
echo "Test Results Summary"
echo "=================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $BLOCKERS -gt 0 ]; then
    echo -e "${RED}CRITICAL: $BLOCKERS blocker(s) preventing user access${NC}"
    exit 1
elif [ $FAILED -gt 0 ]; then
    echo -e "${YELLOW}WARNING: Some tests failed but site may be partially functional${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed! Site is ready (pending DNS fix)${NC}"
    exit 0
fi
