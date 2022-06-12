<template>
  <div class="flex flex-col flex-1">
    <div class="flex flex-1 border-b border-dividerLight">
      <div class="w-full mt-2">
        <div class="flex flex-1 border border-dividerLight">
          <SmartEnvInput v-model="bearerToken" placeholder="Address" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, Ref } from "@nuxtjs/composition-api"
import {
  HoppRESTAuthBasic,
  HoppRESTAuthBearer,
  HoppRESTAuthOAuth2,
  HoppRESTAuthAPIKey,
} from "~/data"
import { pluckRef, useStream } from "~/helpers/utils/composables"
import { restAuth$, setRESTAuth } from "~/newstore/RESTSession"
import { useSetting } from "~/newstore/settings"

export default defineComponent({
  setup() {
    const auth = useStream(
      restAuth$,
      { authType: "none", authActive: true },
      setRESTAuth
    )
    const authType = pluckRef(auth, "authType")
    const authName = computed(() => {
      if (authType.value === "basic") return "Basic Auth"
      else if (authType.value === "bearer") return "Bearer"
      else if (authType.value === "oauth-2") return "OAuth 2.0"
      else if (authType.value === "api-key") return "API key"
      else return "None"
    })
    const authActive = pluckRef(auth, "authActive")
    const basicUsername = pluckRef(auth as Ref<HoppRESTAuthBasic>, "username")
    const basicPassword = pluckRef(auth as Ref<HoppRESTAuthBasic>, "password")
    const bearerToken = pluckRef(auth as Ref<HoppRESTAuthBearer>, "token")
    const oauth2Token = pluckRef(auth as Ref<HoppRESTAuthOAuth2>, "token")
    const apiKey = pluckRef(auth as Ref<HoppRESTAuthAPIKey>, "key")
    const apiValue = pluckRef(auth as Ref<HoppRESTAuthAPIKey>, "value")
    const addTo = pluckRef(auth as Ref<HoppRESTAuthAPIKey>, "addTo")
    if (typeof addTo.value === "undefined") {
      addTo.value = "Headers"
      apiKey.value = ""
      apiValue.value = ""
    }

    const URLExcludes = useSetting("URL_EXCLUDES")
    const clearContent = () => {
      auth.value = {
        authType: "none",
        authActive: true,
      }
    }
    return {
      auth,
      authType,
      authName,
      authActive,
      basicUsername,
      basicPassword,
      bearerToken,
      oauth2Token,
      URLExcludes,
      clearContent,
      apiKey,
      apiValue,
      addTo,
      authTypeOptions: ref<any | null>(null),
      addToOptions: ref<any | null>(null),
    }
  },
})
</script>
