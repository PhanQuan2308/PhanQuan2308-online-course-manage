const express = require('express');
const { verifyToken, checkRole } = require('../middlewares/AuthMiddleware');
const { admin, firestore } = require('../config/FireBaseConfig');

const router = express.Router();

// POST /api/courses (Chỉ Admin có thể tạo khóa học)
router.post('/courses', verifyToken, checkRole(['admin']), async (req, res) => {
  const { title, description } = req.body;

  try {
    const courseRef = firestore.collection('courses').doc();
    await courseRef.set({
      title,
      description,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      adminId: req.user.uid, // ID của admin từ JWT
    });

    res.status(201).json({ message: 'Khóa học đã được tạo' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo khóa học', error });
  }
});

// DELETE /api/courses/:id (Chỉ Admin có thể xóa khóa học)
router.delete('/courses/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  const { id } = req.params;

  try {
    const courseRef = firestore.collection('courses').doc(id);
    await courseRef.delete();

    res.status(200).json({ message: 'Khóa học đã được xóa' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa khóa học', error });
  }
});

// GET /api/courses (Người dùng bình thường có thể xem danh sách khóa học)
router.get('/courses', verifyToken, checkRole(['user', 'admin']), async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const coursesRef = firestore.collection('courses')
      .orderBy('createdAt')
      .limit(parseInt(limit))
      .offset((page - 1) * limit);

    const snapshot = await coursesRef.get();
    const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách khóa học', error });
  }
});

// POST /api/courses/:id/lectures (Chỉ admin có thể thêm bài giảng)
router.post('/courses/:id/lectures', verifyToken, checkRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  try {
    const courseRef = firestore.collection('courses').doc(id);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      return res.status(404).json({ message: 'Khóa học không tồn tại' });
    }

    const lectureRef = firestore.collection('lectures').doc();
    await lectureRef.set({
      courseId: id,
      title,
      content,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ message: 'Bài giảng đã được thêm' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi thêm bài giảng', error });
  }
});

// POST /api/courses/:id/register (Người dùng đăng ký khóa học)
router.post('/courses/:id/register', verifyToken, checkRole(['user']), async (req, res) => {
  const { id } = req.params; // id của khóa học
  const userId = req.user.uid;

  try {
    const courseRef = firestore.collection('courses').doc(id);  
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      return res.status(404).json({ message: 'Khóa học không tồn tại' });
    }

    const registrationRef = firestore.collection('registrations').doc(`${userId}_${id}`);
    await registrationRef.set({
      userId,
      courseId: id,
      registeredAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ message: 'Đăng ký khóa học thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi đăng ký khóa học', error });
  }
});

// GET /api/courses/:id/lectures (Người dùng xem bài giảng trong khóa học đã đăng ký)
router.get('/courses/:id/lectures', verifyToken, checkRole(['user']), async (req, res) => {
  const { id } = req.params;

  try {
    const lecturesRef = firestore.collection('lectures').where('courseId', '==', id);
    const snapshot = await lecturesRef.get();
    const lectures = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json(lectures);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách bài giảng', error });
  }
});

// GET /api/courses/registered - Lấy danh sách khóa học mà người dùng đã đăng ký
router.get('/courses/registered', verifyToken, checkRole(['user', 'admin']), async (req, res) => {
  const userId = req.user.uid;

  try {
    // Lấy tất cả các bản ghi từ 'registrations' dựa trên userId
    const registrationRef = firestore.collection('registrations').where('userId', '==', userId);
    const snapshot = await registrationRef.get();

    if (snapshot.empty) {
      return res.status(404).json({ message: 'Người dùng chưa đăng ký khóa học nào.' });
    }

    // Lấy danh sách các khóa học mà người dùng đã đăng ký
    const registeredCourses = [];
    for (const doc of snapshot.docs) {
      const courseRef = firestore.collection('courses').doc(doc.data().courseId);
      const courseSnapshot = await courseRef.get();
      registeredCourses.push({ id: courseSnapshot.id, ...courseSnapshot.data() });
    }

    res.status(200).json(registeredCourses);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách khóa học đã đăng ký', error });
  }
});

module.exports = router;
