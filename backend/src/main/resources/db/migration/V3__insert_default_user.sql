INSERT INTO users (id, name, email, password, role, is_active)
VALUES (
   uuid_generate_v4(),
   'Admin SOOM',
   'admin@soom.com',
   -- password: 'soom123' yang sudah di-BCrypt
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHi',
   'admin',
   true
);