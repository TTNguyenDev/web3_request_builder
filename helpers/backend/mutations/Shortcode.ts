import { runMutation } from "../GQLClient"
import {
  CreateShortcodeDocument,
  CreateShortcodeMutation,
  CreateShortcodeMutationVariables,
  DeleteShortcodeDocument,
  DeleteShortcodeMutation,
  DeleteShortcodeMutationVariables,
} from "../graphql"
import { HoppRESTRequest } from "~/data"

type DeleteShortcodeErrors = "shortcode/not_found"

export const createShortcode = (request: HoppRESTRequest) =>
  runMutation<CreateShortcodeMutation, CreateShortcodeMutationVariables, "">(
    CreateShortcodeDocument,
    {
      request: JSON.stringify(request),
    }
  )

export const deleteShortcode = (code: string) =>
  runMutation<
    DeleteShortcodeMutation,
    DeleteShortcodeMutationVariables,
    DeleteShortcodeErrors
  >(DeleteShortcodeDocument, {
    code,
  })
