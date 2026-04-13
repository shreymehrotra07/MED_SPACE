const express = require("express");
const router = express.Router();

// Import controllers
const { subscribeNewsletter, sendNewsletterUpdate } = require("../../controllers/othercontrollers/othercontroller");

// Import admin middleware
const { adminMiddleware } = require("../../middlewares/adminMiddleware");

// Route to subscribe to newsletter
router.post("/subscribe", subscribeNewsletter);

// Admin-only route to send newsletter updates
router.post("/admin/send-mail", adminMiddleware, sendNewsletterUpdate);

module.exports = router;
