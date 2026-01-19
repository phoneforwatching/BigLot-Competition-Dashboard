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
    
    # Get Current Open Positions (to filter out)
    current_positions = mt5.positions_get()
    open_pids = {p.ticket for p in current_positions} if current_positions else set()
    if current_positions:
        print(f"DEBUG: Found {len(current_positions)} open positions on account.")
    else:
        print("DEBUG: No open positions found.")

    history_deals = mt5.history_deals_get(from_date, to_date)
    
    if history_deals is None:
        print(f"No history found, error code: {mt5.last_error()}")
    else:
        print(f"Found {len(history_deals)} deals")
        
        # Advanced stats calculation
        gross_profit = 0
        gross_loss = 0
        total_holding_time = 0
        holding_counts = 0
        symbols = []
        
        # Initializing missing variables
        total_profit = 0
        wins = 0
        losses = 0
        total_trades = 0
        total_points = 0
        best_trade = -float('inf')
        worst_trade = float('inf')
        
        # Long/Short Stats
        buy_trades = 0
        buy_wins = 0
        sell_trades = 0
        sell_wins = 0
        
        symbol_cache = {}
        
        # For Max DD calculation (Balance based)
        peak_profit = -float('inf')
        current_profit_curve = 0
        max_drawdown_val = 0
        
        positions = {} # position_id -> {details}
        
        # 1. First Pass: Aggregate all deals by position_id
        for deal in history_deals:
            if deal.symbol:
                symbols.append(deal.symbol)
                
            pid = deal.position_id
            if pid not in positions:
                positions[pid] = {
                    'open_time': 0, 
                    'close_time': 0, 
                    'profit': 0,
                    'symbol': deal.symbol,
                    'type': 'UNKNOWN',
                    'lot': 0,
                    'volume_out': 0,
                    'open_price': 0,
                    'close_price': 0,
                    'sl': 0,
                    'tp': 0,
                    'deals_out': []
                }
            
            if deal.entry == mt5.DEAL_ENTRY_IN:
                positions[pid]['open_time'] = deal.time
                positions[pid]['open_price'] = deal.price
                positions[pid]['lot'] += deal.volume
                
                # Try to get SL/TP
                sl = getattr(deal, 'sl', 0.0)
                tp = getattr(deal, 'tp', 0.0)
                if (sl == 0.0 or tp == 0.0) and deal.order > 0:
                    try:
                        orders = mt5.history_orders_get(ticket=deal.order)
                        if orders and len(orders) > 0:
                            order = orders[0]
                            if sl == 0.0: sl = getattr(order, 'sl', 0.0)
                            if tp == 0.0: tp = getattr(order, 'tp', 0.0)
                    except: pass
                positions[pid]['sl'] = sl
                positions[pid]['tp'] = tp
                positions[pid]['type'] = 'BUY' if (deal.type == mt5.DEAL_TYPE_BUY or deal.type == 0) else 'SELL'
                
            elif deal.entry == mt5.DEAL_ENTRY_OUT:
                positions[pid]['close_time'] = deal.time
                positions[pid]['close_price'] = deal.price
                positions[pid]['profit'] += deal.profit
                positions[pid]['volume_out'] += deal.volume
                positions[pid]['deals_out'].append(deal)

        # 2. Second Pass: Filter and calculate stats only for FULLY CLOSED trades
        # A trade is fully closed if it's NOT in open_pids AND it has some volume_out
        closed_pids = sorted(
            [pid for pid, pos in positions.items() if pid not in open_pids and pos['volume_out'] > 0],
            key=lambda x: positions[x]['close_time']
        )
        
        session_stats = {
            'asian': {'profit': 0, 'wins': 0, 'total': 0},
            'london': {'profit': 0, 'wins': 0, 'total': 0},
            'newyork': {'profit': 0, 'wins': 0, 'total': 0}
        }
        
        total_duration = 0
        duration_count = 0
        win_duration = 0
        win_duration_count = 0
        loss_duration = 0
        loss_duration_count = 0
        
        trades_data = []
        
        for pid in closed_pids:
            pos = positions[pid]
            
            # Stats calculation
            total_trades += 1
            total_profit += pos['profit']
            
            if pos['profit'] > 0:
                wins += 1
                gross_profit += pos['profit']
            elif pos['profit'] < 0:
                losses += 1
                gross_loss += abs(pos['profit'])
            
            if pos['profit'] > best_trade: best_trade = pos['profit']
            if pos['profit'] < worst_trade: worst_trade = pos['profit']
            
            if pos['type'] == 'BUY':
                buy_trades += 1
                if pos['profit'] > 0: buy_wins += 1
            elif pos['type'] == 'SELL':
                sell_trades += 1
                if pos['profit'] > 0: sell_wins += 1
            
            # Points (Weighted by volume)
            if pos['open_price'] > 0:
                sym = pos['symbol']
                if sym:
                    if sym not in symbol_cache:
                        info = mt5.symbol_info(sym)
                        if info is None:
                            mt5.symbol_select(sym, True)
                            info = mt5.symbol_info(sym)
                        symbol_cache[sym] = info
                    
                    sym_info = symbol_cache.get(sym)
                    if sym_info and sym_info.point > 0:
                        pos_points = 0
                        for d_out in pos['deals_out']:
                            p_diff = (d_out.price - pos['open_price']) if pos['type'] == 'BUY' else (pos['open_price'] - d_out.price)
                            pos_points += (p_diff / sym_info.point) * (d_out.volume / pos['lot'])
                        total_points += pos_points

            # DD Calculation
            current_profit_curve += pos['profit']
            if current_profit_curve > peak_profit: peak_profit = current_profit_curve
            dd = peak_profit - current_profit_curve
            if dd > max_drawdown_val: max_drawdown_val = dd
            
            # Session Stats
            # Adjust server time (GMT+3) to UTC
            open_hour = datetime.utcfromtimestamp(pos['open_time'] - 10800).hour
            is_win = pos['profit'] > 0
            if 0 <= open_hour < 8:
                session_stats['asian']['profit'] += pos['profit']
                session_stats['asian']['total'] += 1
                if is_win: session_stats['asian']['wins'] += 1
            if 7 <= open_hour < 16:
                session_stats['london']['profit'] += pos['profit']
                session_stats['london']['total'] += 1
                if is_win: session_stats['london']['wins'] += 1
            if 12 <= open_hour < 21:
                session_stats['newyork']['profit'] += pos['profit']
                session_stats['newyork']['total'] += 1
                if is_win: session_stats['newyork']['wins'] += 1

            # Duration Stats
            duration = pos['close_time'] - pos['open_time']
            if duration >= 0:
                total_duration += duration
                duration_count += 1
                if pos['profit'] > 0:
                    win_duration += duration
                    win_duration_count += 1
                elif pos['profit'] < 0:
                    loss_duration += duration
                    loss_duration_count += 1
            
            # Collect data for 'trades' table
            trades_data.append({
                "participant_id": participant['id'],
                "symbol": pos['symbol'],
                "type": pos['type'],
                "lot_size": float(pos['lot']),
                "open_price": float(pos['open_price']),
                "close_price": float(pos['close_price']),
                "sl": float(pos.get('sl', 0)),
                "tp": float(pos.get('tp', 0)),
                "open_time": datetime.fromtimestamp(pos['open_time'] - 10800, tz=timezone.utc).isoformat(),
                "close_time": datetime.fromtimestamp(pos['close_time'] - 10800, tz=timezone.utc).isoformat(),
                "profit": float(pos['profit']),
                "position_id": pid
            })

        # Calculate Consecutive Stats
        max_consecutive_wins = 0
        max_consecutive_losses = 0
        current_consecutive_wins = 0
        current_consecutive_losses = 0
        for pid in closed_pids:
            if positions[pid]['profit'] > 0:
                current_consecutive_wins += 1
                current_consecutive_losses = 0
                if current_consecutive_wins > max_consecutive_wins: max_consecutive_wins = current_consecutive_wins
            elif positions[pid]['profit'] < 0:
                current_consecutive_losses += 1
                current_consecutive_wins = 0
                if current_consecutive_losses > max_consecutive_losses: max_consecutive_losses = current_consecutive_losses

        # Calculate aggregates
        win_rate = (wins / total_trades * 100) if total_trades > 0 else 0
        win_rate_buy = (buy_wins / buy_trades * 100) if buy_trades > 0 else 0
        win_rate_sell = (sell_wins / sell_trades * 100) if sell_trades > 0 else 0
        
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else (gross_profit if gross_profit > 0 else 0)
        
        # Max DD %
        current_balance = account_info.balance
        start_balance = current_balance - total_profit
        peak_balance = start_balance + peak_profit
        max_dd_percent = (max_drawdown_val / peak_balance * 100) if peak_balance > 0 else 0

        # Avg Win / Loss
        avg_win = (gross_profit / wins) if wins > 0 else 0
        avg_loss = -(gross_loss / losses) if losses > 0 else 0
        rr_ratio = abs(avg_win / avg_loss) if avg_loss != 0 else 0

        # Holding Time Strings
        def format_duration(seconds):
            m, s = divmod(seconds, 60)
            h, m = divmod(m, 60)
            d, h = divmod(h, 24)
            if d > 0: return f"{int(d)}d {int(h)}h"
            if h > 0: return f"{int(h)}h {int(m)}m"
            return f"{int(m)}m {int(s)}s"
            
        avg_holding_time_str = format_duration(total_duration / duration_count) if duration_count > 0 else "0m"
        avg_holding_time_win_str = format_duration(win_duration / win_duration_count) if win_duration_count > 0 else "0m"
        avg_holding_time_loss_str = format_duration(loss_duration / loss_duration_count) if loss_duration_count > 0 else "0m"
        
        # Trading Style
        avg_holding_minutes = (total_duration / duration_count / 60) if duration_count > 0 else 0
        if duration_count == 0: trading_style = "Unknown"
        elif avg_holding_minutes < 30: trading_style = "Scalping"
        elif avg_holding_minutes < 1440: trading_style = "Intraday"
        else: trading_style = "Swing"

        # Favorite Pair
        favorite_pair = Counter(symbols).most_common(1)[0][0] if symbols else "-"

        # 4. Update Daily Stats in Supabase
        today = datetime.now(timezone.utc).date().isoformat()
        
        stats_data = {
            "participant_id": participant['id'],
            "date": today,
            "balance": account_info.balance,
            "equity": account_info.equity,
            "profit": total_profit, 
            "points": int(total_points), 
            "win_rate": win_rate,
            "total_trades": total_trades,
            "profit_factor": round(profit_factor, 2),
            "rr_ratio": round(rr_ratio, 2),
            "max_drawdown": round(max_dd_percent, 2),
            "avg_win": round(avg_win, 2),
            "avg_loss": round(avg_loss, 2),
            "trading_style": trading_style,
            "favorite_pair": favorite_pair,
            "avg_holding_time": avg_holding_time_str,
            "best_trade": float(best_trade) if best_trade != -float('inf') else 0,
            "worst_trade": float(worst_trade) if worst_trade != float('inf') else 0,
            "win_rate_buy": round(win_rate_buy, 2),
            "win_rate_sell": round(win_rate_sell, 2),
            "avg_holding_time_win": avg_holding_time_win_str,
            "avg_holding_time_loss": avg_holding_time_loss_str,
            "max_consecutive_wins": max_consecutive_wins,
            "max_consecutive_losses": max_consecutive_losses,
            "session_asian_profit": round(session_stats['asian']['profit'], 2),
            "session_london_profit": round(session_stats['london']['profit'], 2),
            "session_newyork_profit": round(session_stats['newyork']['profit'], 2),
            "session_asian_win_rate": round((session_stats['asian']['wins'] / session_stats['asian']['total'] * 100), 2) if session_stats['asian']['total'] > 0 else 0,
            "session_london_win_rate": round((session_stats['london']['wins'] / session_stats['london']['total'] * 100), 2) if session_stats['london']['total'] > 0 else 0,
            "session_newyork_win_rate": round((session_stats['newyork']['wins'] / session_stats['newyork']['total'] * 100), 2) if session_stats['newyork']['total'] > 0 else 0,
            "floating_pl": round(account_info.equity - account_info.balance, 2),
            "total_lots": calculate_total_lots(positions),
            "equity_growth_percent": calculate_equity_growth(participant['id'], account_info.equity)
        }
        
        print(f"Calculated Stats for {participant['nickname']}: WinRate={win_rate:.1f}%, HoldingTime={avg_holding_time_str}, Trades={total_trades}")
        
        # 5. Update Trades History in Supabase
        if trades_data:
            try:
                data, count = supabase.table('trades').upsert(trades_data, on_conflict='participant_id,position_id').execute()
                print(f"Synced {len(trades_data)} trades for {participant['nickname']}")
            except Exception as e:
                print(f"Error syncing trades: {e}")

        # Upsert to Supabase
        try:
            data, count = supabase.table('daily_stats').upsert(stats_data, on_conflict='participant_id,date').execute()
            print(f"Updated stats for {participant['nickname']}")
        except Exception as e:
            print(f"Error updating stats: {e}")

def sync_participants_from_csv():
    csv_file = 'participants.csv'
    if not os.path.exists(csv_file):
        print(f"Warning: {csv_file} not found. Skipping CSV sync.")
        return

    print(f"Syncing participants from {csv_file} to Supabase...")
    
    try:
        with open(csv_file, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            participants = list(reader)
            
            if not participants:
                print("No participants found in CSV.")
                return

            for p in participants:
                account_id = p['account_id']
                nickname = p['nickname']
                
                # Check if exists
                res = supabase.table('participants').select("id").eq('account_id', account_id).execute()
                
                data = {
                    "nickname": nickname,
                    "account_id": account_id,
                    "investor_password": p['investor_password'],
                    "server": p['server']
                }
                
                if res.data and len(res.data) > 0:
                    # Update existing (Use the first one found)
                    pid = res.data[0]['id']
                    supabase.table('participants').update(data).eq('id', pid).execute()
                    
                    # If duplicates exist, delete them (Cleanup)
                    if len(res.data) > 1:
                        print(f"Warning: Found duplicate entries for account {account_id}. Cleaning up...")
                        for dup in res.data[1:]:
                            supabase.table('participants').delete().eq('id', dup['id']).execute()
                else:
                    # Insert new
                    supabase.table('participants').insert(data).execute()
                    print(f"Registered new participant: {nickname}")
                    
            print(f"Successfully synced {len(participants)} participants from CSV.")

    except Exception as e:
        print(f"Error syncing participants from CSV: {e}")


def main():
    # 0. Sync Participants from CSV first
    sync_participants_from_csv()

    if not init_mt5():
        return

    print(f"Starting Bridge Service... (Sync Interval: {SYNC_INTERVAL}s)")
    send_telegram_message(f"🚀 BigLot Bridge Started!\nSync Interval: {SYNC_INTERVAL}s")

    while True:
        start_time = time.time()
        print(f"\n--- Sync Cycle Start: {datetime.now().strftime('%H:%M:%S')} ---")

        try:
            response = supabase.table('participants').select("*").execute()
            participants = response.data
            
            for p in participants:
                if p.get('account_id') and p.get('investor_password') and p.get('server'):
                    sync_participant(p)
                else:
                    print(f"Skipping {p['nickname']} - Missing credentials")
                    
        except Exception as e:
            error_msg = f"Error in sync cycle: {e}"
            print(error_msg)
            send_telegram_message(f"⚠️ Bridge Error:\n{error_msg}")

        elapsed = time.time() - start_time
        print(f"--- Sync Cycle Complete in {elapsed:.2f}s ---")
        
        # Cleanup old equity snapshots (once per cycle)
        cleanup_old_snapshots()
        
        # Sync participants
        sync_participants_from_csv()
        
        print("Sleeping for 60 seconds...")
        time.sleep(60)

    mt5.shutdown()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nStopping Bridge Service...")
        send_telegram_message("🛑 BigLot Bridge Stopped (Manual)")
        mt5.shutdown()
    except Exception as e:
        print(f"\nCritical Error: {e}")
        send_telegram_message(f"💀 Bridge Crashed:\n{e}")
        mt5.shutdown()
