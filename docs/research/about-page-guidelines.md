# Research: creator About Page guidelines

Date: 2026-11-05

Scope: introduce Haytham and YaHala, build understanding and trust, and end with a contact CTA. Research only; no UI changes.

## Project context

- Follow the existing research-note convention in this directory. [CONTEXT.md](../../CONTEXT.md) defines the About Page as primarily for viewers and secondarily for potential partners.
- The [earlier research note](about-haithem-page.md#confirmed-decisions-after-research) records **Haithem Alqahaf** as the confirmed English display name and excludes featured videos and partner logos. This brief's “Haytham” spelling does not establish a replacement. Retain the confirmed spelling unless the owner changes it; use one consistent brand spelling in published copy.
- Current [site content](../../src/data/site.yaml) provides an origin story, mission, viewer benefits, and selection principles. Treat these as project-provided material, not independently verified biography. This note neither changes nor revalidates those claims.

## Evidence from primary sources

1. **Answer identity and purpose immediately.** NN/g's original usability research found that visitors look to top-level About pages for foundational answers before deciding whether to engage further. A concise summary should stand on its own. [NN/g, About Us summaries, 2015](https://www.nngroup.com/articles/about-us-summaries/).
2. **Trust depends on clarity and credible specifics.** NN/g's three research rounds included more than 70 participants; users investigated purpose, values, history, and contact information. They appreciated understandable content, realistic photographs, storytelling, and ways to reach a person. This is corporate-site research, mostly on desktop, rather than a controlled test of creator pages or YaHala's audience. [NN/g, About Us research, 2019](https://www.nngroup.com/articles/about-us-information-on-websites/).
3. **Content should serve a visitor's task.** GOV.UK asks publishers to identify who visitors are, what they need to do, and why, using evidence rather than assumptions. Applied here, prospective tasks are deciding whether to follow the work, suggest a story, or discuss collaboration; these remain hypotheses until checked with YaHala's visitors. [GOV.UK, Identify user needs](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/plan-manage-content/identify-user-needs/).
4. **Creator example: identity before chronology.** Ali Abdaal's own About page opens with his identity and roles, then quick facts, then his creator journey. This demonstrates a usable editorial pattern, not evidence of conversion performance. [Ali Abdaal, About](https://aliabdaal.com/about/).
5. **Creator example: explain the audience benefit.** James Clear's own page introduces his work, explains how it benefits readers, and provides routes into that work and a speaking inquiry. Borrow the explicit benefit and relevant next step; neither its length nor its promotional claims establish a requirement for YaHala. [James Clear, About](https://jamesclear.com/about).

Sources were browsed on the date above. Older research dates are stated deliberately; current availability does not make a study recent. Creator pages are first-party observations, not usability studies. No source establishes an optimal word count or proves the narrative order below.

## Design recommendations: narrative order

These are editorial judgments informed by the evidence, not published research findings.

1. **Meet Haithem.** Start with his name, his role behind YaHala, a real portrait, and one plain sentence about the stories and people viewers will encounter. Make the host–brand relationship explicit before a biography.
2. **Why I started.** Use a short first-person origin: the need he noticed, a specific turning point, and why community storytelling became his work. Use only approved personal details; avoid filling gaps with inferred motivations.
3. **What YaHala stands for.** Explain what the welcome means to him and the practical purpose of the channel. Connect values to observable choices instead of broad claims about inspiration or impact.
4. **What viewers gain.** Summarize the existing benefits: useful place and business guidance, people's journeys, and a closer view of Arab American communities. A modest inline link to the Story Browser can support exploration without introducing a featured-video section.
5. **How stories are chosen.** Briefly explain the existing selection principles in everyday language. Use one approved example within the prose if helpful; do not add logos, unsupported reach figures, testimonials, or guaranteed business outcomes.
6. **Get in touch.** End with a warm invitation for a story suggestion or collaboration and one primary **Contact YaHala** link to the actual contact destination. Explain what to send: a short introduction, location, and idea. State response timing only if the team can support it. Verify the destination before publishing; do not invent an inbox or imply every submission will be featured.

Use short paragraphs, descriptive section headings, and a consistent first-person voice for personal experiences. Remove repeated mission statements before adding more sections. The contact ending follows this task's goal; the earlier note's watch/follow ending is not the recommendation here.

## Accessibility guidance for implementation

- **Structure:** use a descriptive page title, one clear page H1, and logically nested section headings. Heading markup must reflect meaning, not font size. [WAI, Headings](https://www.w3.org/WAI/tutorials/page-structure/headings/).
- **Words and links:** use concise language and destination-specific link text such as “Contact YaHala,” rather than “Click here.” Keep the introduction available as text; if video is ever added, provide captions and an appropriate transcript. [WAI, Writing for accessibility](https://www.w3.org/WAI/tips/writing/).
- **Photography:** describe an informative portrait's purpose briefly; use empty alt text for decorative or text-redundant imagery. Do not place the essential biography only inside an image. [WAI, Alt decision tree](https://www.w3.org/WAI/tutorials/images/decision-tree/).
- **Contact interaction:** preserve visible keyboard focus, sufficient contrast, and identifiable links. If contact uses a form, provide associated labels and clear success/error feedback, without relying only on color. [WAI, Designing for accessibility](https://www.w3.org/WAI/tips/designing/).
- **Touch targets:** meet WCAG 2.2 AA's 24-by-24 CSS-pixel minimum or its specified spacing/equivalent/other exceptions; larger CTA padding is a design choice. [WAI, Understanding target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

## Review boundary

Before publishing, check factual approval and spelling, the contact destination, mobile reading order, keyboard operation, and screen-reader heading/link navigation. These are recommended implementation checks, not checks performed during this research. No UI, runtime behavior, or conversion results were tested.
