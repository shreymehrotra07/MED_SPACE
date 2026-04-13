const User = require("../models/user"); 
const base64 = require("base-64");

const userMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check Basic Auth header
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return res.status(401).json({ message: "No authorization header provided" });
  }

  // Decode credentials
  const base64Credentials = authHeader.split(" ")[1];
  const decodedCredentials = base64.decode(base64Credentials);
  const [email] = decodedCredentials.split(":");

  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Attach user to request
    req.user = user;
    next();
    
  } catch (error) {
    console.error("Error in user middleware:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { userMiddleware };
