const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function checkDeployment() {
  const results = {
    timestamp: new Date().toISOString(),
    url: 'https://darkdrop.com',
    consoleErrors: [],
    consoleWarnings: [],
    consoleLogs: [],
    networkErrors: [],
    pageLoadSuccess: false,
    enterpriseFeatures: {
      encryption: { visible: false, details: '' },
      versioning: { visible: false, details: '' },
      auditLogs: { visible: false, details: '' }
    },
    pageTitle: '',
    screenshot: 'deployment-screenshot.png',
    errors: []
  };

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();

      if (type === 'error') {
        results.consoleErrors.push(text);
      } else if (type === 'warning') {
        results.consoleWarnings.push(text);
      } else {
        results.consoleLogs.push(text);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      results.errors.push(`Page Error: ${error.message}`);
    });

    // Capture failed requests
    page.on('requestfailed', request => {
      results.networkErrors.push({
        url: request.url(),
        failure: request.failure().errorText
      });
    });

    console.log('Navigating to https://agent.darkdrop.com...');

    // Navigate to the page
    const response = await page.goto('https://agent.darkdrop.com', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    results.pageLoadSuccess = response.ok();
    results.pageTitle = await page.title();

    console.log(`Page loaded: ${response.ok()}, Status: ${response.status()}`);
    console.log(`Page title: ${results.pageTitle}`);

    // Wait a bit for dynamic content to load
    await page.waitForTimeout(3000);

    // Check for enterprise features in the UI
    console.log('Checking for enterprise features...');

    // Check for encryption-related UI elements
    const encryptionElements = await page.evaluate(() => {
      const elements = [];
      const searchTerms = ['encrypt', 'encryption', 'encrypted', 'security'];

      // Search in all text content
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.toLowerCase();
        searchTerms.forEach(term => {
          if (text.includes(term)) {
            elements.push({
              text: node.textContent.trim(),
              parent: node.parentElement?.tagName,
              visible: node.parentElement?.offsetParent !== null
            });
          }
        });
      }

      return elements;
    });

    if (encryptionElements.length > 0) {
      results.enterpriseFeatures.encryption.visible = true;
      results.enterpriseFeatures.encryption.details = `Found ${encryptionElements.length} references: ${JSON.stringify(encryptionElements.slice(0, 3))}`;
    }

    // Check for versioning-related UI elements
    const versioningElements = await page.evaluate(() => {
      const elements = [];
      const searchTerms = ['version', 'versioning', 'history', 'revision'];

      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.toLowerCase();
        searchTerms.forEach(term => {
          if (text.includes(term)) {
            elements.push({
              text: node.textContent.trim(),
              parent: node.parentElement?.tagName,
              visible: node.parentElement?.offsetParent !== null
            });
          }
        });
      }

      return elements;
    });

    if (versioningElements.length > 0) {
      results.enterpriseFeatures.versioning.visible = true;
      results.enterpriseFeatures.versioning.details = `Found ${versioningElements.length} references: ${JSON.stringify(versioningElements.slice(0, 3))}`;
    }

    // Check for audit log-related UI elements
    const auditLogElements = await page.evaluate(() => {
      const elements = [];
      const searchTerms = ['audit', 'log', 'activity', 'compliance'];

      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.toLowerCase();
        searchTerms.forEach(term => {
          if (text.includes(term)) {
            elements.push({
              text: node.textContent.trim(),
              parent: node.parentElement?.tagName,
              visible: node.parentElement?.offsetParent !== null
            });
          }
        });
      }

      return elements;
    });

    if (auditLogElements.length > 0) {
      results.enterpriseFeatures.auditLogs.visible = true;
      results.enterpriseFeatures.auditLogs.details = `Found ${auditLogElements.length} references: ${JSON.stringify(auditLogElements.slice(0, 3))}`;
    }

    // Get page HTML snapshot
    const bodyText = await page.evaluate(() => document.body.innerText);

    // Take a screenshot
    await page.screenshot({
      path: path.join(__dirname, 'deployment-screenshot.png'),
      fullPage: true
    });

    console.log('Screenshot saved to deployment-screenshot.png');

  } catch (error) {
    results.errors.push(`Fatal Error: ${error.message}`);
    console.error('Error during check:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Generate report
  const report = generateReport(results);

  // Write to file
  fs.writeFileSync(
    path.join(__dirname, 'deployment-health.txt'),
    report,
    'utf8'
  );

  console.log('\nReport written to deployment-health.txt');
  console.log(report);
}

function generateReport(results) {
  const lines = [];

  lines.push('='.repeat(80));
  lines.push('DARKDROP DEPLOYMENT HEALTH CHECK');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(`Timestamp: ${results.timestamp}`);
  lines.push(`URL: ${results.url}`);
  lines.push('');

  // Page Load Status
  lines.push('-'.repeat(80));
  lines.push('PAGE LOAD STATUS');
  lines.push('-'.repeat(80));
  lines.push(`Status: ${results.pageLoadSuccess ? '✓ SUCCESS' : '✗ FAILED'}`);
  lines.push(`Page Title: ${results.pageTitle || 'N/A'}`);
  lines.push('');

  // Console Errors
  lines.push('-'.repeat(80));
  lines.push('CONSOLE ERRORS');
  lines.push('-'.repeat(80));
  if (results.consoleErrors.length === 0) {
    lines.push('✓ No console errors detected');
  } else {
    lines.push(`✗ Found ${results.consoleErrors.length} console error(s):`);
    results.consoleErrors.forEach((error, i) => {
      lines.push(`  ${i + 1}. ${error}`);
    });
  }
  lines.push('');

  // Console Warnings
  lines.push('-'.repeat(80));
  lines.push('CONSOLE WARNINGS');
  lines.push('-'.repeat(80));
  if (results.consoleWarnings.length === 0) {
    lines.push('✓ No console warnings detected');
  } else {
    lines.push(`⚠ Found ${results.consoleWarnings.length} console warning(s):`);
    results.consoleWarnings.slice(0, 10).forEach((warning, i) => {
      lines.push(`  ${i + 1}. ${warning}`);
    });
    if (results.consoleWarnings.length > 10) {
      lines.push(`  ... and ${results.consoleWarnings.length - 10} more`);
    }
  }
  lines.push('');

  // Network Errors
  lines.push('-'.repeat(80));
  lines.push('NETWORK ERRORS');
  lines.push('-'.repeat(80));
  if (results.networkErrors.length === 0) {
    lines.push('✓ No network errors detected');
  } else {
    lines.push(`✗ Found ${results.networkErrors.length} network error(s):`);
    results.networkErrors.forEach((error, i) => {
      lines.push(`  ${i + 1}. ${error.url}`);
      lines.push(`      Error: ${error.failure}`);
    });
  }
  lines.push('');

  // Enterprise Features
  lines.push('-'.repeat(80));
  lines.push('ENTERPRISE FEATURES VISIBILITY');
  lines.push('-'.repeat(80));

  lines.push(`Encryption: ${results.enterpriseFeatures.encryption.visible ? '✓ VISIBLE' : '✗ NOT FOUND'}`);
  if (results.enterpriseFeatures.encryption.details) {
    lines.push(`  ${results.enterpriseFeatures.encryption.details}`);
  }
  lines.push('');

  lines.push(`Versioning: ${results.enterpriseFeatures.versioning.visible ? '✓ VISIBLE' : '✗ NOT FOUND'}`);
  if (results.enterpriseFeatures.versioning.details) {
    lines.push(`  ${results.enterpriseFeatures.versioning.details}`);
  }
  lines.push('');

  lines.push(`Audit Logs: ${results.enterpriseFeatures.auditLogs.visible ? '✓ VISIBLE' : '✗ NOT FOUND'}`);
  if (results.enterpriseFeatures.auditLogs.details) {
    lines.push(`  ${results.enterpriseFeatures.auditLogs.details}`);
  }
  lines.push('');

  // Page Errors
  if (results.errors.length > 0) {
    lines.push('-'.repeat(80));
    lines.push('PAGE ERRORS');
    lines.push('-'.repeat(80));
    results.errors.forEach((error, i) => {
      lines.push(`  ${i + 1}. ${error}`);
    });
    lines.push('');
  }

  // Summary
  lines.push('-'.repeat(80));
  lines.push('SUMMARY');
  lines.push('-'.repeat(80));

  const totalIssues = results.consoleErrors.length + results.networkErrors.length + results.errors.length;
  const featuresFound = [
    results.enterpriseFeatures.encryption.visible,
    results.enterpriseFeatures.versioning.visible,
    results.enterpriseFeatures.auditLogs.visible
  ].filter(Boolean).length;

  if (results.pageLoadSuccess && totalIssues === 0 && featuresFound === 3) {
    lines.push('✓ DEPLOYMENT HEALTHY');
    lines.push('  - Page loads successfully');
    lines.push('  - No critical errors detected');
    lines.push('  - All enterprise features visible');
  } else {
    lines.push('⚠ DEPLOYMENT HAS ISSUES');
    if (!results.pageLoadSuccess) {
      lines.push('  - Page failed to load');
    }
    if (totalIssues > 0) {
      lines.push(`  - ${totalIssues} error(s) detected`);
    }
    if (featuresFound < 3) {
      lines.push(`  - Only ${featuresFound}/3 enterprise features found`);
    }
  }

  lines.push('');
  lines.push(`Screenshot saved to: ${results.screenshot}`);
  lines.push('='.repeat(80));

  return lines.join('\n');
}

checkDeployment().catch(console.error);
