#!/usr/bin/env node

const Database = require('../database');
const path = require('path');
const fs = require('fs').promises;

async function createAccount(id, name, domain, storageQuotaGB = 100) {
    const db = new Database(path.join(__dirname, '../database/darkdrop.db'));
    const STORAGE_ROOT = process.env.STORAGE_ROOT || '/var/darkdrop';

    try {
        await db.initialize();

        // Check if account already exists
        const existing = await db.getAccount(id);
        if (existing) {
            console.error(`Error: Account with ID '${id}' already exists`);
            process.exit(1);
        }

        // Create account
        const storageQuota = storageQuotaGB * 1024 * 1024 * 1024; // Convert GB to bytes
        await db.createAccount(id, name, domain);

        console.log(`\nAccount created successfully!`);
        console.log(`ID: ${id}`);
        console.log(`Name: ${name}`);
        console.log(`Domain: ${domain}`);
        console.log(`Storage Quota: ${storageQuotaGB} GB`);

        // Create storage directories
        const accountPath = path.join(STORAGE_ROOT, id);
        await fs.mkdir(path.join(accountPath, 'agents'), { recursive: true });
        await fs.mkdir(path.join(accountPath, 'users'), { recursive: true });
        await fs.mkdir(path.join(accountPath, 'shared'), { recursive: true });

        console.log(`\nStorage directories created at: ${accountPath}`);

        console.log(`\nNext steps:`);
        console.log(`1. Grant access to users: node scripts/create-user-permission.js user@example.com ${id} write`);
        console.log(`2. Create agent: node scripts/create-agent.js "Agent Name" ${id} write`);

    } catch (error) {
        console.error('Error creating account:', error.message);
        process.exit(1);
    } finally {
        await db.close();
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
    console.log('Usage: node create-account.js <account-id> <account-name> <domain> [storage-quota-gb]');
    console.log('\nExample:');
    console.log('  node create-account.js mycompany "My Company" mycompany.com 200');
    console.log('\nDefaults:');
    console.log('  storage-quota-gb: 100 GB');
    process.exit(1);
}

const [id, name, domain, storageQuotaGB] = args;
createAccount(id, name, domain, storageQuotaGB ? parseInt(storageQuotaGB) : 100);
