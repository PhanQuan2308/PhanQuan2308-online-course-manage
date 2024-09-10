const express = require('express');
const { register, login } = require('../controllers/AuthController');
const { verifyToken, checkRole } = require('../middlewares/AuthMiddleware');

const router = express.Router();

// Định tuyến cho đăng ký
router.post('/register', register);

// Định tuyến cho đăng nhập
router.post('/login', login);

// Route bảo vệ dành cho admin
router.get('/admin', verifyToken, checkRole(['admin']), (req, res) => {
  res.status(200).send('Welcome Admin');
});

// Route dành cho người dùng thường
router.get('/user', verifyToken, checkRole(['user', 'admin']), (req, res) => {
  res.status(200).send('Welcome User');
});

module.exports = router;
