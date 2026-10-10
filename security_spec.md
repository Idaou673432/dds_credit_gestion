# Security Specification: DDS Crédit Confiance

## 1. Data Invariants
1. **Multi-Tenant Business Isolation**: Users can only read, create, or update records (`customers`, `credits`, `payments`, `auditLogs`) if they are authenticated and belong to the corresponding `businessId`.
2. **Financial Non-Negativity & Consistency**:
   - `amount` must be a strictly positive integer (> 0).
   - In `credits`, `remainingAmount = amount - totalPaid`.
   - In `payments`, payment amount must be > 0 and cannot exceed the credit's current `remainingAmount`.
3. **Immutable History & Traceability**:
   - Confirmed payments and credit ledger entries cannot be arbitrarily deleted without audit trail.
   - `createdAt` and `createdBy` must match the server timestamp and the authenticated UID.
4. **Role-Based Access Control (RBAC)**:
   - `owner`: full access (settings, delete, archive, export, invite members).
   - `manager`: manage customers, create credits, record payments.
   - `cashier`: record payments, view customers and credits.

## 2. The "Dirty Dozen" Malicious Payloads (Targeting Rejection)
1. **Cross-Tenant Leak Attack**: Querying or creating a customer belonging to `business_B` while authenticated only in `business_A`.
2. **Identity Spoofing**: Attempting to set `createdBy: "victim_user_uid"` when authenticated as `attacker_user_uid`.
3. **Negative Debt Insertion**: Attempting to create a credit with `amount: -50000`.
4. **Zero-Amount Payment Exploit**: Attempting to record a payment with `amount: 0`.
5. **Overpayment Bypass**: Attempting to record a payment of 60,000 FCFA on a remaining balance of 20,000 FCFA.
6. **Immortal Timestamp Overwrite**: Updating an existing credit while forging `createdAt: "1970-01-01T00:00:00Z"`.
7. **Privilege Escalation**: A cashier attempting to update their own `role: "owner"` in `memberships`.
8. **Ghost Field Poisoning**: Injecting an unapproved field `{ "adminOverride": true, "bypassBalance": true }` into a payment document.
9. **String Bomb / Wallet Denial**: Injecting a 2MB description string into a credit record.
10. **ID Poisoning Attack**: Passing a malicious path traversal `../admin/secret` as `customerId`.
11. **Silent Deletion Attack**: An unauthenticated or cashier user issuing a hard `deleteDoc` on a financial payment record.
12. **Status Shortcut Attack**: Forcing a credit status to `paid` without the corresponding payment amount or while remaining balance > 0.
