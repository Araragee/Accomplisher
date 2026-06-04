## BOLT JOURNAL
## 2025-06-04 - Replace nested loop with Hash Map
**Learning:** Found a classic O(N*M) nested loop pattern disguised as `Array.filter()` inside `Array.map()`. When computing team statistics, it was filtering the entire WFH and accomplishment lists for each individual member.
**Action:** Replaced `array.filter()` inside `array.map()` with a pre-computed dictionary/hash map to achieve O(N + M) complexity instead of O(N * M).
