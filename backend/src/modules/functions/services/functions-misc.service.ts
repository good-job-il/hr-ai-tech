import { Injectable } from "@nestjs/common"

@Injectable()
export class FunctionsMiscService {
  /**
   * Location remains a small domain helper. No third-party compatibility or
   * outbound lookup is performed; callers may refine the default in the UI.
   */
  getLocationFromIP(_ip: string | undefined) {
    return { city: "תל אביב" }
  }
}
