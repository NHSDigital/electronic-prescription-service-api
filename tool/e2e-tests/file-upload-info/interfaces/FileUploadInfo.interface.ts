import {FileUploadType} from "../../enums/FileUploadType.enum";

export interface FileUploadInfo {
  readonly fileName: string,
  readonly filePath: string,
  readonly uploadType: FileUploadType
}