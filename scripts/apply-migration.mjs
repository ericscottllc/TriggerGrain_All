#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env file manually
const envPath = join(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env');
  process.exit(1);
}

console.log('🔧 Supabase Migration Tool');
console.log('='.repeat(50));
console.log('Supabase URL:', supabaseUrl);
console.log('');

async function applyMigration() {
  try {
    console.log('📖 Reading migration file...');
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251030185817_fix_get_user_info_final.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('✓ Migration file loaded');
    console.log('  Size:', migrationSQL.length, 'characters');
    console.log('');

    // Note: The Supabase JS client doesn't have direct SQL execution for security reasons
    // You need to either:
    // 1. Use the Supabase Dashboard SQL Editor
    // 2. Use the Supabase CLI: supabase db push
    // 3. Use a service role key with elevated permissions

    console.log('⚠️  IMPORTANT: Manual Migration Required');
    console.log('='.repeat(50));
    console.log('');
    console.log('The Supabase JavaScript client does not support direct SQL execution');
    console.log('for security reasons. Please apply the migration using one of these methods:');
    console.log('');
    console.log('METHOD 1: Supabase Dashboard (Recommended)');
    console.log('-'.repeat(50));
    console.log('1. Go to:', supabaseUrl.replace('https://', 'https://app.supabase.com/project/').replace('.supabase.co', ''));
    console.log('2. Navigate to: SQL Editor');
    console.log('3. Create a new query');
    console.log('4. Copy the contents from:');
    console.log('   supabase/migrations/20251030185817_fix_get_user_info_final.sql');
    console.log('5. Paste and click "Run"');
    console.log('');
    console.log('METHOD 2: Supabase CLI');
    console.log('-'.repeat(50));
    console.log('1. Install CLI: npm install -g supabase');
    console.log('2. Link project: supabase link --project-ref rolrhhfiakmsmxknutac');
    console.log('3. Push migrations: supabase db push');
    console.log('');
    console.log('METHOD 3: Copy SQL to Clipboard');
    console.log('-'.repeat(50));
    console.log('The SQL migration is printed below. Copy and paste into Supabase Dashboard:');
    console.log('');
    console.log('='.repeat(50));
    console.log(migrationSQL);
    console.log('='.repeat(50));
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applyMigration();
