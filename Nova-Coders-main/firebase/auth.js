import { auth } from './firebase-config.js';

// Authentication service
const AuthService = {
    // Sign up new user
    async signUp(email, password, username) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Create user profile in Firestore
            await db.collection('users').doc(user.uid).set({
                username: username,
                email: email,
                rating: 1000, // Default rating
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return user;
        } catch (error) {
            throw error;
        }
    },

    // Sign in user
    async signIn(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            return userCredential.user;
        } catch (error) {
            throw error;
        }
    },

    // Sign out user
    async signOut() {
        try {
            await auth.signOut();
        } catch (error) {
            throw error;
        }
    },

    // Get current user
    getCurrentUser() {
        return auth.currentUser;
    },

    // Listen to auth state changes
    onAuthStateChanged(callback) {
        return auth.onAuthStateChanged(callback);
    },

    // Update user profile
    async updateProfile(userId, data) {
        try {
            await db.collection('users').doc(userId).update(data);
        } catch (error) {
            throw error;
        }
    }
};

export default AuthService; 