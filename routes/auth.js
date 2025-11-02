const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');

// @route   GET /register
// @desc    Show register form
// @access  Public
router.get('/register', (req, res) => {
    res.render('register');
});

// @route   POST /register
// @desc    Handle user registration
// @access  Public
router.post('/register', async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        
        // Log the user in right after registration
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to AI Travel Guide!');
            res.redirect('/itineraries/new'); // Redirect to create new trip
        });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
});

// @route   GET /login
// @desc    Show login form
// @access  Public
router.get('/login', (req, res) => {
    res.render('login');
});

// @route   POST /login
// @desc    Handle user login
// @access  Public
router.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true,
    keepSessionInfo: true // Ensures req.session.returnTo is not lost
}), (req, res) => {
    req.flash('success', 'Welcome back!');
    // Redirect to the URL they were trying to access, or to their dashboard
    const redirectUrl = req.session.returnTo || '/itineraries';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
});


router.get('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) { return next(err); }
        req.flash('success', 'You have been logged out.');
        res.redirect('/');
    });
});

module.exports = router;