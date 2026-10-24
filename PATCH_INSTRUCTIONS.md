# Querify blue-theme patch

This is a minimal patch for the already-updated UICipher/Querify repository. It contains only `client/src/index.css`, which removes the remaining purple accents from the logo/female badge, schema-studio icon, slider, Launch schema job button, hover/focus glows, and related controls.

In the existing repository, replace **only** `client/src/index.css` with the file at this same path. Keep the other repository files; do not delete the repo or upload a nested `querify/` folder. Commit the change on `main`. If Vercel is connected to `main`, it should redeploy automatically. After deployment, hard-refresh or reopen the website.

The restaurant/hotel scope guard is already present in the current uploaded code; this patch only changes the visual palette.
