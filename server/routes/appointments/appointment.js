const express = require("express");
const { authenticateToken } = require("../../middlewares/authMiddleware.js");
const {
  addAppointment,
  updateAppointmentByID,
  deleteAppointmentByID,
  addEmergencyAppointment,
} = require("../../controllers/appointments/appointmentsController.js");

const router = express.Router();

// Add a new appointment (no hospital reference)
router.post("/appointments", authenticateToken, addAppointment);

// Get all appointments for the logged-in user
router.get("/appointments", authenticateToken, async (req, res) => {
  try {
    const user = req.user; // Comes from authenticateToken middleware
    const appointments = user.appointments || [];
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Update an appointment by ID
router.put(
  "/appointments/:appointmentId",
  authenticateToken,
  updateAppointmentByID
);

// Delete an appointment by ID
router.delete(
  "/appointments/:appointmentId",
  authenticateToken,
  deleteAppointmentByID
);

// Emergency appointments (no authentication required)
router.post("/appointments/emergency", addEmergencyAppointment);

module.exports = router;
