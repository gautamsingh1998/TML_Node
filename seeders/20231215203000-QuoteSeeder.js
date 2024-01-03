require("dotenv").config();
const constants = require("../constants");
/* 'use strict';
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
}; */

("use strict");
const axios = require("axios");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const numberOfQuotes = process.env.QUOTES_NUMBER;
      const quotesData = [];

      for (let i = 0; i < numberOfQuotes; i++) {
        const response = await axios.get(constants.quote.apiUrl);
        const quote = response.data;

        if (quote) {
          quotesData.push({
            text: quote.content,
            author: quote.author,
            createdAt: quote.dateAdded,
            updatedAt: quote.dateModified,
          });
        }
      }

      if (quotesData.length > 0) {
        await queryInterface.bulkInsert("Quotes", quotesData);
        console.log("Quotes seeded successfully.");
      }
    } catch (error) {
      console.error("Error seeding quotes:", error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Quotes", null, {});
  },
};
