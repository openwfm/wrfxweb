from ..app import app
from ..models.Users import User
from ..serverKeys import CLIENT_ID, CLIENT_SECRET

from flask import request, redirect, url_for, session, render_template
from flask_cors import CORS, cross_origin

from authlib.integrations.flask_client import OAuth

# from flask_oauthlib.client import OAuth

cors = CORS(app)
app.config["CORS_HEADERS"] = "Access-Control-Allow-Origin"

oauth = OAuth(app)
google = oauth.register(
    name="google",
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid profile email"},
)

# google = oauth.remote_app(
#     "google",
#     consumer_key=CLIENT_ID,
#     consumer_secret=CLIENT_SECRET,
#     request_token_params={"scope": "email"},
#     base_url="https://www.googleapis.com/oauth2/v1/",
#     request_token_url=None,
#     access_token_method="POST",
#     access_token_url="https://accounts.google.com/o/oauth2/token",
#     authorize_url="https://accounts.google.com/o/oauth2/auth",
# )


@app.route("/create_user", methods=["POST"])
def create_user():
    json = request.get_json()
    username = json["user"]
    password = json["password"]
    contact = json["contact"]
    full_name = json["fullName"]
    organization = json["organization"]
    date = datetime.datetime.now().strftime("%Y-%m-%d")

    user_username = User.query.filter_by(username=username).first()
    if user_username:
        return {"message": "User already exists with username"}, 409
    user_contact = User.query.filter_by(contact=contact).first()
    if user_contact:
        return {"message": "User already exists with contact"}, 409

    new_user = User(
        username=username,
        contact=contact,
        full_name=full_name,
        organization=organization,
        date_created=date,
    )
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    session["username"] = new_user.username
    return redirect(url_for("index"))


@app.route("/login/google", methods=["POST"])
@cross_origin()
def google_login():
    try:
        redirect_uri = url_for("authorize_google", _external=True)
        return google.authorize_redirect(redirect_uri)
        return google.authorize(callback=redirect_uri)
    except Exception as e:
        return {"message": "Error logging in with Google: " + str(e)}, 401


@app.route("/authorize/google", methods=["GET"])
@cross_origin()
def authorize_google():
    print(" ==== authorize_google ====")
    token = google.authorize_access_token()
    userinfo_endpoint = google.server_metadata["userinfo_endpoint"]
    resp = google.get(userinfo_endpoint)
    user_info = resp.json()
    contact = user_info["email"]
    user = User.query.filter_by(contact=contact).first()
    if not user:
        user = User(
            username=user_info["email"],
            contact=user_info["email"],
            full_name=user_info["name"],
            organization="",
            date_created=datetime.datetime.now().strftime("%Y-%m-%d"),
        )
        db.session.add(user)
        db.session.commit()
    session["username"] = user.username
    session["oauth_token"] = token

    return redirect(url_for("index"))


@app.route("/login/submit", methods=["POST"])
def login():
    json = request.get_json()
    username = json["user"]
    password = json["password"]
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        session["username"] = user.username
        return redirect(url_for("index"))
    return {"message": "Login failed"}, 401


@app.route("/login", methods=["GET"])
def login_page():
    return render_template("login.html")
