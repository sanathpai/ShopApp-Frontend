-- Get all user credentials from the database
-- Note: Passwords are likely hashed, so you'll need to reset them or use existing test accounts

-- Query 1: Get all users with their basic info
SELECT 
    id,
    username,
    email,
    first_name,
    last_name,
    shop_name,
    contact,
    role,
    created_at
FROM Users 
ORDER BY created_at DESC;

-- Query 2: Get users with their password hashes (for debugging only)
SELECT 
    id,
    username,
    email,
    password_hash,
    role
FROM Users 
ORDER BY role DESC, username ASC;

-- Query 3: Create a test user with known password
INSERT INTO Users (
    username, 
    password_hash, 
    email, 
    first_name, 
    last_name, 
    shop_name, 
    role
) VALUES (
    'testuser', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'password'
    'test@example.com',
    'Test',
    'User',
    'Test Shop',
    'user'
);

-- Query 4: Reset a user's password to a known value
-- Replace 'username_here' with actual username
UPDATE Users 
SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
WHERE username = 'username_here';
-- This sets password to 'password'

-- Query 5: Check if there are any admin users
SELECT * FROM Users WHERE role = 'admin'; 