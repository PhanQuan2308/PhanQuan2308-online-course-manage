const { admin } = require('../config/FireBaseConfig');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
console.log(process.env.FIREBASE_PRIVATE_KEY);
console.log(process.env.FIREBASE_CLIENT_EMAIL);
console.log(process.env.FIREBASE_PROJECT_ID);

// Đăng ký người dùng mới
exports.register = async (req, res) => {
  const { email, password, role } = req.body;
  try {
    // Firebase yêu cầu mật khẩu dạng plain text
    const userRecord = await admin.auth().createUser({ email, password });
    
    // Lưu role vào Firestore (nếu cần lưu)
    await admin.firestore().collection('users').doc(userRecord.uid).set({ role });
    
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Đăng nhập và phát hành JWT
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Lấy thông tin người dùng từ Firestore
    const userDoc = await admin.firestore().collection('users').doc(userRecord.uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

    const user = userDoc.data();

    // Tạo token JWT
    const token = jwt.sign({ uid: userRecord.uid, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.status(200).json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
