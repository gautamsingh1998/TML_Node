const moment = require("moment-timezone");
const { User, Sequelize } = require("../models");
const { Task } = require("../models");
const constants = require("../constants");

class Helper {
  /*
    |--------------------------------------------------------------------------
    |  # Get Completed Task Percentage
    |--------------------------------------------------------------------------
    */
  static getCompletedTaskPercentage(completedTasks) {
    let total = 0;
    let completed = 0;

    if (completedTasks && completedTasks.length > 0) {
      completedTasks.forEach((value) => {
        total += value.total;

        if (value.status === constants.status.completed) {
          completed += value.total;
        }
      });
    }

    return parseFloat(total === 0 ? 0 : ((completed * 100) / total).toFixed(2));
  }

  /* static dataAllbyMonth(taskByMonths) {
      // Implementation for dataAllbyMonth
      // ...

      return data;
    }

    static dataAllbyWeek(taskByWeeks) {
      // Implementation for dataAllbyWeek
      // ...

      return data;
    }

    static calculateWonLossByWeek(taskByWeeks) {
      // Implementation for calculateWonLossByWeek
      // ...

      return list;
    }

    static calculateWonLossByMonth(taskByMonths) {
      // Implementation for calculateWonLossByMonth

      return list;
    }
 */

  static dataAllbyMonth(taskByMonths) {
    const data = {};
    for (let i = 1; i <= 12; i++) {
      const months = moment()
        .month(i - 1)
        .format("MMM");
      const monthKey = i < 10 ? `0${i}` : `${i}`;
      if (taskByMonths[monthKey]) {
        data[months] = Helper.calculateWonLossByMonth(taskByMonths[monthKey]);
      } else {
        data[months] = null;
      }
    }
    return data;
  }

  static calculateWonLossByMonth(taskByMonths) {
    const date = moment()
      .tz(Helper.setUserTimeZoneOffset())
      .format("DD-MM-YYYY");
    const list = { loss_days: 0, won_days: 0 };

    if (taskByMonths && taskByMonths.length > 0) {
      taskByMonths.forEach((value, key) => {
        if (value.completed_count === value.total) {
          list.won_days += 1;
        } else {
          if (key === 0 && value.converted_created_at === date) {
            // Skip the first incomplete month
            return;
          }

          // Count loss days for tasks created before the current date
          if (moment(value.converted_created_at).isBefore(date, "day")) {
            list.loss_days += 1;
          }
        }
      });
    }

    return list;
  }

  static localTimeZoneConvertUTCTimeZone() {
    return moment().utc().format("YYYY-MM-DD HH:mm:ss");
  }

  static timeZoneConvertToUserTime(value) {
    const userTimeZone = User.timezone || process.env.TIMEZONE;

    return moment.utc(value).tz(userTimeZone).format("YYYY-MM-DD HH:mm:ss");
  }

  static reportRequestDate(date) {
    const userTimeZone = this.setUserTimeZoneOffset();

    const dateTimeString = `${date} 00:00:00`;
    const userDateTime = moment.tz(dateTimeString, userTimeZone);
    const utcDateTime = userDateTime.clone().utc();

    return utcDateTime.format("YYYY-MM-DD HH:mm:ss");
  }

  static setUserTimeZoneOffset() {
    const userTimeZone = User.timezone || process.env.TIMEZONE;
    const userTime = moment.tz(moment(), userTimeZone);
    return userTime.format("Z");
  }
}

module.exports = Helper;
