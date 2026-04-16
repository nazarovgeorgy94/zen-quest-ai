# Project Memory

## Core
- App is EXCLUSIVELY a floating chat widget. NO landings, NO dashboards.
- "Cosmic Mint" aesthetic: #16FFBB primary, #29DDDA accent, #0A081B bg. Glassmorphism 2.0, Framer Motion springs.
- Backend: Supabase RAG, Gemini 1.5 Flash, `pg_trgm` + `tsvector` (Russian). No vector embeddings yet.
- UX: Smart auto-scroll pauses on manual upward scroll; drip streaming prevents layout shifts.
- Theme System: Centralized HSL-tokens (Primary, Accent, Cyan) with `bg-surface-0` to `4` elevation. All colors via CSS vars.
- RCChat split into DiagnosisTimeline, HypothesisCard, ChatMessageList, ChatInput subcomponents.

## Memories
- [Project Purpose](mem://project/core-purpose) — AI Knowledge Base Assistant for ANTIFRAUD platform
- [Architecture Constraints](mem://constraints/architecture) — Strictly a floating widget, no standalone pages
- [Visual Aesthetic](mem://design/aesthetic) — Deep Forest theme, HSL tokens, glassmorphism, animations
- [Widget Layout](mem://design/widget-layout) — Trigger button, minimal header, resize behavior, starter orb
- [Chat Experience](mem://design/chat-experience) — Gradient bubbles, smart scroll, CoT streaming, confidence shield
- [Intelligence Engine](mem://features/intelligence) — Supabase RAG, pg_trgm + tsvector, mock fallback
- [Chat History](mem://features/history) — Sidebar session management and auto-titling
- [Embed Integration](mem://features/embed) — Iframe integration via /embed route
- [Design Tokens](mem://design/tokens) — Cosmic Mint palette, surfaces, gradients, shadows
