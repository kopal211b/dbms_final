import psycopg2

def get_connection():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="postgres",
            user="postgres",
            password="system",
            port="5432"  
        )
        return conn
    except Exception as e:
        print("Database connection failed:", e)
        return None