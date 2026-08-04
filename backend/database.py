import sqlite3
from datetime import datetime


# =========================================================
# DATABASE CONFIGURATION
# =========================================================

DATABASE_NAME = "propvoice.db"


# =========================================================
# GET DATABASE CONNECTION
# =========================================================

def get_connection():

    connection = sqlite3.connect(
        DATABASE_NAME
    )

    # Allows us to access columns by name
    connection.row_factory = sqlite3.Row

    return connection


# =========================================================
# INITIALIZE DATABASE
# =========================================================

def initialize_database():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS leads (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT,

            intent TEXT,

            location TEXT,

            property_type TEXT,

            configuration TEXT,

            budget_min INTEGER,

            budget_max INTEGER,

            purpose TEXT,

            timeline TEXT,

            phone TEXT,

            lead_score INTEGER,

            lead_status TEXT,

            summary TEXT,

            created_at TEXT

        )
    """)

    connection.commit()

    connection.close()


# =========================================================
# SAVE LEAD
# =========================================================

def save_lead(
    lead,
    lead_score,
    summary
):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO leads (

            name,
            intent,
            location,
            property_type,
            configuration,
            budget_min,
            budget_max,
            purpose,
            timeline,
            phone,
            lead_score,
            lead_status,
            summary,
            created_at

        )

        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (

        lead.get("name"),

        lead.get("intent"),

        lead.get("location"),

        lead.get("property_type"),

        lead.get("configuration"),

        lead.get("budget_min"),

        lead.get("budget_max"),

        lead.get("purpose"),

        lead.get("timeline"),

        lead.get("phone"),

        lead_score.get("score", 0),

        lead_score.get("status", "COLD"),

        summary,

        datetime.now().isoformat()

    ))

    connection.commit()

    lead_id = cursor.lastrowid

    connection.close()

    return lead_id


# =========================================================
# GET ALL LEADS
# =========================================================

def get_all_leads():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM leads
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    connection.close()

    return [
        dict(row)
        for row in rows
    ]

