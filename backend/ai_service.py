import os
import json
import re

from dotenv import load_dotenv

# Gemini import
try:
    from google import genai
except ImportError:
    genai = None

from prompts import SYSTEM_PROMPT


# =========================================================
# LOAD ENVIRONMENT
# =========================================================

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

MODEL_NAME = "gemini-2.5-flash"


# =========================================================
# GEMINI CLIENT
# =========================================================

client = None

if API_KEY and genai:

    try:
        client = genai.Client(
            api_key=API_KEY
        )

    except Exception as e:

        print(
            "Gemini client initialization failed:",
            e
        )


# =========================================================
# LEAD MEMORY
# =========================================================

lead_memory = {
    "name": None,
    "intent": None,
    "location": None,
    "property_type": None,
    "configuration": None,
    "budget_min": None,
    "budget_max": None,
    "purpose": None,
    "timeline": None,
    "phone": None,
}


# =========================================================
# RESET LEAD MEMORY
# =========================================================

def reset_lead_memory():

    global lead_memory

    lead_memory = {
        "name": None,
        "intent": None,
        "location": None,
        "property_type": None,
        "configuration": None,
        "budget_min": None,
        "budget_max": None,
        "purpose": None,
        "timeline": None,
        "phone": None,
    }


# =========================================================
# SAFE INTEGER
# =========================================================

def safe_int(value):

    try:
        return int(value)

    except Exception:
        return None


# =========================================================
# EXTRACT BUDGET
# =========================================================

def extract_budget(message):

    text = message.lower()

    # Crore examples:
    # 1 crore
    # 1 cr
    # 1.2 crore
    # 1.5cr

    crore_match = re.search(
        r"(\d+(?:\.\d+)?)\s*(?:crore|cr|करोड़)",
        text
    )

    if crore_match:

        amount = float(
            crore_match.group(1)
        )

        value = int(
            amount * 10000000
        )

        return value, value


    # Lakh examples:
    # 90 lakh
    # 90 lacs
    # 90L
    # 75 lakhs

    lakh_match = re.search(
        r"(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|l)",
        text
    )

    if lakh_match:

        amount = float(
            lakh_match.group(1)
        )

        value = int(
            amount * 100000
        )

        return value, value


    return None, None


# =========================================================
# EXTRACT BHK
# =========================================================

def extract_configuration(message):

    text = message.lower()

    match = re.search(
        r"\b([1-5])\s*(?:bhk|bedroom|bed\s*room)\b",
        text
    )

    if match:

        return (
            match.group(1) +
            " BHK"
        )


    words = {
        "one bhk": "1 BHK",
        "two bhk": "2 BHK",
        "three bhk": "3 BHK",
        "four bhk": "4 BHK",
        "five bhk": "5 BHK",
        "teen bhk": "3 BHK",
        "do bhk": "2 BHK",
        "char bhk": "4 BHK",
    }

    for phrase, value in words.items():

        if phrase in text:

            return value


    return None


# =========================================================
# EXTRACT LOCATION
# =========================================================

def extract_location(message):

    text = message.lower()

    known_locations = [
        "noida",
        "greater noida",
        "noida extension",
        "greater noida west",
        "delhi",
        "gurgaon",
        "gurugram",
        "ghaziabad",
        "faridabad",
        "sector 150",
        "sector 137",
        "sector 62",
        "sector 75",
        "sector 76",
    ]

    for location in known_locations:

        if location in text:

            if location == "gurgaon":
                return "Gurgaon"

            if location == "gurugram":
                return "Gurugram"

            return location.title()


    return None


# =========================================================
# EXTRACT INTENT
# =========================================================

def extract_intent(message):

    text = message.lower()

    buying_words = [
        "buy",
        "buying",
        "purchase",
        "purchasing",
        "lena",
        "lenā",
        "kharid",
        "khareed",
        "kharidna",
        "ghar lena",
        "flat lena",
        "property lena",
    ]

    renting_words = [
        "rent",
        "rental",
        "kiraye",
        "kiraya",
    ]

    investment_words = [
        "investment",
        "invest",
        "investing",
        "return",
        "roi",
    ]

    for word in investment_words:

        if word in text:

            return "Investment"


    for word in renting_words:

        if word in text:

            return "Renting"


    for word in buying_words:

        if word in text:

            return "Buying"


    return None


# =========================================================
# EXTRACT PURPOSE
# =========================================================

def extract_purpose(message):

    text = message.lower()

    self_use_words = [
        "self use",
        "self-use",
        "khud rehne",
        "rehne ke liye",
        "apne liye",
        "family ke liye",
        "family",
    ]

    investment_words = [
        "investment",
        "invest",
        "rent ke liye",
        "rental income",
    ]

    for word in self_use_words:

        if word in text:

            return "Self Use"


    for word in investment_words:

        if word in text:

            return "Investment"


    return None


# =========================================================
# EXTRACT TIMELINE
# =========================================================

def extract_timeline(message):

    text = message.lower()

    if any(
        word in text
        for word in [
            "immediately",
            "immediate",
            "jaldi",
            "abhi",
            "asap",
        ]
    ):

        return "Immediate"


    if any(
        word in text
        for word in [
            "this month",
            "iss month",
            "is month",
        ]
    ):

        return "Within 1 Month"


    if any(
        word in text
        for word in [
            "1 month",
            "one month",
        ]
    ):

        return "Within 1 Month"


    if any(
        word in text
        for word in [
            "3 months",
            "three months",
            "3 mahine",
        ]
    ):

        return "Within 3 Months"


    if any(
        word in text
        for word in [
            "6 months",
            "six months",
            "6 mahine",
        ]
    ):

        return "Within 6 Months"


    return None


# =========================================================
# EXTRACT PHONE
# =========================================================

def extract_phone(message):

    match = re.search(
        r"(?<!\d)(?:\+91[\s-]?)?[6-9]\d{9}(?!\d)",
        message
    )

    if match:

        phone = re.sub(
            r"\D",
            "",
            match.group(0)
        )

        if len(phone) == 12 and phone.startswith("91"):
            phone = phone[2:]

        return phone


    return None


# =========================================================
# EXTRACT NAME
# =========================================================

def extract_name(message):

    patterns = [
        r"(?:my name is|mera naam|main|i am)\s+([A-Za-z]+)",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            message,
            re.IGNORECASE
        )

        if match:

            name = match.group(1)

            if name.lower() not in [
                "looking",
                "interested",
                "searching",
                "from",
                "in",
            ]:

                return name.title()


    return None


# =========================================================
# UPDATE LEAD MEMORY
# =========================================================

def extract_lead_information(message):

    global lead_memory

    location = extract_location(message)

    configuration = extract_configuration(
        message
    )

    budget_min, budget_max = extract_budget(
        message
    )

    intent = extract_intent(message)

    purpose = extract_purpose(message)

    timeline = extract_timeline(message)

    phone = extract_phone(message)

    name = extract_name(message)


    if location:
        lead_memory["location"] = location

    if configuration:
        lead_memory["configuration"] = configuration

    if budget_min:
        lead_memory["budget_min"] = budget_min

    if budget_max:
        lead_memory["budget_max"] = budget_max

    if intent:
        lead_memory["intent"] = intent

    if purpose:
        lead_memory["purpose"] = purpose

    if timeline:
        lead_memory["timeline"] = timeline

    if phone:
        lead_memory["phone"] = phone

    if name:
        lead_memory["name"] = name


    # Default property type when
    # residential BHK is mentioned

    if configuration:

        lead_memory[
            "property_type"
        ] = "Residential Apartment"


    return lead_memory.copy()


# =========================================================
# LEAD SCORE
# =========================================================

def calculate_lead_score():

    score = 0


    # Intent
    if lead_memory["intent"] == "Buying":
        score += 20

    elif lead_memory["intent"] == "Investment":
        score += 20

    elif lead_memory["intent"] == "Renting":
        score += 10


    # Location
    if lead_memory["location"]:
        score += 15


    # Configuration
    if lead_memory["configuration"]:
        score += 15


    # Budget
    if lead_memory["budget_max"]:
        score += 20


    # Purpose
    if lead_memory["purpose"]:
        score += 10


    # Timeline
    if lead_memory["timeline"]:
        score += 10


    # Phone
    if lead_memory["phone"]:
        score += 10


    # Maximum score
    score = min(
        score,
        100
    )


    if score >= 70:

        status = "HOT"

    elif score >= 40:

        status = "WARM"

    else:

        status = "COLD"


    return {
        "score": score,
        "status": status,
    }


# =========================================================
# FALLBACK RESPONSE ENGINE
# =========================================================

def fallback_response(message):

    lead = extract_lead_information(
        message
    )

    score = calculate_lead_score()


    location = (
        lead["location"]
        or "your preferred location"
    )

    configuration = (
        lead["configuration"]
        or "your preferred configuration"
    )

    budget = lead[
        "budget_max"
    ]


    # =====================================================
    # RECOMMENDATION
    # =====================================================

    recommendation = (
        "Aarohan Heights"
    )


    if (
        location
        and "Noida" in location
        and configuration
        == "3 BHK"
    ):

        reply = (
            f"Bilkul! {location} mein "
            f"{configuration} ke liye "
            f"{recommendation} ek acha option "
            f"ho sakta hai. "
            f"Yahan 3 BHK ki pricing "
            f"₹1.05 Crore se start hoti hai. "
        )

    elif location:

        reply = (
            f"Bilkul! {location} mein "
            f"{configuration} ke liye "
            f"{recommendation} ek option "
            f"consider kiya ja sakta hai. "
        )

    else:

        reply = (
            "Bilkul! Main aapki property "
            "requirement ke according suitable "
            "options suggest kar sakti hoon. "
        )


    # =====================================================
    # ASK NEXT QUESTION
    # =====================================================

    if not lead["intent"]:

        reply += (
            "Aap property self-use ke liye "
            "dekh rahe hain ya investment ke liye?"
        )

    elif not lead["location"]:

        reply += (
            "Aapki preferred location kaunsi hai?"
        )

    elif not lead["configuration"]:

        reply += (
            "Aapko kitne BHK chahiye?"
        )

    elif not lead["budget_max"]:

        reply += (
            "Aapka approximate budget kya hai?"
        )

    elif not lead["purpose"]:

        reply += (
            "Aap property khud rehne ke liye "
            "le rahe hain ya investment ke liye?"
        )

    elif not lead["timeline"]:

        reply += (
            "Aap purchase kab tak karna chahenge?"
        )

    elif not lead["phone"]:

        reply += (
            "Agar convenient ho to main "
            "follow-up ke liye aapka phone "
            "number note kar sakti hoon."
        )

    else:

        reply += (
            "Aapke requirements kaafi clear hain. "
            "Main sales team ke liye next "
            "follow-up recommend karungi."
        )


    return {
        "reply": reply,
        "lead": lead,
        "lead_score": score,
    }


# =========================================================
# GEMINI RESPONSE
# =========================================================

def gemini_response(message):

    if not client:

        raise RuntimeError(
            "Gemini client is unavailable"
        )


    lead = extract_lead_information(
        message
    )


    prompt = f"""
{SYSTEM_PROMPT}

You are Aanya, an AI real estate sales
assistant.

Customer message:

"{message}"

Known lead information:

{json.dumps(lead, indent=2)}

Generate a natural Hindi/Hinglish/English
response.

Rules:

1. Never invent customer information.
2. Never ask for information already known.
3. Ask only ONE important missing question.
4. Be concise and conversational.
5. If location is Noida and configuration
   is 3 BHK, Aarohan Heights can be
   recommended.
6. Do not claim a property is guaranteed
   to be available.
7. Return ONLY valid JSON.

Structure:

{{
    "reply": "Aanya's response",
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


    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt
    )


    text = (
        response.text
        .strip()
    )


    # Remove markdown JSON fences

    if text.startswith("```"):

        text = text.replace(
            "```json",
            ""
        )

        text = text.replace(
            "```",
            ""
        )

        text = text.strip()


    result = json.loads(text)


    # Merge extracted information
    # with Gemini information

    if result.get("lead"):

        for key, value in result[
            "lead"
        ].items():

            if value is not None:

                lead_memory[
                    key
                ] = value


    result["lead"] = lead_memory.copy()

    result["lead_score"] = (
        calculate_lead_score()
    )


    return result


# =========================================================
# MAIN RESPONSE FUNCTION
# =========================================================

def generate_response(user_message):

    # First extract information locally.
    # This means lead capture continues
    # even when Gemini is unavailable.

    extract_lead_information(
        user_message
    )


    # Try Gemini first

    try:

        if client:

            result = gemini_response(
                user_message
            )

            return result


    except Exception as e:

        print(
            "Gemini unavailable. "
            "Using fallback engine."
        )

        print(
            "Gemini error:",
            e
        )


    # =====================================================
    # FALLBACK
    # =====================================================

    return fallback_response(
        user_message
    )

