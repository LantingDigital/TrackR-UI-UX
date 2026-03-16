# Community Friends -- v1 Backend Audit

## Decisions Made (2026-03-11)

- **Mutual friends only.** Request → accept → friends. No follow system. No one-way follows.
- **No influencer/public profile mode.** Everyone is equal. No special visibility for any user.
- **Non-friends see:** Name, avatar, credit count, home park, join date. That's it.
- **Everything else locked behind mutual friendship:** Timeline, ratings, collection, stats, activity — all hidden from non-friends.
- **User search:** Algolia for friend discovery (and all other search). Wired in right before TestFlight. Local search works during dev.
- **Block/report:** Report button on every profile and post for v1. Handled via Firebase console. Full moderation dashboard in v1.1.

---

## Screens/Components Covered
- CommunityFriendsTab.tsx (L1-334) -- Stories row + activity feed
- ProfileView.tsx (L1-362) -- Read-only profile view
- friendsStore.ts -- Module-level read-only store
- data/mockFriendsData.ts -- 8 mock friends + 10 activity items

## Current Data Sources
- Friends list: `MOCK_FRIENDS` from `data/mockFriendsData.ts` (8 hardcoded friends)
- Friend activity: `MOCK_FRIEND_ACTIVITY` from `data/mockFriendsData.ts` (10 items)
- Store: `friendsStore.ts` -- read-only: `getFriends()`, `getFriend(id)`, `getActivity()`
- No mutation functions exist: no add/remove friend, no follow/unfollow
- Profile data: hardcoded per-userId in ProfileView.tsx (L52-98)
- Each friend: { id, name, avatar, creditCount, topCoaster, mutualFriends, recentRide }
- Each activity: { id, friendId, friendName, friendAvatar, type (ride|review|milestone), content, timestamp, linkedEntities }

## Interaction Inventory
| # | Element | Location | Current Behavior | Required v1 Behavior | Backend Need |
|---|---------|----------|-----------------|---------------------|--------------|
| 1 | Story bubble press | CommunityFriendsTab L215-221 | Opens ProfileView for friend | Same | Read: users/{friendId} |
| 2 | Activity friend name press | CommunityFriendsTab L223-225 | Opens ProfileView | Same | Read: users/{friendId} |
| 3 | Activity coaster linked text | CommunityFriendsTab L136-170 | Opens RideActionSheet for coaster | Same | None (local coaster data) |
| 4 | Activity park linked text | CommunityFriendsTab L136-170 | Opens park detail or similar | Same | None (local park data) |
| 5 | ProfileView back button | ProfileView L122-129 | Navigates back | Same | None |
| 6 | Add friend button | MISSING | Does not exist | Send/accept friend request | Write: friendRequests/{id} |
| 7 | Remove friend button | MISSING | Does not exist | Remove from friends list | Delete: friends/{userId}/list/{friendId} |
| 8 | Follow/unfollow button | MISSING | Does not exist | Toggle follow state | Write: users/{userId}/following |
| 9 | Friend search/discover | MISSING | Does not exist | Search users by name | Read: users collection (search query) |
| 10 | Friend request notification | MISSING | Does not exist | Badge/alert for pending requests | Read: friendRequests where toUserId == me |
| 11 | Activity pull-to-refresh | MISSING | Not implemented | Refresh activity feed | Read: friends activity query |

## Firestore Collections Required
- `users/{userId}` -- { displayName, avatar, creditCount, topCoaster, totalRides, ... }
- `users/{userId}/friends/{friendId}` -- { addedAt, status: 'active' }
- `friendRequests/{requestId}` -- { fromUserId, toUserId, status: 'pending'|'accepted'|'declined', createdAt }
- `users/{userId}/activity/{activityId}` -- { type, content, linkedEntities, timestamp }
  - OR activity derived from rideLogs + posts (no separate collection)

## Cloud Function Requirements
- `sendFriendRequest(toUserId)` -- Creates friendRequests doc, sends push notification
- `acceptFriendRequest(requestId)` -- Updates request status, creates bidirectional friends docs
- `declineFriendRequest(requestId)` -- Updates request status
- `removeFriend(friendId)` -- Deletes bidirectional friends docs
- `getFriendActivity(userId, limit, cursor)` -- Paginated: queries recent rideLogs + posts from all friends, merges and sorts by timestamp
- `searchUsers(query)` -- Full-text search on user displayName (Firestore text search or Algolia)

## Data Flow: Current vs Required
- **Current:** App boots -> friendsStore loads MOCK_FRIENDS and MOCK_FRIEND_ACTIVITY -> getFriends() returns 8 friends -> getActivity() returns 10 items -> UI renders. ProfileView has hardcoded profile per userId (L52-98). No social actions possible.
- **Required:** Auth -> fetch users/{me}/friends subcollection -> for each friend, fetch user profile -> render stories row. Activity: call getFriendActivity CF -> paginated list. ProfileView: fetch users/{userId} doc. Social: add/remove/follow buttons on ProfileView, friend request flow with notifications.

## Critical Gaps (Missing UI + Backend)
1. **No add/remove friend UI.** ProfileView is read-only. Needs action buttons.
2. **No friend request flow.** No UI for sending, accepting, or declining requests.
3. **No user discovery.** No way to find other users to befriend.
4. **No follow vs friend distinction.** Need to decide: mutual friendship, one-way follow, or both?
5. **No activity pagination.** Currently renders all 10 items. Needs infinite scroll.
6. **Profile data is fake.** ProfileView L52-98 hardcodes profiles per userId. Must fetch from Firestore.

## Open Questions
- Friend model: mutual (both accept) or follow-based (one-way)?
- If mutual: what is the request flow UI? In-app notification? Push?
- Privacy: can non-friends see profiles? Activity? Ride history?
- Activity composition: separate activity collection or derived from rideLogs + posts?
- User search: Firestore native (prefix match only) or third-party (Algolia, Typesense)?
- Should there be a "suggested friends" feature based on park overlap?
- Block/report: needed for v1 App Store submission?
