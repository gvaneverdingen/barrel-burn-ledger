## Goal

Only accept valid IPFS CIDs (CIDv0 `Qm…` 46 chars, or CIDv1 `b…`/`z…` base32/58 ≥ 50 chars) in any field that writes to `cask_transfers.doc_hash` or `casks.provenance_doc_hash`. Give the user inline feedback as they type and block submission on invalid input.

Note: `cask_regauges` has no `doc_hash` column, so regauges are unaffected. If a CID per regauge is wanted, that needs a schema change — I'll flag it but not include it here.

## Scope

1. **New helper** `src/lib/ipfs.ts`
   - `isValidCID(value: string): boolean` — regex-based check covering CIDv0 (`^Qm[1-9A-HJ-NP-Za-km-z]{44}$`) and CIDv1 (`^(b[a-z2-7]{50,}|z[1-9A-HJ-NP-Za-km-z]{48,})$`).
   - `cidError(value: string): string | null` — returns a human message ("Must be a valid IPFS CID (e.g. Qm… or bafy…)") or `null`.
   - Pure functions, no deps.

2. **`CaskProvenancePanel.tsx` — AddTransferDialog**
   - Validate `doc_hash` on change; show inline `<p className="text-destructive text-xs">` under the input when invalid and non-empty.
   - Disable Save button when `doc_hash` is non-empty and invalid.
   - Re-check on submit; toast error if invalid.
   - Add a small helper hint ("Optional. IPFS content hash for the supporting document.") to match the user's tooltip preference.

3. **`CaskAdvancedSpecsFields.tsx` — provenance_doc_hash input**
   - Same inline validation + helper hint.
   - Export a `validateAdvancedSpecs(state): string | null` helper so the two `NewCask.tsx` forms (distillery + warehouse) can block submission with a toast if the CID is malformed. Wire it into both submit handlers.

4. **No DB changes.** Validation is client-side only (server already accepts text). RLS already restricts who can write.

## Out of scope

- Verifying the CID actually resolves on IPFS (network call).
- Adding `doc_hash` to `cask_regauges` (would need a migration).
- Replacing the free-text input with an upload-to-IPFS flow.

## Files touched

- add: `src/lib/ipfs.ts`
- edit: `src/components/CaskProvenancePanel.tsx` (transfer dialog)
- edit: `src/components/CaskAdvancedSpecsFields.tsx` (export validator + inline error)
- edit: `src/pages/distillery/NewCask.tsx` (call validator in submit)
- edit: `src/pages/warehouse/NewCask.tsx` (call validator in submit)
