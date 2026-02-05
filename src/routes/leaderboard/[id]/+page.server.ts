import { supabase } from '$lib/supabase';
import { error } from '@sveltejs/kit';
import { leaderboardData } from '$lib/mock/leaderboard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const { id } = params;

    // Phase 2: Fetch from Supabase
    try {
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        const { data: participant, error: pError } = await supabase
            .from('participants')
            .select('*')
            .eq('id', id)
            .single();


        if (pError || !participant) {
            console.error(`Participant fetch failed for ID ${id}:`, pError);
            throw new Error(pError?.message || 'Participant not found');
        }

        if (participant) {
            // Fetch latest stats
            const { data: stats, error: sError } = await supabase
                .from('daily_stats')
                .select('*')
                .eq('participant_id', id)
                .order('date', { ascending: false })
                .limit(1)
                .single();

            if (sError) console.error(`Stats fetch error for ID ${id}:`, sError);

            // Fetch history
            const { data: history, error: hError } = await supabase
                .from('trades')
                .select('*')
                .eq('participant_id', id)
                .order('close_time', { ascending: false })
                .limit(50);

            if (hError) console.error(`Trades fetch error for ID ${id}:`, hError);

            // Fetch equity curve (all daily stats - for fallback)
            const { data: equityData, error: eError } = await supabase
                .from('daily_stats')
                .select('equity, date')
                .eq('participant_id', id)
                .order('date', { ascending: true });

            if (eError) console.error(`Equity curve fetch error for ID ${id}:`, eError);

            // Fetch detailed equity snapshots (MyFxBook-style)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: equitySnapshots, error: esError } = await supabase
                .from('equity_snapshots')
                .select('timestamp, balance, equity, floating_pl')
                .eq('participant_id', id)
                .gte('timestamp', thirtyDaysAgo.toISOString())
                .order('timestamp', { ascending: false })
                .limit(5000);

            if (esError) console.error(`Equity snapshots fetch error for ID ${id}:`, esError);

            // Fetch ALL trades for Trading Calendar (calculate daily profit from trade history)
            const { data: allTrades, error: atError } = await supabase
                .from('trades')
                .select('close_time, profit')
                .eq('participant_id', id)
                .order('close_time', { ascending: true });

            if (atError) console.error(`All trades fetch error for ID ${id}:`, atError);

            // Calculate daily stats from trades
            const dailyStatsFromTrades = (() => {
                if (!allTrades || allTrades.length === 0) return [];

                const dailyMap = new Map<string, {
                    profit: number;
                    trades: number[];
                }>();

                for (const trade of allTrades) {
                    // Get date from close_time (stored as local broker time)
                    const closeTime = new Date(trade.close_time);
                    // Convert to Thailand timezone (UTC+7) for correct date grouping
                    const thaiTime = new Date(closeTime.getTime() + (7 * 60 * 60 * 1000));
                    const dateKey = thaiTime.toISOString().split('T')[0];

                    if (!dailyMap.has(dateKey)) {
                        dailyMap.set(dateKey, { profit: 0, trades: [] });
                    }
                    const day = dailyMap.get(dateKey)!;
                    day.profit += trade.profit || 0;
                    day.trades.push(trade.profit || 0);
                }

                return Array.from(dailyMap.entries()).map(([date, data]) => {
                    const wins = data.trades.filter(p => p > 0);
                    const losses = data.trades.filter(p => p < 0);
                    return {
                        date,
                        profit: data.profit,
                        totalTrades: data.trades.length,
                        winRate: data.trades.length > 0 ? (wins.length / data.trades.length) * 100 : 0,
                        bestTrade: wins.length > 0 ? Math.max(...wins) : 0,
                        worstTrade: losses.length > 0 ? Math.min(...losses) : 0
                    };
                }).sort((a, b) => a.date.localeCompare(b.date));
            })();

            return {
                trader: {
                    id: participant.id,
                    nickname: participant.nickname,
                    points: stats?.points || 0, // Points logic to be implemented
                    profit: stats?.profit || 0,
                    isDisqualified: (stats?.max_drawdown || 0) > 30,
                    stats: {
                        winRate: stats?.win_rate || 0,
                        profitFactor: stats?.profit_factor || 0,
                        maxDrawdown: stats?.max_drawdown || 0,
                        totalTrades: stats?.total_trades || 0,
                        avgWin: stats?.avg_win || 0,
                        avgLoss: stats?.avg_loss || 0,
                        rrRatio: stats?.rr_ratio || 0,
                        bestTrade: stats?.best_trade || 0,
                        worstTrade: stats?.worst_trade || 0,
                        winRateBuy: stats?.win_rate_buy || 0,
                        winRateSell: stats?.win_rate_sell || 0,
                        tradingStyle: stats?.trading_style || 'Unknown',
                        favoritePair: stats?.favorite_pair || '-',
                        avgHoldingTime: stats?.avg_holding_time || '-',
                        avgHoldingTimeWin: stats?.avg_holding_time_win || '-',
                        avgHoldingTimeLoss: stats?.avg_holding_time_loss || '-',
                        maxConsecutiveWins: stats?.max_consecutive_wins || 0,
                        maxConsecutiveLosses: stats?.max_consecutive_losses || 0,
                        sessionAsianProfit: stats?.session_asian_profit || 0,
                        sessionLondonProfit: stats?.session_london_profit || 0,
                        sessionNewYorkProfit: stats?.session_newyork_profit || 0,
                        sessionAsianWinRate: stats?.session_asian_win_rate || 0,
                        sessionLondonWinRate: stats?.session_london_win_rate || 0,
                        sessionNewYorkWinRate: stats?.session_newyork_win_rate || 0
                    },
                    equityCurve: equityData?.map((d: any) => d.equity) || [],
                    history: history?.map((t: any) => ({
                        id: t.id,
                        symbol: t.symbol,
                        type: t.type,
                        lot: t.lot_size,
                        openPrice: t.open_price,
                        closePrice: t.close_price,
                        sl: t.sl,
                        tp: t.tp,
                        openTime: t.open_time,
                        closeTime: t.close_time,
                        profit: t.profit
                    })) || [],
                    dailyHistory: dailyStatsFromTrades,
                    // MyFxBook-style detailed equity curve
                    equitySnapshots: equitySnapshots?.map((s: any) => ({
                        time: new Date(s.timestamp).getTime() / 1000,
                        balance: s.balance,
                        equity: s.equity,
                        floatingPL: s.floating_pl || 0
                    })).reverse() || []
                },
                rank: await (async () => {
                    if (!stats) return 0;

                    // Fetch all stats for the same date to calculate rank
                    const { data: allStats, error: rError } = await supabase
                        .from('daily_stats')
                        .select('points, profit')
                        .eq('date', stats.date);

                    if (rError) console.error(`Rank fetch error for date ${stats.date}:`, rError);

                    if (!allStats) return 0;

                    // Count how many have better score (Points > OR Points == AND Profit >)
                    const betterStats = allStats.filter((s: any) =>
                        s.points > stats.points ||
                        (s.points === stats.points && s.profit > stats.profit)
                    );

                    return betterStats.length + 1;
                })()
            };
        }
    } catch (e) {
        console.error('Supabase fetch failed detailed error:', e);
    }

    // Fallback to mock data
    const traderIndex = leaderboardData.findIndex((t) => t.id === id);
    if (traderIndex === -1) {
        throw error(404, 'Trader not found');
    }

    const trader = {
        ...leaderboardData[traderIndex],
        isDisqualified: (leaderboardData[traderIndex].stats.maxDrawdown || 0) > 30
    };
    const rank = traderIndex + 1;

    return {
        trader,
        rank
    };
};
