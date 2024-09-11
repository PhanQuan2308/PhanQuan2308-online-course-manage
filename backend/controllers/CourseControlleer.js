const { firestore, admin } = require("../config/firebase");

// Tạo khóa học - chỉ Admin
exports.getCourses = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const coursesRef = firestore
      .collection("courses")
      .orderBy("createdAt")
      .limit(parseInt(limit))
      .offset((page - 1) * limit);
    const snapshot = await coursesRef.get();
    const courses = [];

    for (const doc of snapshot.docs) {
      const course = { id: doc.id, ...doc.data() };

      // Lấy danh sách bài giảng theo courseId
      const lecturesRef = firestore
        .collection("lectures")
        .where("courseId", "==", doc.id);
      const lecturesSnapshot = await lecturesRef.get();

      if (!lecturesSnapshot.empty) {
        const lectures = lecturesSnapshot.docs.map((lecture) => ({
          id: lecture.id,
          ...lecture.data(),
        }));

        // Thêm bài giảng vào khóa học nếu có
        course.lectures = lectures;
      } else {
        // Nếu không có bài giảng thì set lectures là một mảng trống
        course.lectures = [];
      }
      
      courses.push(course);
    }

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách khóa học và bài giảng", error });
  }
};



// Cập nhật khóa học - chỉ Admin
exports.updateCourse = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  try {
    const courseRef = firestore.collection("courses").doc(id);
    await courseRef.update({ title, description });
    res.status(200).json({ message: "Khóa học đã được cập nhật" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật khóa học", error });
  }
};

// Xóa khóa học - chỉ Admin
exports.deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const courseRef = firestore.collection("courses").doc(id);
    await courseRef.delete();
    res.status(200).json({ message: "Khóa học đã được xóa" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa khóa học", error });
  }
};

// Lấy danh sách khóa học - Người dùng có thể xem
exports.getCourses = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const coursesRef = firestore
      .collection("courses")
      .orderBy("createdAt")
      .limit(parseInt(limit))
      .offset((page - 1) * limit);
    const snapshot = await coursesRef.get();
    const courses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách khóa học", error });
  }
};

// Tìm kiếm khóa học - Người dùng có thể tìm kiếm
exports.searchCourses = async (req, res) => {
  const { search } = req.query;
  try {
    const coursesRef = firestore
      .collection("courses")
      .where("title", ">=", search)
      .where("title", "<=", search + "\uf8ff");
    const snapshot = await coursesRef.get();
    const courses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tìm kiếm khóa học", error });
  }
};

// Đăng ký khóa học - Người dùng
exports.registerCourse = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.uid;
  try {
    const courseRef = firestore.collection("courses").doc(id);
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) {
      return res.status(404).json({ message: "Khóa học không tồn tại" });
    }
    const registrationRef = firestore
      .collection("registrations")
      .doc(`${userId}_${id}`);
    await registrationRef.set({
      userId,
      courseId: id,
      registeredAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).json({ message: "Đăng ký khóa học thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi đăng ký khóa học", error });
  }
};

// Lấy chi tiết khóa học - Người dùng đã đăng ký
exports.getCourseDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const courseRef = firestore.collection("courses").doc(id);
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) {
      return res.status(404).json({ message: "Khóa học không tồn tại" });
    }
    res.status(200).json({ id: courseDoc.id, ...courseDoc.data() });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy thông tin khóa học", error });
  }
};

// Thêm bài giảng vào khóa học - Chỉ Admin
exports.addLecture = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    // Kiểm tra xem khóa học có tồn tại không
    const courseRef = firestore.collection("courses").doc(id);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      return res.status(404).json({ message: "Khóa học không tồn tại" });
    }

    // Nếu tồn tại, tạo bài giảng mới
    const lectureRef = firestore.collection("lectures").doc();
    await lectureRef.set({
      courseId: id,
      title,
      content,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).json({ message: "Bài giảng đã được thêm" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm bài giảng", error });
  }
};

// Lấy danh sách bài giảng của khóa học - Người dùng đã đăng ký
// Lấy danh sách khóa học - Người dùng có thể xem
exports.getCourses = async (req, res) => {
  const { page = 1, limit = 10, lastCourseId = null } = req.query;
  try {
    let query = firestore
      .collection("courses")
      .orderBy("createdAt")
      .limit(parseInt(limit));

    // Nếu có lastCourseId, sử dụng để thực hiện pagination
    if (lastCourseId) {
      const lastCourseRef = firestore.collection("courses").doc(lastCourseId);
      const lastCourseSnapshot = await lastCourseRef.get();
      if (lastCourseSnapshot.exists) {
        query = query.startAfter(lastCourseSnapshot);
      }
    }

    const snapshot = await query.get();
    const courses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách khóa học", error });
  }
};

// PUT /api/courses/:courseId/lectures/:lectureId (Chỉ admin có thể sửa bài giảng)
exports.updateLecture = async (req, res) => {
  const { courseId, lectureId } = req.params;
  const { title, content } = req.body;

  try {
    // Kiểm tra xem bài giảng có tồn tại không
    const lectureRef = firestore.collection("lectures").doc(lectureId);
    const lectureDoc = await lectureRef.get();

    if (!lectureDoc.exists) {
      return res.status(404).json({ message: "Bài giảng không tồn tại" });
    }

    // Cập nhật bài giảng
    await lectureRef.update({
      title,
      content,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ message: "Bài giảng đã được cập nhật" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật bài giảng", error });
  }
};


// DELETE /api/courses/:courseId/lectures/:lectureId (Chỉ admin có thể xóa bài giảng)
exports.deleteLecture = async (req, res) => {
  const { courseId, lectureId } = req.params;

  try {
    // Kiểm tra xem bài giảng có tồn tại không
    const lectureRef = firestore.collection("lectures").doc(lectureId);
    const lectureDoc = await lectureRef.get();

    if (!lectureDoc.exists) {
      return res.status(404).json({ message: "Bài giảng không tồn tại" });
    }

    // Xóa bài giảng
    await lectureRef.delete();

    res.status(200).json({ message: "Bài giảng đã được xóa" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa bài giảng", error });
  }
};


// Lấy danh sách khóa học kèm theo bài giảng
