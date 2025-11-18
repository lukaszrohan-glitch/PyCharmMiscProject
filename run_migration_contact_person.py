import psycopg2

# Wklej tu swój DATABASE_PUBLIC_URL z Railway (CAŁY, w cudzysłowie)
DATABASE_URL = "postgresql://postgres:YOOgZmPdkOteYXenkjcYArWkRdRJrbyo@switchyard.proxy.rlwy.net:28247/railway

def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Dodanie kolumn, jeśli ich jeszcze nie ma
    cur.execute("ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_person text;")
    cur.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS contact_person text;")

    conn.commit()
    cur.close()
    conn.close()
    print("Migration done – contact_person columns are in place.")

if __name__ == "__main__":
    main()
