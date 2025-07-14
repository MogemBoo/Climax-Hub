import pool from '../db.js';
import bcrypt from 'bcrypt';

export async function login(req, res) {
  const { usernameOrEmail, password } = req.body;

  try {
    const userResult = await pool.query(
      `SELECT * FROM users WHERE username = $1 OR email = $1`,
      [usernameOrEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    if (user.account_locked) {
      return res.status(403).json({ message: 'Account locked due to multiple failed login attempts' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await pool.query(
        `UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE user_id = $1`,
        [user.user_id]
      );

      if (user.failed_login_attempts + 1 >= 5) {
        await pool.query(
          `UPDATE users SET account_locked = true WHERE user_id = $1`,
          [user.user_id]
        );
        return res.status(403).json({ message: 'Account locked due to multiple failed login attempts' });
      }

      return res.status(400).json({ message: 'Invalid credentials' });
    }

    await pool.query(
      `UPDATE users SET failed_login_attempts = 0, last_login = CURRENT_TIMESTAMP WHERE user_id = $1`,
      [user.user_id]
    );

    // ✅ Send user data back, no JWT
    res.json({ 
      message: 'Login successful', 
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
