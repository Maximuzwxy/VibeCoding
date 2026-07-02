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

// ========== Folder Navigation ==========

// Click on a folder item
document.getElementById('fileListContainer')?.addEventListener('click', (e) => {
    const nameSpan = e.target.closest('.item-name');
    if (!nameSpan) return;
    const isDir = nameSpan.dataset.isdir === 'true';
    if (!isDir) return;

    const folderName = nameSpan.dataset.path;
    const newPath = currentSubPath ? `${currentSubPath}/${folderName}` : folderName;
    navigateTo(newPath);
});

// Back button
document.getElementById('backBtn')?.addEventListener('click', () => {
    // Go up one level
    const parts = currentSubPath.split('/');
    parts.pop();
    const newPath = parts.join('/');
    navigateTo(newPath);
});

// Breadcrumb click
document.getElementById('breadcrumb')?.addEventListener('click', (e) => {
    const crumb = e.target.closest('.breadcrumb-item');
    if (!crumb) return;
    const path = crumb.dataset.path;
    navigateTo(path);
});

function navigateTo(subpath) {
    currentSubPath = subpath;
    const container = document.getElementById('fileListContainer');
    const backBtn = document.getElementById('backBtn');
    const downloadAllBtn = document.getElementById('downloadAllBtn');

    container.innerHTML = '<p class="loading">Loading...</p>';

    fetch(`/api/browse?path=${encodeURIComponent(subpath)}`)
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                container.innerHTML = `<p class="empty-files">${data.error}</p>`;
                return;
            }
            renderFileList(data.items, data.path);
            updateBreadcrumb(data.path);
            backBtn.style.display = subpath ? 'block' : 'none';
            downloadAllBtn.href = `/download_all?path=${encodeURIComponent(subpath)}`;
        })
        .catch(() => {
            container.innerHTML = '<p class="empty-files">Load failed</p>';
        });
}

function renderFileList(items, subpath) {
    const container = document.getElementById('fileListContainer');
    if (!items || items.length === 0) {
        container.innerHTML = '<p class="empty-files">Empty folder</p>';
        return;
    }

    container.innerHTML = items.map(item => {
        if (item.is_dir) {
            const folderPath = subpath ? `${subpath}/${item.name}` : item.name;
            return `
                <div class="file-item folder-item">
                    <span class="item-name" data-path="${folderPath}" data-isdir="true">📁 ${item.name}</span>
                </div>`;
        } else {
            const downloadPath = subpath ? `${subpath}/${item.name}` : item.name;
            return `
                <div class="file-item">
                    <span class="item-name">${item.name}</span>
                    <a href="/download/${encodeURIComponent(downloadPath)}" class="download-btn">⬇️</a>
                </div>`;
        }
    }).join('');
}

function updateBreadcrumb(subpath) {
    const breadcrumb = document.getElementById('breadcrumb');
    let html = `<span class="breadcrumb-item breadcrumb-root" data-path="">${baseFolder}</span>`;

    if (subpath) {
        const parts = subpath.split('/');
        let accumulated = '';
        for (const part of parts) {
            accumulated = accumulated ? `${accumulated}/${part}` : part;
            html += ` <span class="breadcrumb-sep">/</span> <span class="breadcrumb-item" data-path="${accumulated}">${part}</span>`;
        }
    }

    breadcrumb.innerHTML = html;
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
