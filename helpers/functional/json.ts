import * as O from "fp-ts/Option"
import { flow } from "fp-ts/function"

/**
 * Checks and Parses JSON string
 * @param str Raw JSON data to be parsed
 * @returns Option type with some(JSON data) or none
 */
export const safeParseJSON = (str: string): O.Option<object> =>
  O.tryCatch(() => {
    const items = JSON.parse(str)
    console.log(items)
    const requests = items.map((item: any) => ({
      v: "1",
      endpoint: "https://rpc.testnet.near.org",
      name: item.name,
      params: item.inputs.map((i: any) => ({
        active: true,
        key: i.name,
        value: i.param_type,
      })),
      headers: [],
      method: "POST",
      auth: {
        authType: "none",
        authActive: true,
        addTo: "Headers",
        key: "",
        value: "",
        token: "",
      },
      preRequestScript: "",
      testScript: "",
      body: {
        contentType: "application/json",
        body: JSON.stringify({
          method: "query",
          params: {
            request_type:
              item.state_mutability === "read"
                ? "call_function"
                : "write_function",
            method_name: item.name,
            args_base64: Buffer.from(
              JSON.stringify(
                (() => {
                  const args: Record<string, string> = {}
                  item.inputs.forEach((i: any) => {
                    args[i.name] = i.param_type
                  })
                  console.log(args)
                  return args
                })()
              )
            ).toString("base64"),
            finality: "optimistic",
            account_id: "",
          },
          id: "",
          jsonrpc: "2.0",
        }),
      },
    }))
    console.log({
      v: 1,
      name: "collection_name",
      folders: [],
      requests,
    })
    return {
      v: 1,
      name: "collection_name",
      folders: [],
      requests,
    }
  })

/**
 * Checks if given string is a JSON string
 * @param str Raw string to be checked
 * @returns If string is a JSON string
 */
export const isJSON = flow(safeParseJSON, O.isSome)
