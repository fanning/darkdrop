#!/usr/bin/env node

const Database = require('../database');
const crypto = require('crypto');
const path = require('path');

async function createAgent(name, accountId, role = 'write') {
    const db = new Database(path.join(__dirname, '../database/darkdrop.db'));

    try {
        await db.initialize();

        // Check if account exists
        const account = await db.getAccount(accountId);
        if (!account) {
            console.error(`Error: Account '${accountId}' not found`);
            console.log('\nAvailable accounts:');
            const accounts = await db.getAllAccounts();
            accounts.forEach(a => console.log(`  - ${a.id} (${a.name})`));
            process.exit(1);
        }

        // Generate API key
        const apiKey = crypto.randomBytes(32).toString('hex');
        const agentId = crypto.randomUUID();

        // Create agent
        await db.createAgent(agentId, name, apiKey);
        console.log(`\nAgent created successfully!`);
        console.log(`Name: ${name}`);
        console.log(`ID: ${agentId}`);
        console.log(`API Key: ${apiKey}`);

        // Grant permission to account
        const permissionId = crypto.randomUUID();
        await db.createPermission(permissionId, accountId, null, agentId, role);
        console.log(`\nPermission granted to account '${account.name}' with role '${role}'`);

        console.log(`\n=== Configuration ===`);
        console.log(`\nAdd to your MCP config (~/.claude/config.json):`);
        console.log(JSON.stringify({
            mcpServers: {
                darkdrop: {
                    command: "node",
                    args: [path.join(__dirname, "../mcp-server/index.js")],
                    env: {
                        DARKDROP_API_KEY: apiKey,
                        DARKDROP_ACCOUNT_ID: accountId,
                        STORAGE_ROOT: "/var/darkdrop"
                    }
                }
            }
        }, null, 2));

        console.log(`\nOr use as API key:`);
        console.log(`curl -H "x-api-key: ${apiKey}" https://darkdrop.hiveskill.com/files/${accountId}`);

    } catch (error) {
        console.error('Error creating agent:', error.message);
        process.exit(1);
    } finally {
        await db.close();
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: node create-agent.js <agent-name> <account-id> [role]');
    console.log('\nExample:');
    console.log('  node create-agent.js "CustCorp Assistant" custcorp write');
    console.log('\nRoles: read, write, admin (default: write)');
    process.exit(1);
}

const [name, accountId, role] = args;
createAgent(name, accountId, role);
