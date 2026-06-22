// Only needed for admin
document.getElementById('settingBtn')?.addEventListener('click', () => {
    document.getElementById('modal').style.display = 'block';
});

document.querySelector('.close')?.addEventListener('click', () => {
    document.getElementById('modal').style.display = 'none';
});

document.querySelector('.users-close')?.addEventListener('click', () => {
    document.getElementById('usersModal').style.display = 'none';
});

// Users modal button
document.getElementById('usersBtn')?.addEventListener('click', () => {
    document.getElementById('usersModal').style.display = 'block';
    loadUsers();
});

window.onclick = (event) => {
    const modal = document.getElementById('modal');
    const usersModal = document.getElementById('usersModal');
    if (modal && event.target === modal) {
        modal.style.display = 'none';
    }
    if (usersModal && event.target === usersModal) {
        usersModal.style.display = 'none';
    }
};

function loadUsers() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;

    usersList.innerHTML = '<p class="loading">Loading...</p>';

    fetch('/api/users/today')
        .then(res => res.json())
        .then(users => {
            if (users.length === 0) {
                usersList.innerHTML = '<p class="empty-users">No logins today</p>';
                return;
            }

            usersList.innerHTML = users.map(user => `
                <div class="user-item">
                    <span class="user-name">${user.nickname}</span>
                    <span class="user-ip">${user.ip}</span>
                </div>
            `).join('');
        })
        .catch(() => {
            usersList.innerHTML = '<p class="empty-users">Load failed</p>';
        });
}

document.getElementById('saveFolderBtn')?.addEventListener('click', () => {
    const folder = document.getElementById('folderInput').value.trim();
    if (!folder) {
        showError("Folder name cannot be empty");
        return;
    }

    fetch('/set_folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_name: folder })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            showError(data.error || "Failed to set folder");
        }
    })
    .catch(() => {
        showError("Request failed");
    });
});

function showError(msg) {
    const el = document.getElementById('errorMsg');
    if (el) {
        el.textContent = msg;
        if (el.timeoutId) {
            clearTimeout(el.timeoutId);
        }
        el.timeoutId = setTimeout(() => {
            el.textContent = '';
        }, 3000);
    }
}

// Upload logic (unchanged)
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#4fc3f7';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#1a3d5c';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#1a3d5c';
        if (e.dataTransfer.files.length) {
            uploadFiles(e.dataTransfer.files);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            uploadFiles(fileInput.files);
        }
    });
}

function uploadFiles(files) {
    const formData = new FormData();
    for (let file of files) {
        formData.append('file', file);
    }

    fetch(`/upload/${nickname}`, {
        method: 'POST',
        body: formData
    })
    .then(res => {
        if (res.ok) {
            alert('Upload successful!');
            fileInput.value = '';
        } else {
            alert('Upload failed');
        }
    })
    .catch(() => alert('Upload error'));
}