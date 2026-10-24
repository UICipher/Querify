# Querify overlay patch

This is an overlay for the existing `UICipher/Querify` repository, not a replacement repository. Keep all existing files. Extract these paths into the existing repository root and overwrite only matching files; do not delete the repo or upload this archive as a nested folder.

Files included:
- `client/src/index.css` — removes the last purple-hued legacy fallbacks and keeps true-red destructive/error cues.
- `shared/queryScope.ts` — blocks known unsupported domains and unfamiliar requested entities instead of returning company demo rows.
- `shared/queryScope.test.ts` — regression tests for houses, phones, cars, restaurants, hotels, unknown nouns, and supported company queries.
- `api/v1/query.test.ts` — verifies unsupported requests return 422 and no `rows` payload.

After replacing the files, run the project checks, commit the changes to `main`, and push. Vercel will deploy automatically only if this repository is connected to the project.
