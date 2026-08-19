import { httpClient } from "@/api/client/httpClient"
export const fileService = {
  upload(file: File) {
    const data = new FormData()
    data.append("file", file)
    return httpClient.post<{ file_url: string; filename: string }>("/files", data)
  },
}
