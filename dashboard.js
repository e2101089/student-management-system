document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return window.location.href = 'index.html';
  
    // Load fake notifications
    const notiList = document.getElementById('notificationList');
    notiList.innerHTML = `<li>Welcome back, ${user.username}</li>`;
  });
  
  function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  }
  