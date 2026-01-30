#!/usr/bin/env node

const Database = require('../database');
const path = require('path');

async function listAccounts() {
    const db = new Database(path.join(__dirname, '../database/darkdrop.db'));

    try {
        await db.initialize();

        const accounts = await db.getAllAccounts();

        if (accounts.length === 0) {
            console.log('No accounts found.');
            console.log('\nCreate an account with:');
            console.log('  node scripts/create-account.js <id> <name> <domain>');
            return;
        }

        console.log(`\nFound ${accounts.length} account(s):\n`);

        for (const account of accounts) {
            const usedMB = Math.round(account.storage_used / 1024 / 1024);
            const quotaMB = Math.round(account.storage_quota / 1024 / 1024);
            const usedPercent = Math.round((account.storage_used / account.storage_quota) * 100);

            console.log(`ID: ${account.id}`);
            console.log(`Name: ${account.name}`);
            console.log(`Domain: ${account.domain}`);
            console.log(`Status: ${account.status}`);
            console.log(`Storage: ${usedMB} MB / ${quotaMB} MB (${usedPercent}%)`);
            console.log(`Created: ${account.created_at}`);
            console.log('---');
        }

    } catch (error) {
        console.error('Error listing accounts:', error.message);
        process.exit(1);
    } finally {
        await db.close();
    }
}

listAccounts();
