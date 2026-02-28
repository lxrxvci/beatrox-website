# Sprint 1 Client Request Intake System (Scaffold)

Status: Scaffold for mandatory enforcement  
Pillar: Load Reduction  
Sprint: 1

---

## Enforcement Rule

All new client requests must be logged through this intake structure before any commitment is made.

- No informal commitments
- No scope confirmation in chat/text without intake record
- Every request must be tagged

## Required Triage Tag

Select exactly one:

- Included
- Change Order
- New Proposal

## Intake Form Fields (Required)

- Request ID: [Auto/manual]
- Date received:
- Client:
- Event/project:
- Requested change:
- Deadline requested:
- Impacted deliverables:
- Estimated effort:
- Estimated cost impact:
- Triage tag: [Included/Change Order/New Proposal]
- Decision owner:
- Decision date:

## Decision Logic (Scaffold)

- Included: fits signed scope and does not alter timeline/cost materially
- Change Order: outside scope but attached to active project
- New Proposal: net-new work requiring separate proposal

## Communication Template (Internal)

- Intake received and logged
- Classification selected
- Next action and owner
- Client response window

## Compliance Checklist

- [ ] Every request has a Request ID
- [ ] Every request has one triage tag
- [ ] No unlogged commitments this sprint
- [ ] Decision owner and date captured
