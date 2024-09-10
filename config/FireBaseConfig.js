const admin = require('firebase-admin');

console.log(process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'));  // Thêm dòng này để kiểm tra

admin.initializeApp({
  credential: admin.credential.cert({
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    projectId: process.env.FIREBASE_PROJECT_ID,
  }),
});

module.exports = { admin };
