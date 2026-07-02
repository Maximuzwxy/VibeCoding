# Phase 2 — Contacts & Friend Management

## Goal
Implement a contacts page with user search, friend requests, and friend list management.

## Requirements

### Search Users
- Search by username (fuzzy matching)
- Show avatar and username in results
- Show relationship status with current user

### Friend Requests
- Send friend request from search results
- Cannot send to yourself or to existing friends
- Badge indicator for pending requests
- Accept or reject incoming requests

### Friend List
- Show all accepted friends, sorted by most recent
- Each entry: avatar, username, bio
- Actions: send message, view profile, remove friend
- Deleting a friend removes the relationship for both sides

### Preset Friends
- New users auto-become friends with 10 preset accounts (`friend_01` to `friend_10`)
