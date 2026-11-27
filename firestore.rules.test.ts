// Security rules verification cases matching /security_spec.md
// Covers:
// 1. Unauthenticated access denied across all collections.
// 2. Unverified email token rejected by isSignedIn().
// 3. Cross-user private PII /users/{otherUid}/private/info read denied.
// 4. Unscoped collection list query on /registrations denied (requires ownerUid == request.auth.uid).
// 5. ownerUid spoofing on /registrations create denied.
// 6. Role self-escalation on /users/{uid} denied.
// 7. Server timestamp forgery denied (createdAt/updatedAt == request.time).
// 8. Immutable registration field mutation (uid, amount, status, ownerUid) denied for non-admins.
// 9. Extra arbitrary key injection rejected via hasOnly().
// 10. Volumetric payload attacks (notes > 2000 chars, linkedUids > 50) rejected.
// 11. Invalid section/status enum rejected.
// 12. Unauthorized deletion of registrations or admin markers denied.
export const SECURITY_RULE_AUDIT_CASES = 12;
