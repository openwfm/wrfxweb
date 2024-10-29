from flask import Flask, request
import jwt
import bcrypt
from dotenv import load_dotenv
import sqlite3
import datetime
from collections import defaultdict
import os

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
USER_FEEDBACK_DATABASE = "user_feedback.db"
USER_DATABASE = "user.db"

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


@app.route("/api/create_user", methods=["POST"])
def create_user():
    json = request.get_json()
    username = json["user"]
    password = json["password"]
    contact = json["contact"]
    full_name = json["fullName"]
    organization = json["organization"]
    date = datetime.datetime.now().strftime("%Y-%m-%d")
    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    msg = ""
    statusCode = 200
    try:
        with sqlite3.connect(USER_DATABASE) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT user FROM user WHERE user = ? OR contact = ?",
                (username, contact),
            )
            userFetch = cursor.fetchone()
            if userFetch != None:
                statusCode = 409
                msg = "User already exists with username or contact"
            else:
                cursor.execute(
                    "INSERT INTO user (date_added, full_name, organization, contact, user, password_hash) VALUES (?, ?, ?, ?, ?, ?)",
                    (date, full_name, organization, contact, username, hashed_password),
                )
                conn.commit()
                statusCode = 200
                msg = "User successfully created"
    except Exception as e:
        print("Error Creating User:", str(e))
        conn.rollback()
        msg = "Error creating user"
        return {"message": msg}, 500
    finally:
        conn.close()
    return {"message": msg}, statusCode


@app.route("/api/login", methods=["POST"])
def login():
    json = request.get_json()
    username = json["user"]
    password = json["password"]
    userPassword = ""
    try:
        with sqlite3.connect(USER_DATABASE) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT password_hash FROM user WHERE user = ?", (username,))
            userPassword = cursor.fetchone()[0]
    except Exception as e:
        conn.rollback()
        msg = "Error logging in: " + str(e)
        return {"message": msg}, 401
    finally:
        conn.close()
    if bcrypt.checkpw(password.encode("utf-8"), userPassword.encode("utf-8")):
        token = jwt.encode(
            {
                "user": username,
                "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=30),
            },
            SECRET_KEY,
        )
        return {"token": token}
    return {"message": "Login failed"}, 401
