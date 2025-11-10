// routes/auth.js
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const passport = require("passport");

// ---------- Routes ----------

// GET forms
router.get("/register", (req, res) => res.render("auth/register"));
router.get("/login", (req, res) => res.render("auth/login"));

// POST /register -> directly create user and auto-login
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword, mobile, dateOfBirth, address } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      req.flash("error", "Name, email, and password are required.");
      return res.redirect("/register");
    }

    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match.");
      return res.redirect("/register");
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      req.flash("error", "Email is already registered.");
      return res.redirect("/register");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user object
    const userData = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    };

    // Add optional fields if provided
    if (mobile) userData.mobile = mobile;
    if (dateOfBirth) userData.dateOfBirth = new Date(dateOfBirth);
    if (address) userData.address = address;

    // Create and save user
    const user = new User(userData);
    await user.save();

    // Auto-login after registration
    req.login(user, (err) => {
      if (err) {
        console.error("Login error after register:", err);
        req.flash("error", "Registered successfully, but couldn't log you in. Please login manually.");
        return res.redirect("/login");
      }
      req.flash("success", "Registration successful! Welcome to SmartStay.");
      return res.redirect("/listings");
    });

  } catch (err) {
    console.error("Registration error:", err);
    req.flash("error", "An error occurred during registration. Please try again.");
    return res.redirect("/register");
  }
});

// POST /login -> use passport local
router.post("/login", passport.authenticate("local", {
  failureRedirect: "/login",
  failureFlash: true,
}), (req, res) => {
  req.flash("success", "Welcome back!");
  res.redirect("/listings");
});

// Logout route
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return next(err);
    }
    req.flash("success", "Logged out successfully!");
    res.redirect("/listings");
  });
});

module.exports = router;
