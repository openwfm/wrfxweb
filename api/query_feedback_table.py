import sqlite3

def query_feedback_table():
    conn = sqlite3.connect('user_feedback.db')
    c = conn.cursor()
    c.execute('SELECT * FROM user_feedback')
    rows = c.fetchall()
    conn.close()
    return rows
