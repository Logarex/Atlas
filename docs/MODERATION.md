# Moderation

The contribution system should feel easy for users and strict for published data.

## Submission Types

- Correction to an existing store.
- New store proposal.
- Closed store or relocation history.
- Architectural attribute proposal.
- Photo upload.
- Report incorrect or copyrighted content.

## User Flow

1. User opens a store page.
2. User taps "Suggest edit" or "Add photo".
3. App asks for the changed field, proposed value, source URL, optional note, and license confirmation.
4. The app creates a GitHub issue.
5. User sees a submission status.

## Maintainer Flow

1. Maintainer opens the GitHub issue.
2. Issue body shows before/after values, source links, contributor username, and notes.
3. Maintainer approves, requests changes, or rejects.
4. Accepted changes are applied through a dataset pull request.

## GitHub Issue

Suggested V1 issue body:

```text
### Contribution from @username

- Store ID: apple-fifth-avenue
- Type: store_correction
- Field: architecture.attributes.forum
- Proposed Value: yes
- Source: https://www.apple.com/newsroom/2019/09/apple-fifth-avenue-the-cube-is-back/
- Note: Optional reviewer context
```

## Review Rules

- Require a source for factual data.
- Reject copied descriptions or copyrighted photos.
- Prefer "unknown" over guessed attributes.
- Mark volatile information with `lastVerifiedAt`.
- Close rejected issues with a short reason.
- Rate-limit repeated low-quality submissions.

## Roles

- Contributor: can submit edits and photos.
- Trusted contributor: lower friction, still reviewed.
- Reviewer: can approve/reject issues.
- Admin: can manage repository settings and emergency takedowns.
