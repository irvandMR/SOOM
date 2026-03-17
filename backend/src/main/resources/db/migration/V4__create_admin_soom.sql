INSERT INTO users (id, name, email, password, role, is_active)
VALUES (
   uuid_generate_v4(),
   'Admin SOOM',
   'admin@soom.com',
   '$2a$12$w68O9tAr9b9QpxJxvGWoXOGe6Gt2DVztz63UPq4Q7Ijeqkp5bX2re',
   'admin',
   true
);