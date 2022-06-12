import { pluck, distinctUntilChanged, map, filter } from "rxjs/operators"
import { Ref } from "@nuxtjs/composition-api"
import DispatchingStore, { defineDispatchers } from "./DispatchingStore"
import {
  FormDataKeyValue,
  HoppRESTHeader,
  HoppRESTParam,
  HoppRESTReqBody,
  HoppRESTRequest,
  RESTReqSchemaVersion,
  HoppRESTAuth,
  ValidContentTypes,
} from "~/data"
import { HoppRESTResponse } from "~/helpers/types/HoppRESTResponse"
import { useStream } from "~/helpers/utils/composables"
import { HoppTestResult } from "~/helpers/types/HoppTestResult"
import { HoppRequestSaveContext } from "~/helpers/types/HoppRequestSaveContext"
import { applyBodyTransition } from "~/helpers/rules/BodyTransition"

type RESTSession = {
  request: HoppRESTRequest
  response: HoppRESTResponse | null
  testResults: HoppTestResult | null
  saveContext: HoppRequestSaveContext | null
}

export const getDefaultRESTRequest = (): HoppRESTRequest => ({
  v: RESTReqSchemaVersion,
  endpoint: "https://rpc.testnet.near.org",
  name: "Untitled request",
  params: [],
  headers: [],
  method: "POST",
  auth: {
    authType: "none",
    authActive: true,
  },
  preRequestScript: "",
  testScript: "",
  body: {
    contentType: "application/json",
    body: JSON.stringify({
      method: "query",
      params: {
        request_type: "call_function",
        account_id: "",
        method_name: "",
        args_base64: "",
        finality: "optimistic",
      },
      id: "",
      jsonrpc: "2.0",
    }),
  },
})

const defaultRESTSession: RESTSession = {
  request: getDefaultRESTRequest(),
  response: null,
  testResults: null,
  saveContext: null,
}

const dispatchers = defineDispatchers({
  setRequest(_: RESTSession, { req }: { req: HoppRESTRequest }) {
    return {
      request: req,
    }
  },
  setRequestName(curr: RESTSession, { newName }: { newName: string }) {
    return {
      request: {
        ...curr.request,
        name: newName,
      },
    }
  },
  setEndpoint(curr: RESTSession, { newEndpoint }: { newEndpoint: string }) {
    const body = curr.request.body
    const reqBody = JSON.parse(body.body as string)
    reqBody.params.method_name = newEndpoint
    const newReqBody = JSON.stringify(reqBody)
    body.body = newReqBody
    return {
      request: {
        ...curr.request,
        body,
      },
    }
  },
  setParams(curr: RESTSession, { entries }: { entries: HoppRESTParam[] }) {
    const body = curr.request.body
    const reqBody = JSON.parse(body.body as string)
    const args: Record<string, string> = {}
    entries.forEach((e) => {
      if (e.active) args[e.key] = e.value
    })
    reqBody.params.args_base64 = Buffer.from(JSON.stringify(args)).toString(
      "base64"
    )

    const newReqBody = JSON.stringify(reqBody)
    body.body = newReqBody
    return {
      request: {
        ...curr.request,
        params: entries,
        body,
      },
    }
  },
  addParam(curr: RESTSession, { newParam }: { newParam: HoppRESTParam }) {
    return {
      request: {
        ...curr.request,
        params: [...curr.request.params, newParam],
      },
    }
  },
  updateParam(
    curr: RESTSession,
    { index, updatedParam }: { index: number; updatedParam: HoppRESTParam }
  ) {
    const newParams = curr.request.params.map((param, i) => {
      if (i === index) return updatedParam
      else return param
    })

    return {
      request: {
        ...curr.request,
        params: newParams,
      },
    }
  },
  deleteParam(curr: RESTSession, { index }: { index: number }) {
    const newParams = curr.request.params.filter((_x, i) => i !== index)

    return {
      request: {
        ...curr.request,
        params: newParams,
      },
    }
  },
  deleteAllParams(curr: RESTSession) {
    return {
      request: {
        ...curr.request,
        params: [],
      },
    }
  },
  updateMethod(curr: RESTSession, { newMethod }: { newMethod: string }) {
    let newRequestType
    switch (newMethod) {
      case "VIEW":
        newRequestType = "call_function"
        break
      case "NONPAYABLE":
        newRequestType = "write_function"
        break
      case "PAYABLE":
        newRequestType = "write_function"
        break
    }
    const body = curr.request.body
    const reqBody = JSON.parse(body.body as string)
    reqBody.params.request_type = newRequestType
    const newReqBody = JSON.stringify(reqBody)
    body.body = newReqBody
    return {
      request: {
        ...curr.request,
        method: "POST",
        body,
      },
    }
  },
  setHeaders(curr: RESTSession, { entries }: { entries: HoppRESTHeader[] }) {
    return {
      request: {
        ...curr.request,
        headers: entries,
      },
    }
  },
  addHeader(curr: RESTSession, { entry }: { entry: HoppRESTHeader }) {
    return {
      request: {
        ...curr.request,
        headers: [...curr.request.headers, entry],
      },
    }
  },
  updateHeader(
    curr: RESTSession,
    { index, updatedEntry }: { index: number; updatedEntry: HoppRESTHeader }
  ) {
    return {
      request: {
        ...curr.request,
        headers: curr.request.headers.map((header, i) => {
          if (i === index) return updatedEntry
          else return header
        }),
      },
    }
  },
  deleteHeader(curr: RESTSession, { index }: { index: number }) {
    return {
      request: {
        ...curr.request,
        headers: curr.request.headers.filter((_, i) => i !== index),
      },
    }
  },
  deleteAllHeaders(curr: RESTSession) {
    return {
      request: {
        ...curr.request,
        headers: [],
      },
    }
  },
  setAuth(curr: RESTSession, { newAuth }: { newAuth: HoppRESTAuth }) {
    const body = curr.request.body
    const reqBody = JSON.parse(body.body as string)
    // @ts-ignore
    reqBody.params.account_id = newAuth.token
    const newReqBody = JSON.stringify(reqBody)
    body.body = newReqBody
    return {
      request: {
        ...curr.request,
        auth: newAuth,
        body,
      },
    }
  },
  setPreRequestScript(curr: RESTSession, { newScript }: { newScript: string }) {
    return {
      request: {
        ...curr.request,
        preRequestScript: newScript,
      },
    }
  },
  setTestScript(curr: RESTSession, { newScript }: { newScript: string }) {
    return {
      request: {
        ...curr.request,
        testScript: newScript,
      },
    }
  },
  setContentType(
    curr: RESTSession,
    { newContentType }: { newContentType: ValidContentTypes | null }
  ) {
    // TODO: persist body evenafter switching content typees
    return {
      request: {
        ...curr.request,
        body: applyBodyTransition(curr.request.body, newContentType),
      },
    }
  },
  addFormDataEntry(curr: RESTSession, { entry }: { entry: FormDataKeyValue }) {
    // Only perform update if the current content-type is formdata
    if (curr.request.body.contentType !== "multipart/form-data") return {}

    return {
      request: {
        ...curr.request,
        body: <HoppRESTReqBody>{
          contentType: "multipart/form-data",
          body: [...curr.request.body.body, entry],
        },
      },
    }
  },
  deleteFormDataEntry(curr: RESTSession, { index }: { index: number }) {
    // Only perform update if the current content-type is formdata
    if (curr.request.body.contentType !== "multipart/form-data") return {}

    return {
      request: {
        ...curr.request,
        body: <HoppRESTReqBody>{
          contentType: "multipart/form-data",
          body: curr.request.body.body.filter((_, i) => i !== index),
        },
      },
    }
  },
  updateFormDataEntry(
    curr: RESTSession,
    { index, entry }: { index: number; entry: FormDataKeyValue }
  ) {
    // Only perform update if the current content-type is formdata
    if (curr.request.body.contentType !== "multipart/form-data") return {}

    return {
      request: {
        ...curr.request,
        body: <HoppRESTReqBody>{
          contentType: "multipart/form-data",
          body: curr.request.body.body.map((x, i) => (i !== index ? x : entry)),
        },
      },
    }
  },
  deleteAllFormDataEntries(curr: RESTSession) {
    // Only perform update if the current content-type is formdata
    if (curr.request.body.contentType !== "multipart/form-data") return {}

    return {
      request: {
        ...curr.request,
        body: <HoppRESTReqBody>{
          contentType: "multipart/form-data",
          body: [],
        },
      },
    }
  },
  setRequestBody(curr: RESTSession, { newBody }: { newBody: HoppRESTReqBody }) {
    return {
      request: {
        ...curr.request,
        body: newBody,
      },
    }
  },
  updateResponse(
    _curr: RESTSession,
    { updatedRes }: { updatedRes: HoppRESTResponse | null }
  ) {
    return {
      response: updatedRes,
    }
  },
  clearResponse(_curr: RESTSession) {
    return {
      response: null,
    }
  },
  setTestResults(
    _curr: RESTSession,
    { newResults }: { newResults: HoppTestResult | null }
  ) {
    return {
      testResults: newResults,
    }
  },
  setSaveContext(
    _,
    { newContext }: { newContext: HoppRequestSaveContext | null }
  ) {
    return {
      saveContext: newContext,
    }
  },
})

const restSessionStore = new DispatchingStore(defaultRESTSession, dispatchers)

export function getRESTRequest() {
  const request = { ...restSessionStore.subject$.value.request, params: [] }
  console.log(request)
  return request
}

export function setRESTRequest(
  req: HoppRESTRequest,
  saveContext?: HoppRequestSaveContext | null
) {
  restSessionStore.dispatch({
    dispatcher: "setRequest",
    payload: {
      req,
    },
  })

  if (saveContext) setRESTSaveContext(saveContext)
}

export function setRESTSaveContext(saveContext: HoppRequestSaveContext | null) {
  restSessionStore.dispatch({
    dispatcher: "setSaveContext",
    payload: {
      newContext: saveContext,
    },
  })
}

export function getRESTSaveContext() {
  return restSessionStore.value.saveContext
}

export function resetRESTRequest() {
  setRESTRequest(getDefaultRESTRequest())
}

export function setRESTEndpoint(newEndpoint: string) {
  restSessionStore.dispatch({
    dispatcher: "setEndpoint",
    payload: {
      newEndpoint,
    },
  })
}

export function setRESTRequestName(newName: string) {
  restSessionStore.dispatch({
    dispatcher: "setRequestName",
    payload: {
      newName,
    },
  })
}

export function setRESTParams(entries: HoppRESTParam[]) {
  restSessionStore.dispatch({
    dispatcher: "setParams",
    payload: {
      entries,
    },
  })
}

export function addRESTParam(newParam: HoppRESTParam) {
  restSessionStore.dispatch({
    dispatcher: "addParam",
    payload: {
      newParam,
    },
  })
}

export function updateRESTParam(index: number, updatedParam: HoppRESTParam) {
  restSessionStore.dispatch({
    dispatcher: "updateParam",
    payload: {
      updatedParam,
      index,
    },
  })
}

export function deleteRESTParam(index: number) {
  restSessionStore.dispatch({
    dispatcher: "deleteParam",
    payload: {
      index,
    },
  })
}

export function deleteAllRESTParams() {
  restSessionStore.dispatch({
    dispatcher: "deleteAllParams",
    payload: {},
  })
}

export function updateRESTMethod(newMethod: string) {
  restSessionStore.dispatch({
    dispatcher: "updateMethod",
    payload: {
      newMethod,
    },
  })
}

export function setRESTHeaders(entries: HoppRESTHeader[]) {
  restSessionStore.dispatch({
    dispatcher: "setHeaders",
    payload: {
      entries,
    },
  })
}

export function addRESTHeader(entry: HoppRESTHeader) {
  restSessionStore.dispatch({
    dispatcher: "addHeader",
    payload: {
      entry,
    },
  })
}

export function updateRESTHeader(index: number, updatedEntry: HoppRESTHeader) {
  restSessionStore.dispatch({
    dispatcher: "updateHeader",
    payload: {
      index,
      updatedEntry,
    },
  })
}

export function deleteRESTHeader(index: number) {
  restSessionStore.dispatch({
    dispatcher: "deleteHeader",
    payload: {
      index,
    },
  })
}

export function deleteAllRESTHeaders() {
  restSessionStore.dispatch({
    dispatcher: "deleteAllHeaders",
    payload: {},
  })
}

export function setRESTAuth(newAuth: HoppRESTAuth) {
  restSessionStore.dispatch({
    dispatcher: "setAuth",
    payload: {
      newAuth,
    },
  })
}

export function setRESTPreRequestScript(newScript: string) {
  restSessionStore.dispatch({
    dispatcher: "setPreRequestScript",
    payload: {
      newScript,
    },
  })
}

export function setRESTTestScript(newScript: string) {
  restSessionStore.dispatch({
    dispatcher: "setTestScript",
    payload: {
      newScript,
    },
  })
}

export function setRESTReqBody(newBody: HoppRESTReqBody | null) {
  restSessionStore.dispatch({
    dispatcher: "setRequestBody",
    payload: {
      newBody,
    },
  })
}

export function updateRESTResponse(updatedRes: HoppRESTResponse | null) {
  restSessionStore.dispatch({
    dispatcher: "updateResponse",
    payload: {
      updatedRes,
    },
  })
}

export function clearRESTResponse() {
  restSessionStore.dispatch({
    dispatcher: "clearResponse",
    payload: {},
  })
}

export function setRESTTestResults(newResults: HoppTestResult | null) {
  restSessionStore.dispatch({
    dispatcher: "setTestResults",
    payload: {
      newResults,
    },
  })
}

export function addFormDataEntry(entry: FormDataKeyValue) {
  restSessionStore.dispatch({
    dispatcher: "addFormDataEntry",
    payload: {
      entry,
    },
  })
}

export function deleteFormDataEntry(index: number) {
  restSessionStore.dispatch({
    dispatcher: "deleteFormDataEntry",
    payload: {
      index,
    },
  })
}

export function updateFormDataEntry(index: number, entry: FormDataKeyValue) {
  restSessionStore.dispatch({
    dispatcher: "updateFormDataEntry",
    payload: {
      index,
      entry,
    },
  })
}

export function setRESTContentType(newContentType: ValidContentTypes | null) {
  restSessionStore.dispatch({
    dispatcher: "setContentType",
    payload: {
      newContentType,
    },
  })
}

export function deleteAllFormDataEntries() {
  restSessionStore.dispatch({
    dispatcher: "deleteAllFormDataEntries",
    payload: {},
  })
}

export const restSaveContext$ = restSessionStore.subject$.pipe(
  pluck("saveContext"),
  distinctUntilChanged()
)

export const restRequest$ = restSessionStore.subject$.pipe(
  pluck("request"),
  distinctUntilChanged()
)

export const restRequestName$ = restRequest$.pipe(
  pluck("name"),
  distinctUntilChanged()
)

export const restEndpoint$ = restSessionStore.subject$.pipe(
  pluck("request", "body", "body"),
  map((body) => JSON.parse(body as string).params.method_name),
  distinctUntilChanged()
)

export const restParams$ = restSessionStore.subject$.pipe(
  pluck("request", "params"),
  distinctUntilChanged()
)

export const restActiveParamsCount$ = restParams$.pipe(
  map(
    (params) =>
      params.filter((x) => x.active && (x.key !== "" || x.value !== "")).length
  )
)

export const restMethod$ = restSessionStore.subject$.pipe(
  pluck("request", "body", "body"),
  map((body) => {
    const requestType = JSON.parse(body as string).params.request_type
    switch (requestType) {
      case "call_function":
        return "VIEW"
      case "write_function":
        return "NONPAYABLE"
    }
  }),
  distinctUntilChanged()
)

export const restHeaders$ = restSessionStore.subject$.pipe(
  pluck("request", "headers"),
  distinctUntilChanged()
)

export const restActiveHeadersCount$ = restHeaders$.pipe(
  map(
    (params) =>
      params.filter((x) => x.active && (x.key !== "" || x.value !== "")).length
  )
)

export const restAuth$ = restRequest$.pipe(pluck("auth"))

export const restPreRequestScript$ = restSessionStore.subject$.pipe(
  pluck("request", "preRequestScript"),
  distinctUntilChanged()
)

export const restContentType$ = restRequest$.pipe(
  pluck("body", "contentType"),
  distinctUntilChanged()
)

export const restTestScript$ = restSessionStore.subject$.pipe(
  pluck("request", "testScript"),
  distinctUntilChanged()
)

export const restReqBody$ = restSessionStore.subject$.pipe(
  pluck("request", "body"),
  distinctUntilChanged()
)

export const restResponse$ = restSessionStore.subject$.pipe(
  pluck("response"),
  distinctUntilChanged()
)

export const completedRESTResponse$ = restResponse$.pipe(
  filter(
    (res) =>
      res !== null &&
      res.type !== "loading" &&
      res.type !== "network_fail" &&
      res.type !== "script_fail"
  )
)

export const restTestResults$ = restSessionStore.subject$.pipe(
  pluck("testResults"),
  distinctUntilChanged()
)

/**
 * A Vue 3 composable function that gives access to a ref
 * which is updated to the preRequestScript value in the store.
 * The ref value is kept in sync with the store and all writes
 * to the ref are dispatched to the store as `setPreRequestScript`
 * dispatches.
 */
export function usePreRequestScript(): Ref<string> {
  return useStream(
    restPreRequestScript$,
    restSessionStore.value.request.preRequestScript,
    (value) => {
      setRESTPreRequestScript(value)
    }
  )
}

/**
 * A Vue 3 composable function that gives access to a ref
 * which is updated to the testScript value in the store.
 * The ref value is kept in sync with the store and all writes
 * to the ref are dispatched to the store as `setTestScript`
 * dispatches.
 */
export function useTestScript(): Ref<string> {
  return useStream(
    restTestScript$,
    restSessionStore.value.request.testScript,
    (value) => {
      setRESTTestScript(value)
    }
  )
}

export function useRESTRequestBody(): Ref<HoppRESTReqBody> {
  return useStream(
    restReqBody$,
    restSessionStore.value.request.body,
    setRESTReqBody
  )
}

export function useRESTRequestName(): Ref<string> {
  return useStream(
    restRequestName$,
    restSessionStore.value.request.name,
    setRESTRequestName
  )
}
