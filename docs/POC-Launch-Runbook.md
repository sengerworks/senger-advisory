# POC Launch Runbook

This is the operating sequence for a real Organizational Capacity Platform proof of concept. It
uses the same governed workflow as a paid diagnostic; only the commercial entitlement is no-charge.

## Canonical production destination

- Give sponsors and participants only `https://sengeradvisory.com/poc` as the reusable entry link.
- That short address resolves to the private client workspace at
  `https://sengeradvisory.com/workspace/`; invitation acceptance and authentication return there as
  well.
- Never send a localhost, Netlify deploy-preview, Clerk-hosted, Advisor Console, or Platform
  Operations URL to a client participant.
- The destination is deliberately absent from public navigation and excluded from search indexing.

## Before the sponsor enters

- Complete the confirmation and provisioning sequence in `POC-Client-Enrollment-Protocol.md`.
- Confirm the client has one Clerk organization and one accountable executive sponsor.
- Confirm the sponsor is an organization administrator and Senger Advisory is environment-allowlisted
  for Platform Operations.
- Confirm the runtime database, Clerk, OpenAI, and diagnostic-response encryption settings are present.
- Confirm migrations through `038_diagnostic_v2_evidence_source_bridge.sql` are applied and the real
  Postgres RLS test passes.
- Establish the POC record in Platform Operations and assign the advisor for a bounded period.
- Agree on the leadership decision, target completion date, five-to-ten POC participant range, and
  stop conditions before invitations are sent. The paid full diagnostic may support up to fifty.
- Confirm optional assistance is available during framing and design, and establish the required
  30-minute Revelation Session booking path.

## Human-support contract

1. **Framing assistance:** optional. The sponsor may request help without losing saved work or
   blocking approval of the Context Brief.
2. **Design assistance:** optional. The sponsor may request help with perspective coverage or
   question sensitivity without creating a meeting gate.
3. **Revelation Session:** required. Schedule after synthesis approval; keep the Executive Capacity
   Brief locked until the steward releases it shortly before or during the meeting.

The detailed authority, scope, confidentiality, dual-output, and state contract is maintained in
`docs/Stewarded-POC-Operating-Model.md`. Until each product gate is implemented, the steward records
the control in the approved POC operating record and does not represent it as automated enforcement.

## Golden path

1. **Frame:** the sponsor defines the system being examined and approves the six-question Context
   Brief, using optional steward assistance only when useful.
2. **Design:** the sponsor approves perspective coverage and records any accepted gaps without
   storing participant identity in the plan. Optional steward assistance does not block progression.
3. **Frame and protocol:** the advisor approves Diagnostic Frame v2 and Protocol v2; Platform
   Operations explicitly activates v2 before collection begins.
4. **Invitations:** the sponsor assigns approved slots and sends participant invitations.
5. **Confidential participation:** each participant accepts the privacy notice, completes the common
   written protocol and any bounded clarification, and receives an unambiguous submission receipt.
6. **Evidence governance:** the advisor prepares de-identified evidence, resolves disclosure risk,
   and approves or excludes every evidence record.
7. **Synthesis:** the platform drafts the finding; the advisor validates the organizational
   constraint, competing explanations, uncertainty, and intervention direction.
8. **Dual outputs:** the platform prepares the locked Executive Capacity Brief and the private
   Steward Revelation Guide; neither is released merely because synthesis is complete.
9. **Revelation:** notify the sponsor, schedule the Revelation Session, and keep the Brief withheld
   until at least five assigned participants have completed, collection is complete, evidence review
   is resolved, steward approval is recorded, and the steward deliberately releases it.
10. **Leadership decision:** the sponsor reviews the finding and three weighted evidence-informed
    Intervention Directions—one recommended first move and two alternatives—then accepts the finding or requests revision and considers the paid
    next step. Detailed intervention design and delivery remain outside the POC.
11. **POC learning:** capture checkpoint feedback separately from diagnostic evidence, complete the
   aggregate scorecard, and record change candidates and the cohort decision. Follow the active
   checkpoint and closeout sequence in `POC-Learning-Protocol.md`.

## Private prospect walkthrough

Use `/workspace/presenter-demo.html` only while signed in as an authorized Senger Advisory platform
operator or active assigned steward. The walkthrough is personally guided, fictional, and entirely
separate from client workspaces. It may be used to show the sponsor, participant, and steward
experiences before a prospect agrees to a POC. Do not describe it as a POC, enter prospect data, or
imply that the illustrative finding or direction weights predict a prospect's outcome.

## Stop conditions

- Stop immediately for any identity-response linkage, cross-tenant exposure, threshold bypass, or
  misleading confidentiality behavior.
- Block release when evidence is pending, disclosure risk is unresolved, the advisor has not approved
  the synthesis, or fewer than five completed perspectives are available.
- Do not manually copy participant answers into sponsor, advisor, POC-feedback, or change-candidate
  records.
- Record every workaround and support intervention; do not silently normalize it as product behavior.

## Rehearsal before the client session

Run one disposable rehearsal on the canonical production domain—not localhost or a deploy preview—
before enrolling the first external client. Use separate real Clerk accounts for operator, sponsor,
steward, and at least five participants.

1. **Operator:** create a disposable POC organization and engagement, confirm the POC entitlement,
   assign the steward, and send the sponsor invitation.
2. **Sponsor entry:** accept the invitation and confirm authentication returns to the private
   workspace rather than Clerk or the public homepage.
3. **Sponsor setup:** complete orientation, scope, six-question Context Brief, AI synthesis review,
   perspective design, coverage review, 18-question sponsor review, and invitations without a
   mandatory opening or design meeting.
4. **Participant collection:** accept five invitations in separate accounts, confirm privacy terms,
   complete the common protocol, verify draft recovery, and receive clear submission receipts.
5. **Threshold behavior:** verify sponsor results remain locked below five completions and that no
   participant answer, excerpt, identity-linked evidence, or individual score is exposed.
6. **Steward work:** confirm the assigned engagement is named, the command center identifies the next
   move, and the steward can finalize the protocol, monitor operational progress, review protected
   evidence, approve synthesis, and prepare both outputs.
7. **Release:** verify the Brief stays locked until evidence and output gates pass and a Revelation
   Session is recorded; deliberately release it and confirm the private Revelation Guide never enters
   the sponsor view.
8. **Closeout:** confirm the sponsor can revisit and download the Brief during the 30-day POC window,
   capture role-specific feedback separately from evidence, and record the POC scorecard and change
   candidates.

### Dress-rehearsal acceptance record

Record the date, disposable organization, build/commit, tester accounts by role, result for each step,
observed support interventions, and every defect or confusing moment in `POC-Dress-Rehearsal-Record.md`.
The rehearsal passes only when:

- all eight steps complete on the canonical domain without database or API repair;
- no severity-1 or severity-2 issue remains open;
- the sponsor and participant paths require no technical explanation;
- optional assistance never behaves as a progression gate;
- the confidentiality floor and deliberate-release controls behave exactly as stated; and
- the public site, sponsor workspace, participant experience, Advisor Console, Platform Operations,
  and private walkthrough use the approved visual system.

After the rehearsal passes, enroll clients sequentially. Do not begin the next client until the prior
client's launch-blocking findings are resolved or explicitly accepted under the change-control rules.
The repeatable technical rehearsal is defined in
`test/poc-five-participant-dress-rehearsal.test.mjs`; the human production rehearsal is the final
market-readiness gate.

The detailed measurement and decision rules remain in `POC-Operating-Protocol.md` and
`POC-Scorecard.md`. Active-cohort support follows `POC-Operating-Support-Playbook.md`.
The versioned opening language follows `POC-Orientation-and-Participant-Terms.md`.
