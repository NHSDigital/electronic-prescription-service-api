import {render} from "@testing-library/react"
import pretty from "pretty"
import * as React from "react"
import ProductSummaryList from "../../../src/components/claim/productSummaryList"
import {staticProductInfo} from "./props"

test("Renders correctly", async () => {
  const component = <ProductSummaryList {...staticProductInfo}/>
  const {container} = render(component)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})
