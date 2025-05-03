const mongoose = require('mongoose');

const BattleSchema = new mongoose.Schema({
    player1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    player2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    problem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'abandoned'],
        default: 'active'
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    player1Code: {
        type: String,
        default: ''
    },
    player2Code: {
        type: String,
        default: ''
    },
    player1Progress: {
        type: Number,
        default: 0
    },
    player2Progress: {
        type: Number,
        default: 0
    },
    timeLimit: {
        type: Number,
        default: 30 * 60 // 30 minutes in seconds
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    isBotBattle: {
        type: Boolean,
        default: false
    },
    botDifficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard']
    }
});

module.exports = mongoose.model('Battle', BattleSchema); 