// Đảm bảo trang đã được tải xong trước khi thực hiện các thao tác
document.addEventListener('DOMContentLoaded', async () => {
  const teacherId = 1; // Giả sử teacherId của bạn là 1. Bạn có thể lấy ID từ session hoặc login.

  // Gọi API để lấy danh sách khóa học của giáo viên
  try {
    const coursesRes = await fetch(`http://localhost:5000/api/courses?teacher_id=${teacherId}`);
    if (!coursesRes.ok) {
      throw new Error('Failed to fetch courses');
    }
    const courses = await coursesRes.json();

    // Hiển thị danh sách khóa học
    const courseList = document.getElementById('courseList');
    if (courses.length > 0) {
      courses.forEach(course => {
        const listItem = document.createElement('li');
        listItem.textContent = `Course: ${course.name}`;
        courseList.appendChild(listItem);
      });
    } else {
      const noCoursesMessage = document.createElement('li');
      noCoursesMessage.textContent = 'No courses found';
      courseList.appendChild(noCoursesMessage);
    }

    // Gọi API để lấy thông báo cho giáo viên
    const notificationsRes = await fetch(`http://localhost:5000/api/notifications?teacher_id=${teacherId}`);
    if (!notificationsRes.ok) {
      throw new Error('Failed to fetch notifications');
    }
    const notifications = await notificationsRes.json();

    // Hiển thị các thông báo
    const notificationList = document.getElementById('notificationList');
    if (notifications.length > 0) {
      notifications.forEach(notification => {
        const listItem = document.createElement('li');
        listItem.textContent = notification.message;
        notificationList.appendChild(listItem);
      });
    } else {
      const noNotificationsMessage = document.createElement('li');
      noNotificationsMessage.textContent = 'No new notifications';
      notificationList.appendChild(noNotificationsMessage);
    }
  } catch (error) {
    console.error('Error loading data:', error);
    alert('Error loading data. Please try again later.');
  }
});

// Hàm đăng xuất
function logout() {
  window.location.href = '/index.html'; // Chuyển hướng về trang login
}
