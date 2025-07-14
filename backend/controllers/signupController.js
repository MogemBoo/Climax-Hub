import bcrypt from 'bcrypt';
import pool from '../db.js';

export async function signup(req, res) {
  const { username, email, password } = req.body;

  try {
    const userExists = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Username or email already taken' });
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const newUser = await pool.query(
      `INSERT INTO users (username, email, password_hash) 
       VALUES ($1, $2, $3) RETURNING user_id, username, email, is_admin, created_at`,
      [username, email, password_hash]
    );

    res.status(201).json({ user: newUser.rows[0], message: 'User created successfully' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}