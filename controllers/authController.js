const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models'); 

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await User.create({ name, email, password: hashedPassword });

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
        console.log({user, User});
    //  if (!user || !(await User.validPassword(password))) {
        if (!user || !(bcrypt.compare(user.password, password))) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
  
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      return res.json({
          token,
          user: {
            id: user.id,
            name: user.name, // Assuming you have a 'name' field in your user model
            email: user.email,
          },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
