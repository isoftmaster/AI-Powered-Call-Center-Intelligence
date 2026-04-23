import duckdb
import os
import json
from datetime import datetime
from pathlib import Path

# --- Create or connect to local DuckDB file ---
data_dir = Path("data")
data_dir.mkdir(exist_ok=True)
db_path = data_dir / "call_summary.db"

def get_connection():
    return duckdb.connect(str(db_path))

def init_db():
    con = get_connection()
    con.execute("""
    CREATE TABLE IF NOT EXISTS calls (
        id VARCHAR PRIMARY KEY,
        transcript TEXT,
        clean_transcript TEXT,
        pii_detected JSON,
        insights TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    con.close()

def save_call(call_id: str, transcript: str, clean_transcript: str, pii_detected: list, insights: str):
    con = get_connection()
    con.execute("""
        INSERT INTO calls (id, transcript, clean_transcript, pii_detected, insights)
        VALUES (?, ?, ?, ?, ?)
    """, (call_id, transcript, clean_transcript, json.dumps(pii_detected), insights))
    con.close()
