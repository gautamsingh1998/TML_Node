<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Workdays Calculator</title>
  <!-- Include necessary stylesheets for your datepicker -->
  <link rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
    }

    #datepicker {
      margin-bottom: 20px;
    }
  </style>
</head>
<body>

  <label for="inputDays">Enter workdays:</label>
  <input type="number" id="inputDays" min="1" value="3" oninput="calculateDeadline()">

  <p>Deadline: <span id="deadline"></span></p>

  <label for="datepicker">Select a date:</label>
  <input type="text" id="datepicker" readonly>

  <script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
  <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>
  <script>
    function addWorkdays(date, days) {
      const result = new Date(date);
      let addedDays = 0;

      if (result.getDay() !== 0 && result.getDay() !== 6) {
        addedDays++;
      }

      while (addedDays < days) {
        result.setDate(result.getDate() + 1);

        while (result.getDay() === 0 || result.getDay() === 6) {
          result.setDate(result.getDate() + 1);
        }

        addedDays++;
      }

      return result.toISOString().split('T')[0];
    }

    function calculateDeadline() {
      const inputDays = document.getElementById('inputDays').value;
      const today = new Date();
      const deadline = addWorkdays(today, parseInt(inputDays));
      
      document.getElementById('deadline').textContent = deadline;

      // Update the datepicker with the calculated deadline
      $('#datepicker').datepicker('setDate', new Date(deadline));
    }

    // Initialize the datepicker
    $(function() {
      $('#datepicker').datepicker({
        dateFormat: 'yy-mm-dd',
        minDate: 0,
        onSelect: function(selectedDate) {
          // Calculate workdays from selected date and update input field
          const today = new Date();
          const selected = new Date(selectedDate);
          const diff = Math.ceil((selected - today) / (1000 * 60 * 60 * 24));
          const workdays = diff + 1; // include the selected date

          // Update the input field and recalculate the deadline
          $('#inputDays').val(workdays);
          calculateDeadline();
        },
        beforeShowDay: function(date) {
          // Disable Sundays and Saturdays
          const day = date.getDay();
          return [(day !== 0 && day !== 6), ''];
        }
      });
    });

    // Automatically calculate deadline on page load
    $(document).ready(function() {
      calculateDeadline();
    });
  </script>

</body>
</html>
