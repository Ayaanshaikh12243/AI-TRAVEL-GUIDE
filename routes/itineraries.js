const express = require('express');
const router = express.Router();
const Itinerary = require('../models/itinerary');
const aiService = require('../api/aiService');
const { isLoggedIn, checkItineraryOwnership } = require('../middleware');

// @route   GET /itineraries
// @desc    Show all itineraries for the logged-in user
// @access  Private
router.get('/', isLoggedIn, async (req, res) => {
    try {
        const itineraries = await Itinerary.find({ author: req.user._id }).sort({ createdAt: -1 });
        res.render('itineraries/index', { itineraries });
    } catch (err) {
        req.flash('error', 'Could not load your itineraries.');
        res.redirect('/');
    }
});


router.get('/new', isLoggedIn, (req, res) => {
    res.render('itineraries/new');
});

router.post('/', isLoggedIn, async (req, res) => {
    try {
        const userInput = req.body; // { destination, startDate, endDate, interests, travelStyle, pace, budget, currency }

        // Call the AI service
        const aiResponse = await aiService.generateItinerary(userInput);

        if (aiResponse.status === 'error') {
            // If AJAX request, send JSON error instead of redirecting
            if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
                return res.status(400).json({ ok: false, error: aiResponse.message });
            }
            req.flash('error', `AI Error: ${aiResponse.message}`);
            return res.redirect('back');
        }

        // Create a new Itinerary document
        const newItinerary = new Itinerary({
            ...aiResponse, // Spread the AI-generated fields (title, days, budget, etc.)
            author: req.user._id,
            userInput: { // Save the inputs for re-generation
                destination: userInput.destination,
                startDate: userInput.startDate,
                endDate: userInput.endDate,
                interests: userInput.interests,
                travelStyle: userInput.travelStyle,
                pace: userInput.pace,
                budgetInput: userInput.budget,
                currency: userInput.currency
            }
        });

        await newItinerary.save();
        // Respond JSON for AJAX callers; otherwise redirect
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.json({ ok: true, id: newItinerary._id, url: `/itineraries/${newItinerary._id}` });
        }
        req.flash('success', 'Your personalized itinerary has been generated!');
        res.redirect(`/itineraries/${newItinerary._id}`);

    } catch (err) {
        console.error(err);
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.status(500).json({ ok: false, error: 'An error occurred while generating your trip. Please try again.' });
        }
        req.flash('error', 'An error occurred while generating your trip. Please try again.');
        res.redirect('/itineraries/new');
    }
});


router.get('/:id', isLoggedIn, checkItineraryOwnership, async (req, res) => {
    try {
      
        const itinerary = await Itinerary.findById(req.params.id);
        if (!itinerary) {
             req.flash('error', 'Itinerary not found.');
             return res.redirect('/itineraries');
        }
        res.render('itineraries/show', { itinerary });
    } catch (err) {
        req.flash('error', 'Could not find that itinerary.');
        res.redirect('/itineraries');
    }
});


router.get('/:id/edit', isLoggedIn, checkItineraryOwnership, async (req, res) => {
    const itinerary = await Itinerary.findById(req.params.id);
    res.render('itineraries/edit', { itinerary });
});


router.put('/:id', isLoggedIn, checkItineraryOwnership, async (req, res) => {
    try {
     
        const { title } = req.body;
        await Itinerary.findByIdAndUpdate(req.params.id, { title });
        req.flash('success', 'Itinerary title updated!');
        res.redirect(`/itineraries/${req.params.id}`);
    } catch (err) {
        req.flash('error', 'Update failed. Please try again.');
        res.redirect('back');
    }
});


router.delete('/:id', isLoggedIn, checkItineraryOwnership, async (req, res) => {
    try {
        await Itinerary.findByIdAndDelete(req.params.id);
        req.flash('success', 'Itinerary deleted.');
        res.redirect('/itineraries');
    } catch (err) {
        req.flash('error', 'Could not delete itinerary.');
        res.redirect('/itineraries');
    }
});


router.post('/:id/regenerate', isLoggedIn, checkItineraryOwnership, async (req, res) => {
    try {
        const oldItinerary = await Itinerary.findById(req.params.id);
        
        
        const userInput = {
            ...oldItinerary.userInput,
            startDate: oldItinerary.userInput.startDate,
            endDate: oldItinerary.userInput.endDate
        };

        const aiResponse = await aiService.generateItinerary(userInput);

        if (aiResponse.status === 'error') {
            req.flash('error', `AI Re-generation Error: ${aiResponse.message}`);
            return res.redirect('back');
        }

   
        oldItinerary.title = aiResponse.title;
        oldItinerary.startDate = aiResponse.startDate;
        oldItinerary.endDate = aiResponse.endDate;
        oldItinerary.days = aiResponse.days;
        oldItinerary.budget = aiResponse.budget;
        oldItinerary.aiReasoning = aiResponse.aiReasoning;
        
        await oldItinerary.save();

        req.flash('success', 'Itinerary has been re-generated!');
        res.redirect(`/itineraries/${oldItinerary._id}`);

    } catch (err) {
        console.error(err);
        req.flash('error', 'An error occurred during re-generation.');
        res.redirect('back');
    }
});

module.exports = router;