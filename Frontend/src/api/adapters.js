export const unwrap = (payload) => payload?.data ?? payload;

export const wrapData = (payload) => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload;
  }
  return { data: payload };
};

export const getId = (item) =>
  item?._id || item?.id || item?.courseId || item?.categoryId || item?.userId;

export const normalizeUser = (user = {}) => ({
  ...user,
  id: user.id || user._id || user.userId,
  userId: user.userId || user.id || user._id,
  fullName: user.fullName || user.name || user.username || "User",
  roles: Array.isArray(user.roles) ? user.roles : [user.role || "Student"],
});

export const normalizeCategory = (category = {}) => ({
  ...category,
  id: category.id || category._id || category.categoryId,
  categoryId: category.categoryId || category.id || category._id,
  categoryName: category.categoryName || category.name,
});

export const normalizeCourse = (course = {}) => {
  const instructor = course.instructorId || course.instructor || {};
  const category = course.categoryId || course.category || {};
  const status = course.status || (course.isApproved ? "Approved" : "Pending");
  const contents = (course.contents || []).map((content) => ({
    ...content,
    id: content.id || content._id || content.lessonId,
    lessonId: content.lessonId || content.id || content._id,
    sectionId: content.sectionId?._id || content.sectionId?.id || content.sectionId,
    lessonType:
      content.lessonType ||
      (content.contentType === "Lesson" || content.type === "Lesson"
        ? "Video"
        : content.contentType || content.type),
    mediaUrl: content.mediaUrl || content.videoUrl || content.fileUrl,
    durationInMinutes: content.durationInMinutes || content.duration,
  }));
  const sections = (course.sections || []).map((section) => {
    const sectionId = section.sectionId || section.id || section._id;
    return {
      ...section,
      id: sectionId,
      sectionId,
      lessons:
        section.lessons ||
        contents.filter(
          (content) => String(content.sectionId || "") === String(sectionId),
        ),
    };
  });

  return {
    ...course,
    id: course.id || course._id || course.courseId,
    courseId: course.courseId || course.id || course._id,
    instructorId: instructor?._id || instructor?.id || course.instructorId,
    instructorName:
      course.instructorName || instructor?.name || instructor?.fullName || "Instructor",
    categoryId: category?._id || category?.id || course.categoryId,
    categoryName: course.categoryName || category?.name || "General",
    imgPath: course.imgPath || course.imagePath || course.thumbnail,
    imagePath: course.imagePath || course.imgPath || course.thumbnail,
    isApproved: course.isApproved ?? status === "Approved",
    status,
    isFree: course.isFree ?? Number(course.price || 0) === 0,
    contents,
    sections,
    enrollments: course.enrollments || [],
    reviews: course.reviews || [],
  };
};

export const normalizeEnrollment = (enrollment = {}) => {
  const student = enrollment.studentId || enrollment.student || {};
  const course = enrollment.courseId || enrollment.course || {};

  return {
    ...enrollment,
    id: enrollment.id || enrollment._id || enrollment.enrollmentId,
    enrollmentId: enrollment.enrollmentId || enrollment.id || enrollment._id,
    studentId: student?._id || student?.id || enrollment.studentId,
    studentName: enrollment.studentName || student?.name || student?.fullName,
    studentEmail: enrollment.studentEmail || student?.email,
    courseId: course?._id || course?.id || enrollment.courseId,
    courseTitle: enrollment.courseTitle || course?.title,
    course: normalizeCourse(course),
  };
};

export const normalizeExam = (exam = {}) => ({
  ...exam,
  id: exam.id || exam._id || exam.examId,
  examId: exam.examId || exam.id || exam._id,
  courseId: exam.courseId?._id || exam.courseId?.id || exam.courseId,
  courseTitle: exam.courseTitle || exam.courseId?.title || exam.course?.title,
  durationInMinutes: exam.durationInMinutes || exam.duration || 30,
  questions: (exam.questions || []).map((question, index) => {
    const options = question.options || [];
    return {
      ...question,
      questionId: question.questionId || question._id || question.id,
      questionText: question.questionText || question.text || "",
      questionType:
        question.questionType ||
        (question.type === "Multiple Choice" ? "MCQ" : question.type) ||
        "MCQ",
      marks: question.marks || 1,
      order: question.order || index + 1,
      options: options.map((option) =>
        typeof option === "string"
          ? {
              answerOptionId: option,
              optionText: option,
              isCorrect: option === question.correctAnswer,
            }
          : {
              ...option,
              answerOptionId:
                option.answerOptionId || option.id || option._id || option.optionText,
            },
      ),
    };
  }),
});

export const normalizeResult = (result = {}) => ({
  ...result,
  id: result.id || result._id || result.examResultId,
  examResultId: result.examResultId || result.id || result._id,
  studentId: result.studentId?._id || result.studentId?.id || result.studentId,
  studentName:
    result.studentName || result.studentId?.name || result.studentId?.fullName,
  examId: result.examId?._id || result.examId?.id || result.examId,
  examTitle: result.examTitle || result.examId?.title,
  courseId: result.courseId?._id || result.courseId?.id || result.courseId,
  courseTitle: result.courseTitle || result.courseId?.title,
  score: result.percentage ?? result.score,
});

export const normalizeList = (payload, normalizer) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return { data: data.map(normalizer) };
  if (Array.isArray(data?.items)) {
    return { ...data, data: data.items.map(normalizer) };
  }
  return wrapData(data);
};
