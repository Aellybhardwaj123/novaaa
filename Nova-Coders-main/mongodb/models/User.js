const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 1000
    },
    avatar: {
        type: String,
        default: 'https://via.placeholder.com/40'
    },
    battles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Battle'
    }],
    wins: {
        type: Number,
        default: 0
    },
    losses: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema); 