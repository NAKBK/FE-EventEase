# PERUBAHAN: Changes from the Proposal

This file records where the frontend implementation differs from the qualifying-round proposal (EXSUM, Team NAKBK), and why. Each change is one entry with four parts:

- **Proposal:** what the proposal said.
- **Change:** what was built instead.
- **Reason:** why the change was made.
- **Impact on the core problem:** what it means for the gap the proposal targets (BAB I): the distance between a user's personal needs, the information organizers provide, and the actual conditions at the event.

Reasons are taken from the team's planning documents and from decisions made in the backend, which are explained further in the [BE-EventEase docs](https://github.com/NAKBK/BE-EventEase/tree/main/docs). The core loop (Need, Match, Commit, Verify, Improve) is implemented end to end.

## Summary

| No. | Area | Type |
| --- | --- | --- |
| 1 | Match weights | Adjusted |
| 2 | Natural-language needs input | Not built |
| 3 | Route, drop-off, and seating recommendation | Not built |
| 4 | Venue data source | Adjusted |
| 5 | Supporting documents for organizers | Replaced |

## Entries

### 1. Match weights are provisional, not AHP-derived

- **Proposal:** Base weights come from an AHP pairwise comparison done with a small panel of users before Hack Day, then personalized from each user's checklist.
- **Change:** The panel study was not run. The backend uses fixed, documented weights that are raised for attributes the user marks as required. The frontend shows the score and per-attribute breakdown returned by the backend, together with the weight version (`provisional-v1`) and a note that it is provisional.
- **Reason:** No real pairwise comparison results exist yet, and the planning documents state that weights must not be presented as AHP-based until they do. Backend: see ADR-0003 and ADR-0006.
- **Impact on the core problem:** Personalization still works, since different checklists give different scores and breakdowns for the same event. What is missing is the research backing for the exact weights, which is labeled instead of hidden.

### 2. No natural-language needs parser

- **Proposal:** An optional LLM/NLP Needs Parser converts a free-text description of mobility needs into structured attributes.
- **Change:** Needs are set only through the checklist: six required or not-required choices plus a walking distance tolerance (short, moderate, any).
- **Reason:** The proposal marks the parser as optional, and the planning documents treat the checklist as the authoritative input, so the parser was left out.
- **Impact on the core problem:** Needs are still described by function, not by diagnosis. Users cannot yet describe their needs in their own words.

### 3. No route, drop-off, or seating recommendation

- **Proposal:** An optional spatial matching step uses a digital graph of the venue to recommend an accessible route, the best drop-off point, and the best seat.
- **Change:** Not built. The event page shows the organizer's claim for each of the seven attributes (including the claimed walking distance in meters) and the match breakdown. The attendee home page has a map of event locations, and organizers can optionally pin the venue location when registering an event.
- **Reason:** The planning documents allow this only if a verified venue graph or curated route dataset exists, and none does. Routes are not to be inferred from the seven venue attributes.
- **Impact on the core problem:** Users learn whether an event fits them, but not how to move inside the venue. The map shows location only.

### 4. Venue data comes from organizers and demo data, not open data

- **Proposal:** Initial venue data is seeded from DKI Jakarta's accessibility infrastructure open data, adapted from a subset of A11yJSON, and completed by organizer input.
- **Change:** Events in the app are demo data or entered by organizers. Each claim shows its source (organizer claim, open data, or demo data) and the date it was recorded. The open data import was not built (Backend: BE-API-016 is not started).
- **Reason:** The planning documents leave the exact dataset, its license, and its mapping to the seven attributes undecided.
- **Impact on the core problem:** Coverage of real Jakarta venues is limited to what organizers register and to the demo events.

### 5. Event photos replace supporting documents

- **Proposal:** Organizers upload supporting documents when registering an event, and the registration list shows items with a "Need Document" status.
- **Change:** The registration form has an optional photo upload instead. Document upload and the "Need Document" status were not built.
- **Reason:** The backend accepts image uploads only (BE-API-017), and the planning documents rank media uploads as low priority.
- **Impact on the core problem:** Claims can be illustrated with photos but not backed by documents.
