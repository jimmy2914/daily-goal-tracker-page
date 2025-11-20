```
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function displayMigration() {
  try {
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20251120200920_add_assigned_date.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    
    console.log('\n📋 Migration SQL to run in Supabase Dashboard:\n');
    console.log('Please run this SQL manually in your Supabase dashboard:');
    console.log('1. Go to: https://supabase.com/dashboard/project/fhpalvabtdcqwzarjtgz/sql');
    console.log('2. Copy and paste the following SQL:\n');
    console.log('---START SQL---');
    console.log(sql);
    console.log('---END SQL---');
    console.log('\n3. Click "Run" to execute the migration\n');
    
  } catch (error) {
    console.error('Error reading migration file:', error);
    process.exit(1);
  }
}

displayMigration();
```
