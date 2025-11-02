require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejs = require('ejs');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const flash = require('connect-flash');
const methodOverride = require('method-override');

const User = require('./models/user');

// Require Routes
const authRoutes = require('./routes/auth');
const indexRoutes = require('./routes/index');
const itineraryRoutes = require('./routes/itineraries');
const suggestionRoutes = require('./routes/suggestions');

// Connect to MongoDB
mongoose.connect(process.env.DB_URL)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const app = express();

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// Session Configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true, // Enable in production (HTTPS)
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};
app.use(session(sessionConfig));
app.use(flash());

// Passport Configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware to pass flash messages and user info to templates
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Use Routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/itineraries', itineraryRoutes);
app.use('/suggestions', suggestionRoutes);

// 404 Not Found Handler
app.use((req, res) => {
    res.status(404).render('partials/footer'); // You wrote this
});

// Basic Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    req.flash('error', err.message || 'Something went wrong!');
    // res.redirect('back');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
