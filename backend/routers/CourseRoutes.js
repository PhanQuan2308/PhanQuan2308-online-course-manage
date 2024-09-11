const express = require("express");
const { verifyToken, checkRole } = require("../middlewares/AuthMiddleware");
const coursesController = require("../controllers/CourseController");

const router = express.Router();

// POST /api/courses (Chỉ Admin có thể tạo khóa học)
router.post(
  "/courses",
  verifyToken,
  checkRole(["admin"]),
  coursesController.createCourse
);

// GET /api/courses (Người dùng có thể xem danh sách khóa học)
router.get(
  "/courses",
  verifyToken,
  checkRole(["user", "admin"]),
  coursesController.getCourses
);

// PUT /api/courses/:id (Chỉ Admin có thể cập nhật khóa học)
router.put(
  "/courses/:id",
  verifyToken,
  checkRole(["admin"]),
  coursesController.updateCourse
);

// DELETE /api/courses/:id (Chỉ Admin có thể xóa khóa học)
router.delete(
  "/courses/:id",
  verifyToken,
  checkRole(["admin"]),
  coursesController.deleteCourse
);

// POST /api/courses/:id/register (Người dùng có thể đăng ký khóa học)
router.post(
  "/courses/:id/register",
  verifyToken,
  checkRole(["user"]),
  coursesController.registerCourse
);

// GET /api/courses/:id/lectures (Người dùng có thể xem danh sách bài giảng của khóa học đã đăng ký)
router.get(
  "/courses/:id/lectures",
  verifyToken,
  checkRole(["user", "admin"]),
  coursesController.getCourseLectures
);

// POST /api/courses/:id/lectures (Chỉ Admin có thể thêm bài giảng)
router.post(
  "/courses/:id/lectures",
  verifyToken,
  checkRole(["admin"]),
  coursesController.addLecture
);

// PUT /api/courses/:courseId/lectures/:lectureId (Chỉ Admin có thể sửa bài giảng)
router.put(
  "/courses/:courseId/lectures/:lectureId",
  verifyToken,
  checkRole(["admin"]),
  coursesController.updateLecture
);

// DELETE /api/courses/:courseId/lectures/:lectureId (Chỉ Admin có thể xóa bài giảng)
router.delete(
  "/courses/:courseId/lectures/:lectureId",
  verifyToken,
  checkRole(["admin"]),
  coursesController.deleteLecture
);

// GET /api/courses/registered (Người dùng có thể xem các khóa học đã đăng ký)
router.get(
  "/courses/registered",
  verifyToken,
  checkRole(["user", "admin"]),
  coursesController.getRegisteredCourses
);

// GET /api/courses/search (Người dùng có thể tìm kiếm khóa học)
router.get(
  "/courses/search",
  verifyToken,
  checkRole(["user", "admin"]),
  coursesController.searchCourses
);

module.exports = router;
