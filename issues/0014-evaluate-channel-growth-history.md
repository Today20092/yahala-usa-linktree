---
status: open
triage: needs-triage
branch: development
---

# 14 — Evaluate useful channel growth and collaboration history

## Context

Requested November 5, 2026: preserve research on showing channel, audience, and
brand growth, possibly as a scrollable history. First determine whether this
helps visitors understand Ya Hala, choose stories, or assess a partnership.
Adding charts is not itself the objective.

Home already shows dated cross-platform video totals and platform bars. About
now has a linked most-watched catalog-story chart. The geographic map and state
bars describe stories and filming locations, not where viewers live. These are
current snapshots, not a historical series.

The June 22, 2026 cross-platform snapshot records 155,359,353 views. It does not
establish unique people reached, followers, or growth. The November 5 YouTube
story-ranking snapshot covers 323 of 324 eligible long-form catalog stories and
uses approximate public counts. Neither snapshot supports invented monthly
trends or a combined unique audience.

## Branch strategy

Continue this sequential follow-up to the current chart work on `development`,
the shared development-preview branch. Preserve concurrent work. Keep any
approved implementation in this dependency chain on the same branch. Production
promotion and deployment remain separate decisions under the repository workflow.

## Decide whether a public history is worthwhile

- Ordinary viewers primarily need interesting stories and a clear way to watch.
  Assess whether growth/history makes those decisions easier; avoid placing an
  analytics dashboard ahead of the content.
- Prospective partners may benefit from credible evidence of sustained audience
  activity and real collaborations. About, near its partnership action, is the
  initial placement to evaluate.
- Compare a compact proof block or dated milestones with a fuller time-series
  chart. Prefer the smallest presentation that answers an actual visitor question.
- If a scrollable history is useful, keep ordinary document scrolling and
  keyboard access. Avoid scroll hijacking, forced horizontal scrolling, or
  hiding the evidence behind animation. Motion is optional and must respect
  reduced motion and the existing pause controls.
- A valid outcome is to keep analytics internal and add no public growth chart.
  Record the reasoning and available viewer/partner feedback instead of assuming
  higher follower counts necessarily improve the website.

## Research and recommendations

### Separate the measurements

| Question | Suitable evidence | Important distinction |
| --- | --- | --- |
| Is channel activity growing? | Views earned per calendar month | A lifetime total is not a monthly series. |
| Is the audience growing? | Subscribers/followers gained and lost per period | Public follower totals may be rounded; views are not people. |
| How many people see the work? | Platform-reported reach or unique viewers for a stated period, when available | Do not sum platform audiences or daily unique counts into a deduplicated audience. |
| Are collaborations expanding? | Distinct verified brands and first-collaboration dates | A logo list without dates cannot establish historical growth; distinguish collaborations from businesses merely featured. |

Recommended first candidate, subject to the usefulness decision: monthly YouTube
views, net subscriber growth, and dated collaboration milestones. Add other
networks only when their data and definitions are available. No fabricated
history, growth percentages, or future projections.

### Collection options

1. **Start with native analytics exports.** YouTube Studio Advanced Mode supports
   report exports. Importing available history can demonstrate a useful chart
   before building an automated integration. Retain the source, period, metric,
   and import date. This is the simplest manual starting point.
   [YouTube export guide](https://support.google.com/youtube/answer/9717005)
2. **Connect YouTube directly for automation.** Owner-authorized Analytics can
   return daily views and subscriber gains/losses. A public Data API key can
   retrieve channel totals, but subscriber counts are rounded; `channels.list`
   costs one quota unit. Use owner-authorized data for long-term history and
   verify storage/refresh requirements before implementing retention.
   [Analytics reference](https://developers.google.com/youtube/analytics/reference),
   [channel statistics](https://developers.google.com/youtube/data/reference/rest/v3/channels),
   [quotas](https://developers.google.com/youtube/data/determine_quota_cost),
   [data-storage policy](https://developers.google.com/youtube/terms/developer-policies)
3. **Metricool Free can support monitoring.** Its documented free plan includes
   basic analytics and 30 days of history. Website API access requires Advanced
   or Custom; a free dashboard is not a free automated website feed. Recheck
   current plans before choosing it.
   [Free-plan limits](https://help.metricool.com/main-differences-between-free-and-paid-plans-bl0v9),
   [API access](https://help.metricool.com/basic-guide-for-api-integration-r97af)
4. **Social Blade is an optional paid public-data source.** Its Business API
   uses paid credits and offers historical statistics. This may reduce collection
   work, but is not required for the first version. The user's reference to
   “social stream” was not confirmed as a particular service; Social Blade is
   one researched option, not an identified existing connection.
   [Official API and pricing](https://socialblade.com/developers)
5. **Instagram and TikTok need separate connections.** Instagram account insights
   require a professional account, tokens, and suitable permissions. TikTok
   Display API access requires developer setup, product approval, and account
   authorization; statistics use the appropriate scopes. Confirm each account's
   actual access and available history rather than promising identical metrics.
   [Instagram insights](https://developers.facebook.com/documentation/instagram-platform/api-reference/instagram-user/insights),
   [TikTok setup](https://developers.tiktok.com/doc/display-api-get-started/),
   [TikTok scopes](https://developers.tiktok.com/doc/tiktok-api-scopes/)

### Small automation candidate

If a public history earns its place, evaluate a daily Cloudflare Worker Cron
Trigger that fetches authorized analytics, stores dated records in D1, and serves
cached aggregate data to the site's existing Cnippet chart patterns. This should
be small enough for free allowances at the expected collection volume, subject
to current limits and account-wide usage. A Worker schedules and stores data;
it does not replace the source API or account authorization.

Keep credentials server-side, preserve source/metric/period information, make
daily imports idempotent, and support corrections to recent reports. On collection
failure, retain the last successful data with its date rather than inventing zeros.
Serve an aggregate read endpoint so visitor traffic does not trigger platform
requests. No new production resources are authorized by this research ticket.

[Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/),
[D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/),
[Cnippet micro charts](https://ui.cnippet.dev/docs/chart-components/micro),
[Cnippet Area Chart](https://ui.cnippet.dev/charts/cartesian/area-chart)

For brand history, first add verified first-collaboration dates to our own
collaboration records. No social API is needed. Do not derive dates from when a
logo was added to the website or imply that a featured business was a paid partner.

## Acceptance criteria

- [ ] Record the visitor question, intended audience, and evidence/reasoning for
      adding public history; choose a compact proof block, history chart, or no
      public addition before building infrastructure.
- [ ] Inventory authorized account access, metric definitions, available exports,
      historical coverage, and collaboration dates. Identify remaining gaps.
- [ ] If useful, propose the smallest factual presentation and placement; use
      real imported data to evaluate it before adding multiple integrations.
- [ ] Choose manual imports or scheduled collection based on actual maintenance
      needs; verify current API permissions, quotas, retention rules, and costs.
- [ ] If implemented, preserve missing-data gaps, report source/date/period,
      distinguish views/followers/reach, and keep platform audiences separate.
- [ ] If implemented, verify Arabic/RTL labels, mobile reflow, keyboard access,
      equivalent text values, contrast, and reduced motion using
      `web-ui-accessibility`; follow the project's validation and preview rules.
- [ ] If usefulness is weak, close with a documented decision to keep existing
      snapshots or internal analytics and add no public chart.

## Dependencies

The current reach-chart work in `development` provides the presentation baseline.
Owner-approved analytics access or exports are needed for historical channel data;
verified dates are needed for collaboration history. These are implementation
prerequisites, not a request for credentials in this ticket.

## Research status

Sources reviewed November 5, 2026. No new account connections, scheduled jobs,
database provisioning, growth implementation, or deployments were performed for
this ticket. Account-specific analytics access and visitor benefit remain
unverified; `needs-triage` is intentional.
