const { admin, firestore } = require("../config/FireBaseConfig");
const nodemailer = require("nodemailer");

// Cấu hình gửi email bằng Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Hàm gửi email thông báo
async function sendNotificationEmail(email, courseTitle) {
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: "Thông báo khóa học mới",
    text: `Khóa học mới "${courseTitle}" đã được thêm vào. Hãy kiểm tra ngay!`,
  };

  console.log('Đang gửi email tới:', email); // Log email được gửi đến
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email đã được gửi tới ${email}`); // Log khi email được gửi thành công
  } catch (error) {
    console.error("Lỗi khi gửi email:", error.message); // Log lỗi cụ thể
    console.error(error.stack); // Log toàn bộ lỗi để kiểm tra thêm
  }
}

// Hàm tạo khóa học mới và gửi email thông báo
exports.createCourse = async (req, res) => {
  const { title, description } = req.body;

  console.log('Bắt đầu tạo khóa học mới...'); // Log khi bắt đầu tạo khóa học
  try {
    // Thêm khóa học mới vào Firestore
    const courseRef = firestore.collection("courses").doc();
    await courseRef.set({
      title,
      description,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Khóa học đã được tạo:', title); // Log khi khóa học được tạo thành công

    // Lấy tất cả người dùng từ Firestore
    const usersSnapshot = await firestore.collection("users").get();
    const users = usersSnapshot.docs.map((doc) => doc.data());

    console.log('Danh sách người dùng:', users); // Log danh sách người dùng sau khi lấy từ Firestore

    // Gửi email thông báo cho từng người dùng
    for (const user of users) {
      if (user.email) {
        console.log("Gửi email tới:", user.email); // Thêm log này để kiểm tra
        await sendNotificationEmail(user.email, title);
      } else {
        console.log("Người dùng không có email:", user); // Log nếu người dùng không có email
      }
    }

    res.status(201).json({
      message: "Khóa học đã được tạo thành công và email đã được gửi!",
    });
  } catch (error) {
    console.error("Lỗi khi tạo khóa học hoặc gửi email:", error.message); // Log lỗi khi tạo khóa học hoặc gửi email
    res.status(500).json({ message: "Lỗi khi tạo khóa học hoặc gửi email", error });
  }
};

// Lấy danh sách khóa học (cả người dùng và admin đều có thể truy cập)

exports.getCourses = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const coursesRef = firestore
      .collection("courses")
      .orderBy("createdAt")
      .limit(parseInt(limit));

    const snapshot = await coursesRef.get();
    const courses = [];

    for (const doc of snapshot.docs) {
      const courseData = { id: doc.id, ...doc.data() };

      // Fetch lectures for each course
      const lecturesRef = firestore
        .collection("lectures")
        .where("courseId", "==", doc.id);
      const lecturesSnapshot = await lecturesRef.get();
      const lectures = lecturesSnapshot.docs.map((lectureDoc) => ({
        id: lectureDoc.id,
        ...lectureDoc.data(),
      }));

      courseData.lectures = lectures; // Add lectures to the course data
      courses.push(courseData);
    }

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách khóa học", error });
  }
};

// Cập nhật khóa học (chỉ admin có thể truy cập)
exports.updateCourse = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  try {
    const courseRef = firestore.collection("courses").doc(id);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      return res.status(404).json({ message: "Khóa học không tồn tại" });
    }

    // Cập nhật khóa học
    await courseRef.update({
      title,
      description,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ message: "Khóa học đã được cập nhật" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật khóa học", error });
  }
};
// Tìm kiếm khóa học theo tiêu đề
exports.searchCourses = async (req, res) => {
  const { search } = req.query; // Lấy từ khóa tìm kiếm từ query params
  try {
    const coursesRef = firestore
      .collection("courses")
      .where("title", ">=", search)
      .where("title", "<=", search + "\uf8ff"); // Tìm kiếm theo title

    const snapshot = await coursesRef.get();
    const courses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tìm kiếm khóa học", error });
  }
};

// Xóa khóa học (chỉ admin có thể truy cập)
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

// Thêm bài giảng (chỉ admin có thể truy cập)
exports.addLecture = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  try {
    const courseRef = firestore.collection("courses").doc(id);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      return res.status(404).json({ message: "Khóa học không tồn tại" });
    }

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

// Đăng ký khóa học (người dùng có thể truy cập)
exports.registerCourse = async (req, res) => {
  const { id } = req.params; // id của khóa học
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

// Lấy danh sách bài giảng của khóa học đã đăng ký (người dùng có thể truy cập)
exports.getCourseLectures = async (req, res) => {
  const { id } = req.params;

  try {
    const lecturesRef = firestore
      .collection("lectures")
      .where("courseId", "==", id);
    const snapshot = await lecturesRef.get();
    const lectures = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(lectures);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách bài giảng", error });
  }
};

// Lấy danh sách các khóa học mà người dùng đã đăng ký
exports.getRegisteredCourses = async (req, res) => {
  const userId = req.user.uid;

  try {
    const registrationRef = firestore
      .collection("registrations")
      .where("userId", "==", userId);
    const snapshot = await registrationRef.get();

    if (snapshot.empty) {
      return res
        .status(404)
        .json({ message: "Người dùng chưa đăng ký khóa học nào." });
    }

    const registeredCourses = [];
    for (const doc of snapshot.docs) {
      const courseRef = firestore
        .collection("courses")
        .doc(doc.data().courseId);
      const courseSnapshot = await courseRef.get();
      registeredCourses.push({
        id: courseSnapshot.id,
        ...courseSnapshot.data(),
      });
    }

    res.status(200).json(registeredCourses);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách khóa học đã đăng ký", error });
  }
};

// Cập nhật bài giảng (chỉ admin có thể truy cập)
exports.updateLecture = async (req, res) => {
  const { courseId, lectureId } = req.params;
  const { title, content } = req.body;

  try {
    const lectureRef = firestore.collection("lectures").doc(lectureId);
    const lectureDoc = await lectureRef.get();

    if (!lectureDoc.exists) {
      return res.status(404).json({ message: "Bài giảng không tồn tại" });
    }

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

// Xóa bài giảng (chỉ admin có thể truy cập)
exports.deleteLecture = async (req, res) => {
  const { courseId, lectureId } = req.params;

  try {
    const lectureRef = firestore.collection("lectures").doc(lectureId);
    const lectureDoc = await lectureRef.get();

    if (!lectureDoc.exists) {
      return res.status(404).json({ message: "Bài giảng không tồn tại" });
    }

    await lectureRef.delete();

    res.status(200).json({ message: "Bài giảng đã được xóa" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa bài giảng", error });
  }
};
