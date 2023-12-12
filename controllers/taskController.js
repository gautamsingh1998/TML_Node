const { Task, Sequelize } = require("../models");
const { User } = require("../models");
const express = require("express");
const router = express.Router();
const Helper = require('../helpers/helper');
const constants = require("../constants");
const { Op } = require('sequelize');
const moment = require('moment-timezone');
const sequelize  = require('../sequelize');
const mysql = require('mysql2/promise');
const authMiddleware = require("../middleware/authMiddleware");



require('moment-timezone'); // Load all timezone data
moment.tz.add('Asia/Kolkata|LMT IST|-5A.i -50|01|-LzA.i 2oK 1ui0|34e5');


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
      return res
        .status(403)
        .json({
          success: false,
          msg: "You have reached the daily task limit.",
        });
    }

    // Create a new task
    const task = await Task.create({
      user_id: userId,
      name: name,
      status: "Pending",
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
    const startDate = moment(date || moment().tz(userTimeZoneOffset).format('Y-MM-DD'))
      .startOf('day')
      .tz('UTC');

    // End of Day
    const endDate = moment(date || moment().tz(userTimeZoneOffset).format('Y-MM-DD'))
      .endOf('day')
      .tz('UTC');
/* 
    console.log('startDate:', startDate.format()); // Debugging statement
    console.log('endDate:', endDate.format()); // Debugging statement */

    const userId = req.user.id;

    const taskQuery = Task.findAll({
      attributes: [
        'id', 'name', 'createdAt', 'status', 'updatedAt', // Include the 'status' field
        [sequelize.literal(`DATE_FORMAT(CONVERT_TZ(createdAt, '+00:00', '330'), '%Y-%m-%d')`), 'date'],
      ],
      where: {
        user_id: userId,
        createdAt: {
          [Op.between]: [startDate.toDate(), endDate.toDate()],
        },
      },
    });

    const taskPercentageQuery = await Task.findAll({
      attributes: ['status', [sequelize.fn('count', sequelize.col('*')), 'total']],
      where: {
        user_id: userId,
        createdAt: {
          [Op.between]: [startDate.toDate(), endDate.toDate()],
        },
      },
      group: ['status'],
    });

    const taskPercentageData = taskPercentageQuery.map(result => result.get({ plain: true }));

    const percentage = Helper.getCompletedTaskPercentage(taskPercentageData);

    const [taskData] = await Promise.all([taskQuery]);

    const formattedTaskData = taskData.map(task => {
      return {
        id: task.id,
        name: task.name,
        status: task.status,
        date: task.createdAt ? moment(task.createdAt).format('YYYY-MM-DD') : null,
      };
    });

    const data = {
      tasks: formattedTaskData.slice(0, 5),
      percentage,
    };

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
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


/*
|--------------------------------------------------------------------------
| Get Total Won and Loss Data query
|--------------------------------------------------------------------------
*/
async function totalWonAndLoss(req, res) {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });
    const userId = req.user.id;
    try {
        // Get User TimeZone
        const userTimeZoneOffset = Helper.setUserTimeZoneOffset();

        // Get Total Won data
        const [wontaskRows] = await connection.query(`
            SELECT
                CONVERT_TZ(created_at, '+00:00', ?) AS converted_created_at,
                SUM(IF(status = 'completed', 1, 0)) AS completed_count,
                COUNT(*) AS total
            FROM tasks
            WHERE user_id = ? AND DATE(CONVERT_TZ(created_at, '+00:00', ?)) = DATE(CONVERT_TZ(NOW(), '+00:00', ?))
            GROUP BY DATE(converted_created_at)
            HAVING total = completed_count
        `, [userTimeZoneOffset, userId, userTimeZoneOffset, userTimeZoneOffset]);

        // Get Total Loss data
        const [lostTaskRows] = await connection.query(`
            SELECT
                CONVERT_TZ(created_at, '+00:00', ?) AS converted_created_at,
                SUM(IF(status = 'pending', 1, 0)) AS pending_count,
                COUNT(*) AS total
            FROM tasks
            WHERE user_id = ? AND DATE(CONVERT_TZ(created_at, '+00:00', ?)) = DATE(CONVERT_TZ(NOW(), '+00:00', ?))
            GROUP BY DATE(converted_created_at)
            HAVING total = pending_count
        `, [userTimeZoneOffset, userId, userTimeZoneOffset, userTimeZoneOffset]);

        return {
            wontask: wontaskRows.length,
            lostTask: lostTaskRows.length,
        };
    } finally {
        await connection.end();
    }
}

/*
|--------------------------------------------------------------------------
| Week Won Days
|--------------------------------------------------------------------------
*/
async function weekDaysWon(req, res) {
  // Assuming req.user has the authenticated user information
  const userId = req.user.id;
    const userTimeZoneOffset = Helper.setUserTimeZoneOffset();
    
    const date = moment().tz(userTimeZoneOffset).subtract(8, 'days');
    const todayDate = moment().tz(userTimeZoneOffset).format('YYYY-MM-DD');

    try {
        const [weekDaysWonRows] = await connection.query(`
            SELECT
                CONVERT_TZ(created_at, '+00:00', ?) AS converted_created_at,
                SUM(IF(status = 'completed', 1, 0)) AS completed_count,
                COUNT(*) AS total
            FROM tasks
            WHERE user_id = ? AND DATE(CONVERT_TZ(created_at, '+00:00', ?)) <= ? AND DATE(CONVERT_TZ(created_at, '+00:00', ?)) > ?
            GROUP BY DATE(converted_created_at)
            HAVING total = completed_count
        `, [userTimeZoneOffset, userId, userTimeZoneOffset, todayDate, userTimeZoneOffset, date.format('YYYY-MM-DD')]);

        return weekDaysWonRows.length;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

exports.dashboard = async (req, res) => {

  // Assuming req.user has the authenticated user information
  const userId = req.user.id;
  
  // Get User TimeZone
  const userTimeZoneOffset = Helper.setUserTimeZoneOffset() || 'Etc/GMT'; // Use a default timezone if not provided
 
// Start of Day
const startDate = moment().tz(userTimeZoneOffset).startOf('day').tz(process.env.TIMEZONE);

// End of Day
const endDate = moment().tz(userTimeZoneOffset).endOf('day').tz(process.env.TIMEZONE);

// Get the yesterday's date in the user's timezone
const yesterdayDate = moment().tz(userTimeZoneOffset).subtract(1, 'day').format('YYYY-MM-DD');

// Get the current date in the user's timezone
const todayDate = moment().tz(userTimeZoneOffset).startOf('day').format('YYYY-MM-DD');

//console.log('todayDate ', todayDate);
 /*  // Get Loss and Won count in this function
  const totalWonAndLoss = this.totalWonAndLoss(userId); // Assuming totalWonAndLoss is defined somewhere

  // Total Days Won
  const totalDaysWon = totalWonAndLoss.wontask;

  // Total Days Lost
  const totalDaysLost = totalWonAndLoss.lostTask;

  // Last Seven Day Won Task
  const lastSevenDaysWon = this.weekDaysWon(userId); // Assuming weekDaysWon is defined somewhere

  // Last Month Won Task
  const monthDaysWon = this.monthDaysWon(userId); // Assuming monthDaysWon is defined somewhere
 */
  // Total Last 7 days
  const totalSevenDays = 7;

  // Total Last Month day
  const currentDate = moment().tz(userTimeZoneOffset);
  const previousMonth = currentDate.clone().subtract(1, 'month');
  const totalMonthDays = previousMonth.daysInMonth();


  const data = {
    //totalWon: totalDaysWon,
    // totalLost: totalDaysLost,
    // heighestStreak: heighestStreak,
     lastSevenDays: {
       totalDays: totalSevenDays,
    //   totalWon: lastSevenDaysWon
      },
    // steak_data: {
    //   breakStreak: wonStreak > 0 ? 0 : breakStreak,
    //   wonStreak: wonStreak
    // },
     lastMonth: {
      totalDays: totalMonthDays,
    //   totalWon: monthDaysWon
    },
    // todayPercentage: todayPercentage,
    // quotes: quotes,
    // taskByMonths: taskByMonths
  };
  
  return res.json({
    data: data
  });
};
