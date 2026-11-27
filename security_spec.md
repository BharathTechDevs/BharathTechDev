# S-CODERS Firestore Security Specification

## Collections & Access Boundaries
- `/users/{userId}`: Public identity only (`displayName`, `role`, `updatedAt`). Authenticated email-verified users can read/write their own record (`role` locked to `'client'` unless admin).
- `/users/{userId}/private/{docId}`: PII isolation (`email`, `phone`, `company`, `linkedUids`, `updatedAt`). Strictly owner read/write or admin read (`docId == 'info'`).
- `/registrations/{registrationId}`: Owner-scoped registrations (`ownerUid == request.auth.uid`). Supports Services, Workshops, and Events UIDs plus mutable saved workspace profile/notes.
- `/admins/{userId}`: Admin marker collection (`write: if false`).

## 12 Adversarial Payloads ("Dirty Dozen")
1. **Unauthenticated read on `/registrations/{id}`**: Must be denied (`request.auth == null`).
2. **Unverified email token (`email_verified == false`) write to `/registrations/{id}`**: Must be denied (`isSignedIn()` requires `email_verified == true`).
3. **Cross-user read on `/users/{otherUid}/private/info`**: Must be denied (`isOwner(userId)` or `isAdmin()`).
4. **Cross-user `list` query on `/registrations` without `ownerUid == request.auth.uid`**: Must be denied (Pillar 8 resource-scoped read).
5. **UID/Owner spoofing on create (`ownerUid != request.auth.uid`)**: Must be denied.
6. **Privilege escalation on `/users/{uid}` create/update (`role: 'admin'`)**: Must be denied for non-admins.
7. **Timestamp forgery (`createdAt != request.time` or `updatedAt != request.time`)**: Must be denied.
8. **Immutable field mutation on `/registrations/{id}` update (changing `uid`, `section`, `itemId`, `amount`, `paymentStatus`, `ownerUid`, or `createdAt`)**: Must be denied for non-admins.
9. **Unknown extra field injection (`isAdminBypass: true`)**: Must be denied (`hasOnly(...)` whitelist).
10. **Volumetric text DoS (`notes` > 2000 chars or `linkedUids` > 50 items)**: Must be denied by size constraints.
11. **Invalid enum injection (`section: 'hacked'` or `status: 'SUPER'`)**: Must be denied by enum membership check.
12. **Client-side deletion of `/registrations/{id}` or `/admins/{id}`**: Must be denied (`allow delete: if isAdmin()` on registrations, `false` on admins).
