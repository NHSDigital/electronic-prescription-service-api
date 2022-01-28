import {Dispatch, SetStateAction} from "react"

export function readPrescriptionsFromFiles(
  files: FileList,
  prescriptionFilesUploaded: any[],
  setPrescriptionFilesUploaded: Dispatch<SetStateAction<any[]>>
): void {
  for (let i = 0; i < files.length; i++) {
    const reader = new FileReader()
    reader.onload = event => {
      const result = event.target.result
      prescriptionFilesUploaded.push(result)
      setPrescriptionFilesUploaded(prescriptionFilesUploaded)
    }
    reader.readAsText(files[i])
  }
}
