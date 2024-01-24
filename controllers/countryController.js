const { Task, Quote, StateDistrict, Sequelize } = require("../models");
const { User } = require("../models");
const express = require("express");
const router = express.Router();
const sequelize = require("../sequelize");
const mysql = require("mysql2/promise");
const { Country, State, City } = require("country-state-city");

exports.countryDashboard = async (req, res) => {
  async function country_State_City() {
    try {
      const allCountries = Country.getAllCountries();
      const transformedData = [];

      for (const country of allCountries) {
        const countryData = {
          country: country.name,
          states: [],
        };

        const allStates = State.getStatesOfCountry(country.isoCode);

        for (const state of allStates) {
          const stateData = {
            state: state.name,
            cities: [],
          };

          const allCities = City.getCitiesOfState(
            country.isoCode,
            state.isoCode
          );

          for (const city of allCities) {
            stateData.cities.push(city.name);
          }

          countryData.states.push(stateData);
        }

        transformedData.push(countryData);
      }

      return transformedData;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  }
  const { Country, State, City } = require("country-state-city");

  async function country_State_City() {
    try {
      const allCountries = Country.getAllCountries();
      console.log(allCountries);
      const transformedData = [];

      for (const country of allCountries) {
        const countryData = {
          country: country.name,
          isoCode: country.isoCode,
          flag: country.flag,
          phonecode: country.phonecode,
          currency: country.currency,
          latitude: country.latitude,
          longitude: country.longitude,
          timezones: country.timezones.map((timezone) => ({
            zoneName: timezone.zoneName,
            gmtOffset: timezone.gmtOffset,
            gmtOffsetName: timezone.gmtOffsetName,
            abbreviation: timezone.abbreviation,
            tzName: timezone.tzName,
          })),
          states: [],
        };

        const allStates = State.getStatesOfCountry(country.isoCode);

        for (const state of allStates) {
          const stateData = {
            state: state.name,
            isoCode: state.isoCode,
            countryCode: state.countryCode,
            latitude: state.latitude,
            longitude: state.longitude,
            cities: [],
          };

          /*  const allCities = City.getCitiesOfState(
            country.isoCode,
            state.isoCode
          );

          for (const city of allCities) {
            const cityData = {
              city: city.name,
              /* isoCode: city.isoCode,
              countryCode: city.countryCode,
              latitude: city.latitude,
              longitude: city.longitude, 
            };
            stateData.cities.push(cityData);
          } */

          const allCities = City.getCitiesOfState(
            country.isoCode,
            state.isoCode
          );

          for (const city of allCities) {
            stateData.cities.push(city.name);
          }
          countryData.states.push(stateData);
        }

        transformedData.push(countryData);
      }

      return transformedData;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  }

  const data = {
    country_State_City: await country_State_City(),
  };

  return res.json({
    data: data,
  });
};
