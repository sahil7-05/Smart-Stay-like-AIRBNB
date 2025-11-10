const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { isLoggedIn } = require("../middleware");
const bcrypt = require("bcryptjs");

// Validate Gmail address
function isValidGmail(email) {
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  return gmailRegex.test(email);
}

// Edit profile GET
router.get("/edit", isLoggedIn, async (req, res) => {
  res.render("users/edit", { user: req.user });
});

// Edit profile PUT
router.put("/edit", isLoggedIn, async (req, res) => {
  try {
    const { name, email, mobile, dateOfBirth, address, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    // If changing email, validate Gmail
    if (email && email !== user.email) {
      if (!isValidGmail(email)) {
        req.flash("error", "Only Gmail addresses are allowed.");
        return res.redirect("/users/edit");
      }
      // Check if new email exists
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        req.flash("error", "Email already in use.");
        return res.redirect("/users/edit");
      }
    }

    // If changing password, validate current password
    if (newPassword) {
      if (!currentPassword) {
        req.flash("error", "Current password is required to change password.");
        return res.redirect("/users/edit");
      }
      const validCurrent = await bcrypt.compare(currentPassword, user.password);
      if (!validCurrent) {
        req.flash("error", "Current password is incorrect.");
        return res.redirect("/users/edit");
      }
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      user.password = hashedNewPassword;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        name: name || user.name,
        email: email || user.email,
        mobile: mobile || user.mobile,
        dateOfBirth: dateOfBirth || user.dateOfBirth,
        address: address || user.address
      },
      { new: true, runValidators: true }
    );

    // Update session user
    req.login(updatedUser, (err) => {
      if (err) {
        console.error(err);
        req.flash("error", "Error updating profile.");
        return res.redirect("/users/edit");
      }
      req.flash("success", "Profile updated successfully!");
      res.redirect("/listings");
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Error updating profile. Please try again.");
    res.redirect("/users/edit");
  }
});

module.exports = router;
