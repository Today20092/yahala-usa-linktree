# Reusable website sections and page layouts

Research date: **2026-11-05**. Scope: first-party public pages from Apple, Notion, Cloudflare, Samsung, Astro's showcase and two of its linked sites; official Refactoring UI material; W3C/WAI/APG; USWDS, Carbon and GOV.UK.

## Findings and evidence boundaries

**Synthesis:** Reuse works best at three levels: dependable components, sections with a clear content purpose, and page-family layouts that arrange those sections around a task. A shared shell and design vocabulary can preserve identity while an editorial page, product page and searchable collection use different compositions.

Here, **common means recurring in this deliberately selected sample**, not most popular across the web. No global ranking, conversion comparison, usability study or claim of inherent intuitiveness follows from these observations. The sample overrepresents established organizations and public marketing pages.

Method: opened the live public URLs using web extraction, followed two links from the Astro showcase to their owners' sites, and inspected extracted headings, descriptions, links and control labels. Sources were accessed on the research date; page content and routes can change. HTML-derived text supports statements about exposed content groups and approximate document order. It does **not** establish visible columns, bento geometry, spacing, typography, color, breakpoints, sticky behavior, animations, reading order after CSS, or actual accessibility. Duplicate text can represent hidden panels, navigation, carousel clones or extraction artifacts. “Not observed” does not mean absent.

Evidence labels used below:

- **Observed:** content or controls exposed by the fetched first-party page.
- **Guidance:** advice in the official source, distinguished from an observed implementation.
- **Synthesis:** recommendations and vocabulary derived for reuse; these require validation in the intended context.

No browser, screenshots, viewport testing or performance measurements were used. Context-mode tools were unavailable; available web tools and bounded local reads were used. No repository code exploration or implementation was needed.

## Concrete first-party examples

### Apple: category browsing plus purchase support

**Observed:** [Apple's iPhone category page](https://www.apple.com/iphone/) has global navigation, category navigation, featured product promotions with separate learning and purchase links, a lineup collection with a comparison destination, and a shopping-benefits group. Trade-in, payment, setup, delivery and specialist assistance appear as distinct supporting topics. Some topics repeat with longer explanations in extraction; their visual disclosure mechanism was not tested.

**Synthesis:** Treat category navigation, a product collection and purchase-support explanations as separate sections. Repeated product-entry anatomy can support comparison while the page changes from discovery to transaction support. The fetched content does not prove Apple's card dimensions or mobile stacking.

### Notion: capabilities, use cases and evidence

**Observed:** [Notion's product page](https://www.notion.com/product) exposes a headline and summary, free-start and demo actions, customer logos, three capability groups around capturing knowledge, finding information and automating work, then linked workflow examples. Customer quotations and adoption claims follow. The footer groups product, resource, company and audience destinations. Repeated metrics in extraction were not counted as separate sections.

**Synthesis:** A capability section answers what the product does; a use-case collection answers where someone would apply it. They can reuse media and action components without sharing the same narrative role. Customer claims are evidence of a proof section, not independently verified proof of outcomes.

### Cloudflare: platform explanation, proof and plan choices

**Observed:** [Cloudflare's homepage](https://www.cloudflare.com/) exposes a platform proposition and free-start action, network explanations, customer logos and an attributed quotation. Later content includes workforce plan alternatives and developer usage/plan information with product-selector buttons. Much of the extracted text represents repeated values; it should not be interpreted as a visible sequence of hundreds of sections.

**Synthesis:** Platform pages may need both conceptual explanation and concrete choice support. Keep marketing claims, product-family selectors and plan comparisons distinguishable. Reuse the comparison structure, not time-sensitive prices or scale claims. The source's unusually repetitive extraction limits conclusions about arrangement.

### Samsung: product families plus switching reassurance

**Observed:** [Samsung's US smartphone category page](https://www.samsung.com/us/smartphones/) provides family destinations, comparison and accessory links, promotions with learn/buy actions, a new-products collection, trade-in messaging, family-specific product entries, a trial destination, related devices, switching help and support. Several promotional headings are empty in extraction; the corresponding image-led content is only partially observable. Location and search controls precede the main category content.

**Synthesis:** Product-family sections can share entry anatomy while carrying different positioning. Switching, trial and support sections address different decision questions from specifications. Neither empty headings nor duplicated copy should be copied as a design pattern.

### Astro showcase: discovery surface, not a layout prescription

**Observed:** [Astro's showcase](https://astro.build/showcase/) exposes site entries linking to external organizations, alongside a site-submission action and the Astro resource/community shell. The fetched list includes Unilever and The Guardian Engineering; both destinations were followed and inspected below.

**Synthesis:** A showcase is a collection of destinations, not evidence that all sites share a template. Inclusion is a first-party showcase listing at the access date, not an independent audit of each site's current technology, performance or accessibility.

### Showcase destination 1: Unilever's corporate homepage

**Observed:** [Unilever](https://www.unilever.com/) exposes extensive grouped navigation before body content. Its navigation describes company, news, brands, sustainability, suppliers and investors. Body content includes investor/results destinations, quick links, and dated news entries carrying a content type and image. For example, the fetched news collection includes research investment and product-innovation stories. Navigation subgroups must not be mistaken for a continuous sequence of homepage body sections.

**Synthesis:** A corporate hub can combine audience-specific shortcuts with an editorial collection. Date, type and title provide a reusable news-entry contract; an investor shortcut has a different task and should not be forced into an identical story card.

### Showcase destination 2: The Guardian Engineering

**Observed:** [The Guardian Engineering](https://theguardian.engineering/) has engineering-specific navigation, a mission statement, a recruitment destination, team imagery and an explanation of engineering values. A latest-posts list exposes titles, author names and dates, followed by blog and RSS destinations.

**Synthesis:** A team/about family can move from identity to values to current work and participation. This is structurally different from a product catalog despite reusing introductions, linked collections and actions. Its date/author list also demonstrates that a collection need not be described as a visual card grid.

## Official design guidance and Refactoring UI context

**Guidance:** [USWDS templates](https://designsystem.digital.gov/templates/) are starting combinations that can be adapted by adding or removing components. [Carbon's patterns overview](https://www.carbondesignsystem.com/building-blocks/core/patterns/overview) distinguishes coded components from patterns that combine components and additional decisions to meet needs. [GOV.UK patterns](https://design-system.service.gov.uk/patterns/) similarly organizes advice around tasks and page types. None supplies a universal marketing-page sequence.

**Observed and guidance:** The [official Refactoring UI public page](https://refactoringui.com/) combines a proposition, testimonials, explanatory material, package choices and FAQs. Its public border-reduction example offers spacing, surface contrast and shadow as alternative separators. Its gallery FAQ describes layout inspiration with room for different styling, rather than a requirement that projects look alike.

**Existing local understanding:** Read `C:/Users/User/.agents/skills/refactoring-ui/references/book-principles.md`, the local original summary of the 2018 book. Relevant themes: begin with the task; establish emphasis; constrain recurring design choices; give content an appropriate width; use spacing to clarify membership; adapt proportions across sizes; and treat imagery as actual content. This is a local secondary summary, not newly verified access to the book. Its pagination differs from the package description on today's public sales page; no edition or page-count equivalence is assumed.

**Synthesis:** Use that understanding to evaluate sections, rather than turn it into mandatory large heroes, identical containers or decorative grids. The public source supports context-dependent treatment, not a particular visual template or a guarantee of usability.

## Reusable pattern taxonomy

The following is **synthesis**. Names describe jobs and content contracts, not a required component library. Sample references are evidence anchors, not claims that their rendered pages use the proposed geometry. “Split” and “bento” are candidate treatments pending visual verification.

| Pattern | Job and minimum content | Useful variations and boundaries | Evidence anchor |
| --- | --- | --- | --- |
| Shell | Orient across pages: brand/home destination, navigation, main region, footer | Global versus local navigation; optional breadcrumbs or contextual sidebar. Keep routes and labels dependable. | [Apple](https://www.apple.com/iphone/), [WAI structure](https://www.w3.org/WAI/tutorials/page-structure/) |
| Hero / introduction | Identify the page and its main proposition or task: heading, concise context, optional action/media | Text-only, media-led or compact task header. Large imagery and multiple actions are optional. | [Notion](https://www.notion.com/product), [Guardian Engineering](https://theguardian.engineering/) |
| Split feature | Explain one benefit with supporting media: heading, explanation, useful illustration or example | Text/media pair; optional action. Side-by-side and alternating sides are proposed visual variants, not observed facts here. | [Notion capability groups](https://www.notion.com/product) |
| Feature grid / bento | Present related capabilities with explicit priority: section heading plus independently understandable items | Equal entries for equal importance; unequal spans only where hierarchy justifies them. A multi-item group alone does not establish a bento layout. | [Samsung family entries](https://www.samsung.com/us/smartphones/) |
| Editorial section | Develop a narrative or explanation: headings, prose, media/captions where needed | Story lead, long-form body, pull quote or related reading. Reading measure may differ from collection width. | [Guardian Engineering](https://theguardian.engineering/), [Unilever](https://www.unilever.com/) |
| Collection / cards | Help choose among destinations: meaningful title, destination and decision-relevant metadata | List, grid, featured item plus list; optional filter/sort/pagination when the collection warrants them. A card is a container, not the collection's purpose. | [Astro showcase](https://astro.build/showcase/), [Unilever news](https://www.unilever.com/) |
| Proof | Support a claim: attributed quotation, customer example, dated metric or supporting source | Logo collection, case-study excerpt or metric. State scope and provenance; a logo alone does not explain an outcome. | [Notion](https://www.notion.com/product), [Cloudflare](https://www.cloudflare.com/) |
| Steps / process | Explain an actual sequence: ordered stages with short descriptions | Overview differs from a live progress indicator. Do not number unrelated benefits. | [USWDS process list](https://designsystem.digital.gov/components/process-list/) |
| Pricing / comparison | Make alternatives comparable: named options and consistent attributes, conditions and actions | Plan summaries or semantic comparison table. Preserve units, billing periods and exclusions. Do not manufacture pricing for a noncommercial page. | [Cloudflare](https://www.cloudflare.com/), [Refactoring UI](https://refactoringui.com/) |
| CTA / next step | Offer the appropriate continuation: clear action label, destination and enough context | Inline link, paired actions of different priority or a closing section. A CTA is an action role, not necessarily a full-width banner. | [Apple](https://www.apple.com/iphone/), [Guardian recruitment](https://theguardian.engineering/) |
| FAQ / disclosure | Answer genuine remaining questions: questions and useful answers | Plain headings first; accordion when selective disclosure helps. Essential eligibility, price or risk information should remain easy to find. | [Refactoring UI FAQ](https://refactoringui.com/), [APG accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/) |
| Forms | Collect information to complete a task: labeled controls, instructions, submission and feedback | Single short form or a question sequence; support error correction and completion. Do not infer behavior from a sign-up button. | [GOV.UK question pages](https://design-system.service.gov.uk/patterns/question-pages/), [WAI notifications](https://www.w3.org/WAI/tutorials/forms/notifications/) |

**Guidance boundary:** [USWDS process-list guidance](https://designsystem.digital.gov/components/process-list/) differentiates high-level sequential explanation from progress/status and recommends other structures for nonsequential content. This distinction is useful even when a marketing section is called “how it works.”

## Page-family recipes

These sequences are **synthesis**, not mandatory stacks or proven conversion funnels. Omit a section when it has no real content or task. The ordering arrow means narrative sequence, not a grid specification.

| Family and main task | Starting composition | How it differs while retaining identity |
| --- | --- | --- |
| Home / link hub: choose a destination | Shared shell → concise identity/introduction → prioritized destinations → optional current/featured content → footer | Destination labels and ranking matter more than a long sales narrative. Use a small introduction if links are the task. |
| Product / feature detail: understand an offering | Shell → proposition → explanatory features/examples → relevant proof → choice/next step → necessary questions | Media can be prominent; include only benefits and proof relevant to this offering. Inspired by the distinct explanation and support groups in the product samples. |
| Category / catalog: compare candidates | Shell → category heading/navigation → featured candidates → family collections → comparison/support destinations | Repeated entry fields support choice; category structure can vary with inventory. Apple and Samsung provide content precedents. |
| About / team: understand people and purpose | Shell → identity/mission → narrative and people → values/current work → participation/contact | Editorial content needs more reading space and fewer repetitive actions. Guardian Engineering provides a content precedent. |
| Stories / resources: find a relevant item | Shell → collection heading/context → search or filters if useful → results and metadata → pagination/more → recovery states | Put discovery controls near results; preserve current criteria when moving between results and detail. This behavior is recommended, not tested on the sampled sites. |
| Article / case study: read and evaluate | Shell → title/context/metadata → structured body and media → relevant related items → optional next action | Narrow prose and wider supporting media can coexist. Avoid inserting promotional blocks that obscure reading. |
| Plans / comparison: choose on explicit criteria | Shell → decision context → options → detailed comparable attributes → conditions/questions → action | Criteria and terms determine structure; decorative differences must not substitute for comparable information. |
| Contact / service form: complete a submission | Shell → task and requirements → labeled fields → submit → confirmation or correction path | Keep the task focused. Long or conditional services may need question pages rather than a marketing-page layout. |

**Guidance:** [GOV.UK question pages](https://design-system.service.gov.uk/patterns/question-pages/) starts from one question per page for its service context and advises testing before adding progress indicators. This is a useful counterexample to forcing all forms into a single promotional template; it is not a blanket rule for a short contact form.

For YaHala, these are candidate families for the known `/`, `/about` and `/stories` routes, respectively: destination hub, editorial/about, and discoverable collection. That mapping follows the task brief, not an audit of current route implementations. It does not authorize a redesign.

## Component, section and layout model

**Synthesis, informed by the [Carbon distinction](https://www.carbondesignsystem.com/building-blocks/core/patterns/overview) and [USWDS flexibility](https://designsystem.digital.gov/templates/):**

| Level | Responsibility | Example | Reuse boundary |
| --- | --- | --- | --- |
| Foundation / token | A recurring visual decision | Type roles, semantic colors, spacing scale, focus treatment | Stable vocabulary across families; values do not determine page order. |
| Component | One bounded semantic or interactive unit | Button, labeled input, disclosure, story entry | Own semantics and states; avoid baking in one page's copy. |
| Section | A meaningful group serving one content purpose | Story collection, feature explanation, FAQ | Own heading, content schema and local arrangement; compose existing components. |
| Layout / page family | Relationships among sections and navigation | Editorial page, catalog, discovery page | Own widths, sequence and contextual framing; allow different content density. |
| Page instance | Actual content and destinations | A particular about page or story | Supply real data and omit unsupported sections. |

Example content contract: a collection has a section heading and entries; an entry has a title, URL and only the metadata needed to choose it. A feature explanation needs a benefit, explanation and appropriate media, not a mandatory badge, statistic, testimonial and button. These contracts are proposed design tools, not new code or schemas.

Extract a reusable section when repeated content needs the same decisions. Do not create a universal section with dozens of switches to accommodate unrelated jobs. A bounded variant such as compact versus media-led introduction is useful only when real content requires it.

## Consistency without identical pages

All recommendations in this section are **synthesis**:

1. **Keep recognizable rules stable:** brand treatment, typography roles, action hierarchy, navigation labels, focus states and related content metadata. Keep shared controls behaving consistently across families.
2. **Let tasks determine composition:** a reading page can have a narrow body; a collection can have a broader result region; a short form can be compact. They need not share hero height, column count, section count or media ratio.
3. **Reuse anatomy before decoration:** a story entry retains title, destination and useful metadata whether rendered in a list or featured collection. Preserve the decision information when changing presentation.
4. **Specify relationships instead of arbitrary sameness:** headings stay associated with their sections; field labels stay with controls; spacing distinguishes within-group from between-group separation. Test the actual content length.
5. **Allow controlled editorial differences:** imagery, emphasis and section order can reflect the subject. Give an exception a content/task reason; do not introduce arbitrary new colors or interactions for novelty.
6. **Validate the composition:** review long titles, missing media, localization, narrow widths and empty results. Consistent tokens cannot rescue an unsuitable information structure.

The official sources support adaptable patterns and differing treatments. They do not demonstrate that any particular token system creates recognition or improves task success for YaHala; those outcomes would require user evidence.

## Accessibility caveats and validation requirements

These are implementation considerations for a future design, **not findings that the sampled sites pass or fail**. WAI tutorials and APG are explanatory guidance; conformance depends on the applicable normative requirements and the completed page.

- **Structure and shell:** use meaningful regions and logically nested headings; provide a way past repeated navigation. Visual font size should not determine heading rank. See [WAI page structure](https://www.w3.org/WAI/tutorials/page-structure/).
- **Responsive composition:** preserve information and functionality under reflow. WCAG's vertical-content reference is a width equivalent to 320 CSS pixels; exceptions exist for content genuinely requiring two-dimensional layout. Test intermediate widths and zoom, not only two device presets. See [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
- **Feature/bento arrangements:** synthesis: keep source order meaningful when visual cells rearrange, let text grow, and avoid fixed-height cropping of important copy. The word “bento” carries no accessibility semantics.
- **Contrast and imagery:** test actual foreground/background combinations, including overlays. Normal text generally needs 4.5:1; large text 3:1. Large means at least 18pt regular or 14pt bold, not simply any heading. The criterion has defined exceptions. See [Contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- **Collections and actions:** synthesis: use links for destinations and buttons for actions; avoid nested interactive controls in clickable cards. Give repeated links sufficient accessible context. Test keyboard focus and a meaningful reading order.
- **FAQ accordions:** APG specifies heading-contained buttons, expanded state, controlled-panel association, and keyboard operation. Avoid excessive region landmarks. A visually styled question list does not establish an accordion implementation. See [APG accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/).
- **Motion and proof marquees:** provide control over automatic carousel movement; WAI discusses pausing on hover/focus. Synthesis: also accommodate reduced-motion preferences in a future implementation. A visible pause label alone does not prove working behavior. See [WAI carousel animations](https://www.w3.org/WAI/tutorials/carousels/animations/).
- **Comparison:** express header/data relationships in actual tables where information is tabular; WAI explains header cells and scope. Synthesis: preserve those associations in a narrow-screen treatment rather than replacing them with unlabeled values. See [Tables with one header](https://www.w3.org/WAI/tutorials/tables/one-header/).
- **Forms:** associate controls with labels rather than relying on placeholders. Provide clear submission results and actionable error feedback; associate errors with fields and make dynamic notifications available to assistive technology. See [Labeling controls](https://www.w3.org/WAI/tutorials/forms/labels/) and [User notification](https://www.w3.org/WAI/tutorials/forms/notifications/).
- **Discovery states:** synthesis: distinguish first-use empty, loading, failed and filtered-zero-result states. Retain a recovery path and usable filters; avoid treating all absence as an empty collection. [Carbon's overview](https://www.carbondesignsystem.com/building-blocks/core/patterns/overview) identifies these as separate pattern concerns.

## Actionable use and stopping point

**Synthesis:** Before implementing a page, record its primary task, page family, required content, relevant sections and next destination. Start with the smallest composition that serves that task. Reuse the existing project's primitives and tokens, then add a section only when its content contract is real. Check reading order and states before adding decorative variation. When a reference's appearance matters, schedule separate rendered inspection at relevant widths; this research cannot supply visual measurements.

No site files, dependencies, shared settings or skills were changed. Build, UI validation and runtime checks were not applicable to this research-only artifact. Links were opened during research, but future availability, current technology and real-world interaction remain outside the evidence.

## Skill integration and verification

The research was subsequently integrated into the Rulesync-owned shared `web-ui-accessibility` skill on 2026-11-05. Its entrypoint now routes section/layout decisions to `references/sections-layouts.md` and evidence questions to `references/research-basis.md`. The section guide adds the reuse layers, 12 section types, eight page-family starting compositions, shared section contracts, a cross-page CTA example, action hierarchy, applied Refactoring UI principles and optional Astro composition guidance. Existing accessibility requirements and manual invocation policy were preserved. Current Astro and Rulesync documentation was queried through Context7 during integration.

Generation was previewed with global scope, skills only and deletion disabled; its plan contained only this skill. Generation succeeded for Codex, Claude Code, DeepSeek Harness and Grok Build. Rulesync check reported `upToDate: true`; the shared configuration checker passed for all four targets and retained Orca ownership boundaries. All 10 relative links across the six canonical Markdown files resolved. The generic skill validator does not accept the existing `targets` and `disable-model-invocation` management fields; validation of the core content excludes those fields, while separate assertions preserve their original values.

No site implementation or deployment was performed. No site build, UI regression suite, rendered visual audit or usability test was run. These checks validate the skill package and synchronization, not the design quality of a future implementation. Existing agent sessions may need a restart to discover the updated files.

## Dated source register

Every public source below was accessed **2026-11-05**. “Live extraction” means retrieved page text, not a visual or interactive audit. Titles identify destinations; marketing claims and prices are intentionally not treated as independently verified facts.

| ID | Owner and source | Evidence / use |
| --- | --- | --- |
| A1 | Apple — [iPhone](https://www.apple.com/iphone/) | Live extraction: category navigation, promotions, lineup, shopping support. |
| N1 | Notion — [Product](https://www.notion.com/product) | Live extraction: proposition, capabilities, workflows, proof, grouped footer. |
| C1 | Cloudflare — [Homepage](https://www.cloudflare.com/) | Live extraction: platform explanation, proof, plan alternatives; repetitive text limits arrangement claims. |
| S1 | Samsung US — [Smartphones](https://www.samsung.com/us/smartphones/) | Live extraction: product families, comparison, trial, switching/support; some headings unavailable. |
| AS1 | Astro — [Showcase](https://astro.build/showcase/) | Live extraction: external entries and submission; provenance for U1/G1 links. |
| U1 | Unilever — [Global homepage](https://www.unilever.com/) | Followed from AS1; live extraction of grouped navigation, body shortcuts and news. |
| G1 | The Guardian — [Engineering](https://theguardian.engineering/) | Followed from AS1; live extraction of mission, recruitment, values and posts. |
| R1 | Refactoring UI — [Official public page](https://refactoringui.com/) | Live extraction: public design tactic, package/FAQ structure and gallery explanation. |
| R2 | Local — `C:/Users/User/.agents/skills/refactoring-ui/references/book-principles.md` | Read 2026-11-05; existing secondary book understanding, not a fetched public source. |
| D1 | USWDS — [Templates](https://designsystem.digital.gov/templates/) | Official guidance: adaptable combinations. |
| D2 | USWDS — [Process list](https://designsystem.digital.gov/components/process-list/) | Official guidance: sequential explanation versus progress/navigation. |
| D3 | IBM Carbon — [Patterns overview](https://www.carbondesignsystem.com/building-blocks/core/patterns/overview) | Official guidance: patterns versus components; original `/patterns/overview/` redirects here. |
| D4 | GOV.UK — [Patterns](https://design-system.service.gov.uk/patterns/) | Official guidance: task and page-type patterns. |
| D5 | GOV.UK — [Question pages](https://design-system.service.gov.uk/patterns/question-pages/) | Official guidance and example: focused service questions and progress decisions. |
| W1 | W3C WAI — [Page structure](https://www.w3.org/WAI/tutorials/page-structure/) | Semantic regions and heading relationships. |
| W2 | W3C APG — [Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/) | Widget semantics, states and keyboard interaction. |
| W3 | W3C WAI — [Understanding reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) | Explains SC 1.4.10 and exceptions. |
| W4 | W3C WAI — [Understanding contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | Explains SC 1.4.3 thresholds and definitions. |
| W5 | W3C WAI — [Labeling controls](https://www.w3.org/WAI/tutorials/forms/labels/) | Accessible form names and label association. |
| W6 | W3C WAI — [User notification](https://www.w3.org/WAI/tutorials/forms/notifications/) | Form completion, errors and feedback. |
| W7 | W3C WAI — [Carousel animations](https://www.w3.org/WAI/tutorials/carousels/animations/) | Automatic motion control and pause behavior. |
| W8 | W3C WAI — [Tables with one header](https://www.w3.org/WAI/tutorials/tables/one-header/) | Programmatic table header relationships. |
