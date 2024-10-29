import sqlite3


def query_user_table():
    conn = sqlite3.connect("user.db")
    c = conn.cursor()
    c.execute("SELECT * FROM user")
    rows = c.fetchall()
    conn.close()
    return rows


rows = query_user_table()
