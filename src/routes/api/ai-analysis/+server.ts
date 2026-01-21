import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { trader, analysisType, customPrompt, messages } = await request.json();

        // Check API configuration
        if (!OPENAI_API_KEY) {
            return json({ error: 'OpenAI API Key is not configured.' }, { status: 500 });
        }

        let aiMessages = [];

        if (messages && Array.isArray(messages)) {
            // Use provided chat history
            aiMessages = messages.map((msg: any) => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            }));
        } else {
            // Fallback for single prompt legacy support or initial message
            let prompt;
            if (trader) {
                prompt = buildPrompt(trader, analysisType, customPrompt);
            } else {
                prompt = customPrompt || 'สวัสดีครับ มีอะไรให้ผมช่วยเรื่องการเทรดวันนี้ไหมครับ?';
            }
            aiMessages.push({ role: 'user', content: prompt });
        }

        const analysis = await analyzeWithOpenAI(aiMessages, !!trader);

        return json({ analysis });
    } catch (error) {
        console.error('AI Analysis error:', error);
        return json({ error: 'Failed to generate analysis' }, { status: 500 });
    }
};

function buildPrompt(trader: any, analysisType: string, customPrompt?: string): string {
    const stats = trader.stats || {};
    const traderSummary = `
## Trader Profile: ${trader.nickname}
- **Rank**: #${trader.rank}
- **Total Points**: ${trader.points?.toLocaleString() || 0}
- **Total Profit**: $${trader.profit?.toFixed(2) || 0}

## Performance Stats:
- Win Rate: ${stats.winRate?.toFixed(2) || 0}%
- Profit Factor: ${stats.profitFactor || 0}
- Max Drawdown: ${stats.maxDrawdown || 0}%
- Total Trades: ${stats.totalTrades || 0}
- RR Ratio: ${stats.rrRatio || 0}
- Avg Win: $${stats.avgWin || 0}
- Avg Loss: $${stats.avgLoss || 0}
- Best Trade: $${stats.bestTrade || 0}
- Worst Trade: $${stats.worstTrade || 0}
- Win Rate Buy: ${stats.winRateBuy?.toFixed(1) || 0}%
- Win Rate Sell: ${stats.winRateSell?.toFixed(1) || 0}%
- Max Consecutive Wins: ${stats.maxConsecutiveWins || 0}
- Max Consecutive Losses: ${stats.maxConsecutiveLosses || 0}
- Trading Style: ${stats.tradingStyle || 'Unknown'}
- Favorite Pair: ${stats.favoritePair || '-'}
- Avg Holding Time: ${stats.avgHoldingTime || '-'}

## Session Performance:
- Asian Session: Win Rate ${stats.sessionAsianWinRate?.toFixed(1) || 0}%, Profit $${stats.sessionAsianProfit?.toFixed(2) || 0}
- London Session: Win Rate ${stats.sessionLondonWinRate?.toFixed(1) || 0}%, Profit $${stats.sessionLondonProfit?.toFixed(2) || 0}
- New York Session: Win Rate ${stats.sessionNewYorkWinRate?.toFixed(1) || 0}%, Profit $${stats.sessionNewYorkProfit?.toFixed(2) || 0}
`;

    const baseInstructions = `
คุณเป็นผู้เชี่ยวชาญในการวิเคราะห์ Trading Performance
ให้วิเคราะห์ข้อมูลของ Trader นี้และให้คำแนะนำเป็นภาษาไทย
ใช้ภาษาที่เข้าใจง่าย ไม่เป็นทางการเกินไป
ตอบให้กระชับ ตรงประเด็น ไม่เกิน 500 คำ
ใช้ emoji ประกอบเพื่อให้อ่านง่าย
`;

    const analysisInstructions: Record<string, string> = {
        overview: `วิเคราะห์ภาพรวม Performance ของ Trader นี้:
- จุดเด่น/จุดแข็ง
- จุดที่ควรปรับปรุง
- ให้คะแนน Performance โดยรวม (1-10)`,

        winrate: `วิเคราะห์ Win Rate และความสม่ำเสมอ:
- Win Rate เหมาะสมหรือไม่กับ RR Ratio
- เปรียบเทียบ Win Rate Long vs Short
- ควรเน้น Trade ฝั่งไหนมากกว่า`,

        risk: `วิเคราะห์ Risk Management:
- Max Drawdown เหมาะสมหรือไม่
- การจัดการความเสี่ยงต่อ Trade
- มี Consecutive Losses มากไปหรือไม่
- ข้อเสนอแนะในการปรับปรุง`,

        trend: `วิเคราะห์ Trading Style:
- รูปแบบการ Trade เหมาะกับสไตล์หรือไม่
- Session ไหนทำกำไรได้ดี
- ควรเน้น Trade Session ไหน
- เวลาถือ Position เหมาะสมหรือไม่`,

        compare: `เปรียบเทียบกับมาตรฐาน Professional Trader:
- Win Rate 50%+ กับ RR 1:2 ขึ้นไป
- Profit Factor > 1.5
- Max Drawdown < 20%
- ควรปรับปรุงอะไรให้ถึงระดับมืออาชีพ`,

        custom: customPrompt || 'วิเคราะห์ข้อมูลนี้ตามที่เห็นสมควร'
    };

    return `${baseInstructions}

${traderSummary}

## คำขอวิเคราะห์:
${analysisInstructions[analysisType] || analysisInstructions.overview}
`;
}

async function analyzeWithOpenAI(messages: any[], isTraderContext: boolean = false): Promise<string> {
    const openai = new OpenAI({
        apiKey: OPENAI_API_KEY
    });

    const systemPrompt = isTraderContext
        ? 'คุณเป็นผู้เชี่ยวชาญในการวิเคราะห์ Trading Performance ให้คำแนะนำที่เป็นประโยชน์และเข้าใจง่าย'
        : 'คุณเป็นผู้ช่วยอัจฉริยะสำหรับการเทรด (AI Trading Assistant) ที่มีความรู้เรื่องการเงิน การลงทุน และการวิเคราะห์ทางเทคนิค ตอบคำถามเป็นภาษาไทยอย่างสุภาพและเป็นกันเอง';

    const completionMessages = [
        {
            role: 'system',
            content: systemPrompt
        },
        ...messages
    ];

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: completionMessages,
        max_tokens: 1500,
        temperature: 0.7
    });

    return response.choices[0]?.message?.content || 'ไม่สามารถสร้างการวิเคราะห์ได้';
}
