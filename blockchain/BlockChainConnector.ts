import { NearConnector } from "./NearConnector"

export class BlockChainConnector {
  private static _connector: NearConnector

  static get instance(): NearConnector {
    if (!this._connector) this._connector = new NearConnector()
    return this._connector
  }

  static setCurrentContractAddress(address: string) {
    return localStorage.setItem("contract_address", address)
  }

  static clearCurrentContractAddress() {
    return localStorage.removeItem("contract_address")
  }

  static get currentContractAddress() {
    return localStorage.getItem("contract_address") || ""
  }
}
