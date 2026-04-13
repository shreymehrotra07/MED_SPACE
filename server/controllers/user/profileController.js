const User = require("../../models/user.js");
const { ZodError } = require("zod");

// ---------------------------------------------------------
// GET USER PROFILE
// ---------------------------------------------------------
const getProfile = async (req, res) => {
  try {
    const profile = await User.findById(req.user.id);

    if (!profile) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({ ...profile.toObject(), role: "user" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", err });
  }
};

// ---------------------------------------------------------
// EDIT USER PROFILE
// ---------------------------------------------------------
const editProfileByID = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = req.body;

    // Check if the user exists
    let user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Validate user data using schema
    updateData = User.schema.partial().parse(updateData);

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.json(updatedUser);
  } catch (error) {
    console.log(error);
    if (error instanceof ZodError) {
      return res
        .status(400)
        .json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { getProfile, editProfileByID };
