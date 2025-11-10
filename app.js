// app.js
require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const Booking = require("./models/booking");
const User = require("./models/user");
const Review = require("./models/review");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const fetch = require("node-fetch");

const multer = require("multer");
let upload;
if (process.env.CLOUDINARY_CLOUD_NAME) {
  const { storage } = require("./config/cloudinary");
  upload = multer({ storage });
} else {
  upload = multer({ dest: "uploads/" });
}

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/wanderlust";
mongoose.connect(MONGO_URL)
  .then(() => console.log("connected to DB:", MONGO_URL))
  .catch(err => console.log("DB connect error:", err));

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "notagoodsecret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Passport
passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const user = await User.findOne({ email });
      if (!user) return done(null, false, { message: "Incorrect email" });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return done(null, false, { message: "Incorrect password" });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const u = await User.findById(id);
  done(null, u);
});

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

/* ---------------- AUTH ------------------ */
app.get("/register", (req, res) => res.render("auth/register"));

app.post("/register", async (req, res) => {
  const { email, name, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) {
    req.flash("error", "Email already registered");
    return res.redirect("/register");
  }
  const hashed = await bcrypt.hash(password, 12);
  const user = new User({ email, name, password: hashed });
  await user.save();
  req.login(user, err => {
    if (err) return next(err);
    req.flash("success", "Welcome!");
    res.redirect("/listings");
  });
});

app.get("/login", (req, res) => res.render("auth/login"));
app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    req.flash("success", "Welcome back!");
    res.redirect("/listings");
  }
);

app.get("/logout", (req, res) => {
  req.logout(() => {});
  req.flash("success", "Logged out");
  res.redirect("/listings");
});

/* ---------------- LISTINGS ------------------ */
app.get("/listings", async (req, res) => {
  let { 
    location, 
    minPrice, 
    maxPrice, 
    type, 
    q, 
    purpose, 
    category, 
    amenities, 
    startDate, 
    endDate 
  } = req.query;
  
  const filter = {};
  
  // Basic search filters
  if (location) filter.location = new RegExp(location, "i");
  if (q) filter.title = new RegExp(q, "i");
  if (type) filter.type = type;
  
  // Price range filter
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  
  // Purpose filter
  if (purpose && purpose !== 'all') filter.purpose = purpose;
  
  // Category filter
  if (category && category !== 'all') filter.category = category;
  
  // Amenities filter
  if (amenities) {
    const amenityList = Array.isArray(amenities) ? amenities : [amenities];
    filter.amenities = { $in: amenityList };
  }
  
  // Date availability filter
  if (startDate || endDate) {
    filter['availability.available'] = true;
    if (startDate) {
      filter['availability.startDate'] = { $lte: new Date(startDate) };
    }
    if (endDate) {
      filter['availability.endDate'] = { $gte: new Date(endDate) };
    }
  }
  
  const allListings = await Listing.find(filter).sort({ createdAt: -1 });
  res.render("listings/index", { allListings, filters: req.query });
});

app.get("/listings/new", isLoggedIn, (req, res) => res.render("listings/new"));

app.post("/listings", isLoggedIn, upload.single("image"), async (req, res, next) => {
  try {
    const payload = req.body.listing;
    const clean = {
      title: payload.title,
      description: payload.description,
      price: Number(payload.price) || 0,
      location: payload.location,
      country: payload.country,
      type: payload.type || "stay",
      amenities: Array.isArray(req.body.amenities) ? req.body.amenities : (payload.amenities ? [payload.amenities] : []),
    };
    if (req.file && req.file.path) {
      clean.image = { url: req.file.path, filename: req.file.filename || req.file.originalname };
    }
    const listing = new Listing({ ...clean, host: req.user._id });
    await listing.save();
    req.flash("success", "Listing created");
    res.redirect("/listings");
  } catch (err) {
    next(err);
  }
});

app.get("/listings/:id", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  const reviews = await Review.find({ listing: id }).populate("user");
  res.render("listings/show-enhanced", {
    listing,
    reviews
  });
});

app.get("/listings/:id/edit", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }
  res.render("listings/edit", { listing });
});

app.put("/listings/:id", isLoggedIn, upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const payload = req.body.listing;
  const update = {
    title: payload.title,
    description: payload.description,
    price: Number(payload.price) || 0,
    location: payload.location,
    country: payload.country,
    type: payload.type,
    amenities: Array.isArray(req.body.amenities) ? req.body.amenities : (payload.amenities ? [payload.amenities] : []),
  };
  if (req.file && req.file.path) update.image = { url: req.file.path, filename: req.file.filename || req.file.originalname };
  await Listing.findByIdAndUpdate(id, { ...update });
  req.flash("success", "Listing updated");
  res.redirect(`/listings/${id}`);
});

app.delete("/listings/:id", isLoggedIn, async (req, res) => {
  await Listing.findByIdAndDelete(req.params.id);
  req.flash("success", "Listing deleted");
  res.redirect("/listings");
});

/* ---------------- BOOKINGS ------------------ */
app.post("/bookings", isLoggedIn, async (req, res) => {
  const { listingId, startDate, endDate } = req.body;
  const listing = await Listing.findById(listingId);
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end) || end <= start) {
    req.flash("error", "Invalid dates");
    return res.redirect(`/listings/${listingId}`);
  }
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.ceil((end - start) / msPerDay);
  const total = (listing.price || 0) * days;
  const booking = new Booking({
    listing: listing._id,
    user: req.user._id,
    startDate: start,
    endDate: end,
    totalPrice: total,
    status: "pending",
  });
  await booking.save();
  req.flash("success", "Booking created (pending)");
  res.redirect("/mybookings");
});

app.get("/mybookings", isLoggedIn, async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).populate("listing");
  res.render("users/bookings", { bookings });
});

app.get("/mylistings", isLoggedIn, async (req, res) => {
  const listings = await Listing.find({ host: req.user._id }).sort({ createdAt: -1 });
  res.render("users/mylistings", { listings });
});

/* ---------------- REVIEWS ------------------ */
app.post("/listings/:id/reviews", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const { rating, review } = req.body;
  
  try {
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }
    
    // Check if user already reviewed this listing
    const existingReview = await Review.findOne({ listing: id, user: req.user._id });
    if (existingReview) {
      req.flash("error", "You have already reviewed this listing");
      return res.redirect(`/listings/${id}`);
    }
    
    const newReview = new Review({
      listing: id,
      user: req.user._id,
      rating: Number(rating),
      review
    });
    
    await newReview.save();
    
    // Update listing's average rating
    const reviews = await Review.find({ listing: id });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    await Listing.findByIdAndUpdate(id, {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length
    });
    
    req.flash("success", "Review added successfully");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Error adding review");
    res.redirect(`/listings/${id}`);
  }
});

app.delete("/listings/:id/reviews/:reviewId", isLoggedIn, async (req, res) => {
  const { id, reviewId } = req.params;
  
  try {
    const review = await Review.findById(reviewId);
    if (!review || review.user.toString() !== req.user._id.toString()) {
      req.flash("error", "You can only delete your own reviews");
      return res.redirect(`/listings/${id}`);
    }
    
    await Review.findByIdAndDelete(reviewId);
    
    // Update listing's average rating
    const reviews = await Review.find({ listing: id });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
    
    await Listing.findByIdAndUpdate(id, {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length
    });
    
    req.flash("success", "Review deleted successfully");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Error deleting review");
    res.redirect(`/listings/${id}`);
  }
});

/* ---------------- LEAFLET MAPS API ------------------ */
app.get("/listings/:id/map", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }
  res.render("listings/map", { listing });
});

/* ---------------- HOTEL SEARCH API ------------------ */
app.get("/api/search-hotels", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: "Missing location query" });
  }

  try {
    console.log(`[search-hotels] Query received: "${query}"`);

    // 1) Geocode using Nominatim
    const nominatimURL = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    console.log("[search-hotels] Nominatim URL:", nominatimURL);
    const geoResponse = await fetch(nominatimURL, {
      headers: {
        "User-Agent": "SmartStayApp/1.0 (bhupender.dev09@gmail.com)",
        "Accept-Language": "en",
      },
    });

    if (!geoResponse.ok) {
      const text = await geoResponse.text();
      console.error("Nominatim error:", text);
      return res.status(geoResponse.status).json({ error: "Nominatim request failed", details: text });
    }

    const geoData = await geoResponse.json();

    if (!geoData.length) {
      return res.status(404).json({ error: "Location not found" });
    }

    const { lat, lon } = geoData[0];
    console.log(`[search-hotels] Geocoded: lat=${lat}, lon=${lon}`);

    // 2) Build Overpass query - include hotels
    const overpassQuery = `[out:json][timeout:25];
      (
        node["tourism"="hotel"](around:5000,${lat},${lon});
        way["tourism"="hotel"](around:5000,${lat},${lon});
        relation["tourism"="hotel"](around:5000,${lat},${lon});
      );
      out center;`;

    // Try primary Overpass endpoint, fallback to alternative if it times out or 500/504
    const overpassEndpoints = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass.openstreetmap.fr/api/interpreter"
    ];

    let overpassData = null;
    for (const ep of overpassEndpoints) {
      try {
        console.log(`[search-hotels] Querying Overpass: ${ep}`);
        const overRes = await fetch(ep, {
          method: "POST",
          body: overpassQuery,
          headers: {
            "User-Agent": "SmartStay/1.0 (bhupender.dev09@gmail.com)",
            "Content-Type": "application/x-www-form-urlencoded"
          },
        });

        if (!overRes.ok) {
          console.warn(`[search-hotels] Overpass ${ep} returned HTTP ${overRes.status}`);
          // try next endpoint
          continue;
        }

        overpassData = await overRes.json();
        if (overpassData && Array.isArray(overpassData.elements)) {
          console.log(`[search-hotels] Overpass returned ${overpassData.elements.length} elements from ${ep}`);
          break;
        }
      } catch (err) {
        console.warn(`[search-hotels] Overpass fetch error for ${ep}:`, err.message);
        // try next endpoint
      }
    }

    if (!overpassData || !Array.isArray(overpassData.elements)) {
      console.error("[search-hotels] Overpass failed on all endpoints or returned invalid data");
      return res.status(502).json({ error: "Overpass query failed or timed out. Try again later." });
    }

    // 3) Normalize results
    const hotels = overpassData.elements
      .map(el => {
        const lat = el.lat ?? (el.center && el.center.lat);
        const lon = el.lon ?? (el.center && el.center.lon);
        return {
          id: el.id,
          osm_type: el.type,
          name: el.tags?.name || "Unnamed",
          lat,
          lon,
          address: el.tags?.["addr:full"] || el.tags?.["addr:street"] || el.tags?.["addr:city"] || null,
          phone: el.tags?.phone || null,
          website: el.tags?.website || null,
          stars: el.tags?.stars || null,
          tags: el.tags || {}
        };
      })
      .filter(h => h.lat && h.lon);

    console.log(`[search-hotels] Responding with ${hotels.length} normalized hotels`);
    return res.json({ hotels });
  } catch (err) {
    console.error("[search-hotels] Unexpected server error:", err);
    return res.status(500).json({ error: "Server error", message: err.message });
  }
});

app.get("/hotels", (req, res) => res.render("listings/hotels"));

/* -------------- helper ------------------ */
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash("error", "You must be logged in");
  res.redirect("/login");
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something went wrong: " + err.message);
});

app.get("/", (req, res) => res.redirect("/listings"));

/* ---------------- ABOUT PAGE ------------------ */
app.get("/about", (req, res) => res.render("about"));

app.listen(8080, () => console.log("server started on port 8080"));
