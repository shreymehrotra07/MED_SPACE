const nodemailer = require("nodemailer");
const Newsletter = require("../../models/newsletter");

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,   // Gmail email from env
    pass: process.env.SMTP_PASSWORD // Gmail app password or normal password
  }
});

// Controller: Subscribe a user to the newsletter
const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existingSubscriber = await Newsletter.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ message: "Email is already subscribed" });
    }

    const newSubscriber = new Newsletter({ email });
    await newSubscriber.save();
    console.log(`New subscriber: ${email}`);

    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "Thank you for Subscribing to Our Newsletter",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center;">
          <h2>Thank You for Subscribing!</h2>
          <p>Dear Subscriber,</p>
          <p>We are thrilled to have you with us. Stay tuned for our latest updates and offers!</p>
          <a href="https://med-space.vercel.app/" style="display: inline-block; padding: 10px 20px; margin-top: 20px; color: white; background-color: #007BFF; text-decoration: none; border-radius: 5px;">
            Explore More
          </a>
          <p style="margin-top: 30px;">Best Regards,<br>Med-space</p>
        </div>
      `
    });

    res.status(200).json({ message: "Subscription successful, confirmation email sent" });
  } catch (error) {
    console.error("Error in subscribing to newsletter:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller: Send updates to all subscribers (Admin only)
const sendNewsletterUpdate = async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and message are required." });
    }

    const subscribers = await Newsletter.find({}, "email");
    const emailAddresses = subscribers.map(sub => sub.email);

    if (emailAddresses.length === 0) {
      return res.status(400).json({ message: "No subscribers found." });
    }

    const emailPromises = emailAddresses.map(email =>
      transporter.sendMail({
        from: process.env.SMTP_EMAIL,
        to: email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>${subject}</h2>
            <p>${message}</p>
            <p style="margin-top: 30px;">Best Regards,<br>Med-space Team</p>
          </div>
        `
      })
    );

    await Promise.all(emailPromises);

    res.status(200).json({ message: "Update sent to all subscribers." });
  } catch (error) {
    console.error("Error in sending newsletter update:", error.message);
    res.status(500).json({ message: "Server error while sending updates." });
  }
};

module.exports = { subscribeNewsletter, sendNewsletterUpdate };
