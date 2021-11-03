import * as React from "react"
import PrescriptionSearch from "../components/prescription-tracker/prescriptionSearch"

interface SearchPageProps {
  baseUrl: string
  prescriptionId?: string
}

const SearchPage: React.FC<SearchPageProps> = ({
  baseUrl,
  prescriptionId
}) => {
    return <>
        <PrescriptionSearch
            baseUrl={baseUrl}
            prescriptionId={prescriptionId}
        />
    </>
}

export default SearchPage