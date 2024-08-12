import {Dispatch, SetStateAction} from "react"

export function readPrescriptionsFromFiles(
  // eslint-disable-next-line no-undef
  files: FileList,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prescriptionFilesUploaded: Array<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setPrescriptionFilesUploaded: Dispatch<SetStateAction<Array<any>>>
): void {
  for (let i = 0; i < files.length; i++) {
    // eslint-disable-next-line no-undef
    const reader = new FileReader()
    reader.onload = event => {
      const result = event.target.result
      prescriptionFilesUploaded.push(result)
      setPrescriptionFilesUploaded(prescriptionFilesUploaded)
    }
    reader.readAsText(files[i])
  }
}
