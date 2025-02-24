from clientServer.app import app, db
from api.models.UserFeedback import UserFeedback

from flask import request

import datetime


@app.route("/submit_issue", methods=["POST"])
def submit_issue():
    json = request.get_json()
    featureOrBug = "Bug" if int(json["featureOrBug"]) == 0 else "Feature"
    title = json["title"]
    description = json["description"]
    steps = json["steps"]
    contact = json["contact"]
    full_name = json["fullName"]
    organization = json["organization"]
    date = datetime.datetime.now().strftime("%Y-%m-%d")
    todays_feedback = UserFeedback.query.filter_by(date_created=date).all()
    if len(todays_feedback) >= 100:
        return {
            "message": "Daily feedback limit reached. Please try again tomorrow."
        }, 429
    user_feedback = UserFeedback(
        date_created=date,
        full_name=full_name,
        organization=organization,
        contact=contact,
        featureOrBug=featureOrBug,
        title=title,
        steps=steps,
        description=description,
    )
    db.session.add(user_feedback)
    db.session.commit()

    return {"message": "Issue successfully submitted"}, 200
