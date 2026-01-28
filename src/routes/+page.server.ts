import { supabase } from '$lib/supabase';
import { leaderboardData } from '$lib/mock/leaderboard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    // Phase 2: Fetch from Supabase
    console.log('🔍 Home: Starting Supabase fetch...');

    try {
        if (!supabase) {
            console.error('❌ Supabase client is null');
            throw new Error('Supabase client not initialized');
        }

        const { data, error } = await supabase
            .from('daily_stats')
            .select(`
                *,
                participants (*)
            `)
            .order('date', { ascending: false })
            .order('points', { ascending: false });

        console.log('🔍 Home - error:', error);
        console.log('🔍 Home - data count:', data?.length || 0);

        if (!error && data && data.length > 0) {
            console.log('✅ Home: Using real Supabase data!');
            // Filter to keep only the latest entry per participant
            const latestEntries = new Map();
            data.forEach((entry: any) => {
                if (!latestEntries.has(entry.participant_id)) {
                    latestEntries.set(entry.participant_id, entry);
                }
            });

            const uniqueData = Array.from(latestEntries.values());
            return {
                leaderboard: processLeaderboardData(uniqueData, true)
            };
        }
    } catch (e) {
        console.error('Supabase fetch failed, falling back to mock data:', e);
    }

    // Fallback to mock data until DB is ready or if fetch fails
    return {
        leaderboard: processLeaderboardData(leaderboardData, false)
    };
};

/* Helper function to process leaderboard data with new rules */
function processLeaderboardData(data: any[], fromSupabase = false) {
    // 1. Map to base structure
    const mapped = data.map((entry: any) => {
        const stats = fromSupabase ? {
            winRate: entry.win_rate,
            profitFactor: entry.profit_factor,
            maxDrawdown: entry.max_drawdown || 0,
            totalTrades: entry.total_trades,
            avgWin: entry.avg_win,
            avgLoss: entry.avg_loss,
            rrRatio: entry.rr_ratio
        } : entry.stats;

        // Disqualification Rule: Equity <= 0 (Port Blown)
        // If equity is missing, fallback to balance, or default to safe value if mock
        const equity = fromSupabase ? entry.equity : (entry.equityCurve ? entry.equityCurve[entry.equityCurve.length - 1] : 10000); // Mock fallback

        // For Supabase data:
        const isDisqualified = fromSupabase
            ? (
                Number(entry.equity) <= 0 ||
                (entry.max_drawdown !== null && Number(entry.max_drawdown) >= 99) ||
                (entry.participants && entry.participants.is_disqualified === true)
            )
            : (entry.isDisqualified === true || entry.stats.maxDrawdown > 99 || (entry.equityCurve && entry.equityCurve[entry.equityCurve.length - 1] <= 0));

        return {
            id: fromSupabase ? entry.participant_id : entry.id,
            nickname: fromSupabase ? (entry.participants?.nickname || 'Unknown') : entry.nickname,
            points: entry.points,
            profit: entry.profit,
            // balance: entry.balance, // Optional
            // equity: entry.equity,   // Optional
            isDisqualified,
            stats,
            history: fromSupabase ? [] : entry.history,
            equityCurve: fromSupabase ? [] : entry.equityCurve,
        };
    });

    // 2. Separate Active and Disqualified
    const activeInfo = mapped.filter((e: any) => !e.isDisqualified);
    const disqualifiedInfo = mapped.filter((e: any) => e.isDisqualified);

    // 3. Calculate Ranks for Active Users ONLY
    // Rank by Profit
    const profitSorted = [...activeInfo].sort((a, b) => b.profit - a.profit);
    const profitRanks = new Map(profitSorted.map((e, i) => [e.id, i + 1]));

    // Rank by Points (Pips)
    const pointsSorted = [...activeInfo].sort((a, b) => b.points - a.points);
    const pointsRanks = new Map(pointsSorted.map((e, i) => [e.id, i + 1]));

    // 4. Assign Ranks back to objects
    const finalActive = activeInfo.map((e: any) => ({
        ...e,
        rankProfit: profitRanks.get(e.id),
        rankPoints: pointsRanks.get(e.id)
    }));

    // Disqualified users get no rank or special rank
    const finalDisqualified = disqualifiedInfo.map((e: any) => ({
        ...e,
        rankProfit: 999,
        rankPoints: 999
    }));

    // 5. Combine and Sort for Display (Primary Sort: Points/Pips as per request to "use points")
    // But maybe we want a toggle? For now, default to Points High-to-Low for active, then Disqualified.
    return [...finalActive.sort((a, b) => b.points - a.points), ...finalDisqualified];
}
