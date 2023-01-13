import * as React from "react"
import {ReactElement} from "react"
import {AppContext, AppContextValue} from "../src"
import {render, RenderResult} from "@testing-library/react"

export const renderWithContext = (ui: ReactElement, contextValue: AppContextValue): RenderResult => render(
  <AppContext.Provider value={contextValue}>
    {ui}
  </AppContext.Provider>
)
