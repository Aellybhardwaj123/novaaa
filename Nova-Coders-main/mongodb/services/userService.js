const User = require('../models/User');

const UserService = {
    async createUser(userData) {
        const user = new User(userData);
        return await user.save();
    },

    async getUserById(userId) {
        return await User.findById(userId);
    },

    async getUserByEmail(email) {
        return await User.findOne({ email });
    },

    async getUserByUsername(username) {
        return await User.findOne({ username });
    },

    async updateUser(userId, updates) {
        return await User.findByIdAndUpdate(userId, updates, { new: true });
    },

    async updateUserRating(userId, newRating) {
        return await User.findByIdAndUpdate(
            userId,
            { 
                rating: newRating,
                lastUpdated: Date.now()
            },
            { new: true }
        );
    },

    async addBattleToUser(userId, battleId) {
        return await User.findByIdAndUpdate(
            userId,
            { $push: { battles: battleId } },
            { new: true }
        );
    },

    async incrementUserWins(userId) {
        return await User.findByIdAndUpdate(
            userId,
            { $inc: { wins: 1 } },
            { new: true }
        );
    },

    async incrementUserLosses(userId) {
        return await User.findByIdAndUpdate(
            userId,
            { $inc: { losses: 1 } },
            { new: true }
        );
    },

    async getLeaderboard(limit = 10) {
        return await User.find()
            .sort({ rating: -1 })
            .limit(limit)
            .select('username rating avatar wins losses');
    }
};

module.exports = UserService; 