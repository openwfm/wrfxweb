import sqlite3

conn = sqlite3.connect('user_feedback.db')
print("Connected to database successfully")

conn.execute('CREATE TABLE user_feedback (id INTEGER PRIMARY KEY, date TEXT, full_name TEXT, organization TEXT, contact TEXT, type INTEGER, title TEXT, description TEXT, steps TEXT)')
print("Table created successfully")

conn.close()
