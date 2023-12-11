const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { User } = require('../models'); // Make sure to import your User model

const verifyToken = promisify(jwt.verify);

const authMiddleware = async (req, res, next) => {
  try {
    const authorizationHeader = req.header('Authorization');

    console.log('Authorization Header:', authorizationHeader);

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No valid token provided.' });
    }

    const token = authorizationHeader.split(' ')[1];

    const decoded = await verifyToken(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(decoded.userId); // Attach user details to req.user
    next();
  } catch (err) {
    console.error('Token Verification Error:', err);
    return res.status(401).json({ error: `Invalid token. ${err.message}` });
  }
};

module.exports = authMiddleware;
