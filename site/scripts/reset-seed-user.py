import hashlib
import os
import secrets
import sys

import psycopg2

if len(sys.argv) < 2:
    print("Usage: python scripts/reset-seed-user.py <new-password>")
    sys.exit(1)

password = sys.argv[1]
if len(password) < 8:
    print("Password must be at least 8 characters")
    sys.exit(1)

database_url = os.environ.get('DATABASE_URL')
if not database_url:
    print("DATABASE_URL env var required")
    sys.exit(1)

# Match Payload's generatePasswordSaltHash:
# salt = 32 random bytes hex, hash = pbkdf2(password, salt, 25000, 512, 'sha256') hex
salt = secrets.token_hex(32)
hash_bytes = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 25000, 512)
hash_hex = hash_bytes.hex()

conn = psycopg2.connect(database_url)
cur = conn.cursor()

cur.execute("SELECT id FROM users WHERE email = 'cms-seed@beatrox.com' LIMIT 1")
row = cur.fetchone()

if row:
    user_id = row[0]
    cur.execute(
        "UPDATE users SET salt = %s, hash = %s, updated_at = NOW() WHERE id = %s",
        (salt, hash_hex, user_id),
    )
    print(f"Updated cms-seed@beatrox.com password (id: {user_id})")
else:
    cur.execute(
        """
        INSERT INTO users (email, salt, hash, created_at, updated_at)
        VALUES ('cms-seed@beatrox.com', %s, %s, NOW(), NOW())
        RETURNING id
        """,
        (salt, hash_hex),
    )
    user_id = cur.fetchone()[0]
    print(f"Created cms-seed@beatrox.com user (id: {user_id})")

conn.commit()
cur.close()
conn.close()
