import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { trader, analysisType, customPrompt, provider } = await request.json();

        if (!trader) {
            return json({ error: 'Missing trader data' }, { status: 400 });
        }

        const prompt = buildPrompt(trader, analysisType, customPrompt);
        
        let analysis = '';
        
        if (provider === 'gemini' && GEMINI_API_KEY) {
            analysis = await analyzeWithGemini(prompt);
        } else if (OPENAI_API_KEY) {
            analysis = await analyzeWithOpenAI(prompt);
        } else {
            return json({ error: 'No AI provider configured. Please add OPENAI_API_KEY or GEMINI_API_KEY to your environment.' }, { status: 500 });
        }

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

async function analyzeWithOpenAI(prompt: string): Promise<string> {
    const openai = new OpenAI({
        apiKey: OPENAI_API_KEY
    });

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: 'คุณเป็นผู้เชี่ยวชาญในการวิเคราะห์ Trading Performance ให้คำแนะนำที่เป็นประโยชน์และเข้าใจง่าย'
            },
            {
                role: 'user',
                content: prompt
            }
        ],
        max_tokens: 1500,
        temperature: 0.7
    });

    return response.choices[0]?.message?.content || 'ไม่สามารถสร้างการวิเคราะห์ได้';
}

async function analyzeWithGemini(prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || 'ไม่สามารถสร้างการวิเคราะห์ได้';
}
