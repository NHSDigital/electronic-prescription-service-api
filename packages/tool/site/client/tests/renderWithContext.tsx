import * as React from "react"
import {AppContext, AppContextValue} from "../src"
import {render, RenderResult} from "@testing-library/react"

export const renderWithContext = (ui: React.ReactElement, contextValue: AppContextValue): RenderResult => render(
  <AppContext.Provider value={contextValue}>
    {ui}
  </AppContext.Provider>
)
