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
4. Submission is saved as pending.
5. User sees a pending status.

## Maintainer Flow

1. A Discord message appears in the maintainer channel.
2. Maintainer opens the review link.
3. Review page shows before/after values, source links, contributor history, and risk flags.
4. Maintainer approves, requests changes, or rejects.
5. Decision is logged in `reviews`.

## Discord Message

Discord webhooks are enough for V1 notifications. For one-click approve/reject buttons, use a Discord bot or signed links to a web review page.

Suggested V1 message:

```json
{
  "content": "New Atlas submission",
  "embeds": [
    {
      "title": "Correction: Apple Fifth Avenue",
      "fields": [
        { "name": "Field", "value": "attributes.forum" },
        { "name": "Proposed value", "value": "yes" },
        { "name": "Source", "value": "https://www.apple.com/newsroom/2019/09/apple-fifth-avenue-the-cube-is-back/" },
        { "name": "Submitted by", "value": "@username" }
      ]
    }
  ]
}
```

## Review Rules

- Require a source for factual data.
- Reject copied descriptions or copyrighted photos.
- Prefer "unknown" over guessed attributes.
- Mark volatile information with `lastVerifiedAt`.
- Keep rejected submissions for audit, but do not expose them publicly.
- Rate-limit repeated low-quality submissions.

## Roles

- Contributor: can submit edits and photos.
- Trusted contributor: lower friction, still reviewed.
- Reviewer: can approve/reject.
- Admin: can manage users, roles, and emergency takedowns.
