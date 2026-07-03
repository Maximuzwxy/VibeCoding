# Social Network App - Requirements Specification

---

## ⚠️ Important: UI Style Selection

**UI style must be determined before development starts. Once selected, it must be strictly and consistently applied.**

> See detailed style descriptions and selection process in: **Phase Zero: UI Style Selection**

---

## 1. Project Overview

### 1.1 Project Name
**Social** - A Simple Social Networking Application

### 1.2 Project Goals
Implement a web application with basic social networking features, including user accounts, friend management, instant messaging, and post publishing.

### 1.3 Use Cases
- Demo / educational purposes
- Learning full-stack web development from scratch
- Demonstrating AI-assisted programming workflow

### 1.4 Technology Stack

| Layer | Technology | Description |
|------|------|------|
| Frontend | HTML + CSS + Vanilla JavaScript | No frameworks, easy to learn |
| Backend | Flask (Python) | Lightweight web framework |
| Real-time | WebSocket (SocketIO) | Instant messaging |
| Database | JSON files | Lightweight data storage |
| Responsive | CSS Media Queries | Mobile / desktop adaptation |

### 1.5 Project Structure

```text
social/
├── app.py                # Flask main app (backend entry)
├── requirements.txt      # Python dependencies
├── data/                 # JSON data directory
│   ├── users.json        # Users table
│   ├── friendships.json  # Friendship table
│   ├── messages.json     # Messages table
│   └── posts.json        # Posts table
├── templates/             # HTML templates
│   ├── login.html        # Login page
│   ├── register.html      # Registration page
│   ├── index.html         # Home page (navigation container)
│   ├── contacts.html      # Contacts page
│   ├── chat.html          # Chat detail page
│   ├── friendscircle.html # Feed / Timeline page
│   ├── profile.html       # Profile page
│   ├── settings.html      # Settings page
│   ├── admin.html         # Admin panel
│   └── base.html          # Base template
├── static/               # Static assets
│   ├── css/
│   │   └── style.css     # Global styles
│   └── js/
│       ├── api.js        # API wrapper
│       ├── app.js        # Main app logic
│       └── auth.js       # Auth related
├── uploads/              # User uploads
│   └── posts/           # Post images
└── scripts/
    └── init_data.py     # Data init script
```

### 1.6 Database Design

#### users.json - Users Table
```json
[
    {
      "id": "uuid",
      "username": "zhang_san",
      "password": "password",
      "avatar": "url or base64",
      "bio": "Bio",
      "created_at": "ISO time",
      "last_login": "ISO time"
    }
  ]
```

#### friendships.json - Friendship Table
```json
[
    {
      "id": "uuid",
      "from": "User A",
      "to": "User B",
      "status": "pending | accepted | rejected",
      "created_at": "ISO time"
    }
  ]
```

#### messages.json - Messages Table
```json
[
    {
      "id": "uuid",
      "from": "Sender",
      "to": "Receiver",
      "content": "Message content",
      "created_at": "ISO time"
    }
  ]
}
```

#### posts.json - Posts Table
```json
[
    {
      "id": "uuid",
      "username": "Author",
      "avatar": "Author avatar URL",
      "content": "Text content",
      "images": ["Image URL list"],
      "likes": ["Liked usernames list"],
      "comments": [
        {
          "id": "uuid",
          "username": "Commenter",
          "avatar": "Commenter avatar URL",
          "content": "Comment content",
          "created_at": "ISO time"
        }
      ],
      "created_at": "ISO time"
    }
  ]
}
```

### 1.7 Preset Data

#### Default Avatar
New users use Cravatar-generated cartoon avatars:
```
https://cravatar.cn/avatar/{md5_hash}?d=monsterid&s=200
```

#### Preset Users (11, for friendship testing)
| Username | Password | Avatar | Bio |
|--------|------|------|------|
| maximuz | 111111 | Cravatar (robohash) | A lazy person with nothing to say |
| luna_star | 111111 | Cravatar (monsterid) | Star-gazing traveler |
| cloud_walker | 111111 | Cravatar (robohash) | Drifting through clouds |
| pixel_dreamer | 111111 | Cravatar (monsterid) | Weaving dreams with pixels |
| echo_valley | 111111 | Cravatar (robohash) | Echoes in the valley |
| neon_pulse | 111111 | Cravatar (wavatar) | Neon pulses, heartbeats in sync |
| forest_whisper | 111111 | Cravatar (monsterid) | Forest whispers, everything grows |
| ocean_drift | 111111 | Cravatar (monsterid) | Drifting with the current |
| solar_flare | 111111 | Cravatar (wavatar) | Solar flare, bursting energy |
| midnight_owl | 111111 | Cravatar (robohash) | Midnight owl, endless thoughts |
| crystal_rain | 111111 | Cravatar (monsterid) | Crystal raindrops |

#### Preset Posts (each with comments)
| Author | Content | Image | Comments |
|--------|------|------|------|
| luna_star | Beautiful day for photography! | picsum.photos/800/400?random=1 | cloud_walker: Great shot!<br>echo_valley: Where is this? |
| cloud_walker | New album just dropped! | picsum.photos/800/400?random=2 | pixel_dreamer: On repeat!<br>neon_pulse: My favorite song |
| echo_valley | Travel diary - Stop #100 | picsum.photos/800/400?random=3 | luna_star: So jealous!<br>forest_whisper: Beautiful place |
| pixel_dreamer | How to make pixel art | picsum.photos/800/400?random=4 | ocean_drift: Interesting!<br>midnight_owl: Trying this tomorrow |
| neon_pulse | Finished "One Hundred Years of Solitude" | picsum.photos/800/400?random=5 | solar_flare: A classic<br>crystal_rain: What did you think? |

#### Data Init Script (scripts/init_data.py)
```python
import json
import uuid
from datetime import datetime

DATA_DIR = 'data'
USERS_FILE = f'{DATA_DIR}/users.json'
FRIENDSHIPS_FILE = f'{DATA_DIR}/friendships.json'

users = [
    {
        'id': 'f7a80c84-c4c6-488b-8809-f76e67065fed',
        'username': 'maximuz',
        'password': '111111',
        'avatar': 'https://cravatar.cn/avatar/327caf04e9fc21a465...?d=robohash&s=200',
        'bio': 'A lazy person with nothing to say',
        'created_at': '2026-05-10T08:52:53.952023'
    },
    {
        'id': str(uuid.uuid4()),
        'username': 'luna_star',
        'password': '111111',
        'avatar': 'https://cravatar.cn/avatar/ba8a48b0...?d=monsterid&s=200',
        'bio': 'Star-gazing traveler',
        'created_at': '2026-05-09T10:00:00'
    },
    # ... cloud_walker, pixel_dreamer, echo_valley, neon_pulse,
    #     forest_whisper, ocean_drift, solar_flare, midnight_owl, crystal_rain
]

friendships = []
for i in range(1, len(users)):
    friendships.append({
        'id': str(uuid.uuid4()),
        'user1': 'maximuz',
        'user2': users[i]['username'],
        'status': 'accepted',
        'created_at': datetime.utcnow().isoformat()
    })

with open(USERS_FILE, 'w', encoding='utf-8') as f:
    json.dump(users, f, ensure_ascii=False, indent=2)

with open(FRIENDSHIPS_FILE, 'w', encoding='utf-8') as f:
    json.dump(friendships, f, ensure_ascii=False, indent=2)
```

#### Avatar Resource Notes
- **Default avatar**: Cravatar API (free, no auth required)
  - URL: `https://cravatar.cn/avatar/{md5_hash}?d=monsterid&s=200`
- **Sample images**: Lorem Picsum (free, no auth required)
  - URL: `https://picsum.photos/800/400?random={n}`

#### Preset Data Purpose
1. **Easy dev testing**: See the full effect without manually creating data
2. **Friendship demo**: New users automatically get 11 preset friends after registration
3. **Post feed demo**: Preset posts include images, likes, and comments
4. **UI preview**: See avatars, text+image layouts, etc.

### 1.8 Testing Standards

#### Importance
- **All features must include test code**. Features must pass tests before delivery.
- Do not deliver code without tests.
- After completing each phase, run automated tests to verify.

#### Test Types & Frameworks

| Type | Description | Framework |
|------|------|----------|
| API Testing | Verify backend endpoint correctness | pytest |
| UI Testing | Verify frontend page functionality | pytest + Playwright |

#### Dependency Installation

```bash
# API test dependencies
pip install pytest

# UI test dependencies
pip install pytest pytest-playwright
playwright install chromium
```

#### Test File Structure

```text
tests/
├── api/                  # API tests
│   ├── __init__.py
│   ├── test_auth.py      # Auth endpoint tests
│   ├── test_friends.py   # Friends endpoint tests
│   ├── test_messages.py  # Messages endpoint tests
│   └── test_posts.py     # Posts endpoint tests
├── ui/                   # UI tests
│   ├── __init__.py
│   ├── test_login.py     # Login page tests
│   ├── test_contacts.py  # Contacts page tests
│   └── test_chat.py      # Chat page tests
├── conftest.py           # Shared fixtures
└── run_all_tests.py      # All-test runner
```

#### Testing Framework Notes

**pytest**: Python unit testing framework
- For backend API testing
- Supports parameterized tests, fixtures and other advanced features

**Playwright**: End-to-end testing framework
- For frontend UI testing (browser automation)
- Headless mode:
  - `headless=True`: Browser runs in background, invisible
  - `headless=False`: Browser visible, for development debugging

#### API Test Example

```python
# tests/api/test_auth.py
import pytest

def test_register_success(client):
    """Test successful registration"""
    response = client.post('/api/auth/register', json={
        'username': 'test_user',
        'password': 'password123'
    })
    assert response.status_code == 200
    assert response.json['username'] == 'test_user'

def test_login_success(client):
    """Test successful login"""
    response = client.post('/api/auth/login', json={
        'username': 'test_user',
        'password': 'password123'
    })
    assert response.status_code == 200
    assert 'token' in response.json
```

#### UI Test Example

```python
# tests/ui/test_login.py
import pytest

def test_login_page_loads(page):
    """Test login page loads correctly"""
    page.goto('/login')
    assert page.locator('input[type="text"]').is_visible()
    assert page.locator('input[type="password"]').is_visible()
    assert page.locator('button[type="submit"]').is_visible()

def test_login_success(page):
    """Test successful login"""
    page.goto('/login')
    page.fill('input[type="text"]', 'test_user')
    page.fill('input[type="password"]', 'password123')
    page.click('button[type="submit"]')
    # Verify redirect to home
    assert '/settings' in page.url or '/contacts' in page.url
```

#### Running Tests

```bash
# Start server (required before UI tests)
python app.py

# Run all tests
pytest tests/

# Run API tests only
pytest tests/api/

# Run UI tests only
pytest tests/ui/

# Run UI tests in headed mode (for debugging)
pytest tests/ui/ --headed
```

#### Test Completion Criteria
- [ ] API tests cover all backend endpoints
- [ ] UI tests cover key frontend page functionality
- [ ] All tests pass before feature delivery

---

## 2. Phased Implementation Plan

This project is implemented in 6 phases. Each phase must be completed independently before moving to the next.

---

## Phase Zero: UI Style Selection

### Goal
Determine the project's overall UI style to lay the foundation for subsequent development.

### Steps
1. **Review styles**: Read the 6 UI style specifications below
2. **Choose a style**: Select 1 style from the following

| Style # | Style Name | Characteristics |
|----------|----------|------|
| UI-1 | Modern Minimalist | Business style, subtle shadows |
| UI-2 | Glassmorphism | Frosted glass effect, gradient backgrounds |
| UI-3 | Dark Minimal | Dark theme, neon accents |
| UI-4 | Flat Design | No shadows, solid color blocks |
| UI-5 | Gradient Colorful | Rainbow gradients, rich animations |
| UI-6 | Vintage Print | Serif fonts, warm tones |

3. **Confirm selection**: Mark the chosen style at the top of this document (e.g., Currently selected: **UI-1 Modern Minimalist**)
4. **Follow-up development**: All page development follows the chosen style's CSS spec

### Phase Zero Completion Criteria
- [ ] User has reviewed all 6 UI style specifications
- [ ] User has selected a definitive project UI style
- [ ] Selected style marked at the top of steps.md (e.g., `Currently selected: UI-1 Modern Minimalist`)

---

## Phase One: Login, Registration & Profile Settings

### Goal
Implement user registration, login, and profile settings.

### Pages

| Page | File | Description |
|------|------|------|
| Login | login.html | User login |
| Register | register.html | User registration |
| Settings | settings.html | Profile management |

### Page Design Details

#### Login Page (login.html)
- Username input
- Password input
- "Login" button
- "No account? Register" link
- Redirect to settings page on success

#### Registration Page (register.html)
- Username input
- Password input
- Confirm password input
- "Register" button
- "Already have an account? Login" link
- Auto-login and redirect to settings page on success

#### Settings Page (settings.html)
- Left sidebar: avatar + username + nav menu (Messages, Contacts, Discover, Settings)
- Right content area:
  - Avatar display + change avatar button
  - Username (read-only, cannot be changed)
  - Bio (max 100 characters) + character counter
  - Change password (current password + new password + confirm new password)
  - Save button
  - Logout button

### Feature Design Details

#### User Registration
- **Input**: Username, password, confirm password
- **Username validation**:
  ```
  ^[a-zA-Z_][a-zA-Z0-9_]{3,15}$
  ```
  - Length: 4-16 characters
  - Characters: letters, digits, underscores
  - Cannot start with a digit
- **Password validation**: At least 6 characters
- **Validation**: Both passwords must match
- **Response**: Return user info, auto-login

#### User Login
- **Input**: Username, password
- **Response**: Return user info on success
- **Error messages**: User not found / Wrong password

#### Profile Management
- **Change avatar**: Select local image, max 5MB
- **Edit bio**: Max 100 characters
- **Change password**: Must verify current password, new password min 6 chars, must match confirmation
- **Logout**: Clear login state, return to login page

### API Design

| Method | Path | Description |
|------|------|------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Get current user info |
| PUT | /api/users/profile | Update profile (avatar, bio) |
| PUT | /api/users/password | Change password |
| POST | /api/users/upload-avatar | Upload avatar file |

### Phase One Completion Criteria
- [ ] Users can register an account
- [ ] Users can log in
- [ ] Users can view and edit their avatar and bio
- [ ] Users can change password
- [ ] Users can log out

---

## Phase Two: Contacts & Friend Management

### Goal
Implement contacts page, user search, add friends, and manage friend requests.

### Pages

| Page | File | Description |
|------|------|------|
| Contacts | contacts.html | Friend list + search + friend requests |

### Page Design Details

#### Contacts Page (contacts.html)
- Left sidebar: avatar + username + nav menu
- Right content area:
  - Search box (search users)
  - Friend request area (red badge when pending requests exist)
  - Friend list (sorted by add time, newest first)
  - Each friend shows: avatar, nickname, bio
  - Friend actions: send message, view profile, remove

### Feature Design Details

#### Search Users
- Fuzzy search by username
- Search results show: avatar, nickname
- Display relationship status with current user

#### Send Friend Request
- Click "Add Friend" in search results
- Can only send one friend request to the same user
- Cannot send friend request to yourself

#### Handle Friend Requests
- Show all received pending friend requests
- Each request shows: requester avatar, requester nickname
- Support "Accept" and "Reject" actions

#### Friend List
- Show all added friends
- Sorted by add time, newest first
- Each friend shows: avatar, nickname, bio

#### Remove Friend
- Remove friend from friend list
- Both sides lose friendship relationship

#### Initialization Data
- After a new user registers, automatically create 11 preset friends
- The init script must pre-create 10 user accounts
- New user automatically establishes friendships (accepted status) with these 11 users

### API Design

| Method | Path | Description |
|------|------|------|
| GET | /api/users/search?q=keyword | Search users |
| GET | /api/friends | Get friend list |
| GET | /api/friends/requests | Get friend request list |
| POST | /api/friends/requests | Send friend request |
| PUT | /api/friends/requests/{id} | Handle friend request (accept/reject) |
| DELETE | /api/friends/{username} | Remove friend |

### Data Init Script (scripts/init_data.py)
- Create 11 preset users (to become friends of new users)
- Usernames: `maximuz`, `luna_star`, `cloud_walker`, `pixel_dreamer`, `echo_valley`, `neon_pulse`, `forest_whisper`, `ocean_drift`, `solar_flare`, `midnight_owl`, `crystal_rain`
- Unified password: `111111`
- Skip if user already exists

### Phase Two Completion Criteria
- [ ] Users can search for other users
- [ ] Users can send friend requests
- [ ] Users can accept/reject friend requests
- [ ] Users can view friend list
- [ ] Users can remove friends
- [ ] New users automatically get 10 initial friends

---

## Phase Three: Instant Messaging

### Goal
Implement real-time chat with message sending, receiving, and conversation list.

### Pages

| Page | File | Description |
|------|------|------|
| Messages | index.html#chats | Chat conversation list |
| Chat Detail | chat.html | Chat details |

### Page Design Details

#### Messages Page (index.html#chats)
- Left sidebar: avatar + username + nav menu
- Right content area:
  - Chat conversation list
  - Each conversation shows: friend avatar, friend name, last message, message time
  - Unread message conversations show red dot
  - Click conversation to go to chat detail page

#### Chat Detail Page (chat.html)
- Top nav bar: back button + friend name + friend avatar
- Middle: message list
  - Own messages shown on right (bubble style)
  - Received messages shown on left (bubble style)
  - Each message shows content + time
- Bottom: input box + send button
- Auto-scroll to bottom after sending

### Feature Design Details

#### Send Message
- Type text and click send or press Enter
- Message appears immediately in chat window
- Can only send messages to friends

#### Receive Message
- Receive messages in real-time via WebSocket
- On chat detail page, new messages appended directly
- Not on chat detail page, conversation list updates

#### Chat History
- Load history messages when opening chat page
- Messages ordered chronologically
- Messages stored on server

#### Unread Message Indicator
- In conversation list, friends with unread messages show red dot
- Clear unread status when entering chat page

### WebSocket Design

**Connection URL**: `ws://host/ws`

**Message Format**:
```json
{
  "type": "message",
  "from": "zhang_san",
  "to": "li_si",
  "content": "Hello!",
  "id": "uuid",
  "created_at": "ISO time"
}
```

**Event List**:
| Event | Direction | Description |
|------|------|------|
| connect | Client→Server | Connect with session auth |
| send_message | Client→Server | Send message |
| new_message | Server→Client | New message received |
| error | Server→Client | Error info |

### API Design

| Method | Path | Description |
|------|------|------|
| GET | /api/messages/conversations | Get conversation list |
| GET | /api/messages/{username} | Get chat history with a friend |

### Phase Three Completion Criteria
- [ ] Users can view chat conversation list
- [ ] Users can enter chat detail page
- [ ] Users can send messages
- [ ] Users can receive messages in real-time
- [ ] Users can view chat history
- [ ] Unread messages have red dot indicator

---

## Phase Four: Feed / Timeline

### Goal
Implement post publishing, browsing, and interaction (likes, comments).

### Pages

| Page | File | Description |
|------|------|------|
| Discover | friendscircle.html | Post feed |
| Profile | profile.html | User's posts |

### Page Design Details

#### Discover Page (friendscircle.html)
- Left sidebar: avatar + username + nav menu
- Right content area:
  - Post creation entry (text input + image selection button)
  - Post feed (reverse chronological)
  - Each post shows: author avatar, nickname, content, images, publish time
  - Interaction area: like button + comment button
  - Like list display
  - Comment list display
  - Comment input box

#### Profile Page (profile.html)
- Top: user avatar, nickname, bio
- If own profile, show "Edit Profile" button
- Post list (only this user's posts)
- If not a friend and not self, browse-only, no interaction

### Feature Design Details

#### Publish Post
- Text content: max 500 characters
- Images: optional, max 9
- Appears at top of feed after publishing

#### Browse Feed
- Posts sorted by time, newest first
- Only show posts from friends and self
- Click image to view full size

#### Like
- Click like button to like
- Click again to unlike
- Like list shows all usernames who liked

#### Comment
- Input comment below post
- Comment list shows commenter avatar, nickname, content, time
- Can delete own comments

#### Profile Page
- Show all posts by the user
- Non-friends can only browse, no interaction

### API Design

| Method | Path | Description |
|------|------|------|
| GET | /api/posts | Get post feed (friends + self) |
| GET | /api/posts/mine | Get my posts |
| GET | /api/posts/user/{username} | Get a user's posts |
| POST | /api/posts | Publish post (multipart/form-data) |
| DELETE | /api/posts/{id} | Delete post |
| POST | /api/posts/{id}/like | Like |
| DELETE | /api/posts/{id}/like | Unlike |
| POST | /api/posts/{id}/comments | Add comment |
| DELETE | /api/posts/{id}/comments/{comment_id} | Delete comment |

### Phase Four Completion Criteria
- [ ] Users can publish posts (text + images)
- [ ] Users can browse post feed
- [ ] Users can like/unlike
- [ ] Users can comment
- [ ] Users can delete own posts and comments
- [ ] Users can view other users' profiles

---

## Phase Five: Admin Panel

### Goal
Implement admin backend for managing users and posts.

### Pages

| Page | File | Description |
|------|------|------|
| Admin Login | admin.html | Admin login |
| Admin Panel | admin.html | Stats + user management + post management |

### Page Design Details

#### Admin Login
- Username input
- Password input
- Login button
- Default admin account: admin / 111111

#### Admin Panel
- Left: stats overview
  - Total users
  - Total posts
  - Monthly active users
  - Daily active users
- Center/Right:
  - User list (username, avatar, registration time, friend count, post count)
  - Post list (author, content, likes count, comments count, publish time)
  - Can view post details (including comments)

### Feature Design Details

#### Admin Login
- Verify admin credentials
- Enter admin panel on success

#### Data Statistics
- Real-time stats:
  - Total users
  - Total posts
  - Monthly active users (users who logged in this month)
  - Daily active users

#### User Management
- Display all users list
- Show each user's friend count and post count
- Support viewing user details

#### Post Management
- Display all posts list
- Support viewing post details (including comments)
- Support deleting inappropriate posts

### API Design

| Method | Path | Description |
|------|------|------|
| POST | /api/admin/login | Admin login |
| POST | /api/admin/logout | Admin logout |
| GET | /api/admin/stats | Get statistics |
| GET | /api/admin/users | Get user list |
| GET | /api/admin/posts | Get post list |
| GET | /api/admin/posts/{id} | Get post details |

### Phase Five Completion Criteria
- [x] Admin can log in
- [x] Admin can view statistics
- [x] Admin can view user list
- [x] Admin can view post list
- [x] Admin can delete posts

---

## 3. UI/UX Design Spec

> **Note**: The following is the default spec for UI-1 (Modern Minimalist) style. The actual project style is determined by the user's selection in Phase Zero.

### 3.1 Design Style
- Clean modern style
- Rounded cards: `border-radius: 12px`
- Subtle shadows: `box-shadow: 0 2px 8px rgba(0,0,0,0.08)`
- Ample whitespace: element spacing 16px-24px
- Gradient background: login page uses soft gradients

---

### Appendix: 6 UI Style Specifications

#### UI-1: Modern Minimalist - Current project style

| Property | Value |
|------|-----|
| Primary | #6366F1 (Indigo) |
| Primary-hover | #4F46E5 |
| Background | #F8FAFC |
| Card | #FFFFFF |
| Text primary | #1E293B |
| Text secondary | #64748B |
| Border | #E2E8F0 |
| Accent | #8B5CF6 (Purple) |
| Danger | #EF4444 |
| Success | #10B981 |
| Border radius | 10-12px |
| Shadow | Subtle |
| Font | System font stack |
| Sidebar width | 240px |

#### UI-2: Glassmorphism

| Property | Value |
|------|-----|
| Background | Gradient (#667eea → #764ba2 → #f093fb) |
| Card effect | Semi-transparent frosted glass (backdrop-filter: blur) |
| Opacity | rgba(255,255,255,0.15) |
| Border | rgba(255,255,255,0.3) |
| Border radius | 20-24px |
| Shadow | Soft |
| Font | System font stack |
| Feature | Frosted blur effect, gradient backgrounds |

#### UI-3: Dark Minimal

| Property | Value |
|------|-----|
| Background | #0a0a0f (Deep black) |
| Card | #13131a (Dark gray) |
| Border | #1f1f2e |
| Text primary | #FFFFFF |
| Text secondary | #6b7280 |
| Accent | Gradient (#00d4ff → #7b2ff7) |
| Online status | #10B981 (glow effect) |
| Border radius | 12-16px |
| Shadow | Neon glow |
| Font | SF Pro Display |

#### UI-4: Flat Design

| Property | Value |
|------|-----|
| Primary | #3498DB (Pure blue) |
| Background | #ECF0F1 (Light gray) |
| Card | #FFFFFF |
| Border | #BDC3C7 |
| Text primary | #2C3E50 |
| Text secondary | #7F8C8D |
| Online status | #2ECC71 |
| Border radius | 8-10px |
| Shadow | None (flat) |
| Font | System font stack |
| Feature | No shadows, no gradients, solid colors |

#### UI-5: Gradient Colorful

| Property | Value |
|------|-----|
| Background | Rainbow gradient animation (400% animation) |
| Primary | #FF6B6B → #9B59B6 |
| Card | rgba(255,255,255,0.95) |
| Text primary | #1F2937 |
| Text secondary | #6B7280 |
| Accent | Gradient text |
| Border radius | 16-20px |
| Shadow | Colored |
| Font | System font stack |
| Feature | Animated gradient background, hover animations |

#### UI-6: Vintage Print

| Property | Value |
|------|-----|
| Primary | #8B5A2B (Brown) |
| Background | #F5E6D3 (Cream) |
| Card | #FFFEF7 (Ivory) |
| Border | #D4C4A8 |
| Text primary | #5D4E37 |
| Text secondary | #8B7355 |
| Online status | #6B8E23 |
| Border radius | 2-4px (sharp/slight round) |
| Shadow | None or very faint |
| Font | Palatino/Georgia (Serif) |
| Feature | Paper texture, dashed borders, serif fonts |

---

### 3.2 Color Scheme (UI-1 Default)
```
Primary: #6366F1 (Indigo)
Primary-hover: #4F46E5
Background: #F8FAFC (Light gray-blue)
Card: #FFFFFF
Text primary: #1E293B
Text secondary: #64748B
Border: #E2E8F0
Accent: #8B5CF6 (Purple)
Danger: #EF4444
Success: #10B981
```

### 3.3 Typography
```
Main font: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif
Headings: 24px / 20px / 18px
Body: 16px
Captions: 14px / 12px
```

### 3.4 Layout
- Left sidebar: 240px fixed width
- Main content area: fill remaining space
- Responsive: mobile (<=768px) switches to top navigation

### 3.5 Responsive Breakpoints
```
Mobile: <= 768px
Tablet: 769px - 1024px
Desktop: > 1024px
```

---

## 4. Appendix

### 4.1 Username Regex Explanation
```regex
^[a-zA-Z_][a-zA-Z0-9_]{3,15}$
```
- Must start with a letter or underscore
- Following characters can be letters, digits, or underscores
- Total length 4-16 characters

### 4.2 Default Avatar
New users use Cravatar-generated cartoon avatars:
```
https://cravatar.cn/avatar/{md5_hash}?d=monsterid&s=200
```

---

## 5. Deployment Requirements

### 5.1 Network Access Configuration
- **Bind address**: `0.0.0.0` (accessible from all devices on LAN)
- **Access**: After starting the server, phones/computers on the same WiFi can access via `http://[computer IP]:5000`
- **Local access**: `http://localhost:5000` or `http://127.0.0.1:5000`

### 5.2 Configuration Example
```python
socketio.run(app, debug=True, host='0.0.0.0', port=5000)
```

### 5.3 Notes
- **Dev environment**: This config is for local development debugging only
- **Security**: Do not expose `debug=True` mode to untrusted networks
- **Firewall**: Ensure local firewall allows inbound connections on port 5000
