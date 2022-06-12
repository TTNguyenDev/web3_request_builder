import {
  connect,
  ConnectedWalletAccount,
  Connection,
  Contract,
  keyStores,
  Near,
  WalletConnection,
} from "near-api-js"
import { BrowserLocalStorageKeyStore } from "near-api-js/lib/key_stores"
import { NearConfig } from "near-api-js/lib/near"
import { NearConfig as config } from "../config"

// 4 epochs
const NUM_BLOCKS_NON_ARCHIVAL = 4 * 12 * 3600

const ViewMethods: string[] = [
  "get_account",
  "get_accounts",
  "get_num_accounts",
  "get_followers",
  "get_following",
  "get_post_by_id",
  "storage_minimum_balance",
  "storage_balance_of",
  "get_post_likes",
  "get_num_likes",
  "already_like",
  "get_comments",
  "get_num_post_comments",
  "topics",
  "vote_status",
  "get_votes",
  "already_joined",
  "get_community_posts",
  "get_community_post_with_id",
  "get_communities",
  "community_by_id",
  "joined_communities",
  "get_accounts_with_ids",
  "get_members",
  "get_posts_by_account",
  "get_posts_of_topic",
  "get_posts",
  "get_hot_posts",
  "get_trending_posts",
  "get_num_posts_by_account",
  "get_deleted_posts",
  "is_admin",
]

const ChangeMethods: string[] = [
  "storage_deposit",
  "storage_withdraw",
  "post",
  "follow",
  "unfollow",
  "like_post",
  "unlike_post",
  "comment",
  "edit_comment",
  "new_topic",
  "set_avatar",
  "set_thumbnail",
  "set_bio",
  "new_message",
  "upvote",
  "downvote",
  "unvote",
  "set_pub_key",
  "new_community",
  "join_community",
  "leave_community",
  "community_post",
  "set_community_thumbnail",
  "set_community_avatar",
  "set_community_bio",
  "delete_post",
  "delete_community_post",
]

type ContractMethodType<K = any> = (...args: any) => K
type ContractMethodsType = {
  get_account: ContractMethodType
  get_accounts: ContractMethodType
  get_num_accounts: ContractMethodType
  get_followers: ContractMethodType
  get_following: ContractMethodType
  get_post_by_id: ContractMethodType
  storage_minimum_balance: ContractMethodType
  storage_balance_of: ContractMethodType
  get_post_likes: ContractMethodType
  get_num_likes: ContractMethodType
  already_like: ContractMethodType
  get_comments: ContractMethodType
  get_num_post_comments: ContractMethodType
  topics: ContractMethodType
  storage_deposit: ContractMethodType
  storage_withdraw: ContractMethodType
  post: ContractMethodType
  follow: ContractMethodType
  unfollow: ContractMethodType
  like_post: ContractMethodType
  unlike_post: ContractMethodType
  comment: ContractMethodType
  edit_comment: ContractMethodType
  new_topic: ContractMethodType
  nftContract: any
  set_avatar: ContractMethodType
  set_thumbnail: ContractMethodType
  set_bio: ContractMethodType
  new_message: ContractMethodType
  upvote: ContractMethodType
  downvote: ContractMethodType
  unvote: ContractMethodType
  vote_status: ContractMethodType
  get_votes: ContractMethodType
  set_pub_key: ContractMethodType
  new_community: ContractMethodType
  join_community: ContractMethodType
  leave_community: ContractMethodType
  community_post: ContractMethodType
  set_community_thumbnail: ContractMethodType
  set_community_avatar: ContractMethodType
  set_community_bio: ContractMethodType
  already_joined: ContractMethodType
  get_community_posts: ContractMethodType
  get_community_post_with_id: ContractMethodType
  get_communities: ContractMethodType
  community_by_id: ContractMethodType
  joined_communities: ContractMethodType
  get_accounts_with_ids: ContractMethodType
  get_members: ContractMethodType
  get_posts_by_account: ContractMethodType
  get_posts_of_topic: ContractMethodType
  get_posts: ContractMethodType
  get_hot_posts: ContractMethodType
  get_trending_posts: ContractMethodType
  get_num_posts_by_account: ContractMethodType
  delete_post: ContractMethodType
  delete_community_post: ContractMethodType
  get_deleted_posts: ContractMethodType
  is_admin: ContractMethodType
}

type NFTContractMethodsType = {
  tokens_of_owner: ContractMethodType
  tokens_metadata_of_owner: ContractMethodType
  token_metadata: ContractMethodType
}

type FTContractMethodsType = {
  storage_deposit: ContractMethodType
  storage_balance_of: ContractMethodType
  ft_balance_of: ContractMethodType
  ft_metadata: ContractMethodType
  ft_transfer: ContractMethodType
}

export class NearConnector {
  private _keyStore: BrowserLocalStorageKeyStore

  private _config: NearConfig

  private _near!: Near

  private _contract!: Contract

  private _rawbotNFTContract!: Contract

  private _ftContract!: Contract

  private _archivalConnection!: Connection

  private _walletConnection!: WalletConnection

  private _lastBlockHeight!: number

  private _storageMinimumBalance!: number

  private _account!: ConnectedWalletAccount

  constructor() {
    const keyStore = new keyStores.BrowserLocalStorageKeyStore()
    this._keyStore = keyStore
    this._config = { deps: { keyStore }, headers: {}, ...config }
  }

  public get near(): Near {
    return this._near
  }

  public get contract(): Contract & ContractMethodsType {
    return this._contract as any
  }

  public get nftContract(): Contract & NFTContractMethodsType {
    return this._rawbotNFTContract as any
  }

  public get ftContract(): Contract & FTContractMethodsType {
    return this._ftContract as any
  }

  public get archivalConnection(): Connection {
    return this._archivalConnection
  }

  public get walletConnection(): WalletConnection {
    return this._walletConnection
  }

  public get storageMinimumBalance(): number {
    return this._storageMinimumBalance
  }

  public get account(): ConnectedWalletAccount {
    return this._account
  }

  public get lastBlockHeight(): number {
    return this._lastBlockHeight
  }

  public async updateLastBlockHeight() {
    const block = await this.account.connection.provider.block({
      finality: "optimistic",
    })

    this._lastBlockHeight = block.header.height
  }

  private async connectToNear() {
    this._near = await connect(this._config)
    this._archivalConnection = Connection.fromConfig({
      networkId: config.networkId,
      provider: {
        type: "JsonRpcProvider",
        args: { url: config.archivalNodeUrl },
      },
      signer: { type: "InMemorySigner", keyStore: this._keyStore },
    })

    this._walletConnection = new WalletConnection(
      this.near,
      config.contractName
    )

    this._account = this._walletConnection.account()
  }

  // eslint-disable-next-line require-await
  private async initContract() {
    this._contract = new Contract(this.account, config.contractName, {
      viewMethods: ViewMethods,
      changeMethods: ChangeMethods,
    })

    this._rawbotNFTContract = new Contract(
      this.account,
      config.rawbotNFTContract,
      {
        viewMethods: [
          "tokens_of_owner",
          "tokens_metadata_of_owner",
          "token_metadata",
        ],
        changeMethods: [],
      }
    )

    this._ftContract = new Contract(this.account, config.ftContractName, {
      viewMethods: ["storage_balance_of", "ft_balance_of", "ft_metadata"],
      changeMethods: ["storage_deposit", "ft_transfer"],
    })
  }

  public async initNear() {
    await this.connectToNear()
    await this.initContract()
    const block = await this.account.connection.provider.block({
      finality: "final",
    })

    this._lastBlockHeight = block.header.height

    console.log("Near connector successfully")

    // this._storageMinimumBalance =
    //     // @ts-ignore
    //     await this.contract.storage_minimum_balance();
  }

  async getBlock(payload: {
    blockId: number
    methodName: string
    args: Record<string, any>
  }) {
    const { blockId, methodName, args } = payload

    // @ts-ignore
    this.account.validateArgs(args || {})

    const connection =
      blockId + NUM_BLOCKS_NON_ARCHIVAL < this._lastBlockHeight
        ? this.archivalConnection
        : this.account.connection

    const res: any = await connection.provider.query({
      request_type: "call_function",
      // @ts-ignore
      block_id: blockId,
      account_id: config.contractName,
      method_name: methodName,
      args_base64: Buffer.from(JSON.stringify(args), "utf8").toString("base64"),
    })

    return (
      res.result &&
      res.result.length > 0 &&
      JSON.parse(Buffer.from(res.result).toString())
    )
  }
}
