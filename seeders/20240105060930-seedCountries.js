"use strict";
const { Country } = require("country-state-city");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const countriesData = Country.getAllCountries().map(formatCountry);

      if (countriesData.length > 0) {
        // Add createdAt and updatedAt to each country data
        const currentTime = new Date();

        countriesData.forEach((country) => {
          country.createdAt = currentTime;
          country.updatedAt = currentTime;
        });

        await queryInterface.bulkInsert("countries", countriesData);
        console.log("Countries seeded successfully.");
      } else {
        console.log("No countries to seed.");
      }
    } catch (error) {
      console.error("Error seeding countries:", error.message);
      console.error("Validation Errors:", error.errors); // Log validation errors
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("countries", null, {});
    console.log("Countries deleted successfully.");
  },
};

function formatCountry(country) {
  return {
    isoCode: country.isoCode,
    name: country.name,
    phonecode: country.phonecode,
    flag: country.flag,
    currency: country.currency,
    latitude: country.latitude,
    longitude: country.longitude,
  };
}
