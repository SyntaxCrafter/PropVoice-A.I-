import os
import json

from google import genai
from dotenv import load_dotenv

from prompts import SYSTEM_PROMPT


# Load variables from .env
load_dotenv()


# Get Gemini API key
API_KEY = os.getenv("GEMINI_API_KEY")


# Stop the application if API key is missing
if not API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing. "
        "Please add it to backend/.env"
    )


# Create Gemini client
client = genai.Client(
    api_key=API_KEY
)


# Gemini model
MODEL_NAME = "gemini-2.5-flash"


def generate_response(user_message):

    prompt = f"""
{SYSTEM_PROMPT}

You are now handling one turn of a real estate sales conversation.

The customer has just said:

"{user_message}"

Your job is to do TWO things:

1. Generate Aanya's natural conversational response.
2. Extract ALL customer information that can be confidently
   understood from the customer's message.

IMPORTANT:

- Never invent information.
- If a field is not mentioned, return null.
- If the customer says "around 1 crore", convert it to
  approximately 10000000 INR.
- If the customer says "90 lakh", convert it to approximately
  9000000 INR.
- Understand Hindi, Hinglish and English.
- Understand common variations such as:
  "3 bhk", "three bhk", "3 bedroom", "teen BHK".
- Keep the conversation natural.
- Ask about ONE important missing requirement at a time.
- Do not ask for information already provided.

Return ONLY valid JSON.

Use exactly this structure:

{{
    "reply": "Natural response from Aanya",

    "lead": {{
        "name": null,
        "intent": null,
        "location": null,
        "property_type": null,
        "configuration": null,
        "budget_min": null,
        "budget_max": null,
        "purpose": null,
        "timeline": null,
        "phone": null
    }}
}}
"""

    # Call Gemini
    try:

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt
        )

        text = response.text.strip()

    except Exception as e:

        print("Gemini API Error:", e)

        return {
            "reply": "Sorry, abhi mujhe thodi technical problem aa rahi hai. Please ek moment baad dobara try karein.",
            "lead": {}
        }

    # Remove Markdown code fences if Gemini adds them
    if text.startswith("```"):

        text = text.replace("```json", "")
        text = text.replace("```", "")
        text = text.strip()

    # Convert Gemini JSON response into Python dictionary
    try:

        result = json.loads(text)

    except json.JSONDecodeError:

        result = {
            "reply": text,
            "lead": {
                "name": None,
                "intent": None,
                "location": None,
                "property_type": None,
                "configuration": None,
                "budget_min": None,
                "budget_max": None,
                "purpose": None,
                "timeline": None,
                "phone": None
            }
        }

    return result

def calculate_lead_score():

    score = 0

    # Location
    if lead_memory.get("location"):
        score += 15

    # Configuration
    if lead_memory.get("configuration"):
        score += 15

    # Budget
    if lead_memory.get("budget_max"):
        score += 20

    # Purpose
    if lead_memory.get("purpose"):
        score += 10

    # Timeline
    if lead_memory.get("timeline"):
        score += 15

    # Phone
    if lead_memory.get("phone"):
        score += 15

    # Name
    if lead_memory.get("name"):
        score += 5

    # Intent
    if lead_memory.get("intent"):
        score += 5

    # -----------------------------------------------------
    # Lead classification
    # -----------------------------------------------------

    if score >= 75:
        status = "HOT"

    elif score >= 45:
        status = "WARM"

    else:
        status = "COLD"

    return {
        "score": score,
        "status": status
    }