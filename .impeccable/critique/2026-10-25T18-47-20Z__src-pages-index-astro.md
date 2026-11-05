---
target: Ya Hala homepage
total_score: 21
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\User\\Documents\\yahala-usa-linktree\\src\\pages\\index.astro"
target_fingerprint: "sha256:b94ba26dda197c4f3fa2d3be65f9c24866cfd04b12644a3b63188292aded8e05"
target_path: "C:\\Users\\User\\Documents\\yahala-usa-linktree\\src\\pages\\index.astro"
timestamp: 2026-10-25T18-47-20Z
slug: src-pages-index-astro
---
Method: dual-agent (A: /root/design_review · B: /root/technical_review)

# Ya Hala homepage critique

Target: `src/pages/index.astro`. Surface mode: Experience (portfolio), with viewer and sponsor conversion goals.

## Design specificity

The site is recognizably Ya Hala. Bilingual artwork, real field-story thumbnails, editorial serif headlines, and community geography give it an authored identity. Preserve that identity. The main opportunity is to connect the work and its evidence to an obvious sponsor contact path.

## Design health

| Heuristic | Score | Evidence |
|---|---:|---|
| Visibility of system status | 3 | Dates and map/loading cues are visible. |
| Match with the real world | 2 | Views are presented as people reached. |
| User control and freedom | 3 | Familiar links and story browsing paths. |
| Consistency and standards | 3 | Coherent typography, platform icons, red/navy identity. |
| Error prevention | 3 | Low-risk link flows with named controls. |
| Recognition rather than recall | 2 | Sponsors must infer where contact lives. |
| Flexibility and efficiency | n/a | Portfolio rather than an expert task interface. |
| Aesthetic and minimalist design | 2 | Cropped host and delayed work previews weaken hierarchy. |
| Error recovery | 3 | Search source includes recovery guidance; live search was not exercised. |
| Help and documentation | n/a | Portfolio does not need a documentation workflow. |
| **Total** | **21/32** | **66%: Acceptable** |

## What works

- Watch latest is visibly primary, with a comfortable 48px mobile target.
- Real show imagery and Arabic thumbnails demonstrate the actual work.
- Named social links and familiar icons make following straightforward; social buttons are 56px tall.

## Priority issues

1. **P1: No explicit sponsor/contact route on the homepage.** All rendered homepage anchors were inspected: none names contact, sponsorship, collaboration, mailto, or WhatsApp. Add a restrained contact action near the intro and a clear closing invitation after the work. Reuse a confirmed destination. Source: `src/pages/index.astro:257`, `:424`. Suggested commands: clarify, layout.
2. **P1: Audience proof changes the meaning of its source data.** Every metric in `src/data/site.yaml:634` is Views. The card says People reached and Total audience. Views do not establish unique people. Relabel the summary and accessible name as total views, retain the recorded figures and update date, and make the units clear in platform details. Source: `src/components/ReachBadge.astro:90`, `:95`, `:109`. Suggested command: clarify.
3. **P2: Desktop hero crops the host off the right edge.** At 1280px the tall image box cuts away much of the host; the phone composition is better. Adjust desktop fit, position, or aspect ratio against the real image bounds while preserving the phone composition. Source: `src/pages/index.astro:209`, `src/styles.css:564`, `src/pages/index.css:344`. Suggested commands: layout, adapt.
4. **P2: Story evidence arrives late on mobile.** At 390px the first latest-story thumbnail begins around y=2067, after cover, intro, social links, QR, stats, repeated about copy, and brands. Watch latest is available earlier, but visitors cannot preview the work immediately. Bring one real work preview earlier or shorten the preamble. Source: `src/pages/index.astro:307`, `:311`, `:335`. Suggested commands: layout, distill.

## Persona checks and journey

- New viewers understand the subject quickly, but have to scroll extensively to preview a story on a phone.
- Distracted mobile visitors get a usable watch action; QR and the introductory sequence compete with seeing the work.
- Sponsors lack a named next action and encounter an inflated interpretation of the view count.

Cognitive load is moderate: watch, about, browse, four social platforms, QR, and share compete in the introductory sequence. The page begins with confident branding, moves into numerical proof, reaches real story imagery later, and ends without a direct collaboration invitation.

## Technical evidence and minor observations

The CLI detector returned zero findings for both the homepage and component directory. That does not establish accessibility compliance or invalidate the design findings. Screenshots and DOM checks covered 1280x720, 768x1024, and 390x844. No document horizontal overflow, broken images, unlabeled inputs, or captured browser warnings/errors were found. The clipped brand-marquee overflow is intentional.

Secondary mobile intro links are only 20px tall and footer links 17px; increase hit areas in a later accessibility pass. At tablet size, the watch action starts around y=755 beneath a large stacked cover. Some showcase links have generic story titles. Preserve publication and metric update dates instead of implying greater freshness.

## Decisions before refinement

- Choose the business contact destination: the existing Instagram connection, or a dedicated email/business inquiry destination supplied by the owner.
- Keep this pass to contact, truthful metric wording, and desktop crop, or also bring a story preview earlier on mobile.
