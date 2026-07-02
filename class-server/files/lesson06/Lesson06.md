# 06 Social Network

## Tips

- **Class Server**: http://192.168.3.38:6688
- **Starting a New Project**: Always create a new folder and start a fresh AI chat session. Make sure AI recognizes the new directory context and generates all subsequent code within it.
- **Submitting Homework**: At the end of class, submit your assignment by compressing (zipping) your project folder and uploading it.
- **Console Logs**: If the program behaves unexpectedly, always check the browser Console logs for error messages. Press F12 or Ctrl+Shift+J / Cmd+Option+J to open the Console.

## Building a Social Network

Today we're building something familiar — a social network app, like WeChat.

### Think about it:

- What features does a social app need? (Login? Chat? Moments? Friends?)
- Which features are absolutely **essential** vs. "nice to have"?
- How do these features connect to what we've already learned — **frontend** (HTML/CSS/JS), **backend** (Flask), and **database** (JSON)?
- Where does user data live? How do two people chat in real time? How does a post get saved and shown to friends?

### Key idea:
A social network is not just one big program — it's many small features working together, each using the frontend + backend + database pattern we've been practicing.

## Social Network — Development Phases

Build it step by step. Detailed requirements for each phase are in the `social/` folder.

| Phase | Topic | What You'll Build |
|-------|-------|-------------------|
| Phase 1 | Login, Register & Profile | User accounts: sign up, log in, edit avatar/bio, change password |
| Phase 2 | Contacts & Friends | Search users, send/accept friend requests, manage friend list |
| Phase 3 | Instant Messaging | Real-time chat with WebSocket — send and receive messages instantly |
| Phase 4 | Moments (Friend Circle) | Publish posts with images, like and comment on friends' posts |
| Phase 5 | Admin Dashboard | Admin panel: view statistics, manage users and posts |
