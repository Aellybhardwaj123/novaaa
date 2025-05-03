const Battle = require('../models/Battle');
const UserService = require('./userService');

const BattleService = {
    async createBattle(battleData) {
        const battle = new Battle(battleData);
        return await battle.save();
    },

    async getBattleById(battleId) {
        return await Battle.findById(battleId)
            .populate('player1', 'username rating avatar')
            .populate('player2', 'username rating avatar')
            .populate('problem')
            .populate('winner', 'username');
    },

    async updateBattle(battleId, updates) {
        return await Battle.findByIdAndUpdate(battleId, updates, { new: true });
    },

    async updatePlayerCode(battleId, playerNumber, code) {
        const updateField = playerNumber === 1 ? 'player1Code' : 'player2Code';
        return await Battle.findByIdAndUpdate(
            battleId,
            { [updateField]: code },
            { new: true }
        );
    },

    async updatePlayerProgress(battleId, playerNumber, progress) {
        const updateField = playerNumber === 1 ? 'player1Progress' : 'player2Progress';
        return await Battle.findByIdAndUpdate(
            battleId,
            { [updateField]: progress },
            { new: true }
        );
    },

    async completeBattle(battleId, winnerId) {
        const battle = await Battle.findByIdAndUpdate(
            battleId,
            { 
                status: 'completed',
                winner: winnerId,
                endTime: Date.now()
            },
            { new: true }
        );

        if (battle) {
            // Update user statistics
            if (winnerId) {
                await UserService.incrementUserWins(winnerId);
                const loserId = battle.player1.toString() === winnerId ? 
                    battle.player2 : battle.player1;
                await UserService.incrementUserLosses(loserId);
            }
        }

        return battle;
    },

    async abandonBattle(battleId) {
        return await Battle.findByIdAndUpdate(
            battleId,
            { 
                status: 'abandoned',
                endTime: Date.now()
            },
            { new: true }
        );
    },

    async getActiveBattles() {
        return await Battle.find({ status: 'active' })
            .populate('player1', 'username rating avatar')
            .populate('player2', 'username rating avatar')
            .populate('problem');
    },

    async getBattlesByUserId(userId) {
        return await Battle.find({
            $or: [{ player1: userId }, { player2: userId }]
        })
            .populate('player1', 'username rating avatar')
            .populate('player2', 'username rating avatar')
            .populate('problem')
            .populate('winner', 'username')
            .sort({ startTime: -1 });
    }
};

module.exports = BattleService; 