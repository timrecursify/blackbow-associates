-- Create database and user for BlackBow Associates
-- Run with: sudo -u postgres psql -f create_database.sql

CREATE DATABASE blackbow;
CREATE USER blackbow_user WITH ENCRYPTED PASSWORD 'Ji8cKXf6eWJOrOKA4ZUKFyDFUPhvpm5g';
GRANT ALL PRIVILEGES ON DATABASE blackbow TO blackbow_user;

\c blackbow

GRANT ALL ON SCHEMA public TO blackbow_user;
ALTER DATABASE blackbow OWNER TO blackbow_user;
