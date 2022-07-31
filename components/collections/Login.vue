<template>
  <SmartModal
    v-if="show"
    dialog
    :title="`Login`"
    max-width="sm:max-w-md"
    @close="hideModal"
  >
    <template #body>
      <div class="flex flex-col">
        <div class="flex flex-col px-2 pb-6">
          <div class="space-y-2 mt-2">
            <p class="flex items-center">
              <span
                class="inline-flex items-center justify-center flex-shrink-0 mr-4 border-4 rounded-full border-primary text-dividerDark"
                :class="{
                  '!text-green-500': contractAddress,
                }"
              >
                <i class="material-icons">check_circle</i>
              </span>
              <span> Contract address </span>
            </p>
            <div class="flex flex-col ml-10">
              <div class="flex flex-1 border-b border-dividerLight">
                <div class="w-full">
                  <div class="flex flex-1 border border-dividerLight">
                    <SmartEnvInput
                      v-model="contractAddress"
                      placeholder="Address"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ButtonPrimary
          :label="`Login`"
          :disabled="enableLoginButton"
          class="mx-2"
          :loading="importingMyCollections"
          @click.native="handleLogin"
        />
      </div>
    </template>
  </SmartModal>
</template>

<script setup lang="ts">
import { computed, ref } from "@nuxtjs/composition-api"
import { BlockChainConnector } from "~/blockchain"
import { useI18n, useToast } from "~/helpers/utils/composables"

const toast = useToast()
const t = useI18n()

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: "hide-modal"): void
}>()

const hideModal = () => {
  resetLogin()
  emit("hide-modal")
}

const contractAddress = ref<string>("")

const handleLogin = () => {
  if (contractAddress) {
    BlockChainConnector.setCurrentContractAddress(contractAddress.value)
    BlockChainConnector.instance.walletConnection.requestSignIn(
      contractAddress.value
    )
  } else toast.error(`${t("empty.contract_address")}`)
}

const enableLoginButton = computed(() => !contractAddress.value)

const resetLogin = () => {
  contractAddress.value = ""
}
</script>
