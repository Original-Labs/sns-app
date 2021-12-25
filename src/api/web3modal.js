import { setup as setupENS } from '../apollo/mutations/ens'
import { setup as setupSNS } from '../apollo/mutations/sns'
// import { setup as setupENS } from '../apollo/mutations/ens'
import {
  isReadOnlyReactive,
  networkIdReactive,
  networkReactive,
  web3ProviderReactive
} from '../apollo/reactiveVars'
// import { getNetwork, getNetworkId, isReadOnly } from '@ensdomains/ui'
import { getNetwork, getNetworkId, isReadOnly } from 'sns-app-contract-api'

const INFURA_ID =
  window.location.host === 'sns.chat'
    ? '5a380f9dfbb44b2abf9f681d39ddc382'
    : '5a380f9dfbb44b2abf9f681d39ddc382'

const PORTIS_ID = '57e5d6ca-e408-4925-99c4-e7da3bdb8bf5'

let provider
const option = {
  network: 'mainnet', // optional
  cacheProvider: true, // optional
  providerOptions: {
    // walletconnect: {
    //   package: () => import('@walletconnect/web3-provider'),
    //   packageFactory: true,
    //   options: {
    //     infuraId: INFURA_ID
    //   }
    // },
    // walletlink: {
    //   package: () => import('walletlink'),
    //   packageFactory: true,
    //   options: {
    //     appName: 'sns-app',
    //     jsonRpcUrl: `https://polygon-mainnet.infura.io/v3/${INFURA_ID}`
    //   }
    // },
    // mewconnect: {
    //   package: () => import('@myetherwallet/mewconnect-web-client'),
    //   packageFactory: true,
    //   options: {
    //     infuraId: INFURA_ID,
    //     description: ' '
    //   }
    // },
    // portis: {
    //   package: () => import('@portis/web3'),
    //   packageFactory: true,
    //   options: {
    //     id: PORTIS_ID
    //   }
    // },
    // torus: {
    //   package: () => import('@toruslabs/torus-embed'),
    //   packageFactory: true
    // }
  }
}

let web3Modal
export const connect = async () => {
  try {
    const Web3Modal = (await import('@ensdomains/web3modal')).default

    web3Modal = new Web3Modal(option)
    provider = await web3Modal.connect()

    await setupSNS({
      customProvider: provider,
      reloadOnAccountsChange: false,
      enforceReload: true
    })
    return provider
  } catch (e) {
    if (e !== 'Modal closed by user') {
      throw e
    }
  }
}

export const disconnect = async function() {
  if (web3Modal) {
    await web3Modal.clearCachedProvider()
  }

  // Disconnect wallet connect provider
  if (provider && provider.disconnect) {
    provider.disconnect()
  }
  await setupSNS({
    reloadOnAccountsChange: false,
    enforceReadOnly: true,
    enforceReload: false
  })

  isReadOnlyReactive(isReadOnly())
  web3ProviderReactive(null)
  networkIdReactive(await getNetworkId())
  networkReactive(await getNetwork())
}

export const setWeb3Modal = x => {
  web3Modal = x
}
