<template>
  <SmartTabs
    v-model="selectedRealtimeTab"
    styles="sticky bg-primary top-upperMobilePrimaryStickyFold sm:top-upperPrimaryStickyFold z-10"
  >
    <!-- <SmartTab :id="'contract_address'" :label="`${$t('tab.contract_address')}`">
      <HttpContractAddress />
    </SmartTab> -->
    <SmartTab
      :id="'params'"
      :label="`${$t('tab.parameters')}`"
      :info="`${newActiveParamsCount$}`"
    >
      <HttpParameters />
    </SmartTab>
    <SmartTab
      v-if="method === 'PAYABLE'"
      :id="'deposit'"
      :label="`${$t('tab.deposit')}`"
    >
      <HttpDeposit />
    </SmartTab>
  </SmartTabs>
</template>

<script setup lang="ts">
import { ref } from "@nuxtjs/composition-api"
import { map } from "rxjs/operators"
import { useReadonlyStream, useStream } from "~/helpers/utils/composables"
import {
  restActiveParamsCount$,
  restMethod$,
  updateRESTMethod,
} from "~/newstore/RESTSession"

export type RequestOptionTabs =
  | "params"
  | "bodyParams"
  | "headers"
  | "authorization"

const selectedRealtimeTab = ref<RequestOptionTabs>("params")

// const changeTab = (e: RequestOptionTabs) => {
//   selectedRealtimeTab.value = e
// }

const newActiveParamsCount$ = useReadonlyStream(
  restActiveParamsCount$.pipe(
    map((e) => {
      if (e === 0) return null
      return `${e}`
    })
  ),
  null
)
const method = useStream(restMethod$, "", updateRESTMethod)
</script>
