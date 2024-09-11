const express = require('express');
const authRoutes = require('./routers/AuthRoutes'); // Import file routes cho auth
const courseRoutes = require('./routers/CourseRoutes'); // Import file routes cho courses
require('dotenv').config();
const cors = require('cors');

const app = express(); // Đã khai báo app ở đây

// Cấu hình CORS, đảm bảo frontend (ví dụ localhost:3000) có quyền truy cập vào backend
app.use(cors({
  origin: ['http://localhost:3000', 'https://phanquan2308-online-course-manage.onrender.com'], // Cụ thể hóa địa chỉ frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'], // Cho phép các headers cần thiết
  credentials: true
}));


// Middleware để parse JSON
app.use(express.json());

// Sử dụng các route auth (đăng ký, đăng nhập)
app.use('/api/auth', authRoutes);

// Sử dụng các route course (quản lý khóa học)
app.use('/api', courseRoutes); // Đường dẫn cho các API liên quan đến khóa học

// Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
