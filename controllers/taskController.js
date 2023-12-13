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
moment.tz.load(require('moment-timezone/data/packed/latest.json'));
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

  exports.dashboard = async (req, res) => {

    // Assuming req.user has the authenticated user information
    const userId = req.user.id;
    
    // Get User TimeZone
    const userTimeZoneOffset = Helper.setUserTimeZoneOffset() || 'Etc/GMT';
  
  // Start of Day
  const startDate = moment().tz(userTimeZoneOffset).startOf('day').tz(process.env.TIMEZONE);

  // End of Day
  const endDate = moment().tz(userTimeZoneOffset).endOf('day').tz(process.env.TIMEZONE);

  // Get the yesterday's date in the user's timezone
  const yesterdayDate = moment().tz(userTimeZoneOffset).subtract(1, 'day').format('YYYY-MM-DD');

  // Get the current date in the user's timezone
  const todayDate = moment().tz(userTimeZoneOffset).startOf('day').format('YYYY-MM-DD');

  //console.log('todayDate ', todayDate);
      
        // Call the static function with await
      const totalDaysWon = await this.totalWon(userId);
      const totalDaysLost = await this.totalLoss(userId);

    // Last Seven Day Won Task
    const lastSevenDaysWon = await this.weekDaysWon(userId);

    // Last Month Won Task
    
    const monthDaysWon = await this.monthDaysWon(userId);
    
  
    // Total Last 7 days
    const totalSevenDays = 7;

    // Total Last Month day
    const currentDate = moment().tz(userTimeZoneOffset);
    const previousMonth = currentDate.clone().subtract(1, 'month');
    const totalMonthDays = previousMonth.daysInMonth();

    /*
  |--------------------------------------------------------------------------
  |  # Get Highest Streak Tasks.
  |--------------------------------------------------------------------------
  */
  async function getHighestStreakTasks(userId, userTimeZoneOffset) {
    const todayDate = moment().format('YYYY-MM-DD');

    const streakHighestTasks = await Task.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.fn('CONVERT_TZ', sequelize.col('createdAt'), '+00:00', userTimeZoneOffset)), 'converted_created_at'],
        [sequelize.fn('SUM', sequelize.literal("IF(status = 'completed', 1, 0)")), 'completed_count'],
        [sequelize.fn('SUM', sequelize.literal("IF(status = 'pending', 1, 0)")), 'pending_count'],
        [sequelize.fn('COUNT', sequelize.col('*')), 'total'],
      ],
      group: [
        Sequelize.fn('DATE', Sequelize.fn('CONVERT_TZ', Sequelize.col('createdAt'), '+00:00', userTimeZoneOffset)),
        'Task.createdAt',
      ],
      where: {
        user_id: userId,
        createdAt: {
          [Op.lte]: sequelize.fn('CONVERT_TZ', sequelize.literal('NOW()'), '+00:00', userTimeZoneOffset),
        },
      },
      order: [[sequelize.fn('CONVERT_TZ', sequelize.col('createdAt'), '+00:00', userTimeZoneOffset), 'DESC']],
    });

    return streakHighestTasks;
  }

  const streakHighestTasks = await getHighestStreakTasks(userId, userTimeZoneOffset);
  const highestStreak = Helper.getHighestStreak(streakHighestTasks);


    const data = {
      totalWon: totalDaysWon,
      totalLost: totalDaysLost,
      heighestStreak: highestStreak,
      lastSevenDays: {
        totalDays: totalSevenDays,
        totalWon: lastSevenDaysWon
        },
      steak_data: {
        breakStreak: "wonStreak > 0 ? 0 : breakStreak",
        wonStreak: "wonStreak"
      },
      lastMonth: {
        totalDays: totalMonthDays,
        totalWon: monthDaysWon
      },
      todayPercentage: "todayPercentage",
      quotes: "quotes",
      taskByMonths: "taskByMonths"
    };
    
    return res.json({
      data: data
    });
  };

  exports.totalWon = async function totalWon(userId) {
    // Get User TimeZone
    const userTimeZoneOffset = Helper.setUserTimeZoneOffset() || 'Asia/Karachi';


    try {
      
      const wonTask = await Task.findAll({
        attributes: [
          [Sequelize.fn('DATE', Sequelize.fn('CONVERT_TZ', Sequelize.col('createdAt'), '+00:00', userTimeZoneOffset)), 'converted_created_at'],
          [Sequelize.fn('SUM', Sequelize.literal("IF(status = 'completed', 1, 0)")), 'completed_count'],
          [Sequelize.fn('COUNT', Sequelize.col('*')), 'total'],
        ],
        group: [
          Sequelize.fn('DATE', Sequelize.fn('CONVERT_TZ', Sequelize.col('createdAt'), '+00:00', userTimeZoneOffset)),
          'Task.createdAt',
        ],
        having: Sequelize.literal('total = completed_count'),
        where: {
          user_id: userId,
        },
      });
      
      return wonTask.length > 0 ? wonTask[0].get('total') : 0;

    } catch (error) {
      console.error('Error in totalWon function:', error);
      throw new Error('Error in totalWon function');
    }
  };


  exports.totalLoss = async function totalLoss(userId) {
    // Get User TimeZone
    const userTimeZoneOffset = Helper.setUserTimeZoneOffset() || 'Etc/GMT';

    try {
    
      const lostTask = await Task.findAll({
        attributes: [
          [Sequelize.fn('DATE', Sequelize.fn('CONVERT_TZ', Sequelize.col('createdAt'), '+00:00', userTimeZoneOffset)), 'converted_created_at'],
          [Sequelize.fn('SUM', Sequelize.literal("IF(status = 'pending', 1, 0)")), 'pending_count'],
          [Sequelize.fn('COUNT', '*'), 'total'],
        ],
        group: [
          Sequelize.fn('DATE', Sequelize.fn('CONVERT_TZ', Sequelize.col('createdAt'), '+00:00', userTimeZoneOffset)),
          'Task.createdAt',
        ],
        having: Sequelize.literal('total = pending_count'),
        where: {
          user_id: userId,
        },
      });
      
    return lostTask.length > 0 ? lostTask[0].get('total') : 0;

    } catch (error) {
      console.error('Error in totalLoss function:', error);
      throw new Error('Error in totalLoss function');
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Week Won Days
  |--------------------------------------------------------------------------
  */
  exports.weekDaysWon = async function weekDaysWon(userId) {
    try {
      // Get User TimeZone
      const userTimeZoneOffset = Helper.setUserTimeZoneOffset() || 'Etc/GMT';

      // Calculate the date 8 days ago in the user's timezone
      const date = moment().subtract(8, 'days').format('YYYY-MM-DD');

      // Get today's date in the user's timezone
      const todayDate = moment().format('YYYY-MM-DD');

      const weekDaysWon = await Task.findAll({
        where: {
          user_id: userId,
          createdAt: {
            [Op.between]: [
              Sequelize.fn('CONVERT_TZ', Sequelize.literal('DATE_SUB(NOW(), INTERVAL 7 DAY)'), '+00:00', userTimeZoneOffset),
              Sequelize.fn('CONVERT_TZ', Sequelize.literal('NOW()'), '+00:00', userTimeZoneOffset),
            ],
          },
        },
        attributes: [
          [sequelize.fn('CONVERT_TZ', sequelize.col('createdAt'), '+00:00', userTimeZoneOffset), 'converted_created_at'],
          [sequelize.fn('SUM', sequelize.literal("IF(status = 'completed', 1, 0)")), 'completed_count'],
          [sequelize.fn('COUNT', sequelize.col('*')), 'total'],
        ],
        group: [
          Sequelize.fn('DATE', Sequelize.fn('CONVERT_TZ', Sequelize.col('createdAt'), '+00:00', userTimeZoneOffset)),
          'Task.createdAt',
        ],
        having: sequelize.literal('COUNT(*) = SUM(IF(status = \'completed\', 1, 0))'),
      });

      return weekDaysWon.length > 0 ? weekDaysWon[0].get('total') : 0;
    } catch (error) {
      console.error('Error in weekDaysWon:', error);
      throw new Error('Error in weekDaysWon');
    }
  };


  exports.monthDaysWon = async function monthDaysWon(userId) {
    // Get User TimeZone
    const userTimeZoneOffset = Helper.setUserTimeZoneOffset() || 'Etc/GMT';

    try {
      const monthDaysWon = await Task.findAll({
        where: {
          user_id: userId,
          createdAt: {
            [Op.between]: [
              Sequelize.fn('CONVERT_TZ', Sequelize.literal('DATE_SUB(NOW(), INTERVAL 30 DAY)'), '+00:00', userTimeZoneOffset),
              Sequelize.fn('CONVERT_TZ', Sequelize.literal('NOW()'), '+00:00', userTimeZoneOffset),
            ],
          },
        },
        attributes: [
          [sequelize.fn('CONVERT_TZ', sequelize.col('createdAt'), '+00:00', userTimeZoneOffset), 'converted_created_at'],
          [sequelize.fn('SUM', sequelize.literal("IF(status = 'completed', 1, 0)")), 'completed_count'],
          [sequelize.fn('COUNT', sequelize.col('*')), 'total'],
        ],
        group: [
          Sequelize.fn('DATE', Sequelize.fn('CONVERT_TZ', Sequelize.col('createdAt'), '+00:00', userTimeZoneOffset)),
          'Task.createdAt',
        ],
        having: sequelize.literal('COUNT(*) = SUM(IF(status = \'completed\', 1, 0))'),
      });

      return monthDaysWon.length > 0 ? monthDaysWon[0].get('total') : 0;
    } catch (error) {
      console.error('Error in monthDaysWon:', error);
      throw new Error('Error in monthDaysWon');
    }
  }
