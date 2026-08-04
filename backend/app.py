from flask import Flask, jsonify, request
from flask_cors import CORS

from ai_service import (
    generate_response,
    reset_lead_memory,
    calculate_lead_score
)

from database import (
    initialize_database,
    save_lead,
    get_all_leads
)


# =========================================================
# CREATE FLASK APPLICATION
# =========================================================

app = Flask(__name__)

# Initialize SQLite database
initialize_database()

# Allow React frontend to communicate with Flask
CORS(app)


# =========================================================
# HOME / HEALTH CHECK
# =========================================================

@app.get("/")
def home():

    return jsonify({
        "status": "success",
        "message": "PropVoice AI backend is running"
    })


# =========================================================
# TEST API
# =========================================================

@app.get("/api/test")
def test_api():

    return jsonify({
        "status": "success",
        "message": "Hello React! Flask backend is working."
    })


# =========================================================
# AI CHAT API
# =========================================================

@app.post("/api/chat")
def chat():

    data = request.get_json() or {}

    user_message = data.get(
        "message",
        ""
    ).strip()

    if not user_message:

        return jsonify({
            "status": "error",
            "message": "Message is required"
        }), 400

    # Generate AI response
    ai_response = generate_response(
        user_message
    )

    # Calculate current lead score
    lead_score = calculate_lead_score()

    return jsonify({

        "status": "success",

        "user_message": user_message,

        "reply": ai_response.get(
            "reply",
            ""
        ),

        "lead": ai_response.get(
            "lead",
            {}
        ),

        "lead_score": lead_score

    })


# =========================================================
# RESET CONVERSATION
# =========================================================

@app.post("/api/reset")
def reset():

    reset_lead_memory()

    return jsonify({
        "status": "success",
        "message": "Conversation reset successfully"
    })


# =========================================================
# SAVE LEAD
# =========================================================

@app.post("/api/leads")
def create_lead():

    data = request.get_json() or {}

    lead = data.get(
        "lead",
        {}
    )

    lead_score = data.get(
        "lead_score",
        {
            "score": 0,
            "status": "COLD"
        }
    )

    summary = data.get(
        "summary",
        ""
    )

    # Save lead into SQLite
    lead_id = save_lead(
        lead,
        lead_score,
        summary
    )

    return jsonify({

        "status": "success",

        "message": "Lead saved successfully",

        "lead_id": lead_id

    })


# =========================================================
# GET ALL SAVED LEADS
# =========================================================

@app.get("/api/leads")
def leads():

    all_leads = get_all_leads()

    return jsonify({

        "status": "success",

        "leads": all_leads

    })


# =========================================================
# START FLASK SERVER
# =========================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )

