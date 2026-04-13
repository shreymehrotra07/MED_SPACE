const { z } = require("zod");
const nodemailer = require("nodemailer");
const User = require("../../models/user.js");

const {
  userSchema,
  loginSchema,
  emailCheckSchema,
  otpVerificationSchema,
  passwordResetSchema,
} = require("../../validators/authSchemas.js");

const {
  hashPassword,
  comparePassword,
} = require("../../utils/bcrypt/bcryptUtils.js");

const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

const { generateOTP, verifyOTP, clearOTP } = require("../../utils/otputils.js");

/* ----------------------- USER REGISTER ----------------------- */
const registerUser = async (req, res) => {
  try {
    const parsed = userSchema.parse(req.body);
    const {
      name,
      email,
      password,
      phone,
      dob,
      gender,
      address,
      medicalHistory,
    } = parsed;

    const hashedPassword = await hashPassword(password);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      dob,
      gender,
      address,
      medicalHistory,
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Error registering user", error });
  }
};

/* ----------------------- USER LOGIN ----------------------- */
const loginUser = async (req, res) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const { email, password } = parsed;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: "3d" });

    res.json({ token, message: "User logged in successfully" });
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }

    res.status(500).json({ message: "Error logging in", error });
  }
};

/* ----------------------- GOOGLE SIGN-IN ----------------------- */
const createUserFromGoogleSignIn = async (googleProfile) => {
  try {
    const { id, displayName, emails } = googleProfile;
    const email = emails[0].value;

    const hashedPassword = await hashPassword(id);

    const userObject = {
      name: displayName || "Google User",
      email,
      password: hashedPassword,
      phone: "0000000000",
      address: {
        street: "Unknown",
        city: "Unknown",
        state: "Unknown",
        postalCode: "000000",
      },
      gender: "Male",
      dob: new Date(),
      medicalHistory: [],
    };

    const parsedUser = userSchema.parse(userObject);

    const user = new User(parsedUser);
    await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: "3d" });

    return { user, token };
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw new Error("Failed to create user");
  }
};

/* ----------------------- FORGOT PASSWORD ----------------------- */
const forgotPassword = async (req, res) => {
  try {
    const parsed = emailCheckSchema.parse(req.body);
    const { email } = parsed;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not found" });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) return res.status(500).json({ message: "Email sending failed" });
      res.status(200).json({ message: "OTP sent successfully" });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending OTP", error });
  }
};

/* ----------------------- VERIFY OTP ----------------------- */
const verifyOTPApi = async (req, res) => {
  try {
    const parsed = otpVerificationSchema.parse(req.body);
    const { email, otp } = parsed;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!verifyOTP(user, otp))
      return res.status(400).json({ message: "Invalid or expired OTP" });

    await clearOTP(user);

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "OTP verification failed", error });
  }
};

/* ----------------------- RESET PASSWORD ----------------------- */
const resetPassword = async (req, res) => {
  try {
    const parsed = passwordResetSchema.parse(req.body);
    const { email, newPassword } = parsed;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashed = await hashPassword(newPassword);
    user.password = hashed;

    await clearOTP(user);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Password reset failed", error });
  }
};

module.exports = {
  registerUser,
  loginUser,
  createUserFromGoogleSignIn,
  forgotPassword,
  verifyOTPApi,
  resetPassword,
};
