from flask import Flask, request
import jwt
from dotenv import load_dotenv
import sqlite3
import datetime
from collections import defaultdict
import os

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
USER_FEEDBACK_DATABASE = "user_feedback.db"

app = Flask(__name__)
feedback_counts = defaultdict(int)


@app.route("/api/submit_issue", methods=["POST"])
def submit_issue():
    json = request.get_json()
    featureOrBug = int(json["featureOrBug"])
    title = json["title"]
    description = json["description"]
    steps = json["steps"]
    contact = json["contact"]
    full_name = json["fullName"]
    organization = json["organization"]
    date = datetime.datetime.now().strftime("%Y-%m-%d")
    if feedback_counts[date] >= 100:
        print("Daily feedback limit reached.")
        return {
            "message": "Daily feedback limit reached. Please try again tomorrow."
        }, 429
    try:
        with sqlite3.connect(USER_FEEDBACK_DATABASE) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO user_feedback (date, full_name, organization, contact, type, title, description, steps) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    date,
                    full_name,
                    organization,
                    contact,
                    featureOrBug,
                    title,
                    description,
                    steps,
                ),
            )
            conn.commit()
            msg = "Issue successfully submitted"
    except Exception as e:
        print("Error Submitting Issue:", str(e))
        conn.rollback()
        msg = "Error submitting issue: " + str(e)
    finally:
        conn.close()
        feedback_counts[date] += 1
        return {"message": msg}


@app.route("/api/login", methods=["POST"])
def login():
    auth = request.authorization
    if auth and auth.username == "admin" and auth.password == "admin":
        token = jwt.encode(
            {
                "user": auth.username,
                "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=30),
            },
            SECRET_KEY,
        )
        return {"token": token}
    return {"message": "Login failed"}, 401
