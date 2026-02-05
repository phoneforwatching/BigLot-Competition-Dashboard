import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestData() {
    console.log('--- Checking Latest daily_stats ---');
    const { data: dailyStats, error: dsError } = await supabase
        .from('daily_stats')
        .select('date, equity, participant_id')
        .order('date', { ascending: false })
        .limit(10);

    if (dsError) console.error('Error fetching daily_stats:', dsError);
    else console.table(dailyStats);

    console.log('\n--- Checking Latest equity_snapshots ---');
    const { data: snapshots, error: sError } = await supabase
        .from('equity_snapshots')
        .select('timestamp, equity, participant_id')
        .order('timestamp', { ascending: false })
        .limit(10);

    if (sError) console.error('Error fetching equity_snapshots:', sError);
    else console.table(snapshots);
}

checkLatestData();
