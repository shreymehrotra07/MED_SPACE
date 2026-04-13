const mongoose = require("mongoose");
const { z } = require("zod");
const asyncHandler = require("express-async-handler");
const sendMail = require("../../utils/notifications/sendMail.js");

const {
  appointmentSchema,
  updateAppointmentSchema,
} = require("../../validators/appointmentSchemas.js");

const User = require("../../models/user.js");

// BOOK APPOINTMENT (USER ONLY)
const bookAppointmentByUserID = async (req, res) => {
  try {
    const parsedData = appointmentSchema.parse(req.body);
    const user = await User.findById(parsedData.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const appointment = {
      date: parsedData.date,
      reason: parsedData.reason,
      status: "pending",
    };

    user.appointments.push(appointment);
    await user.save();

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    res.status(500).json({ message: "Error booking appointment", error });
  }
};

// GET USER APPOINTMENTS
const getAppointmentsByUserID = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user.appointments);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ADD APPOINTMENT (USER ONLY)
const addAppointment = async (req, res) => {
  try {
    const parsedData = appointmentSchema.parse(req.body);

    const user = await User.findById(parsedData.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newAppointment = {
      date: parsedData.date,
      reason: parsedData.reason,
      status: "pending",
    };

    user.appointments.push(newAppointment);
    await user.save();

    res.status(201).json(newAppointment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    res.status(500).json({ message: "Server error", error });
  }
};

// UPDATE APPOINTMENT
const updateAppointmentByID = async (req, res) => {
  try {
    const parsedData = updateAppointmentSchema.parse(req.body);
    const { appointmentId, userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const appointment = user.appointments.id(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.date = parsedData.date;
    appointment.reason = parsedData.reason;
    appointment.status = parsedData.status;

    await user.save();

    res.status(200).json(appointment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    res.status(500).json({ message: "Server error", error });
  }
};

// DELETE APPOINTMENT
const deleteAppointmentByID = async (req, res) => {
  try {
    const { appointmentId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isRemoved = user.appointments.id(appointmentId);

    if (!isRemoved) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    user.appointments.pull(appointmentId);
    await user.save();

    res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// EMERGENCY APPOINTMENT (USER ONLY)
const addEmergencyAppointment = asyncHandler(async (req, res) => {
  const { name, email, age, gender, contact, reason, date } = req.body;

  let user = await User.findOne({ email });

  // if user not exist → create
  if (!user) {
    const password = Math.random().toString(36).slice(-8);
    user = new User({
      name,
      email,
      age,
      gender,
      phone: contact,
      password,
    });
  }

  const appointment = {
    date,
    reason,
    status: "emergency",
  };

  user.appointments.push(appointment);
  await user.save();

  await sendMail(
    `Your emergency appointment is booked on ${appointment.date}`,
    user.email
  );

  res.status(200).json({
    message: "Emergency appointment booked successfully",
    appointment,
  });
});

module.exports = {
  bookAppointmentByUserID,
  getAppointmentsByUserID,
  addAppointment,
  updateAppointmentByID,
  deleteAppointmentByID,
  addEmergencyAppointment,
};
