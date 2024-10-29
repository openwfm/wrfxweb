import sqlite3

conn = sqlite3.connect("user_table.db")
print("Connected to database successfully")

conn.execute(
    "CREATE TABLE user_feedback (id INTEGER PRIMARY KEY, date_added TEXT, full_name TEXT, organization TEXT, contact TEXT, user TEXT, password_hash TEXT)"
)
print("Table created successfully")

conn.close()
