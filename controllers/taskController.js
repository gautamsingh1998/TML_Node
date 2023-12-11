const { Task, Sequelize } = require('../models');
const express = require('express');
const router = express.Router();
const Helper = require('../helper/helper'); // Assuming you have a Helper module
const constants = require('../constants');

exports.addTask = async (req, res) => {
  try {
    const { name } = req.body;

    // Get User Timezone
    //const userTimeZoneOffset = Helper.setUserTimeZoneOffset();

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
          [Sequelize.Op.between]: [startDate, endDate]
        }
      }
    });

    if (todayTasks >= constants.dailyTaskLimit) {
      return res.status(403).json({ success: false, msg: 'You have reached the daily task limit.' });
    }

    // Create a new task
    const task = await Task.create({
      user_id: userId,
      name: name,
      status: 'Pending',
      
    });

    if (task) {
      return res.status(200).json({ success: true, data: task, msg: 'Task created successfully.' });
    } else {
      return res.status(403).json({ success: false, msg: 'Something went wrong.' });
    }
  } catch (error) {
    return res.status(403).json({ success: false, msg: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({ success: false, msg: 'Task not found.' });
    }

    task.name = name;
    task.status = status;

    if (await task.save()) {
      return res.status(200).json({ success: true, msg: 'Task has been updated.', data: task });
    } else {
      return res.status(403).json({ success: false, msg: 'Something went wrong.' });
    }
  } catch (error) {
    return res.status(403).json({ success: false, msg: error.message });
  }
};