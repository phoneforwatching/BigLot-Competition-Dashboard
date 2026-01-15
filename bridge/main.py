import os
import time
import MetaTrader5 as mt5
from datetime import datetime, timezone, timedelta
from collections import Counter
import csv
from core import init_mt5, get_supabase_client, load_env, send_telegram_message
from equity_service import (
    should_record_snapshot, 
    record_equity_snapshot, 
    calculate_equity_growth,
    calculate_total_lots,
    cleanup_old_snapshots
)

# Load environment variables
load_env()

SYNC_INTERVAL = int(os.getenv("SYNC_INTERVAL", "60")) # Default 60 seconds

# Initialize Supabase client
supabase = get_supabase_client()

def sync_participant(participant):
    print(f"Syncing participant: {participant['nickname']} ({participant['account_id']})")
    
    # 1. Login to MT5
    try:
        authorized = mt5.login(
            int(participant['account_id']), 
            password=participant['investor_password'], 
            server=participant['server']
        )
    except Exception as e:
        print(f"Login error: {e}")
        return

    if not authorized:
        print(f"Failed to connect to account #{participant['account_id']}, error code: {mt5.last_error()}")
        return

    # 2. Get Account Info
    account_info = mt5.account_info()
    if account_info is None:
        print(f"Failed to get account info, error code: {mt5.last_error()}")
        return

    # 2.5. Record Equity Snapshot (every 5 minutes)
    if should_record_snapshot(participant['id']):
        record_equity_snapshot(participant['id'], account_info)

    # 3. Get Trade History (Last 30 days for safety, or all time)
    from_date = datetime(2024, 1, 1, tzinfo=timezone.utc)
    # Add 1 day to current time to avoid timezone mismatches (server time vs local time)
    to_date = datetime.now(timezone.utc) + timedelta(days=1)
    
    print(f"Fetching history from {from_date} to {to_date}...")
    
    history_deals = mt5.history_deals_get(from_date, to_date)
    
    if history_deals is None:
        print(f"No history found, error code: {mt5.last_error()}")
    else:
        print(f"Found {len(history_deals)} deals")
        
        # Stats accumulation
        total_profit = 0
        wins = 0
        losses = 0
        gross_profit = 0
        gross_loss = 0
        total_trades = 0
        total_points = 0
        best_trade = -float('inf')
        worst_trade = float('inf')
        
        buy_trades = 0
        buy_wins = 0
        sell_trades = 0
        sell_wins = 0
        
        symbol_cache = {}
        
        current_profit_curve = 0
        peak_profit = -float('inf')
        max_drawdown_val = 0
        
        positions = {} # position_id -> trade details
        
        for deal in history_deals:
            pid = deal.position_id
            if pid not in positions:
                positions[pid] = {
                    'open_time': 0, 
                    'close_time': 0, 
                    'profit': 0,
                    'symbol': deal.symbol,
                    'type': 'UNKNOWN',
                    'lot': 0,
                    'open_price': 0,
                    'close_price': 0,
                    'sl': 0,
                    'tp': 0
                }
            
            if deal.entry == mt5.DEAL_ENTRY_IN:
                positions[pid]['open_time'] = deal.time
                positions[pid]['open_price'] = deal.price
                positions[pid]['lot'] = deal.volume
                positions[pid]['type'] = 'BUY' if deal.type == mt5.ORDER_TYPE_BUY else 'SELL'
                
                # Fetch SL/TP from history order if available
                if deal.order > 0:
                    orders = mt5.history_orders_get(ticket=deal.order)
                    if orders:
                        positions[pid]['sl'] = getattr(orders[0], 'sl', 0.0)
                        positions[pid]['tp'] = getattr(orders[0], 'tp', 0.0)
                
            elif deal.entry == mt5.DEAL_ENTRY_OUT:
                positions[pid]['close_time'] = deal.time
                positions[pid]['close_price'] = deal.price
                positions[pid]['profit'] += deal.profit
                
                # Update stats
                total_trades += 1
                total_profit += deal.profit
                
                if deal.profit > 0:
                    wins += 1
                    gross_profit += deal.profit
                elif deal.profit < 0:
                    losses += 1
                    gross_loss += abs(deal.profit)
                
                if deal.profit > best_trade: best_trade = deal.profit
                if deal.profit < worst_trade: worst_trade = deal.profit
                
                if positions[pid]['type'] == 'BUY':
                    buy_trades += 1
                    if deal.profit > 0: buy_wins += 1
                elif positions[pid]['type'] == 'SELL':
                    sell_trades += 1
                    if deal.profit > 0: sell_wins += 1
                
                # Points calculation
                sym = deal.symbol
                if sym:
                    if sym not in symbol_cache:
                        mt5.symbol_select(sym, True)
                        symbol_cache[sym] = mt5.symbol_info(sym)
                    
                    sym_info = symbol_cache[sym]
                    if sym_info and sym_info.point > 0:
                        diff = (deal.price - positions[pid]['open_price']) if positions[pid]['type'] == 'BUY' else (positions[pid]['open_price'] - deal.price)
                        total_points += (diff / sym_info.point)
                
                # Max DD calculation
                current_profit_curve += deal.profit
                if current_profit_curve > peak_profit: peak_profit = current_profit_curve
                dd = peak_profit - current_profit_curve
                if dd > max_drawdown_val: max_drawdown_val = dd

        # Aggregates
        win_rate = (wins / total_trades * 100) if total_trades > 0 else 0
        win_rate_buy = (buy_wins / buy_trades * 100) if buy_trades > 0 else 0
        win_rate_sell = (sell_wins / sell_trades * 100) if sell_trades > 0 else 0
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else (gross_profit if gross_profit > 0 else 0)
        
        current_balance = account_info.balance
        start_balance = current_balance - total_profit
        peak_balance = start_balance + peak_profit
        max_dd_percent = (max_drawdown_val / peak_balance * 100) if peak_balance > 0 else 0
        
        avg_win = (gross_profit / wins) if wins > 0 else 0
        avg_loss = -(gross_loss / losses) if losses > 0 else 0
        rr_ratio = abs(avg_win / avg_loss) if avg_loss != 0 else 0

        # Holding Time & Trading Style
        total_duration = 0
        win_duration = 0
        win_duration_count = 0
        loss_duration = 0
        loss_duration_count = 0
        duration_count = 0
        
        for pos in positions.values():
            if pos['open_time'] > 0 and pos['close_time'] > 0:
                dur = pos['close_time'] - pos['open_time']
                if dur >= 0:
                    total_duration += dur
                    duration_count += 1
                    if pos['profit'] > 0:
                        win_duration += dur
                        win_duration_count += 1
                    elif pos['profit'] < 0:
                        loss_duration += dur
                        loss_duration_count += 1

        avg_hold = total_duration / duration_count if duration_count > 0 else 0
        
        def fmt_dur(s):
            m, s = divmod(s, 60); h, m = divmod(m, 60); d, h = divmod(h, 24)
            if d > 0: return f"{int(d)}d {int(h)}h"
            if h > 0: return f"{int(h)}h {int(m)}m"
            return f"{int(m)}m {int(s)}s"

        # Session Stats (Approximate UTC+3 to UTC)
        session_stats = {'asian':{'p':0,'w':0,'t':0}, 'london':{'p':0,'w':0,'t':0}, 'newyork':{'p':0,'w':0,'t':0}}
        for pos in positions.values():
            if pos['open_time'] > 0 and pos['close_time'] > 0:
                hr = datetime.utcfromtimestamp(pos['open_time'] - 10800).hour
                p = pos['profit']
                w = p > 0
                if 0 <= hr < 8: session_stats['asian']['p']+=p; session_stats['asian']['t']+=1; session_stats['asian']['w']+=int(w)
                if 7 <= hr < 16: session_stats['london']['p']+=p; session_stats['london']['t']+=1; session_stats['london']['w']+=int(w)
                if 12 <= hr < 21: session_stats['newyork']['p']+=p; session_stats['newyork']['t']+=1; session_stats['newyork']['w']+=int(w)

        # Style & Favorite
        style = "Scalping" if avg_hold/60 < 30 else ("Intraday" if avg_hold/60 < 1440 else "Swing")
        if duration_count == 0: style = "Unknown"
        fav = Counter([p['symbol'] for p in positions.values() if p['symbol']]).most_common(1)[0][0] if positions else "-"

        # Prepare payload
        stats_data = {
            "participant_id": participant['id'],
            "date": datetime.now(timezone.utc).date().isoformat(),
            "balance": account_info.balance,
            "equity": account_info.equity,
            "profit": total_profit, 
            "points": int(total_points), 
            "win_rate": round(win_rate, 2),
            "total_trades": total_trades,
            "profit_factor": round(profit_factor, 2),
            "rr_ratio": round(rr_ratio, 2),
            "max_drawdown": round(max_dd_percent, 2),
            "avg_win": round(avg_win, 2),
            "avg_loss": round(avg_loss, 2),
            "trading_style": style,
            "favorite_pair": fav,
            "avg_holding_time": fmt_dur(avg_hold),
            "best_trade": round(best_trade, 2) if best_trade != -float('inf') else 0,
            "worst_trade": round(worst_trade, 2) if worst_trade != float('inf') else 0,
            "win_rate_buy": round(win_rate_buy, 2),
            "win_rate_sell": round(win_rate_sell, 2),
            "avg_holding_time_win": fmt_dur(win_duration/win_duration_count) if win_duration_count>0 else "0m",
            "avg_holding_time_loss": fmt_dur(loss_duration/loss_duration_count) if loss_duration_count>0 else "0m",
            "session_asian_profit": round(session_stats['asian']['p'], 2),
            "session_london_profit": round(session_stats['london']['p'], 2),
            "session_newyork_profit": round(session_stats['newyork']['p'], 2),
            "session_asian_win_rate": round(session_stats['asian']['w']/session_stats['asian']['t']*100, 2) if session_stats['asian']['t']>0 else 0,
            "session_london_win_rate": round(session_stats['london']['w']/session_stats['london']['t']*100, 2) if session_stats['london']['t']>0 else 0,
            "session_newyork_win_rate": round(session_stats['newyork']['w']/session_stats['newyork']['t']*100, 2) if session_stats['newyork']['t']>0 else 0,
            "floating_pl": round(account_info.equity - account_info.balance, 2),
            "total_lots": calculate_total_lots(positions),
            "equity_growth_percent": calculate_equity_growth(participant['id'], account_info.equity)
        }

        # Sync trades
        trades_data = [{
            "participant_id": participant['id'],
            "symbol": p['symbol'],
            "type": p['type'],
            "lot_size": float(p['lot']),
            "open_price": float(p['open_price']),
            "close_price": float(p['close_price']),
            "sl": float(p['sl']),
            "tp": float(p['tp']),
            "open_time": datetime.fromtimestamp(p['open_time'] - 10800, tz=timezone.utc).isoformat(),
            "close_time": datetime.fromtimestamp(p['close_time'] - 10800, tz=timezone.utc).isoformat(),
            "profit": float(p['profit']),
            "position_id": pid
        } for pid, p in positions.items() if p['open_time']>0 and p['close_time']>0]

        if trades_data:
            supabase.table('trades').upsert(trades_data, on_conflict='participant_id,position_id').execute()
        
        supabase.table('daily_stats').upsert(stats_data, on_conflict='participant_id,date').execute()
        print(f"✅ Synced {participant['nickname']}")

def main():
    if not init_mt5(): return
    print(f"🚀 Bridge Service Started (Interval: {SYNC_INTERVAL}s)")
    while True:
        try:
            participants = supabase.table('participants').select("*").execute().data
            for p in participants:
                if p.get('account_id') and p.get('investor_password'):
                    sync_participant(p)
            cleanup_old_snapshots()
        except Exception as e:
            print(f"❌ Error: {e}")
        time.sleep(SYNC_INTERVAL)

if __name__ == "__main__":
    try: main()
    except KeyboardInterrupt: mt5.shutdown()
