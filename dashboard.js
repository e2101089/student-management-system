// Đảm bảo trang đã được tải xong trước khi thực hiện các thao tác
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Lấy ID của giáo viên từ localStorage hoặc một biến toàn cục
    const teacherId = JSON.parse(localStorage.getItem('user'))?.id;

    if (!teacherId) {
      throw new Error('Teacher ID is not available');
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
  localStorage.removeItem('user'); // Xóa thông tin người dùng khỏi localStorage
  window.location.href = '/index.html'; // Chuyển hướng về trang login
}
