"use strict";
const { City } = require("country-state-city");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const citiesData = City.getAllCities().map(formatCity);

      if (citiesData.length > 0) {
        const currentTime = new Date();

        citiesData.forEach(async (city) => {
          // Assuming you have a "countryId" field in your "cities" table
          city.createdAt = currentTime;
          city.updatedAt = currentTime;

          await queryInterface.bulkInsert("cities", [city]);
          console.log(`City ${city.name} seeded successfully.`);
        });

        console.log("Cities seeded successfully.");
      } else {
        console.log("No cities to seed.");
      }
    } catch (error) {
      console.error("Error seeding cities:", error.message);
      console.error("Validation Errors:", error.errors);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("cities", null, {});
    console.log("Cities deleted successfully.");
  },
};

function formatCity(city) {
  return {
    name: city.name,
    countryId: null,
  };
}
