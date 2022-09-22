import {FileUploadType} from "../enums/FileUploadType.enum";


export interface FileUploadInfo {
    fileName: string,
    filePath: string,
    uploadType: FileUploadType
}