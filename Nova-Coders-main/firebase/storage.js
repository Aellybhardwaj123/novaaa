import { storage } from './firebase-config.js';

// Storage service
const StorageService = {
    // Upload user avatar
    async uploadAvatar(userId, file) {
        try {
            const storageRef = storage.ref();
            const avatarRef = storageRef.child(`avatars/${userId}/${file.name}`);
            
            const snapshot = await avatarRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            return downloadURL;
        } catch (error) {
            throw error;
        }
    },

    // Delete user avatar
    async deleteAvatar(userId, fileName) {
        try {
            const storageRef = storage.ref();
            const avatarRef = storageRef.child(`avatars/${userId}/${fileName}`);
            
            await avatarRef.delete();
        } catch (error) {
            throw error;
        }
    },

    // Upload problem test cases
    async uploadTestCases(problemId, files) {
        try {
            const storageRef = storage.ref();
            const testCasesRef = storageRef.child(`problems/${problemId}/test-cases`);
            
            const uploadPromises = files.map(file => {
                const fileRef = testCasesRef.child(file.name);
                return fileRef.put(file);
            });
            
            const snapshots = await Promise.all(uploadPromises);
            const downloadURLs = await Promise.all(
                snapshots.map(snapshot => snapshot.ref.getDownloadURL())
            );
            
            return downloadURLs;
        } catch (error) {
            throw error;
        }
    }
};

export default StorageService; 