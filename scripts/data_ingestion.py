
import os
import csv
import logging
import argparse
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime
from pathlib import Path

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("DataIngestion")

def get_db_connection():
    """Connect to the Postgres database."""
    # Assuming standard Supabase/Postgres env vars
    # In a real scenario, use a library or connection string from .env
    db_host = os.environ.get("POSTGRES_HOST", "localhost")
    db_port = os.environ.get("POSTGRES_PORT", "54322") # Default to our docker port
    db_name = os.environ.get("POSTGRES_DB", "postgres")
    db_user = os.environ.get("POSTGRES_USER", "postgres")
    db_pass = os.environ.get("POSTGRES_PASSWORD", "postgres")
    
    conn = psycopg2.connect(
        host=db_host,
        port=db_port,
        dbname=db_name,
        user=db_user,
        password=db_pass
    )
    return conn

def parse_csv_line(line: dict) -> tuple:
    """Parse a CSV row into a tuple for insertion."""
    # Expected keys: symbol, date, open, high, low, close, volume
    # Adjust based on actual CSV format found in project
    try:
        symbol = line.get('Symbol') or line.get('symbol')
        date_str = line.get('Date') or line.get('date')
        
        # Helper to clean currency strings if needed "$100.00"
        def clean_float(val):
            if not val: return None
            if isinstance(val, (int, float)): return val
            return float(str(val).replace('$', '').replace(',', '').strip())

        op = clean_float(line.get('Open') or line.get('open'))
        hi = clean_float(line.get('High') or line.get('high'))
        lo = clean_float(line.get('Low') or line.get('low'))
        cl = clean_float(line.get('Close') or line.get('close'))
        vol = int(clean_float(line.get('Volume') or line.get('volume')) or 0)
        
        return (symbol, date_str, op, hi, lo, cl, vol)
    except Exception as e:
        logger.warning(f"Error parsing line {line}: {e}")
        return None

def ingest_data(file_path: str):
    """Read CSV/JSON and bulk insert to DB."""
    path = Path(file_path)
    if not path.exists():
        logger.error(f"File not found: {file_path}")
        return

    logger.info(f"Connecting to database...")
    try:
        conn = get_db_connection()
        cur = conn.cursor()
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        logger.info("Ensure the Docker stack is running (docker compose up -d)")
        return

    logger.info(f"Reading file {file_path}...")
    
    rows_to_insert = []
    
    # Very basic CSV support
    if path.suffix.lower() == '.csv':
        with open(path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                parsed = parse_csv_line(row)
                if parsed:
                    rows_to_insert.append(parsed)
    
    if not rows_to_insert:
        logger.warning("No valid rows found to insert.")
        return

    logger.info(f"Inserting {len(rows_to_insert)} rows...")
    
    insert_query = """
    INSERT INTO public.prices (symbol, date, open, high, low, close, volume)
    VALUES %s
    ON CONFLICT (symbol, date) DO UPDATE 
    SET open = EXCLUDED.open,
        high = EXCLUDED.high,
        low = EXCLUDED.low,
        close = EXCLUDED.close,
        volume = EXCLUDED.volume;
    """
    
    try:
        execute_values(cur, insert_query, rows_to_insert)
        conn.commit()
        logger.info("Ingestion successful.")
    except Exception as e:
        conn.rollback()
        logger.error(f"Error during bulk insert: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bulk Data Ingestion")
    parser.add_argument("file", help="Path to CSV file containing market data")
    args = parser.parse_args()
    
    ingest_data(args.file)
