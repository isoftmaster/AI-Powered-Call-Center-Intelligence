import os
import json
from openai import OpenAI
from dotenv import load_dotenv

# Load the OpenAI API key from .env file (if any, but we will override it for locally)
load_dotenv()

# Point to the local Ollama instance
client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama" # api_key is required by the client but ignored by Ollama
)

# Load the prompt templates once so they're not reloaded every call
with open("backend/models/system_prompt.txt", "r", encoding="utf-8") as sys_file:
    system_prompt = sys_file.read()

with open("backend/models/telecom_prompt.txt", "r", encoding="utf-8") as user_file:
    telecom_prompt = user_file.read()

with open("backend/models/json_prompt.txt", "r", encoding="utf-8") as json_file:
    json_prompt = json_file.read()


def analyze_transcript(transcript: str) -> str:
    """
    Given a transcript string, send it to local LLaMA-2 with the structured telecom prompt
    and return the insights as a natural language bullet list.
    """
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": transcript + "\n\n" + telecom_prompt}
    ]

    try:
        completion = client.chat.completions.create(
            model="llama2",  # the pulled local model from Ollama
            messages=messages,
            temperature=0.8,        # creative but still stable
            top_p=0.9,              # nucleus sampling
            max_tokens=1000
        )
        return completion.choices[0].message.content.strip()

    except Exception as e:
        return f"[Error generating local LLM insights: {e}]"


def analyze_transcript_structured(transcript: str) -> dict:
    """
    Given a transcript string, send it to local LLM with the JSON prompt
    and return the insights as a dictionary for charting.
    """
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": transcript + "\n\n" + json_prompt}
      ]

    try:
        completion = client.chat.completions.create(
            model="llama2",
            messages=messages,
            temperature=0.2, # low temperature for strict JSON
            max_tokens=1000,
            response_format={"type": "json_object"}
        )
        content = completion.choices[0].message.content.strip()
        return json.loads(content)
    except Exception as e:
        print(f"Error in JSON analysis: {e}")
        # Return a fallback structure
        return {
            "classification": "Unknown",
            "satisfaction_score": 3,
            "sentiment": "Neutral",
            "churn_risk_score": 50,
            "emotional_progression": []
        }
