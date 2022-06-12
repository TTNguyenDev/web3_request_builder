import { HoppRESTRequest } from "~/data"

/**
 * Defines how a Teams request is represented in TeamCollectionAdapter
 */
export interface TeamRequest {
  id: string
  collectionID: string
  title: string
  request: HoppRESTRequest
}
