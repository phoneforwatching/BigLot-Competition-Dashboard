export type LeaderboardEntry = {
    id: string;
    points: number;
    profit: number;
    equity: number;
    isDisqualified?: boolean;
    rankProfit?: number;
    rankPoints?: number;
}; // Minimal Type

function processLeaderboardData(data: any[]) {
    // 1. Map to base structure (simplified for test)
    const mapped = data.map((entry: any) => {
        // Disqualification Rule: Equity <= 0 (Port Blown)
        const isDisqualified = entry.equity <= 0;

        return {
            id: entry.id,
            points: entry.points,
            profit: entry.profit,
            equity: entry.equity,
            isDisqualified,
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

    return [...finalActive.sort((a, b) => b.points - a.points), ...finalDisqualified];
}

const testData = [
    { id: 'A', points: 50, profit: 100, equity: 1000 },
    { id: 'B', points: 40, profit: 200, equity: 1000 },
    { id: 'C', points: 500, profit: 500, equity: -10 },
    { id: 'D', points: 60, profit: 300, equity: 1000 } // Should be Profit Leader #1, Points Leader #1
];

console.log('--- Testing Logic ---');
const result = processLeaderboardData(testData);

result.forEach(r => {
    console.log(`User ${r.id}: Points=${r.points} Profit=${r.profit} Equity=${r.equity} -> Disqualified=${r.isDisqualified} RankPoints=${r.rankPoints} RankProfit=${r.rankProfit} DoubleWinner=${r.rankPoints === 1 && r.rankProfit === 1}`);
});

// Check if Logic matches expectations
// active: A, B, D
// Points: D(60) > A(50) > B(40) => D=1, A=2, B=3
// Profit: D(300) > B(200) > A(100) => D=1, B=2, A=3

const valid =
    result.find(r => r.id === 'D')?.rankPoints === 1 &&
    result.find(r => r.id === 'D')?.rankProfit === 1 &&
    result.find(r => r.id === 'C')?.isDisqualified === true;

if (valid) {
    console.log('✅ Logic Validated Successfully');
} else {
    console.error('❌ Logic Validation Failed');
}
