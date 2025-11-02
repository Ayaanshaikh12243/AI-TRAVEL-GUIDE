const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
    // passport-local-mongoose adds username, hash, and salt
});

// This plugin adds all the necessary methods for authentication
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);