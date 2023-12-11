const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./models'); // Make sure to import sequelize correctly
const apiRoutes = require('./routes/apiRoutes');

const app = express();

app.use(bodyParser.json());

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;

// Ensure that sequelize.sync is a function before calling it
if (typeof sequelize.sync === 'function') {
  sequelize.sync()
    .then(() => {
      console.log('Database synced');
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error('Error syncing database:', error);
    });
} else {
  console.error('sequelize.sync is not a function');
}
