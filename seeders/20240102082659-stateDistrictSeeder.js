const constants = require("../constants");
/* // seeders/YYYYMMDDHHMMSS-demo-state-district.js
const axios = require("axios");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Fetch data from the third-party API
      const response = await axios.get(
        "https://api.covid19india.org/state_district_wise.json"
      );

      // Extract relevant data from the API response
      const apiData = response.data;

      if (!apiData || typeof apiData !== "object") {
        console.error("Invalid API response format:", apiData);
        return; // Skip seeding if the data is not in the expected format
      }

      // Convert the object into an array of state-district pairs
      const stateDistrictPairs = Object.entries(apiData);

      // Insert data into the 'StateDistricts' table
      await queryInterface.bulkInsert(
        "StateDistricts",
        stateDistrictPairs.flatMap(([state, stateData]) => {
          if (
            !stateData ||
            typeof stateData !== "object" ||
            !stateData.districtData
          ) {
            console.error(
              `Invalid data format for state '${state}':`,
              stateData
            );
            return [];
          }

          const districtData = stateData.districtData;
          const districtsString = Object.keys(districtData).join(", ");

          // Truncate the districts string if it exceeds 255 characters
          const truncatedDistricts = districtsString.substring(0, 255);

          return {
            state,
            districts: truncatedDistricts,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }),
        {}
      );
    } catch (error) {
      console.error("Error seeding data:", error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove all records from the 'StateDistricts' table
    await queryInterface.bulkDelete("StateDistricts", null, {});
  },
};
 */

// seeders/YYYYMMDDHHMMSS-demo-state-district.js
const axios = require("axios");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const apiResponse = await axios.get(constants.state_district_wise.apiUrl);
      const apiData = apiResponse.data;
      await queryInterface.bulkInsert(
        "StateDistricts",
        Object.keys(apiData)
          .map((state) => {
            const districtData =
              apiData[state]?.districtData ||
              (Array.isArray(apiData[state]?.districts)
                ? { Unassigned: apiData[state]?.districts }
                : null);

            const districtsArray = districtData
              ? Object.entries(districtData).map(([districts, data]) => ({
                  state,
                  statecode: apiData[state]?.statecode || null,
                  districts,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }))
              : [];

            return districtsArray;
          })
          .flat(),
        {}
      );
    } catch (error) {
      console.error("Error seeding data:", error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove all records from the 'StateDistricts' table
    await queryInterface.bulkDelete("StateDistricts", null, {});
  },
};
