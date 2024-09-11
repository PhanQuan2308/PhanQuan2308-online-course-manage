const express = require('express');
const authRoutes = require('./routers/AuthRoutes'); // Import file routes cho auth
const courseRoutes = require('./routers/CourseRoutes'); // Import file routes cho courses
require('dotenv').config();
const cors = require('cors');


app.use(cors());
const app = express();

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
