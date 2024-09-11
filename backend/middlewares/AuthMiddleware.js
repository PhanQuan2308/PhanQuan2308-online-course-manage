const jwt = require('jsonwebtoken');

// Middleware xác thực JWT
exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log("Token received in verifyToken middleware:", token); // Log token để kiểm tra

  if (!token) {
    return res.status(403).json({ error: 'Token is required for authentication' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Gán thông tin người dùng vào request
    console.log("Decoded token:", decoded); // Log thông tin token sau khi giải mã
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware kiểm tra phân quyền
exports.checkRole = (roles) => (req, res, next) => {
  console.log("User role in checkRole middleware:", req.user.role); // Log vai trò của người dùng

  if (!roles.includes(req.user.role)) {
    console.log("Access denied for role:", req.user.role);
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};
