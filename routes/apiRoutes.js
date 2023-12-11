const express = require("express");
const authController = require("../controllers/authController");
const taskController = require("../controllers/taskController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// user api
router.post("/register", authController.register);
router.post("/login", authController.login);
//router.get('/protected', authMiddleware, authController.protectedRoute);
// User deletion route
router.delete("/user-delete/:id", authController.userDelete);

router.use(authMiddleware);
// Routes within the authentication group
router.get("/user/details", authController.getUserDetails);
router.post("/logout", authController.logout);

//task
router.post("/addTask", taskController.addTask);
router.put("/updateTask/:id", taskController.updateTask);

module.exports = router;
