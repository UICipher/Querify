# Querify — Final Handoff

## Production

The current Production app is live at [https://querify-lyart.vercel.app](https://querify-lyart.vercel.app). The Vercel project is `temple22579-9996/querify`. Its Production environment keeps `QUERIFY_GEMINI_API_KEY` as a server-side secret and sets `QUERIFY_GEMINI_MODEL=gemini-3.5-flash-lite`.

## App behavior

Querify keeps two distinct modes:

- **Knowledge Answers** sends open-topic questions to Gemini 3.5 Flash-Lite using a text-only Interactions API request. Search, browsing, tools, citations, and sample-data fallback are disabled. Answers can be outdated or inaccurate; the UI discloses that limitation. Provider or quota failures return an explicit error instead of unrelated demo rows.
- **SQL Demo** remains separate and operates only on the six fictional sample datasets using the existing guarded read-only query path. It is not presented as current real-world data.

The Knowledge Answers request caps output at 1,024 tokens and uses a low thinking level. Google Search grounding is disabled.

## Visual refinement

The overview now uses a quieter editorial treatment: a typographic hero marker, matte primary action, text-style secondary action, and open ruled workflow columns instead of another row of heavy cards. The pointer-follow spotlight and subtle hover lift remain, with visible keyboard focus and reduced-motion support. The rest of the app’s dark slate palette and separate SQL Demo layout are preserved.

## Free-tier and privacy notes

Google’s current pricing lists Gemini 3.5 Flash-Lite text input and output as free on the Gemini API Free Tier. Search grounding is not available on that model’s Free Tier, so the app does not call it. I did not enable paid billing as part of this setup. Free-tier quotas can still be reached. See [Google’s model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite) and [pricing](https://ai.google.dev/gemini-api/docs/pricing).

Google’s Free-Tier terms may allow submitted prompts and responses to be used to improve products and be processed by human reviewers. Do not submit sensitive, confidential, or personal information. Knowledge Answers are not live web research and do not include source citations.

## Verification completed

- `pnpm run check` — passed.
- `pnpm test` — passed: 90 tests across 10 files.
- `node test-querify-ui.cjs` — passed.
- `pnpm run build:static` and `pnpm run build` — passed.
- `git diff --check` — passed.
- Production homepage, JavaScript, and CSS — HTTP 200 after the final deployment.
- Live restaurant-ranking smoke test — HTTP 200 with an answer; zero sources, zero citations, empty Search Suggestions, and no SQL rows.

This confirms the requested broad-topic example works. It does not guarantee every possible question will always succeed; the model can be uncertain, wrong, rate-limited, or temporarily unavailable.

## GitHub synchronization

The Vercel project is connected to `UICipher/Querify`, but the verified source changes were deployed from the sandbox with the Vercel CLI and have not been pushed to GitHub. This sandbox has no authenticated GitHub CLI or GitHub write credential. A later Git-triggered deployment from the unchanged repository could restore the older source. Enable the GitHub connector or otherwise authorize repository write access to sync these changes; the live Vercel Production deployment is already updated.

## Hackathon criteria

The supplied ZIP did not contain a separate rubric or marking-criteria file. The project handoff and included source were used to complete the requested scope.
