const admin = require('firebase-admin');
require('dotenv').config(); // Load các biến môi trường từ file .env

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Thay thế \\n bằng \n trong private key
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      projectId: process.env.FIREBASE_PROJECT_ID,
    }),
  });

  const firestore = admin.firestore();
  module.exports = { admin, firestore };
} catch (error) {
  console.error('Error initializing Firebase:', error);
}
