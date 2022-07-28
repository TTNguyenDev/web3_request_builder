import { AxiosResponse, AxiosRequestConfig } from "axios"
import { BehaviorSubject, Observable } from "rxjs"
import cloneDeep from "lodash/cloneDeep"
import * as T from "fp-ts/Task"
import * as TE from "fp-ts/TaskEither"
import * as O from "fp-ts/Option"
import { pipe } from "fp-ts/function"
import { transactions, utils } from "near-api-js"
import { BN } from "bn.js"
import AxiosStrategy, {
  cancelRunningAxiosRequest,
} from "./strategies/AxiosStrategy"
import ExtensionStrategy, {
  cancelRunningExtensionRequest,
  hasExtensionInstalled,
} from "./strategies/ExtensionStrategy"
import { HoppRESTResponse } from "./types/HoppRESTResponse"
import { EffectiveHoppRESTRequest } from "./utils/EffectiveURL"
import { settingsStore } from "~/newstore/settings"
import { BlockChainConnector } from "~/blockchain"

export type NetworkResponse = AxiosResponse<any> & {
  config?: {
    timeData?: {
      startTime: number
      endTime: number
    }
  }
}

export type NetworkStrategy = (
  req: AxiosRequestConfig
) => TE.TaskEither<any, NetworkResponse>

export const cancelRunningRequest = () => {
  if (isExtensionsAllowed() && hasExtensionInstalled()) {
    cancelRunningExtensionRequest()
  } else {
    cancelRunningAxiosRequest()
  }
}

const isExtensionsAllowed = () => settingsStore.value.EXTENSIONS_ENABLED

const runAppropriateStrategy = (req: AxiosRequestConfig) => {
  if (isExtensionsAllowed() && hasExtensionInstalled()) {
    return ExtensionStrategy(req)
  }

  return AxiosStrategy(req)
}

/**
 * Returns an identifier for how a request will be ran
 * if the system is asked to fire a request
 *
 */
export function getCurrentStrategyID() {
  if (isExtensionsAllowed() && hasExtensionInstalled()) {
    return "extension" as const
  } else if (settingsStore.value.PROXY_ENABLED) {
    return "proxy" as const
  } else {
    return "normal" as const
  }
}

export const sendNetworkRequest = (req: any) =>
  pipe(
    runAppropriateStrategy(req),
    TE.getOrElse((e) => {
      throw e
    })
  )()

const processResponse = (
  res: NetworkResponse,
  req: EffectiveHoppRESTRequest,
  backupTimeStart: number,
  backupTimeEnd: number,
  successState: HoppRESTResponse["type"]
) =>
  pipe(
    TE.Do,

    // Calculate the content length
    TE.bind("contentLength", () =>
      TE.of(
        res.headers["content-length"]
          ? parseInt(res.headers["content-length"])
          : (res.data as ArrayBuffer).byteLength
      )
    ),

    // Building the final response object
    TE.map(
      ({ contentLength }) =>
        <HoppRESTResponse>{
          type: successState,
          statusCode: res.status,
          body: res.data,
          headers: Object.keys(res.headers).map((x) => ({
            key: x,
            value: res.headers[x],
          })),
          meta: {
            responseSize: contentLength,
            responseDuration: backupTimeEnd - backupTimeStart,
          },
          req,
        }
    )
  )

export function createRESTNetworkRequestStream(
  request: EffectiveHoppRESTRequest
): Observable<HoppRESTResponse> {
  const response = new BehaviorSubject<HoppRESTResponse>({
    type: "loading",
    req: request,
  })

  const body = JSON.parse(request.body.body as any)
  const requestType = body.params.request_type
  const args: Record<string, string> = {}
  request.params.forEach((e) => {
    if (e.active) args[e.key] = e.value
  })
  pipe(
    TE.Do,

    // Get a deep clone of the request
    TE.bind("req", () => TE.of(cloneDeep(request))),

    // Assembling headers object
    TE.bind("headers", ({ req }) =>
      TE.of(
        req.effectiveFinalHeaders.reduce((acc, { key, value }) => {
          return Object.assign(acc, { [key]: value })
        }, {})
      )
    ),

    // Assembling params object
    TE.bind("params", ({ req }) => {
      const params = new URLSearchParams()
      req.effectiveFinalParams.forEach((x) => {
        params.append(x.key, x.value)
      })
      return TE.of(params)
    }),

    // Keeping the backup start time
    TE.bind("backupTimeStart", () => TE.of(Date.now())),

    // Running the request and getting the response
    TE.bind("res", ({ req, headers, params }) => {
      if (requestType === "call_function") {
        return runAppropriateStrategy({
          method: req.method as any,
          url: req.effectiveFinalURL.trim(),
          headers,
          params,
          data: req.effectiveFinalBody,
        })
      } else {
        return pipe(
          O.fromNullable,
          TE.chain(() =>
            TE.tryCatch(
              () =>
                BlockChainConnector.instance.account.signAndSendTransaction({
                  receiverId: body.params.account_id,
                  actions: [
                    transactions.functionCall(
                      body.params.method_name,
                      args,
                      new BN("30000000000000"),
                      new BN(
                        request.auth.amount
                          ? utils.format.parseNearAmount(request.auth.amount)
                          : "0"
                      )
                    ),
                  ],
                }),
              (err) => err as any
            )
          )
        )
      }
    }),

    // Getting the backup end time
    TE.bind("backupTimeEnd", () => TE.of(Date.now())),

    // Assemble the final response object
    TE.chainW((payload: any) => {
      const { req, res, backupTimeEnd, backupTimeStart } = payload
      console.log(payload)

      if (requestType === "call_function")
        return processResponse(
          res,
          req,
          backupTimeStart,
          backupTimeEnd,
          "success"
        )
      else
        return TE.of(<HoppRESTResponse>{
          type: "success",
          statusCode: 200,
          body: Buffer.from(JSON.stringify(res)) as any,
          headers: [] as any,
          meta: {
            responseDuration: backupTimeEnd - backupTimeStart,
          },
          req,
        })
    }),

    // Writing success state to the stream
    TE.chain((res) => {
      response.next(res)
      response.complete()

      return TE.of(res)
    }),

    // Package the error type
    TE.getOrElseW((e) => {
      const obj: HoppRESTResponse = {
        type: "network_fail",
        error: e,
        req: request,
      }

      response.next(obj)
      response.complete()

      return T.of(obj)
    })
  )()

  return response
}
