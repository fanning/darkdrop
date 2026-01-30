#!/usr/bin/env node

const Database = require('../database');
const crypto = require('crypto');
const path = require('path');

async function grantUserAccess(email, accountId, role = 'write') {
    const db = new Database(path.join(__dirname, '../database/darkdrop.db'));

    try {
        await db.initialize();

        // Check if user exists
        const user = await db.getUserByEmail(email);
        if (!user) {
            console.error(`Error: User with email '${email}' not found`);
            console.log('\nUser must register first at https://darkdrop.hiveskill.com/register');
            process.exit(1);
        }

        // Check if account exists
        const account = await db.getAccount(accountId);
        if (!account) {
            console.error(`Error: Account '${accountId}' not found`);
            console.log('\nAvailable accounts:');
            const accounts = await db.getAllAccounts();
            accounts.forEach(a => console.log(`  - ${a.id} (${a.name})`));
            process.exit(1);
        }

        // Grant permission
        const permissionId = crypto.randomUUID();
        await db.createPermission(permissionId, accountId, user.id, null, role);

        console.log(`\nPermission granted successfully!`);
        console.log(`User: ${user.name} (${user.email})`);
        console.log(`Account: ${account.name} (${account.id})`);
        console.log(`Role: ${role}`);

    } catch (error) {
        console.error('Error granting permission:', error.message);
        process.exit(1);
    } finally {
        await db.close();
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: node create-user-permission.js <user-email> <account-id> [role]');
    console.log('\nExample:');
    console.log('  node create-user-permission.js user@example.com custcorp write');
    console.log('\nRoles: read, write, admin (default: write)');
    process.exit(1);
}

const [email, accountId, role] = args;
grantUserAccess(email, accountId, role);
