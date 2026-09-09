import sqlite3

def run_migration():
    conn = sqlite3.connect('data/sonar_x.db')
    cursor = conn.cursor()
    
    # Check existing columns
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if "verification_expiry" not in columns:
        print("Adding verification_expiry...")
        cursor.execute("ALTER TABLE users ADD COLUMN verification_expiry DATETIME")
    
    if "verification_attempts" not in columns:
        print("Adding verification_attempts...")
        cursor.execute("ALTER TABLE users ADD COLUMN verification_attempts INTEGER DEFAULT 0")
        
    if "verification_last_sent" not in columns:
        print("Adding verification_last_sent...")
        cursor.execute("ALTER TABLE users ADD COLUMN verification_last_sent DATETIME")
        
    conn.commit()
    conn.close()
    print("Migration successful.")

if __name__ == "__main__":
    run_migration()
