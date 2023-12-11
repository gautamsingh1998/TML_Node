const moment = require('moment-timezone');
const { User } = require('../models'); // Assuming you have a User model

class Helper {
  static getCompletedTaskPercentage(completedTasks) {
    let total = 0;
    let completed = 0;

    if (completedTasks && completedTasks.length > 0) {
      completedTasks.forEach((value) => {
        total += value.total;

        if (value.status === 'Completed') {
          completed += value.total;
        }
      });
    }

    return total === 0 ? 0 : ((completed * 100) / total).toFixed(2);
  }

  static getWonDaysStreak(wontask) {
    // Implementation for getWonDaysStreak
    // ...

    return wonStreak;
  }

  static getLostDaysStreak(lostTask) {
    // Implementation for getLostDaysStreak
    // ...

    return lostStreak;
  }

  static getHighestStreak(taskData) {
    // Implementation for getHighestStreak
    // ...

    return highestStreak;
  }

  static dataAllbyMonth(taskByMonths) {
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
    // ...

    return list;
  }

  static localTimeZoneConvertUTCTimeZone() {
    return moment().utc().format('YYYY-MM-DD HH:mm:ss');
  }

  static timeZoneConvertToUserTime(value) {
    const userTimeZone = User.timezone || config.app.timezone;

    return moment.utc(value).tz(userTimeZone).format('YYYY-MM-DD HH:mm:ss');
  }

  static reportRequestDate(date) {
    const userTimeZone = this.setUserTimeZoneOffset();

    const dateTimeString = `${date} 00:00:00`;
    const userDateTime = moment.tz(dateTimeString, userTimeZone);
    const utcDateTime = userDateTime.clone().utc();

    return utcDateTime.format('YYYY-MM-DD HH:mm:ss');
  }

  static setUserTimeZoneOffset() {
    const userTimeZone = User.timezone || config.app.timezone;
    const userTime = moment.tz(moment(), userTimeZone);
    return userTime.format('Z');
  }

}

module.exports = Helper;
