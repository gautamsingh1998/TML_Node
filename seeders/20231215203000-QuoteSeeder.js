'use strict';
const axios = require('axios');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Make HTTP request to get quotes
      const response = await axios.get('https://type.fit/api/quotes');
      const quotes = response.data;

      if (quotes && quotes.length > 0) {

        const quotesData = quotes.map(quote => ({
          text: quote.text,
          author: quote.author,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await queryInterface.bulkInsert('Quotes', quotesData);
        
        console.log('Quotes seeded successfully.');
      }
    } catch (error) {
      console.error('Error seeding quotes:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Delete all records from the 'Quotes' table
    await queryInterface.bulkDelete('Quotes', null, {});
  },
};
