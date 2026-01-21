export interface EconomicEvent {
    id: string;
    time: string;
    currency: string;
    event: string;
    impact: 'high' | 'medium' | 'low';
    actual?: string;
    forecast?: string;
    previous?: string;
    date: string; // ISO date string YYYY-MM-DD
}

export const mockCalendarData: EconomicEvent[] = [
    // Today
    {
        id: '1',
        time: '19:30',
        currency: 'USD',
        event: 'Core CPI m/m',
        impact: 'high',
        forecast: '0.3%',
        previous: '0.3%',
        date: new Date().toISOString().split('T')[0]
    },
    {
        id: '2',
        time: '19:30',
        currency: 'USD',
        event: 'CPI y/y',
        impact: 'high',
        forecast: '3.2%',
        previous: '3.4%',
        date: new Date().toISOString().split('T')[0]
    },
    {
        id: '3',
        time: '19:30',
        currency: 'USD',
        event: 'Unemployment Claims',
        impact: 'medium',
        forecast: '210K',
        previous: '202K',
        date: new Date().toISOString().split('T')[0]
    },
    {
        id: '4',
        time: '21:15',
        currency: 'EUR',
        event: 'Main Refinancing Rate',
        impact: 'high',
        forecast: '4.50%',
        previous: '4.50%',
        date: new Date().toISOString().split('T')[0]
    },
    {
        id: '5',
        time: '21:45',
        currency: 'EUR',
        event: 'ECB Press Conference',
        impact: 'high',
        date: new Date().toISOString().split('T')[0]
    },
    // Tomorrow
    {
        id: '6',
        time: '14:00',
        currency: 'GBP',
        event: 'GDP m/m',
        impact: 'high',
        forecast: '0.2%',
        previous: '-0.1%',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    },
    {
        id: '7',
        time: '20:30',
        currency: 'USD',
        event: 'PPI m/m',
        impact: 'medium',
        forecast: '0.1%',
        previous: '0.0%',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    }
];
