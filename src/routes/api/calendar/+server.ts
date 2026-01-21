import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import puppeteer from 'puppeteer';

import type { EconomicEvent } from '$lib/data/calendarData';

// Simple in-memory cache
let cache: {
    data: EconomicEvent[];
    timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const GET: RequestHandler = async () => {
    // Return cached data if valid
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
        return json({ events: cache.data });
    }

    try {
        const events = await scrapeForexFactory();

        // Update cache
        if (events.length > 0) {
            cache = {
                data: events,
                timestamp: Date.now()
            };
        }

        return json({ events });
    } catch (error) {
        console.error('Scraping failed:', error);

        // Return stale cache if available when scraping fails
        if (cache) {
            return json({ events: cache.data });
        }

        return json({ error: 'Failed to fetch directly from Forex Factory' }, { status: 500 });
    }
};

async function scrapeForexFactory(): Promise<EconomicEvent[]> {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Set a realistic viewport and User-Agent
        await page.setViewport({ width: 1280, height: 800 });
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Go to Forex Factory Calendar
        // We use 'today' to focus on the immediate relevant data, or just /calendar for the week
        await page.goto('https://www.forexfactory.com/calendar', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        // Wait for the calendar table to be visible
        await page.waitForSelector('.calendar__table', { timeout: 10000 });

        // Extract data
        const events = await page.evaluate(() => {
            const rows = document.querySelectorAll('.calendar__row');
            const result: any[] = [];
            let currentDate = '';

            // Map month names to numbers
            const months: Record<string, string> = {
                Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
                Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
            };

            const currentYear = new Date().getFullYear();

            rows.forEach((row) => {
                // Ignore navigation/ad rows
                if (!row.getAttribute('data-event-id')) return;

                // Check if this row has a date (it's the first row of that day section)
                const dateCell = row.querySelector('.calendar__date');
                if (dateCell) {
                    const dateText = dateCell.textContent?.trim() || '';
                    // Format: "Mon Jan 1"
                    // We need to parse this into YYYY-MM-DD
                    const match = dateText.match(/(\w+)\s+(\w+)\s+(\d+)/);
                    if (match) {
                        const [_, weekday, monthStr, dayStr] = match;
                        const month = months[monthStr];
                        const day = dayStr.padStart(2, '0');
                        // Simple year assumption: current year
                        currentDate = `${currentYear}-${month}-${day}`;
                    }
                }

                const time = row.querySelector('.calendar__time')?.textContent?.trim() || '';
                const currency = row.querySelector('.calendar__currency')?.textContent?.trim() || '';
                const event = row.querySelector('.calendar__event-title')?.textContent?.trim() || '';

                // Impact
                let impact = 'low';
                const impactSpan = row.querySelector('.calendar__impact span');
                if (impactSpan) {
                    const className = impactSpan.className;
                    if (className.includes('impact-red') || className.includes('high')) impact = 'high';
                    else if (className.includes('impact-orange') || className.includes('medium')) impact = 'medium';
                }

                const actual = row.querySelector('.calendar__actual')?.textContent?.trim() || '';
                const forecast = row.querySelector('.calendar__forecast')?.textContent?.trim() || '';
                const previous = row.querySelector('.calendar__previous')?.textContent?.trim() || '';

                if (currency && event) {
                    result.push({
                        id: row.getAttribute('data-event-id'),
                        time,
                        currency,
                        event,
                        impact,
                        actual,
                        forecast,
                        previous,
                        date: currentDate
                    });
                }
            });

            return result;
        });

        return events;

    } catch (e) {
        console.error('Puppeteer error:', e);
        throw e;
    } finally {
        if (browser) await browser.close();
    }
}
