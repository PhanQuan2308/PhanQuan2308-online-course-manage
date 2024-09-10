require('dotenv').config();
const express = require('express');
const authRoutes = require('./routers/AuthRoutes');

const app = express();

// Middleware để parse JSON
app.use(express.json());

// Sử dụng các route
app.use('/api/auth', authRoutes);

// Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
