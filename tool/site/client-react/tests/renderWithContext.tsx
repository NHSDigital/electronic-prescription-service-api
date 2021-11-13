import * as React from "react"
import {ReactElement} from "react"
import {AppContext, AppContextValue} from "../src"
import {render} from "@testing-library/react"

export const renderWithContext = (ui: ReactElement, contextValue: AppContextValue) => render(
  <AppContext.Provider value={contextValue}>
    {ui}
  </AppContext.Provider>
)
