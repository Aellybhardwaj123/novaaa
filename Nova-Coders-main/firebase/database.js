import { db } from './firebase-config.js';

// Database service
const DatabaseService = {
    // User operations
    async getUser(userId) {
        try {
            const doc = await db.collection('users').doc(userId).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            throw error;
        }
    },

    async updateUserRating(userId, newRating) {
        try {
            await db.collection('users').doc(userId).update({
                rating: newRating,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            throw error;
        }
    },

    // Battle operations
    async createBattle(battleData) {
        try {
            const battleRef = await db.collection('battles').add({
                ...battleData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active'
            });
            return battleRef.id;
        } catch (error) {
            throw error;
        }
    },

    async updateBattle(battleId, updates) {
        try {
            await db.collection('battles').doc(battleId).update({
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            throw error;
        }
    },

    async getBattle(battleId) {
        try {
            const doc = await db.collection('battles').doc(battleId).get();
            return doc.exists ? { id: doc.id, ...doc.data() } : null;
        } catch (error) {
            throw error;
        }
    },

    // Problem operations
    async getProblem(problemId) {
        try {
            const doc = await db.collection('problems').doc(problemId).get();
            return doc.exists ? { id: doc.id, ...doc.data() } : null;
        } catch (error) {
            throw error;
        }
    },

    async getRandomProblem(difficulty) {
        try {
            const snapshot = await db.collection('problems')
                .where('difficulty', '==', difficulty)
                .get();
            
            if (snapshot.empty) return null;
            
            const problems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return problems[Math.floor(Math.random() * problems.length)];
        } catch (error) {
            throw error;
        }
    },

    // Leaderboard operations
    async getLeaderboard(limit = 10) {
        try {
            const snapshot = await db.collection('users')
                .orderBy('rating', 'desc')
                .limit(limit)
                .get();
            
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            throw error;
        }
    }
};

export default DatabaseService; 