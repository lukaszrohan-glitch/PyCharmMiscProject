import sqlite3

conn = sqlite3.connect('_dev_db.sqlite')
cur = conn.cursor()
cur.execute('SELECT sql FROM sqlite_master WHERE type="view" AND name="v_order_finance"')
result = cur.fetchone()
if result:
    print(result[0])
else:
    print('View not found')
conn.close()

