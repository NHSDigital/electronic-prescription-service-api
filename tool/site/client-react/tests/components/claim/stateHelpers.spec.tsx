import {mergeState, sparseArray} from "../../../src/components/claim/stateHelpers"

test.each([
  [
    "primitives",
    false,
    true,
    true
  ],
  [
    "shallow objects",
    {A: "a", B: "b"},
    {A: "c"},
    {A: "c", B: "b"}
  ],
  [
    "shallow arrays",
    ["a", "b", "c"],
    sparseArray(1, "z"),
    ["a", "z", "c"]
  ],
  [
    "nested stuff",
    {A: ["aaa", "bbb", "ccc"], B: ["ddd", "eee"]},
    {A: sparseArray(2, "zzz")},
    {A: ["aaa", "bbb", "zzz"], B: ["ddd", "eee"]}
  ]
])("mergeState handles %s", (_desc, prevState, change, mergedState) => {
  expect(mergeState(prevState, change)).toEqual(mergedState)
})
