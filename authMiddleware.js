const jwt = require('jsonwebtoken');
const db = require('./database');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

const authenticateUser = async (username, password) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE username = ?',
      [username],
      async (err, user) => {
        if (err || !user) return resolve(null);
        
        const bcrypt = require('bcryptjs');
        const isValid = await bcrypt.compare(password, user.password_hash);
        resolve(isValid ? user : null);
      }
    );
  });
};

module.exports = { authenticateJWT, authenticateUser };