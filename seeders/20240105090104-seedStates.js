"use strict";
const { State, Country } = require("country-state-city");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Retrieve states data with country information and format it
      const statesData = State.getAllStates().map(async (state) => {
        const countryId = await findCountryIdByName(state.country);
        const currentTime = new Date();

        return {
          ...state,
          createdAt: currentTime,
          updatedAt: currentTime,
          name: state.name || "Default State Name",
          latitude: state.latitude || 0,
          longitude: state.longitude || 0,
          countryCode: state.countryCode || 0,
          isoCode: state.isoCode || 0,
          countryId: countryId || 1,
        };
      });

      if (statesData.length > 0) {
        await queryInterface.bulkInsert(
          "states",
          await Promise.all(statesData)
        );
        console.log("States seeded successfully.");
      } else {
        console.log("No states to seed.");
      }
    } catch (error) {
      console.error("Error seeding states:", error.message);
      console.error("Validation Errors:", error.errors);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("states", null, {});
    console.log("States deleted successfully.");
  },
};

async function findCountryIdByName(countryName) {
  const countries = await Country.getAllCountries();
  const country = countries.find((c) => c.name === countryName);
  return country ? country.id : null;
}
