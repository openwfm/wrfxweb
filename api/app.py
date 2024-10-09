from flask import Flask, request
import sqlite3
from datetime import datetime
from collections import defaultdict

USER_FEEDBACK_DATABASE = 'user_feedback.db'

app = Flask(__name__)
feedback_counts = defaultdict(int)

@app.route('/api/submit_issue', methods=['POST'])
def submit_issue():
    json = request.get_json()
    featureOrBug = int(json['featureOrBug'])
    title = json['title']
    description = json['description']
    steps = json['steps']
    contact = json['contact']
    full_name = json['fullName']
    organization = json['organization']
    date = datetime.now().strftime("%Y-%m-%d")
    if feedback_counts[date] >= 100:
        print ("Daily feedback limit reached.")
        return jsonify({'message': 'Daily feedback limit reached. Please try again tomorrow.'}), 429
    try: 
        with sqlite3.connect(USER_FEEDBACK_DATABASE) as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO user_feedback (date, full_name, organization, contact, type, title, description, steps) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", (date, full_name, organization, contact, featureOrBug, title, description, steps))
            conn.commit()
            msg = 'Issue successfully submitted'
    except Exception as e:
        print("Error Submitting Issue:",str(e))
        conn.rollback()
        msg = 'Error submitting issue: ' + str(e)
    finally:
        conn.close()
        feedback_counts[date] += 1
        return jsonify({'message': msg})

