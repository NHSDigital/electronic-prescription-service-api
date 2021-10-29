import {mergeState, sparseArray} from "../../../src/components/stateHelpers"

test.each([
  [
    "primitive updates",
    false,
    true,
    true
  ],
  [
    "shallow object updates",
    {A: "a", B: "b"},
    {A: "zzz"},
    {A: "zzz", B: "b"}
  ],
  [
    "shallow array updates",
    ["a", "b", "c"],
    sparseArray(1, "zzz"),
    ["a", "zzz", "c"]
  ],
  [
    "nested updates",
    {A: ["a", "b", "c"], B: ["d", "e"]},
    {A: sparseArray(2, "zzz")},
    {A: ["a", "b", "zzz"], B: ["d", "e"]}
  ],
  [
    "multiple updates",
    {A: {w: "1", x: "2"}, B: {y: "3", z: "4"}},
    {A: {x: "999"}, B: {y: "999"}},
    {A: {w: "1", x: "999"}, B: {y: "999", z: "4"}}
  ]
])("mergeState handles %s", (_desc, prevState, newPartialState, mergedState) => {
  expect(mergeState(prevState, newPartialState)).toEqual(mergedState)
})
