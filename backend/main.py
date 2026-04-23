# --- FastAPI Application for Call Intelligence Backend ---
# Handles audio and transcript upload, transcribes audio, sends to GPT, returns insights

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import openai
import tempfile
import whisper
import uvicorn
import os
from dotenv import load_dotenv
import uuid
import json
from backend.database import init_db, save_call, get_connection

# --- Load OpenAI API key from .env so we never hardcode secrets ---
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# --- initialize FastAPI app ---
# this powers the backend server for both upload + insight APIs
app = FastAPI()

# --- initialize database on startup ---
@app.on_event("startup")
async def startup_event():
    init_db()

# --- enable CORS (important for local frontend testing) ---
# this allows React or Streamlit UIs to make requests to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- load Whisper model once ---
# loading it globally avoids reloading the model every API call
whisper_model = whisper.load_model("base")  # use "base" or "small" to keep memory light

# --- POST route to receive audio + return insights ---
# takes .wav/.mp3 uploads, transcribes, then hits GPT for behavioral analysis
@app.post("/analyze-audio")
async def analyze_audio(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    # run the speech-to-text step
    result = whisper_model.transcribe(tmp_path)
    transcript = result["text"]

    # Redact PII using local spaCy and Presidio
    from backend.pii_redaction import detect_and_redact
    redaction_result = detect_and_redact(transcript)
    clean_transcript = redaction_result["redacted_text"]

    # feed the clean transcript to local LLM to extract intent, tone, churn risk, etc.
    from backend.gpt_analysis import analyze_transcript, analyze_transcript_structured
    insights_text = analyze_transcript(clean_transcript)
    insights_json = analyze_transcript_structured(clean_transcript)

    # Generate a unique call ID
    call_id = str(uuid.uuid4())

    # Save to DuckDB for post-call analytics
    save_call(
        call_id=call_id,
        transcript=transcript,
        clean_transcript=clean_transcript,
        pii_detected=redaction_result["pii_detected"],
        insights=json.dumps(insights_json)  # store the structured JSON
    )

    # return raw transcript, clean transcript, detected PII, and insights
    return {
        "call_id": call_id,
        "transcript": transcript,
        "clean_transcript": clean_transcript,
        "pii_detected": redaction_result["pii_detected"],
        "insights": insights_text,
        "insights_structured": insights_json
    }

# --- POST route for raw transcript text upload ---
# useful for testing manually or using pre-existing call logs
@app.post("/analyze-text")
async def analyze_text_input(transcript: str = Form(...)):
    from backend.pii_redaction import detect_and_redact
    redaction_result = detect_and_redact(transcript)
    clean_transcript = redaction_result["redacted_text"]

    from backend.gpt_analysis import analyze_transcript, analyze_transcript_structured
    insights_text = analyze_transcript(clean_transcript)
    insights_json = analyze_transcript_structured(clean_transcript)
    
    # Generate a unique call ID
    call_id = str(uuid.uuid4())

    # Save to DuckDB for post-call analytics
    save_call(
        call_id=call_id,
        transcript=transcript,
        clean_transcript=clean_transcript,
        pii_detected=redaction_result["pii_detected"],
        insights=json.dumps(insights_json)
    )
    
    return {
        "call_id": call_id,
        "transcript": transcript,
        "clean_transcript": clean_transcript,
        "pii_detected": redaction_result["pii_detected"],
        "insights": insights_text,
        "insights_structured": insights_json
    }

# --- GET route to retrieve call history ---
@app.get("/history")
async def get_history():
    con = get_connection()
    try:
        # Query calls sorted by most recent
        results = con.execute("SELECT id, transcript, clean_transcript, pii_detected, insights, created_at FROM calls ORDER BY created_at DESC").fetchall()
        
        history = []
        for row in results:
            history.append({
                "call_id": row[0],
                "transcript": row[1],
                "clean_transcript": row[2],
                "pii_detected": json.loads(row[3]) if isinstance(row[3], str) else row[3],
                "insights": row[4],
                "created_at": row[5].isoformat() if row[5] else None
            })
        return history
    except Exception as e:
        return {"error": str(e)}
    finally:
        con.close()

# --- GET route for historical analytics charts ---
@app.get("/analytics")
async def get_analytics():
    con = get_connection()
    try:
        # Get sentiment distribution
        sentiment_data = con.execute("""
            SELECT 
                json_extract(insights, '$.sentiment') as sentiment,
                count(*) as count
            FROM calls
            GROUP BY sentiment
        """).fetchall()

        # Get churn risk average over time
        churn_trend = con.execute("""
            SELECT 
                strftime('%Y-%m-%d %H:%M', created_at) as time,
                avg(CAST(json_extract(insights, '$.churn_risk_score') AS FLOAT)) as avg_risk
            FROM calls
            GROUP BY time
            ORDER BY time ASC
        """).fetchall()

        # Get issue classification distribution
        issue_dist = con.execute("""
            SELECT 
                json_extract(insights, '$.classification') as category,
                count(*) as count
            FROM calls
            GROUP BY category
        """).fetchall()

        return {
            "sentiment_dist": [{"name": r[0], "value": r[1]} for r in sentiment_data if r[0]],
            "churn_trend": [{"time": r[0], "risk": r[1]} for r in churn_trend if r[0]],
            "issue_dist": [{"name": r[0], "value": r[1]} for r in issue_dist if r[0]]
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        con.close()

# --- GET healthcheck route for testing ---
@app.get("/ping")
def ping():
    return {"status": "ok"}

# --- run locally with uvicorn when this file is the entrypoint ---
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)

# --- pip install requirements for MacOS ---
# do this once before running anything else
# recommended to run in a virtualenv or conda env
# use --no-deps on keras/tensorflow to avoid Mac Intel crash bugs
#
# pip install openai whisper fastapi python-dotenv uvicorn[standard] torchaudio
# pip install transformers==4.37.2  # lock version for stability
# pip install keras==2.11.0 --no-deps  # avoid Apple Silicon issues if keras is needed downstream
# pip install spacy==3.7.2 presidio-analyzer presidio-anonymizer
# python -m spacy download en_core_web_sm
