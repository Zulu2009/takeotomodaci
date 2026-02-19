# Firebase Setup

1. Create a Firebase project.
2. Enable Authentication providers (Google and/or Email).
3. Create Firestore in production mode.
4. Deploy rules and indexes:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## Collections

- `lessons`: canonical lesson metadata
- `games`: game definitions by `type + config`
- `videos`: metadata and R2 keys
- `user_progress`: per-user progress snapshots
- `admins`: optional list of admin UIDs

## Recommended content shape

Use IDs that are stable, lowercase, and slug-style. Example: `day-01-hiragana`.
