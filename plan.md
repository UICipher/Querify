# Querify implementation plan

## Product approach
Querify is a focused enterprise query studio: a single workspace for natural-language intent, clarification, safe SQL preview, raw analytics, and explainable business insight. The existing Spring Boot API remains the production backend boundary; the Vite client consumes its documented `clarification_needed` and analytics payloads, with a deterministic local demo fallback for preview resilience.

## Structure
- `client/src/pages/Home.tsx`: query studio UI, conversation state, result tabs, and responsive interaction model.
- `client/src/index.css`: dark slate design tokens, typography, layout, skeleton-free stable states, and responsive breakpoints.
- `text-to-sql-backend/`: Java 21/Spring Boot API for clarification, SQL validation, bounded read-only execution, and analytics metadata.
- `client/public/manus-routes.json`: complete public page route manifest.

## Design direction
Three candidate styles: Terminal editorial (0.07), industrial data atelier (0.06), and nocturne operations desk (0.08). Chosen: **nocturne operations desk**.

- **Movement:** restrained enterprise dark mode with a data-operations feel rather than decorative glassmorphism.
- **Principles:** high information density without clutter; lime accent reserved for safe/active states; visible system status; purposeful hierarchy.
- **Color philosophy:** charcoal and blue-slate surfaces reduce fatigue; a single acid-lime signal makes successful actions and safety boundaries legible.
- **Layout:** asymmetric utility rail + generous working canvas; results sit immediately beneath the question to preserve the mental model.
- **Signature elements:** Q mark with an upward query arrow, numbered workflow steps, and lime safety affordances.
- **Interaction:** ambiguity is surfaced as a calm, human clarification moment; no hidden state changes.
- **Animation:** short opacity/transform transitions only for progress feedback; no ambient motion that competes with query comprehension.
- **Typography:** DM Sans for UI and DM Mono for SQL/system metadata.
- **Brand essence:** the explainable bridge between business questions and governed data — precise, calm, trustworthy.
- **Voice:** “Ask your data better questions.” and “One quick clarification.”
- **Wordmark:** compact Q/arrow mark paired with a text wordmark.
- **Signature color:** acid lime `#B8E94D`.
