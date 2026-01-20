import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
    const symbol = url.searchParams.get('symbol');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const timeframe = url.searchParams.get('timeframe') || 'M15';

    if (!symbol || !from || !to) {
        return json({ error: 'Missing required parameters: symbol, from, to' }, { status: 400 });
    }

    try {
        if (!supabase) {
            // Fallback to mock data if supabase is not initialized
            const mockData = generateMockCandles(symbol.replace('.s', ''), from, to, timeframe);
            return json(mockData);
        }

        // Determine table based on timeframe
        const tableName = timeframe === 'M1' ? 'market_data_m1' : 'market_data';

        // Clean symbol (remove .s suffix if present)
        const cleanSymbol = symbol.replace('.s', '');

        const { data, error } = await supabase
            .from(tableName)
            .select('time, open, high, low, close, volume')
            .eq('symbol', cleanSymbol)
            .gte('time', from)
            .lte('time', to)
            .order('time', { ascending: true })
            .limit(5000);


        if (error) {
            console.warn(`Supabase error fetching from ${tableName} (Code: ${error.code}). Trying fallback table...`);

            // If M1 failed, try the standard table
            if (tableName === 'market_data_m1') {
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('market_data')
                    .select('time, open, high, low, close, volume')
                    .eq('symbol', cleanSymbol)
                    .gte('time', from)
                    .lte('time', to)
                    .order('time', { ascending: true })
                    .limit(5000);

                if (!fallbackError && fallbackData && fallbackData.length > 0) {
                    return json(fallbackData);
                }
            }

            // Still nothing? Use mock data
            console.log('No data found in any table, generating mock data...');
            const mockData = generateMockCandles(cleanSymbol, from, to, timeframe);
            return json(mockData);
        }

        if (!data || data.length === 0) {
            // Generate mock data if no real data available
            const mockData = generateMockCandles(cleanSymbol, from, to, timeframe);
            return json(mockData);
        }

        return json(data);
    } catch (e) {
        console.error('Error fetching candles:', e);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};

// Generate mock candles for development/testing
function generateMockCandles(symbol: string, from: string, to: string, timeframe: string) {
    const candles = [];
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Determine interval in minutes
    const intervalMinutes = timeframe === 'M1' ? 1 :
        timeframe === 'M5' ? 5 :
            timeframe === 'M15' ? 15 :
                timeframe === 'H1' ? 60 :
                    timeframe === 'H4' ? 240 : 15;

    // Base prices for different symbols
    const basePrices: Record<string, number> = {
        'XAUUSD': 2000,
        'EURUSD': 1.08,
        'GBPUSD': 1.26,
        'BTCUSD': 45000,
        'US30': 38000,
        'USDJPY': 150,
        'GBPJPY': 188,
    };

    const basePrice = basePrices[symbol] || 100;
    const volatility = basePrice * 0.001; // 0.1% volatility per candle

    let currentPrice = basePrice;
    let currentTime = new Date(fromDate);

    while (currentTime <= toDate) {
        // Skip weekends
        const dayOfWeek = currentTime.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            currentTime = new Date(currentTime.getTime() + intervalMinutes * 60 * 1000);
            continue;
        }

        // Generate OHLC
        const change = (Math.random() - 0.48) * volatility; // Slight upward bias
        const open = currentPrice;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;

        candles.push({
            time: currentTime.toISOString(),
            open: Number(open.toFixed(symbol.includes('JPY') ? 3 : 5)),
            high: Number(high.toFixed(symbol.includes('JPY') ? 3 : 5)),
            low: Number(low.toFixed(symbol.includes('JPY') ? 3 : 5)),
            close: Number(close.toFixed(symbol.includes('JPY') ? 3 : 5)),
            volume: Math.floor(Math.random() * 1000) + 100
        });

        currentPrice = close;
        currentTime = new Date(currentTime.getTime() + intervalMinutes * 60 * 1000);
    }

    return candles;
}
