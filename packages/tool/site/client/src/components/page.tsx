import * as React from "react"
import {PageFooter} from "./pageFooter"
import {useCookies} from "react-cookie"
import {PageHeader} from "./pageHeader"

export const Page = (props: {children: React.ReactNode}) => {
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
