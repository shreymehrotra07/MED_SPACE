const express = require("express");
const {
  getProfile,
  editProfileByID,
} = require("../../controllers/user/profileController.js");

const {
  createUserProfile,
  getAllUsers,
  getUserByID,
  updateUserByID,
  deleteUserByID,
} = require("../../controllers/user/userController.js");
const { authenticateToken } = require("../../middlewares/authMiddleware.js");

const router = express.Router();

// Public Routes
router.post("/", createUserProfile);
router.post("/:id", getUserByID);

// Protected Routes (Require Authentication)
router.post("/all", authenticateToken, getAllUsers); // Changed endpoint to avoid conflict with POST "/"
router.delete("/:id", authenticateToken, deleteUserByID);
router.put("/:id", authenticateToken, updateUserByID);

router.get("/profile", authenticateToken, getProfile);
router.put("/profile/edit/:id", authenticateToken, editProfileByID);

module.exports = router;
