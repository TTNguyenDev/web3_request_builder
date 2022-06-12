export const NearConfig = Object.freeze({
  networkId: process.env.REACT_APP_NEAR_NETWORK_ID || "testnet",
  nodeUrl:
    process.env.REACT_APP_NEAR_NODE_URL || "https://rpc.testnet.near.org",
  archivalNodeUrl:
    process.env.REACT_APP_NEAR_ARCHIVAL_NODE_URL ||
    "https://rpc.testnet.internal.near.org",
  contractName:
    process.env.REACT_APP_NEAR_CONTRACT_NAME ||
    "dev-1652100430918-60749606761829",
  rawbotNFTContract: "dev-1641440672601-60716758911821",
  ftContractName:
    process.env.REACT_APP_NEAR_FT_CONTRACT_NAME ||
    "dev-1647845530785-37343439549244",
  walletUrl:
    process.env.REACT_APP_NEAR_WALLET_URL || "https://wallet.testnet.near.org",

  appTitle: process.env.REACT_APP_NEAR_APP_TITLE || "Rawbots",
})
