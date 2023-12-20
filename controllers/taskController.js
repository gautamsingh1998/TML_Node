const { Task, Quote, Sequelize } = require("../models");
const { User } = require("../models");
const express = require("express");
const router = express.Router();
const Helper = require("../helpers/helper");
const constants = require("../constants");
const { Op } = require("sequelize");
const moment = require("moment-timezone");
const sequelize = require("../sequelize");
const mysql = require("mysql2/promise");
const authMiddleware = require("../middleware/authMiddleware");
const task = require("../models/task");
moment.tz.load(require("moment-timezone/data/packed/latest.json"));
require("moment-timezone"); // Load all timezone data
moment.tz.add("Asia/Kolkata|LMT IST|-5A.i -50|01|-LzA.i 2oK 1ui0|34e5");

/**
 * Add Task.
 */

exports.addTask = async (req, res) => {
  try {
    const { name } = req.body;

    // Get User Timezone
    const userTimeZoneOffset = Helper.setUserTimeZoneOffset();

    // Start of Day
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    // End of Day
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const userId = req.user.id; // Assuming user information is attached to the request

    // Count tasks created today
    const todayTasks = await Task.count({
      where: {
        user_id: userId,
        createdAt: {
          [Sequelize.Op.between]: [startDate, endDate],
        },
      },
    });

    if (todayTasks >= constants.dailyTaskLimit) {
      return res.status(403).json({
        success: false,
        msg: "You have reached the daily task limit.",
      });
    }

    // Create a new task
    const task = await Task.create({
      user_id: userId,
      name: name,
      status: constants.status.pending,
    });

    if (task) {
      return res
        .status(200)
        .json({ success: true, data: task, msg: "Task created successfully." });
    } else {
      return res
        .status(403)
        .json({ success: false, msg: "Something went wrong." });
    }
  } catch (error) {
    return res.status(403).json({ success: false, msg: error.message });
  }
};

/**
 * GET Task.
 */

exports.getTask = async (req, res) => {
  try {
    const { date } = req.query;
    const userTimeZoneOffset = Helper.setUserTimeZoneOffset();

    // Start of Day
    const startDate = moment(
      date || moment().tz(userTimeZoneOffset).format("Y-MM-DD")
    )
      .startOf("day")
      .tz("UTC");

    // End of Day
    const endDate = moment(
      date || moment().tz(userTimeZoneOffset).format("Y-MM-DD")
    )
      .endOf("day")
      .tz("UTC");
    /* 
      console.log('startDate:', startDate.format()); // Debugging statement
      console.log('endDate:', endDate.format()); // Debugging statement */

    const userId = req.user.id;

    const taskQuery = Task.findAll({
      attributes: [
        "id",
        "name",
        "createdAt",
        "status",
        "updatedAt", // Include the 'status' field
        [
          sequelize.literal(
            `DATE_FORMAT(CONVERT_TZ(createdAt, '+00:00', '330'), '%Y-%m-%d')`
          ),
          "date",
        ],
      ],
      where: {
        user_id: userId,
        createdAt: {
          [Op.between]: [startDate.toDate(), endDate.toDate()],
        },
      },
    });

    const taskPercentageQuery = await Task.findAll({
      attributes: [
        "status",
        [sequelize.fn("count", sequelize.col("*")), "total"],
      ],
      where: {
        user_id: userId,
        createdAt: {
          [Op.between]: [startDate.toDate(), endDate.toDate()],
        },
      },
      group: ["status"],
    });

    const taskPercentageData = taskPercentageQuery.map((result) =>
      result.get({ plain: true })
    );

    const percentage = Helper.getCompletedTaskPercentage(taskPercentageData);

    const [taskData] = await Promise.all([taskQuery]);

    const formattedTaskData = taskData.map((task) => {
      return {
        id: task.id,
        name: task.name,
        status: task.status,
        date: task.createdAt
          ? moment(task.createdAt).format("YYYY-MM-DD")
          : null,
      };
    });

    const data = {
      tasks: formattedTaskData.slice(0, 5),
      percentage,
    };

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
};

/**
 * UPDATE Task.
 */

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({ success: false, msg: "Task not found." });
    }

    task.name = name;
    task.status = status;

    if (await task.save()) {
      return res
        .status(200)
        .json({ success: true, msg: "Task has been updated.", data: task });
    } else {
      return res
        .status(403)
        .json({ success: false, msg: "Something went wrong." });
    }
  } catch (error) {
    return res.status(403).json({ success: false, msg: error.message });
  }
};

/*
  |--------------------------------------------------------------------------
  |  Deletes a task by its ID.
  |--------------------------------------------------------------------------
  */
exports.taskDelete = async (req, res) => {
  const taskId = req.params.id; // Assuming you're passing the task ID in the request parameters

  try {
    // Find the user by ID
    const task = await Task.findByPk(taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Delete the user
    await task.destroy();

    res.json({ message: "Task has been deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.dashboard = async (req, res) => {
  // Assuming req.user has the authenticated user information
  const userId = req.user.id;

  // Get User TimeZone
  const userTimeZoneOffset = Helper.setUserTimeZoneOffset() || "Etc/GMT";

  // Start of Day
  const startDate = moment()
    .tz(userTimeZoneOffset)
    .startOf("day")
    .tz(process.env.TIMEZONE);

  // End of Day
  const endDate = moment()
    .tz(userTimeZoneOffset)
    .endOf("day")
    .tz(process.env.TIMEZONE);

  // Get the yesterday's date in the user's timezone
  const yesterdayDate = moment()
    .tz(userTimeZoneOffset)
    .subtract(1, "day")
    .format("YYYY-MM-DD");

  // Get the current date in the user's timezone
  const todayDate = moment()
    .tz(userTimeZoneOffset)
    .startOf("day")
    .format("YYYY-MM-DD");

  // Total Last 7 days
  const totalSevenDays = 7;

  // Total Last Month day
  const currentDate = moment().tz(userTimeZoneOffset);
  const previousMonth = currentDate.clone().subtract(1, "month");
  const totalMonthDays = previousMonth.daysInMonth();

  async function totalWonAndLost(userId, userTimeZoneOffset) {
    try {
      const wonTasks = await Task.findAll({
        where: {
          user_id: userId,
        },
      });

      const uniqueCompletedDates = new Set();
      const uniquePendingDates = new Set();
      const uniqueDates = new Set();
      wonTasks.forEach((task) => {
        // Check if the task has a 'createdAt' property
        if (task.createdAt) {
          const date = task.createdAt.toISOString().split("T")[0];
          if (!uniqueDates.has(date)) {
            uniqueDates.add(date); // Add the date to the set to track uniqueness
            if (
              task.status === constants.status.completed &&
              !uniqueCompletedDates.has(date)
            ) {
              uniqueCompletedDates.add(date);
            } else if (
              task.status === constants.status.pending &&
              !uniquePendingDates.has(date)
            ) {
              uniquePendingDates.add(date);
            }
          }
        }
      });

      const completedCount = uniqueCompletedDates.size;
      const pendingCount = uniquePendingDates.size;

      return { completedCount, pendingCount };
    } catch (error) {
      console.error("Error in totalWon function:", error);
      throw new Error("Error in totalWon function");
    }
  }

  const { completedCount, pendingCount } = await totalWonAndLost(
    userId,
    userTimeZoneOffset
  );
  const totalDaysWon = completedCount;
  const totalDaysLost = pendingCount;

  /*
    |--------------------------------------------------------------------------
    | Week Won Days
    |--------------------------------------------------------------------------
    */
  async function weekDaysWon(userId, userTimeZoneOffset) {
    try {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() - 7); // Subtract 7 days

      const wonTasks = await Task.findAll({
        where: {
          user_id: userId,
          createdAt: {
            [Op.gte]: currentDate, // Filter tasks created on or after currentDate
          },
        },
      });

      const uniqueCompletedDates = new Set();
      const uniqueDates = new Set();
      wonTasks.forEach((task) => {
        // Check if the task has a 'createdAt' property
        if (task.createdAt) {
          const date = task.createdAt.toISOString().split("T")[0];
          if (!uniqueDates.has(date)) {
            uniqueDates.add(date); // Add the date to the set to track uniqueness
            if (
              task.status === constants.status.completed &&
              !uniqueCompletedDates.has(date)
            ) {
              uniqueCompletedDates.add(date);
            }
          }
        }
      });

      const completedCount = uniqueCompletedDates.size;
      return completedCount;
    } catch (error) {
      console.error("Error in totalWon function:", error);
      throw new Error("Error in totalWon function");
    }
  }

  const lastSevenDaysWon = await weekDaysWon(userId, userTimeZoneOffset);

  /*
    |--------------------------------------------------------------------------
    | MONTH Won Days
    |--------------------------------------------------------------------------
    */
  async function monthDayWon(userId, userTimeZoneOffset) {
    try {
      // Get the current date
      const currentDate = new Date();

      // Calculate the first day of the current month
      const firstDayOfCurrentMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );

      // Calculate the first day of the last month
      const firstDayOfLastMonth = new Date(firstDayOfCurrentMonth);
      firstDayOfLastMonth.setMonth(firstDayOfCurrentMonth.getMonth() - 1);

      const wonTasks = await Task.findAll({
        where: {
          user_id: userId,
          createdAt: {
            [Op.gte]: firstDayOfLastMonth,
            [Op.lt]: firstDayOfCurrentMonth,
          },
        },
      });

      const uniqueCompletedDates = new Set();
      const uniqueDates = new Set();
      wonTasks.forEach((task) => {
        // Check if the task has a 'createdAt' property
        if (task.createdAt) {
          const date = task.createdAt.toISOString().split("T")[0];
          if (!uniqueDates.has(date)) {
            uniqueDates.add(date); // Add the date to the set to track uniqueness
            if (
              task.status === constants.status.completed &&
              !uniqueCompletedDates.has(date)
            ) {
              uniqueCompletedDates.add(date);
            }
          }
        }
      });

      const completedCount = uniqueCompletedDates.size;
      return completedCount;
    } catch (error) {
      console.error("Error in totalWon function:", error);
      throw new Error("Error in totalWon function");
    }
  }

  const monthDaysWon = await monthDayWon(userId, userTimeZoneOffset);

  /*
  |--------------------------------------------------------------------------
  |  # Get Highest Streak Tasks.
  |--------------------------------------------------------------------------
  */

  async function getHighestStreakTasks(userId, userTimeZoneOffset) {
    try {
      const wonTasks = await Task.findAll({
        where: {
          user_id: userId,
        },
      });

      const uniqueCompletedDates = new Set();
      let currentStreak = 0;
      let highestStreak = 0;

      wonTasks.forEach((task) => {
        // Check if the task has a 'createdAt' property

        if (task.createdAt instanceof Date) {
          const date = task.createdAt.toISOString().split("T")[0];

          if (
            task.status === constants.status.completed &&
            !uniqueCompletedDates.has(date)
          ) {
            uniqueCompletedDates.add(date);
            currentStreak++;

            // Update the highest streak if the current streak is greater
            if (currentStreak > highestStreak) {
              highestStreak = currentStreak;
            }
          } else {
            // Reset the current streak if the task is not completed
            currentStreak = 0;
          }
        }
      });
      return highestStreak;
    } catch (error) {
      console.error("Error in getHighestStreakTasks function:", error);
      throw new Error("Error in getHighestStreakTasks function");
    }
  }

  // Assuming this is in an async function or use Promise.then() to handle promises
  const highestStreakTasks = await getHighestStreakTasks(
    userId,
    userTimeZoneOffset
  );

  async function getStreakData(userId) {
    try {
      const wonTasks = await Task.findAll({
        where: {
          user_id: userId,
        },
      });

      let breakStreaks = 0;
      let wonStreaks = 0;
      let currentStreak = 0;
      const uniqueCompletedDates = new Set();
      const uniquePendingDates = new Set();
      wonTasks.forEach((task) => {
        // Check if the task has a 'createdAt' property
        if (task.createdAt instanceof Date) {
          const date = task.createdAt.toISOString().split("T")[0];
          // Add the date to the set to track uniqueness
          if (
            task.status === constants.status.completed &&
            !uniqueCompletedDates.has(date)
          ) {
            // If the task is completed and the date is unique, update won streaks
            uniqueCompletedDates.add(date);
            wonStreaks++;
            currentStreak++;
          }

          if (
            task.status === constants.status.pending &&
            !uniquePendingDates.has(date)
          ) {
            uniquePendingDates.add(date);
            breakStreaks--;
            wonStreaks = 0;
            currentStreak++;
          }
          // Update breakStreaks when there's a break in the streak
          if (currentStreak > 1 && task.status === constants.status.completed) {
            breakStreaks = wonStreaks;
          }
        }
      });

      return { wonStreaks, breakStreaks };
    } catch (error) {
      console.error("Error in getStreakData function:", error);
      throw new Error("Error in getStreakData function");
    }
  }

  const { wonStreaks, breakStreaks } = await getStreakData(
    userId,
    userTimeZoneOffset
  );
  const wonStreak = wonStreaks;
  const breakStreak = breakStreaks;

  async function todayDays(userId) {
    try {
      // Get tasks for today
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set time to the beginning of the day
      const taskPercentage = await Task.findAll({
        attributes: [
          "status",
          [sequelize.fn("count", sequelize.col("*")), "total"],
        ],
        where: {
          user_id: userId,
          createdAt: {
            [Op.gte]: today,
          },
        },
        group: ["status"],
      });
      return taskPercentage;
    } catch (error) {
      console.error("Error in todayDays function:", error);
      throw new Error("Error in todayDays function");
    }
  }

  //const todayPercentag = taskPercentage;
  const taskPercentage = await todayDays(userId, userTimeZoneOffset);
  const taskPercentageData = taskPercentage.map((result) =>
    result.get({ plain: true })
  );
  const todayPercentage = Helper.getCompletedTaskPercentage(taskPercentageData);

  /* const randomQuote = await Quote.findOne({
    order: sequelize.random(),
    limit: 1,
  }); */

  const axios = require("axios");
  const apiUrl = "https://api.quotable.io/random";

  async function fetchData() {
    try {
      const response = await axios.get(apiUrl);
      const quote = response.data.content;
      const author = response.data.author;
      const randomQuote = `${quote} - ${author}`;
      console.log(randomQuote);
      return randomQuote;
    } catch (error) {
      console.error("Error fetching data:", error.message);
    }
  }
  const randomQuote = await fetchData();

  const data = {
    totalWon: totalDaysWon,
    totalLost: totalDaysLost,
    heighestStreak: highestStreakTasks,
    lastSevenDays: {
      totalDays: totalSevenDays,
      totalWon: lastSevenDaysWon,
    },
    steak_data: {
      breakStreak: wonStreak > 0 ? 0 : breakStreak,
      wonStreak: wonStreak,
    },
    lastMonth: {
      totalDays: totalMonthDays,
      totalWon: monthDaysWon,
    },
    todayPercentage: todayPercentage,
    quotes: randomQuote,
    taskByMonths: "taskByMonthsProcessed",
  };

  return res.json({
    data: data,
  });
};
