const Itinerary = require('../models/itinerary');

const middlewareObj = {};

// Checks if user is authenticated
middlewareObj.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.returnTo = req.originalUrl; // Store the URL they were trying to access
    req.flash('error', 'You must be logged in to do that.');
    res.redirect('/login');
};

// Checks if the logged-in user is the author of the itinerary
middlewareObj.checkItineraryOwnership = async (req, res, next) => {
    try {
        const itinerary = await Itinerary.findById(req.params.id);
        if (!itinerary) {
            req.flash('error', 'Itinerary not found.');
            return res.redirect('back');
        }
        // Check if user owns the itinerary
        if (itinerary.author.equals(req.user._id)) {
            next();
        } else {
            req.flash('error', 'You do not have permission to do that.');
            res.redirect('back');
        }
    } catch (err) {
        req.flash('error', 'Itinerary not found or invalid ID.');
        res.redirect('back');
    }
};

module.exports = middlewareObj;