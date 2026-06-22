const API = {
    async get(url) {
        const res = await fetch(url, {credentials: 'same-origin'});
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '请求失败');
        return data;
    },
    
    async post(url, body) {
        const res = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body),
            credentials: 'same-origin'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '请求失败');
        return data;
    },
    
    async put(url, body) {
        const res = await fetch(url, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body),
            credentials: 'same-origin'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '请求失败');
        return data;
    },
    
    async del(url) {
        const res = await fetch(url, {
            method: 'DELETE',
            credentials: 'same-origin'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '请求失败');
        return data;
    },
    
    async upload(url, formData) {
        const res = await fetch(url, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '请求失败');
        return data;
    },
    
    async getFriends() {
        return this.get('/api/friends');
    },
    
    async getFriendRequests() {
        return this.get('/api/friends/requests');
    },
    
    async sendFriendRequest(to) {
        return this.post('/api/friends/requests', {to});
    },
    
    async handleFriendRequest(requestId, action) {
        return this.put(`/api/friends/requests/${requestId}`, {action});
    },
    
    async removeFriend(username) {
        return this.del(`/api/friends/${username}`);
    },
    
    async searchUsers(query) {
        return this.get(`/api/users/search?q=${encodeURIComponent(query)}`);
    },
    
    async updateProfile(data) {
        return this.put('/api/users/profile', data);
    },
    
    async updatePassword(currentPassword, newPassword, confirmPassword) {
        return this.put('/api/users/password', {
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword
        });
    },
    
    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);
        return this.upload('/api/users/upload-avatar', formData);
    },
    
    async getConversations() {
        return this.get('/api/messages/conversations');
    },

    async getMessages(username) {
        return this.get(`/api/messages/${username}`);
    },

    async sendMessage(to, content) {
        return this.post('/api/messages/send', {to, content});
    },

    async getPosts() {
        return this.get('/api/posts');
    },

    async getMyPosts() {
        return this.get('/api/posts/mine');
    },

    async createPost(content, images) {
        const formData = new FormData();
        formData.append('content', content);
        if (images) {
            for (let i = 0; i < images.length; i++) {
                formData.append('images', images[i]);
            }
        }
        return this.upload('/api/posts', formData);
    },

    async deletePost(postId) {
        return this.del(`/api/posts/${postId}`);
    },

    async likePost(postId) {
        return this.post(`/api/posts/${postId}/like`, {});
    },

    async unlikePost(postId) {
        return this.del(`/api/posts/${postId}/like`);
    },

    async addComment(postId, content) {
        return this.post(`/api/posts/${postId}/comments`, {content});
    },

    async deleteComment(postId, commentId) {
        return this.del(`/api/posts/${postId}/comments/${commentId}`);
    }
};
