import * as React from "react"
import {PageFooter} from "./pageFooter"
import {useCookies} from "react-cookie"
import {PageHeader} from "./pageHeader"

interface PageProps {
  children?: React.ReactNode
}

export const Page: React.FC = (props: PageProps) => {
  const [cookies] = useCookies()
  const loggedIn = cookies["Access-Token-Set"]
  return (
    <>
      <PageHeader loggedIn={loggedIn}/>
      {props.children}
      <PageFooter/>
    </>
  )
}
