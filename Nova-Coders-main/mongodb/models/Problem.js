const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: true
    },
    category: {
        type: String,
        required: true
    },
    initialCode: {
        type: String,
        required: true
    },
    testCases: [{
        input: {
            type: String,
            required: true
        },
        output: {
            type: String,
            required: true
        },
        explanation: String
    }],
    solution: {
        type: String,
        required: true
    },
    timeLimit: {
        type: Number,
        default: 2 // seconds
    },
    memoryLimit: {
        type: Number,
        default: 256 // MB
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Problem', ProblemSchema); 