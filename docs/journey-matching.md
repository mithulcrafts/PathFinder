# Journey match scores

Search results may include `journeyMatch` on each returned journey. The backend uses the
verified Clerk identity, not an identity supplied in the request body. Existing text
and voice query requests already attach the Clerk bearer token.

## Meaning and calculation
Scores compare the signed-in user's saved Neo4j journey with the saved journey of
each search-result owner. Search relevance and journey similarity are different:
search chooses the candidates; this score compares the people’s recorded journeys.

This is deterministic weighted Jaccard feature overlap:
- Skills: 40%
- Goal topics and subtopics: 25%
- Normalized experience text terms: 20%
- Directed transition feature pairs (source skills/title terms to destination features): 15%

A dimension is omitted unless both journeys contain features for it. Remaining
weights are renormalized. Scores are rounded to whole percentages. Zero is valid;
100 means identical compared feature sets, not identical lives. This is not a
probability, semantic embedding model, graph-isomorphism proof, or guarantee of success.

Both journeys need at least one experience with meaningful text or skills.
Self, anonymous, missing-profile, insufficient-data, and database-error cases have
no score. The UI never substitutes a made-up match. Errors do not fail the underlying
search. The response includes a component breakdown and computation timestamp, but
does not expose the signed-in user's raw graph or proofs.

## Freshness and limits
Graphs are read on each search; save changes then search again to refresh.
"Real-time" means request-time calculation, not live background streaming.
Responses use `Cache-Control: private, no-store` and vary on Authorization.

To bound work, scoring reads at most 20 candidate users, 50 goals and 100 latest
experiences per user, 30 ordered skills per experience, and 200 directed edges
within those selected experiences. Query timeout is five seconds. Experience text
is limited to 12,000 characters per experience; transition features use up to 12
skills and eight title terms per endpoint. Therefore larger graphs can be truncated,
and this simple lexical model is not yet empirically calibrated.

## Validation
- `cd backend && npm ci && npm run build && npm test`
- `cd frontend && npm ci && npm run typecheck && npm test && npm run build`
- Regression coverage includes exact/disjoint/partial overlap, directionality,
  normalization, punctuation-only input, missing data, weight normalization, privacy,
  candidate caps, authentication gating and session/read/close failures.
- Deployment requires both backend and frontend updates. A source branch push is
  not confirmation that either live service has been updated. No new secrets or
  infrastructure are required.
