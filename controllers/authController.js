const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.register = async (req, res) => {
  const { name, email, timezone , password } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await User.create({ name, email, timezone, password: hashedPassword });

    if (newUser) {
      return res.json({
        data: {
          message: 'User registered successfully',
          userId: newUser.id,
        },
      });
    } else {
      return res.status(500).json({ error: 'Failed to create user' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.validPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    // Use req.user to access user details
    const user = req.user;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Customize the response as needed
    return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          timezone: user.timezone,
          // Add other user properties as needed
        },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
