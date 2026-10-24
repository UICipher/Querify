# Apply the Querify enhancement overlay

This archive contains only the changed/new application and setup files from the public `UICipher/Querify` `main` snapshot at `443dde9416111725ceabde241196a3b5f35d57cc`. It contains no deletions and no credentials.

Extract the ZIP **at the root of your existing Querify repository**, allowing the matching files to be replaced. Keep every other existing repository file. Then run `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test`, `node test-querify-ui.cjs`, and `pnpm build:static`.

For the live AI query API, follow `AI_SETUP.md` and enter `QUERIFY_LLM_API_KEY` and `QUERIFY_LLM_MODEL` directly in Vercel’s server-side Environment Variables, then redeploy. Do not put the key in GitHub, source code, chat, or any `VITE_` variable.
