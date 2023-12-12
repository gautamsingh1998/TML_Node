const moment = require('moment-timezone');
const { User, Sequelize } = require("../models");

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
  
        if (value.status === 'completed') {
          completed += value.total;
        }
      });
    }

    return parseFloat(total === 0 ? 0 : ((completed * 100) / total).toFixed(2)); 
  }
  
  
  /*
  |--------------------------------------------------------------------------
  |  # Get Won days streak 
  |--------------------------------------------------------------------------
  */

  async getWonDaysStreak(wontask) {
  // Get User TimeZone
  const userTimeZoneOffset = await setUserTimeZoneOffset(); // Assuming setUserTimeZoneOffset is asynchronous

  let wonStreak = 0;

  if (wontask.length > 0) {
    const taskData = [...wontask]; // Make a copy of the array
    const last = taskData[0] || {};

    const createdAt = moment(last.converted_created_at).format('DD-MM-YYYY');
    const todayDate = moment().tz(userTimeZoneOffset).format('DD-MM-YYYY');
    const yesterday = moment().tz(userTimeZoneOffset).subtract(1, 'days').format('DD-MM-YYYY');

    const firstWonOrLoss = last.completed_count === last.total ? 'W' : 'L';
    let day = 0;

    if (createdAt === todayDate) {
      day = 1;
    }

    if (firstWonOrLoss === 'W' && (createdAt === todayDate || createdAt === yesterday)) {
      for (const result of taskData) {
        const dateData = day ? todayDate : yesterday;
        let forComparedate = moment(dateData, 'DD-MM-YYYY');

        if (wonStreak > 0) {
          forComparedate = forComparedate.subtract(wonStreak, 'days');
        }

        const forCompareDate = forComparedate.format('DD-MM-YYYY');
        const createdAtDate = moment(result.converted_created_at).format('DD-MM-YYYY');
        const wonOrLoss = result.completed_count === result.total ? 'W' : 'L';

        if (firstWonOrLoss !== wonOrLoss || forCompareDate !== createdAtDate) {
          break;
        }

        wonStreak++;
      }
    }
  }

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
    const userTimeZone = User.timezone || process.env.TIMEZONE;

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
    const userTimeZone = User.timezone || process.env.TIMEZONE;
    const userTime = moment.tz(moment(), userTimeZone);
    return userTime.format('Z');
  }

}

module.exports = Helper;
