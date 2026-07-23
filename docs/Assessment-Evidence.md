# Assessment Evidence Infrastructure v1

## Purpose

The evidence layer tests whether the Organizational Capacity Assessment is useful and
directionally accurate before stronger benchmark or validation claims are made. Participation
is optional and is kept separate from contact or lead-generation workflows.

## Consent boundary

The assessment runs entirely in the browser by default. No evidence request is made unless a
participant selects the anonymous-evidence consent control. A participant can still complete,
print, and discuss the assessment without consenting.

## Accepted data

Every accepted event includes a random session identifier, assessment version, and scoring
version. Depending on the event, the endpoint accepts:

- assessment start, abandonment domain, completion, and save-or-print report actions;
- elapsed time rounded to seconds;
- six aggregate domain scores, the overall index, and interpretation band;
- optional organization-size, respondent-perspective, and growth-pressure categories; and
- an optional 1–5 accuracy rating and up to 1,000 characters of written feedback.

The endpoint does not accept individual question responses, names, email addresses,
organization names, or arbitrary additional fields. Request IP address, user agent, and
referrer are not copied into evidence records.

## Storage and access

Validated records are written as immutable, server-generated keys in the site-scoped
`assessment-evidence` Netlify Blobs store. Records are grouped by receipt date and can be
browsed or downloaded by an authorized site administrator through Netlify. There is no public
read endpoint.

Review retention at least annually and whenever the assessment or scoring version changes
materially. Delete event-level records no later than 24 months after receipt unless they have
already been converted into aggregate, de-identified research summaries. Delete records
earlier when they no longer contribute to model evaluation or evidence development.

## Interpretation

Lifecycle counts help identify completion and abandonment patterns. Score distributions and
accuracy ratings support item and band calibration hypotheses. They do not establish
psychometric validity, representative norms, causality, or external benchmarks. Any scoring
change should receive a new scoring version and be documented before deployment.

## Local verification

Run `pnpm test` for the data-contract tests. Use Netlify Dev to exercise the function and Blobs
integration locally; a basic static HTTP server will continue to run the assessment but cannot
serve the evidence endpoint.
