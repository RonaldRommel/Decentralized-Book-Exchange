CREATE DATABASE IF NOT EXISTS bookdb;
USE bookdb;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  reputation INT DEFAULT 0,
  location VARCHAR(255),           -- optional field
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS exchanges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  book_id VARCHAR(100) NOT NULL,
  borrower_id INT NOT NULL,
  lender_id INT NOT NULL,
  state ENUM('requested', 'accepted', 'rejected', 'returned', 'completed', 'cancelled') NOT NULL,
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (borrower_id) REFERENCES users(id),
  FOREIGN KEY (lender_id) REFERENCES users(id)
);

INSERT INTO users (id, name, email, reputation, location)
VALUES
  (1, 'Alice Johnson', 'alice@example.com', 45, 'Seattle, WA'),
  (2, 'Bob Smith', 'bob@example.com', 60, 'Portland, OR'),
  (3, 'Charlie Nguyen', 'charlie@example.com', 30, 'San Francisco, CA');


INSERT INTO exchanges (book_id, borrower_id, lender_id, state)
VALUES
  ('book-001', 1, 2, 'requested'),
  ('book-002', 3, 1, 'completed');


