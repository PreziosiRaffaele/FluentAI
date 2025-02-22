const { initializeApp } = require('firebase/app');
const {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    sendEmailVerification
} = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');

class AuthService {
    constructor() {
        const firebaseConfig = {
            apiKey: "AIzaSyBb-RJPzfZKftmhutT3Uj_3Qj4OsRZJGHg",
            authDomain: "key-genie.firebaseapp.com",
            projectId: "key-genie",
            storageBucket: "key-genie.firebasestorage.app",
            messagingSenderId: "883591007158",
            appId: "1:883591007158:web:ac823decc1b9976a648f17",
            measurementId: "G-ZF6GKJ9PWW"
        };

        this.app = initializeApp(firebaseConfig);
        this.auth = getAuth(this.app);
        this.db = getFirestore(this.app);
    }

    async login (email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            if (!userCredential.user.emailVerified) {
                throw new Error('Email not verified. Please check your inbox.');
            }
            return userCredential.user;
        } catch (error) {
            throw new Error(`Authentication failed: ${error.message}`);
        }
    }

    async signup (email, password) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            await sendEmailVerification(user);
        } catch (error) {
            throw new Error(`Signup failed: ${error.message}`);
        }
    }

    async logout () {
        try {
            await signOut(this.auth);
        } catch (error) {
            throw new Error(`Logout failed: ${error.message}`);
        }
    }

    onAuthStateChange (callback) {
        return onAuthStateChanged(this.auth, callback);
    }

    getCurrentUser () {
        return this.auth.currentUser;
    }
}

module.exports = AuthService;
