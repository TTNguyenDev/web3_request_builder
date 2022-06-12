import cloneDeep from "lodash/cloneDeep"
import { runPreRequestScript } from "~/js-sanbox"
import { Environment } from "~/data"
import {
  getCurrentEnvironment,
  getGlobalVariables,
} from "~/newstore/environments"

export const getCombinedEnvVariables = () => ({
  global: cloneDeep(getGlobalVariables()),
  selected: cloneDeep(getCurrentEnvironment().variables),
})

export const getFinalEnvsFromPreRequest = (
  script: string,
  envs: {
    global: Environment["variables"]
    selected: Environment["variables"]
  }
) => runPreRequestScript(script, envs)
