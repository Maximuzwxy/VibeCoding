# Phase 1 — Login, Register & Profile Settings

## Goal
Implement user registration, login, and personal profile management.

## Requirements

### Registration
- Username, password, confirm password fields
- Username: 4–16 chars, letters/numbers/underscores, must start with a letter or underscore
- Password: at least 6 characters, must match confirmation
- Auto-login after successful registration

### Login
- Username + password
- Show error messages for invalid credentials
- Redirect to settings page on success

### Profile Settings
- Sidebar with avatar, username, navigation menu
- Change avatar (upload image, max 5MB)
- Edit bio (max 100 characters with counter)
- Change password (current + new + confirm)
- Logout button

### Default Avatar
- Auto-generated avatar from DiceBear API based on username
