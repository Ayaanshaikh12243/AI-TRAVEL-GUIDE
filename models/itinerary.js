const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ActivitySchema = new Schema({
    time: String,
    place: String,
    activity: String,
    cost: String,
    transport: String
}, { _id: false });

const DayPlanSchema = new Schema({
    day: Number,
    date: String,
    plan: [ActivitySchema],
    alternatives: [String]
}, { _id: false });

const ItinerarySchema = new Schema({

    title: {
        type: String,
        required: true
    },
    startDate: {
        type: String,
        required: true
    },
    endDate: {
        type: String,
        required: true
    },
    days: [DayPlanSchema],
    budget: String,
    aiReasoning: [String],

 
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },

    // Store original inputs for re-generation
    userInput: {
        destination: String,
        interests: String,
        travelStyle: String,
        pace: String,
        budgetInput: String,
        currency: String
    }
}, { timestamps: true }); // timestamps adds createdAt and updatedAt

module.exports = mongoose.model('Itinerary', ItinerarySchema);