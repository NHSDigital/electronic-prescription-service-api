import * as React from "react"
import {ReactNode} from "react"

interface PreProps {
  children: ReactNode
}

const Pre: React.FC<PreProps> = ({
  children
}) => {
  const preStyle: React.CSSProperties = {
    whiteSpace: "break-spaces",
    overflowWrap: "anywhere"
  }
  return (
    <pre style={preStyle}>
      {children}
    </pre>
  )
}

export default Pre
