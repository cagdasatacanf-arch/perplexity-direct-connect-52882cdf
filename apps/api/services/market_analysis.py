
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional

class MarketAnalysisService:
    """
    Service for calculating technical indicators and merging market data.
    """
    
    @staticmethod
    def calculate_technical_indicators(data: List[Dict[str, Any]], benchmark_data: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
        """
        Calculate technical indicators for the given price data.
        
        Args:
            data: List of OHLCV dictionaries
            benchmark_data: Optional list of OHLCV dictionaries for benchmark correlation
            
        Returns:
            List of dictionaries with original data plus technical indicators
        """
        if not data:
            return []
            
        # Convert to DataFrame
        df = pd.DataFrame(data)
        
        # Ensure correct types
        numeric_cols = ['open', 'high', 'low', 'close', 'volume']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        df.sort_values('date', inplace=True)
        
        # Calculate RSI (14 period)
        if 'close' in df.columns:
            delta = df['close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            
            rs = gain / loss
            df['rsi'] = 100 - (100 / (1 + rs))
            df['rsi'] = df['rsi'].fillna(50) # Default neutral for initial periods
            
            # Calculate Bollinger Bands (20 period, 2 std dev)
            window = 20
            sma = df['close'].rolling(window=window).mean()
            std = df['close'].rolling(window=window).std()
            df['bb_upper'] = sma + (std * 2)
            df['bb_lower'] = sma - (std * 2)
            
            # Handle NaN for initial periods
            df['bb_upper'] = df['bb_upper'].fillna(df['close'] * 1.05)
            df['bb_lower'] = df['bb_lower'].fillna(df['close'] * 0.95)
            
        # Calculate Correlation with Benchmark (if provided)
        if benchmark_data:
            bench_df = pd.DataFrame(benchmark_data)
            if 'close' in bench_df.columns and 'date' in bench_df.columns:
                # Merge on date
                merged = pd.merge(df[['date', 'close']], bench_df[['date', 'close']], on='date', suffixes=('', '_bench'))
                
                # Calculate rolling correlation (e.g., 30 days)
                rolling_corr = merged['close'].rolling(window=30).corr(merged['close_bench'])
                
                # Map back to original dataframe
                # Note: This is simplified. For exact mapping we might need re-indexing.
                # Here we just attach the correlation series assuming sorted index alignment if possible,
                # but valid merging is safer.
                
                # Let's create a mapping dict for O(1) lookup
                corr_map = dict(zip(merged['date'], rolling_corr))
                df['benchmark_corr'] = df['date'].map(corr_map).fillna(0)
            else:
                 df['benchmark_corr'] = 0
        else:
             df['benchmark_corr'] = 0
             
        # Format output
        # Rename date to timestamp if needed or keep date
        # The user requested 'timestamp', 'open', 'high', 'low', 'close', 'rsi', ...
        
        results = []
        for _, row in df.iterrows():
            item = {
                "timestamp": row.get('date'), # User asked for timestamp, our data uses date.
                "open": row.get('open'),
                "high": row.get('high'),
                "low": row.get('low'),
                "close": row.get('close'),
                "volume": row.get('volume'),
                "rsi": None if pd.isna(row.get('rsi')) else round(row.get('rsi'), 2),
                "bb_upper": None if pd.isna(row.get('bb_upper')) else round(row.get('bb_upper'), 2),
                "bb_lower": None if pd.isna(row.get('bb_lower')) else round(row.get('bb_lower'), 2),
                "benchmark_corr": None if pd.isna(row.get('benchmark_corr')) else round(row.get('benchmark_corr'), 4)
            }
            results.append(item)
            
        return results
