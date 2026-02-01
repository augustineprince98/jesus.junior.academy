import bcrypt

# The stored hash from the database
stored_hash = "$2b$12$RxjT0J0F9f0r4kth1e0WNeh10Dof3Yf4M5KCLEIhkLkdtzUxznFli"

# Test password
test_password = "admin123"

try:
    result = bcrypt.checkpw(test_password.encode('utf-8'), stored_hash.encode('utf-8'))
    print(f"Password '{test_password}' matches: {result}")
except Exception as e:
    print(f"Error: {e}")

# Also show what a new hash would look like
new_hash = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt())
print(f"New hash for admin123: {new_hash.decode()}")
