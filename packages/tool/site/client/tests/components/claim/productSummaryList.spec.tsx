import {render} from "@testing-library/react"
import * as React from "react"
import ProductSummaryList from "../../../src/components/claim/productSummaryList"
import {staticProductInfo} from "./props"

test("Renders correctly", async () => {
  const component = <ProductSummaryList {...staticProductInfo}/>
  const {container} = render(component)
  expect(container.innerHTML).toMatchSnapshot()
})
