import { supabase } from '$lib/supabase';
import { leaderboardData } from '$lib/mock/leaderboard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    // Phase 2: Fetch from Supabase
    console.log('🔍 Leaderboard: Starting Supabase fetch...');
    console.log('🔍 Supabase client exists:', !!supabase);

    try {
        if (!supabase) {
            console.error('❌ Supabase client is null/undefined');
            throw new Error('Supabase client not initialized');
        }

        console.log('🔍 Fetching daily_stats with participants...');
        const { data, error } = await supabase
            .from('daily_stats')
            .select(`
                *,
                participants (nickname)
            `)
            .order('date', { ascending: false })
            .order('points', { ascending: false });

        console.log('🔍 Supabase response - error:', error);
        console.log('🔍 Supabase response - data count:', data?.length || 0);

        if (!error && data && data.length > 0) {
            console.log('✅ Using real Supabase data!');
            // Filter to keep only the latest entry per participant
            const latestEntries = new Map();
            data.forEach((entry: any) => {
                if (!latestEntries.has(entry.participant_id)) {
                    latestEntries.set(entry.participant_id, entry);
                }
            });

            const sortedData = Array.from(latestEntries.values()).sort((a: any, b: any) => {
                const aDisqualified = (a.max_drawdown || 0) > 30;
                const bDisqualified = (b.max_drawdown || 0) > 30;

                if (aDisqualified !== bDisqualified) {
                    return aDisqualified ? 1 : -1; // Disqualified goes to bottom
                }
                return b.points - a.points;
            });

            return {
                leaderboard: sortedData.map((entry: any) => ({
                    id: entry.participant_id,
                    nickname: entry.participants?.nickname || 'Unknown',
                    points: entry.points,
                    profit: entry.profit,
                    balance: entry.balance,
                    equity: entry.equity,
                    isDisqualified: (entry.max_drawdown || 0) > 30,
                    stats: {
                        winRate: entry.win_rate,
                        profitFactor: entry.profit_factor,
                        maxDrawdown: entry.max_drawdown || 0,
                        totalTrades: entry.total_trades,
                        avgWin: entry.avg_win,
                        avgLoss: entry.avg_loss
                    },
                    history: [], // List view doesn't need history
                    equityCurve: [] // List view doesn't need curve
                }))
            };
        }
    } catch (e) {
        console.error('Supabase fetch failed, falling back to mock data:', e);
    }

    // Fallback to mock data until DB is ready or if fetch fails
    const processedMockData = leaderboardData.map(entry => ({
        ...entry,
        isDisqualified: (entry.stats.maxDrawdown || 0) > 30
    })).sort((a, b) => {
        const aDisqualified = a.isDisqualified;
        const bDisqualified = b.isDisqualified;

        if (aDisqualified !== bDisqualified) {
            return aDisqualified ? 1 : -1; // Disqualified goes to bottom
        }

        // Normal sort
        if (b.points !== a.points) return b.points - a.points;
        return b.profit - a.profit;
    });

    return {
        leaderboard: processedMockData
    };
};
