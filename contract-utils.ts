import { ethers } from "ethers"
import { CONTRACT_ABI } from "./contract-abi"

export const CONTRACT_ADDRESS = "0xD0501e868AEC9973E118B975E00E1d078c88D263"
export const TEA_SEPOLIA_RPC_URL = "https://tea-sepolia.g.alchemy.com/public"

// Add these constants for Tea Sepolia network
export const TEA_SEPOLIA_CHAIN_ID = 10218
export const TEA_SEPOLIA_NETWORK = {
  chainId: `0x${TEA_SEPOLIA_CHAIN_ID.toString(16)}`, // '0x27ea' in hex
  chainName: "Tea Sepolia",
  nativeCurrency: {
    name: "TEA",
    symbol: "TEA",
    decimals: 18,
  },
  rpcUrls: [TEA_SEPOLIA_RPC_URL],
  blockExplorerUrls: ["https://explorer.teaprotocol.io/"],
}

// Add sTEA token contract details
export const STEA_CONTRACT_ADDRESS = "0x09bA156Aaf3505d07b6F82872b35D75b7A7d5032"
export const STEA_CONTRACT_ABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "allowance", type: "uint256" },
      { internalType: "uint256", name: "needed", type: "uint256" },
    ],
    name: "ERC20InsufficientAllowance",
    type: "error",
  },
  {
    inputs: [
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "uint256", name: "balance", type: "uint256" },
      { internalType: "uint256", name: "needed", type: "uint256" },
    ],
    name: "ERC20InsufficientBalance",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "approver", type: "address" }],
    name: "ERC20InvalidApprover",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "receiver", type: "address" }],
    name: "ERC20InvalidReceiver",
    type: "error",
  },
  { inputs: [{ internalType: "address", name: "sender", type: "address" }], name: "ERC20InvalidSender", type: "error" },
  {
    inputs: [{ internalType: "address", name: "spender", type: "address" }],
    name: "ERC20InvalidSpender",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: true, internalType: "address", name: "spender", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
]

// Update the provider creation with better error handling and fallback mechanism
const createProvider = () => {
  try {
    console.log("Creating provider with TEA_SEPOLIA_RPC_URL:", TEA_SEPOLIA_RPC_URL)
    const provider = new ethers.JsonRpcProvider(TEA_SEPOLIA_RPC_URL, undefined, {
      staticNetwork: true,
      polling: true,
      pollingInterval: 4000, // Increase polling interval to reduce rate limiting issues
      batchStallTime: 50, // Add small delay between batch requests
      cacheTimeout: -1, // Disable cache to ensure fresh data
      // Add retry options
      retry: {
        retryFunc: (error, attempt) => {
          console.warn(`RPC request failed (attempt ${attempt}):`, error.message)
          return attempt < 3 // Retry up to 3 times
        },
        delay: 1000, // Start with 1s delay
        maxDelay: 5000, // Max 5s delay
      },
    })

    // Test the connection
    provider.getBlockNumber().catch((error) => {
      console.error("Failed to connect to primary RPC:", error)
      console.warn("Provider may have connectivity issues")
    })

    return provider
  } catch (error) {
    console.error("Error creating provider:", error)
    // Fallback to a public RPC if available
    console.warn("Falling back to public RPC")
    return new ethers.JsonRpcProvider("https://rpc.ankr.com/eth_sepolia")
  }
}

// Create a read-only provider for direct contract calls
const readProvider = createProvider()
const readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readProvider)

// Create a read-only sTEA contract instance
const sTEAContract = new ethers.Contract(STEA_CONTRACT_ADDRESS, STEA_CONTRACT_ABI, readProvider)

// Add a function to check network connectivity
export const checkNetworkConnectivity = async () => {
  try {
    const blockNumber = await readProvider.getBlockNumber()
    console.log("Current block number:", blockNumber)
    return true
  } catch (error) {
    console.error("Network connectivity check failed:", error)
    return false
  }
}

// Add a function to check if user is on the correct network
export const checkCorrectNetwork = async () => {
  try {
    const { ethereum } = window as any
    if (!ethereum) return false

    const currentChainId = await ethereum.request({ method: "eth_chainId" })
    return currentChainId === TEA_SEPOLIA_NETWORK.chainId
  } catch (error) {
    console.error("Error checking network:", error)
    return false
  }
}

// Add a function to switch to Tea Sepolia network
export const switchToTeaSepoliaNetwork = async () => {
  try {
    const { ethereum } = window as any
    if (!ethereum) throw new Error("MetaMask not installed")

    try {
      // First try to switch to the network if it's already added to MetaMask
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: TEA_SEPOLIA_NETWORK.chainId }],
      })
      return true
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          // Add the network to MetaMask
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [TEA_SEPOLIA_NETWORK],
          })
          return true
        } catch (addError) {
          console.error("Error adding network to MetaMask:", addError)
          throw new Error("Failed to add Tea Sepolia network to MetaMask")
        }
      } else {
        console.error("Error switching network:", switchError)
        throw new Error("Failed to switch to Tea Sepolia network")
      }
    }
  } catch (error) {
    console.error("Error in switchToTeaSepoliaNetwork:", error)
    throw error
  }
}

// Update the getSignedContract function to fix the network configuration error
export const getSignedContract = async () => {
  try {
    const { ethereum } = window as any
    if (!ethereum) {
      throw new Error("MetaMask not installed")
    }

    // Check if on correct network
    const currentChainId = await ethereum.request({ method: "eth_chainId" })
    if (currentChainId !== TEA_SEPOLIA_NETWORK.chainId) {
      throw new Error("Please switch to Tea Sepolia network")
    }

    // Create the provider with correct parameters - don't pass options directly to constructor
    const web3Provider = new ethers.BrowserProvider(ethereum)

    // Get the signer from MetaMask
    const signer = await web3Provider.getSigner()
    console.log("Got signer for address:", await signer.getAddress())

    // Create a contract instance with the signer
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
  } catch (error) {
    console.error("Error in getSignedContract:", error)
    throw error
  }
}

// Get signed sTEA contract
export const getSignedSTEAContract = async () => {
  try {
    const { ethereum } = window as any
    if (!ethereum) {
      throw new Error("MetaMask not installed")
    }

    const web3Provider = new ethers.BrowserProvider(ethereum)
    const signer = await web3Provider.getSigner()

    return new ethers.Contract(STEA_CONTRACT_ADDRESS, STEA_CONTRACT_ABI, signer)
  } catch (error) {
    console.error("Error in getSignedSTEAContract:", error)
    throw error
  }
}

// Function to get sTEA balance directly from the sTEA contract
export const getSTEABalance = async (address: string) => {
  try {
    const balance = await sTEAContract.balanceOf(address)
    return balance
  } catch (error) {
    console.error(`Error getting sTEA balance for ${address}:`, error)
    return BigInt(0)
  }
}

// Perbaiki fungsi getProposals untuk menangani lebih banyak proposal dan menambahkan caching
export const getProposals = async (maxProposals = 50) => {
  try {
    console.log("Fetching proposals using read-only provider...")
    const proposals = []

    // First check if we can connect to the network
    const isConnected = await checkNetworkConnectivity()
    if (!isConnected) {
      console.warn("Network connectivity issues detected, proposals may not load correctly")
    }

    // Implement batching to improve performance
    const batchSize = 10
    const batches = Math.ceil(maxProposals / batchSize)

    for (let batch = 0; batch < batches; batch++) {
      const batchPromises = []
      const startIdx = batch * batchSize
      const endIdx = Math.min(startIdx + batchSize, maxProposals)

      for (let i = startIdx; i < endIdx; i++) {
        batchPromises.push(
          (async (index) => {
            try {
              const proposal = await readOnlyContract.proposals(index)

              // Check if the proposal has valid data
              if (proposal && typeof proposal.description === "string") {
                return {
                  id: index,
                  description: proposal.description,
                  voteCount: Number(proposal.voteCount),
                  active: proposal.active,
                }
              }
            } catch (error) {
              // If we get an error, we've likely reached the end of the proposals
              console.log(`No proposal at index ${index}`)
              return null
            }
          })(i),
        )
      }

      const batchResults = await Promise.all(batchPromises)
      const validResults = batchResults.filter((result) => result !== null)

      // If no valid results in this batch, we've reached the end
      if (validResults.length === 0) {
        break
      }

      proposals.push(...validResults)
    }

    console.log(`Total proposals found: ${proposals.length}`)
    return proposals
  } catch (error) {
    console.error("Error fetching proposals:", error)
    return [] // Return empty array instead of throwing to prevent UI crashes
  }
}

// Update the getLeaderboard function to filter out duplicate addresses
export const getLeaderboard = async () => {
  try {
    console.log("Fetching leaderboard using read-only provider...")

    // First check if we can connect to the network
    const isConnected = await checkNetworkConnectivity()
    if (!isConnected) {
      console.warn("Network connectivity issues detected, leaderboard may not load correctly")
      return { addresses: [], amounts: [] }
    }

    // Get leaderboard data from contract
    const leaderboard = await readOnlyContract.leaderboard()

    if (leaderboard && Array.isArray(leaderboard[0]) && Array.isArray(leaderboard[1])) {
      // Create a map to track unique addresses and their highest amounts
      const addressMap = new Map()

      leaderboard[0].forEach((address, index) => {
        const amount = leaderboard[1][index]
        const formattedAmount = ethers.formatEther(amount)

        // If address already exists in map, keep the higher amount
        if (addressMap.has(address)) {
          const existingAmount = addressMap.get(address)
          if (Number.parseFloat(formattedAmount) > Number.parseFloat(existingAmount)) {
            addressMap.set(address, formattedAmount)
          }
        } else {
          addressMap.set(address, formattedAmount)
        }
      })

      // Convert map back to arrays
      const uniqueAddresses = Array.from(addressMap.keys())
      const uniqueAmounts = uniqueAddresses.map((addr) => addressMap.get(addr))

      // Sort by amount (descending)
      const sortedIndices = uniqueAmounts
        .map((amount, index) => ({ index, amount: Number.parseFloat(amount) }))
        .sort((a, b) => b.amount - a.amount)
        .map((item) => item.index)

      const addresses = sortedIndices.map((i) => uniqueAddresses[i])
      const amounts = sortedIndices.map((i) => uniqueAmounts[i])

      console.log("Leaderboard addresses (unique):", addresses)
      console.log("Leaderboard amounts (unique):", amounts)

      return {
        addresses,
        amounts,
      }
    } else {
      console.error("Invalid leaderboard data format:", leaderboard)
      return { addresses: [], amounts: [] }
    }
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return { addresses: [], amounts: [] } // Return empty data instead of throwing
  }
}

// New function to get sTEA balances leaderboard directly from the sTEA contract
export const getDirectSTEALeaderboard = async () => {
  try {
    console.log("Fetching sTEA balances directly from sTEA contract...")

    // First check if we can connect to the network
    const isConnected = await checkNetworkConnectivity()
    if (!isConnected) {
      console.warn("Network connectivity issues detected, leaderboard may not load correctly")
      return { addresses: [], amounts: [] }
    }

    // Get addresses from the main contract's leaderboard
    // We need this because ERC20 contracts don't have a way to list all holders
    const leaderboard = await readOnlyContract.leaderboard()

    if (!leaderboard || !Array.isArray(leaderboard[0])) {
      console.error("Invalid leaderboard data format:", leaderboard)
      return { addresses: [], amounts: [] }
    }

    // Get unique addresses from the leaderboard
    const uniqueAddresses = [...new Set(leaderboard[0])]
    console.log(`Found ${uniqueAddresses.length} unique addresses to check for sTEA balances`)

    // Process in smaller batches to avoid timeouts
    const batchSize = 10
    const batches = Math.ceil(uniqueAddresses.length / batchSize)

    // Store results
    const addressesWithBalance = []
    const balances = []

    for (let i = 0; i < batches; i++) {
      const startIdx = i * batchSize
      const endIdx = Math.min(startIdx + batchSize, uniqueAddresses.length)
      const batchAddresses = uniqueAddresses.slice(startIdx, endIdx)

      console.log(`Processing batch ${i + 1}/${batches} (${batchAddresses.length} addresses)`)

      // Process batch in parallel
      const batchPromises = batchAddresses.map((address) => {
        return Promise.race([
          // Get balance with timeout
          (async () => {
            try {
              const balance = await sTEAContract.balanceOf(address)
              if (balance > 0n) {
                return { address, balance }
              }
              return null
            } catch (error) {
              console.error(`Error getting sTEA balance for ${address}:`, error)
              return null
            }
          })(),
          // 3-second timeout
          new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout for ${address}`)), 3000)),
        ]).catch((error) => {
          console.warn(error.message)
          return null
        })
      })

      const results = await Promise.all(batchPromises)

      // Add valid results
      results.forEach((result) => {
        if (result && result.balance > 0n) {
          addressesWithBalance.push(result.address)
          balances.push(ethers.formatEther(result.balance))
        }
      })

      // Add a small delay between batches
      if (i < batches - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    // Sort by balance (descending)
    const sortedIndices = balances
      .map((amount, index) => ({ index, amount: Number.parseFloat(amount) }))
      .sort((a, b) => b.amount - a.amount)
      .map((item) => item.index)

    const sortedAddresses = sortedIndices.map((i) => addressesWithBalance[i])
    const sortedBalances = sortedIndices.map((i) => balances[i])

    console.log(`Found ${sortedAddresses.length} addresses with sTEA balances`)

    return {
      addresses: sortedAddresses,
      amounts: sortedBalances,
    }
  } catch (error) {
    console.error("Error fetching direct sTEA leaderboard:", error)
    return { addresses: [], amounts: [] }
  }
}

// Add a new function to get staked balances for leaderboard
export const getStakedBalancesLeaderboard = async () => {
  try {
    console.log("Fetching staked balances for leaderboard...")

    // Try to get sTEA balances directly from the sTEA contract first
    try {
      const directSTEALeaderboard = await getDirectSTEALeaderboard()
      if (directSTEALeaderboard.addresses.length > 0) {
        console.log("Successfully fetched sTEA balances directly from contract")
        return directSTEALeaderboard
      }
    } catch (error) {
      console.error("Error fetching direct sTEA leaderboard:", error)
    }

    // Fallback to the old method if direct method fails
    console.log("Falling back to old method for fetching staked balances...")

    // Since we don't have a getStakers function in the contract,
    // we'll use the existing leaderboard function and filter for staked balances
    const leaderboard = await readOnlyContract.leaderboard()

    if (leaderboard && Array.isArray(leaderboard[0]) && Array.isArray(leaderboard[1])) {
      const addresses = leaderboard[0]

      // Create a Set to track unique addresses we've already processed
      // This prevents duplicate processing of the same address
      const processedAddresses = new Set()

      // Create an array to store staked balance results
      const stakedBalances = []

      // Limit the number of addresses to process to avoid timeouts
      // Process only the first 20 addresses to ensure we complete within timeout
      const addressesToProcess = addresses.slice(0, 20)

      // Process addresses in batches to improve performance
      const batchSize = 5
      const batches = Math.ceil(addressesToProcess.length / batchSize)

      for (let i = 0; i < batches; i++) {
        const startIdx = i * batchSize
        const endIdx = Math.min(startIdx + batchSize, addressesToProcess.length)
        const batchAddresses = addressesToProcess.slice(startIdx, endIdx)

        // Process batch in parallel with individual timeouts
        const batchPromises = batchAddresses.map((address) => {
          // Skip if we've already processed this address
          if (processedAddresses.has(address)) {
            return Promise.resolve(null)
          }

          // Mark this address as processed
          processedAddresses.add(address)

          // Add timeout for each individual request
          return Promise.race([
            (async () => {
              try {
                const balance = await readOnlyContract.stakedBalances(address)

                // Only add addresses with non-zero staked balance
                if (balance > 0n) {
                  return {
                    address,
                    amount: balance,
                  }
                }
                return null
              } catch (error) {
                console.error(`Error getting staked balance for ${address}:`, error)
                return null
              }
            })(),
            // 3-second timeout for individual address
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout getting balance for ${address}`)), 3000),
            ),
          ]).catch((error) => {
            console.warn(`Skipping address ${address}:`, error.message)
            return null
          })
        })

        // Wait for all promises in the batch to resolve
        const results = await Promise.all(batchPromises)

        // Add valid results to stakedBalances
        results.forEach((result) => {
          if (result) {
            stakedBalances.push(result)
          }
        })

        // Add a small delay between batches
        if (i < batches - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      }

      // If we have at least some results, we can proceed
      if (stakedBalances.length > 0) {
        // Sort by staked balance (descending)
        // Fix: Use proper BigInt comparison
        const sortedBalances = stakedBalances.sort((a, b) => {
          // Proper BigInt comparison
          if (b.amount > a.amount) return 1
          if (b.amount < a.amount) return -1
          return 0
        })

        const sortedAddresses = sortedBalances.map((item) => item.address)
        const sortedAmounts = sortedBalances.map((item) => ethers.formatEther(item.amount))

        console.log("Staked balances leaderboard addresses:", sortedAddresses)
        console.log("Staked balances leaderboard amounts:", sortedAmounts)

        return {
          addresses: sortedAddresses,
          amounts: sortedAmounts,
        }
      }
    }

    // If we couldn't get any valid data, fall back to regular leaderboard
    console.warn("No valid staked balances found, falling back to regular leaderboard")
    return getLeaderboard()
  } catch (error) {
    console.error("Error fetching staked balances leaderboard:", error)
    return getLeaderboard() // Return regular leaderboard as fallback
  }
}

// Update the getUserBalances function with better error handling
export const getUserBalances = async (address: string) => {
  try {
    console.log("Fetching balances for address:", address)

    // First check if we can connect to the network
    const isConnected = await checkNetworkConnectivity()
    if (!isConnected) {
      console.warn("Network connectivity issues detected, balances may not load correctly")
      return {
        balance: "0",
        stakedBalance: "0",
        totalStaked: "0",
        hasVoted: false,
      }
    }

    const balance = await readOnlyContract.balances(address)

    // Get staked balance directly from sTEA contract
    let stakedBalance
    try {
      stakedBalance = await sTEAContract.balanceOf(address)
    } catch (error) {
      console.error("Error getting sTEA balance directly, falling back to contract method:", error)
      stakedBalance = await readOnlyContract.stakedBalances(address)
    }

    const totalStaked = await readOnlyContract.totalStaked()
    const hasVoted = await readOnlyContract.hasVoted(address)

    console.log("Balance:", ethers.formatEther(balance))
    console.log("Staked Balance:", ethers.formatEther(stakedBalance))
    console.log("Total Staked:", ethers.formatEther(totalStaked))
    console.log("Has Voted:", hasVoted)

    return {
      balance: ethers.formatEther(balance),
      stakedBalance: ethers.formatEther(stakedBalance),
      totalStaked: ethers.formatEther(totalStaked),
      hasVoted,
    }
  } catch (error) {
    console.error("Error fetching user balances:", error)
    return {
      balance: "0",
      stakedBalance: "0",
      totalStaked: "0",
      hasVoted: false,
    }
  }
}

// Update the getNativeBalance function with better error handling
export const getNativeBalance = async (address: string) => {
  try {
    console.log("Fetching native balance for address:", address)

    // Try to get the balance from MetaMask first (more reliable)
    try {
      const { ethereum } = window as any
      if (ethereum) {
        const web3Provider = new ethers.BrowserProvider(ethereum)
        const balance = await web3Provider.getBalance(address)
        const formattedBalance = ethers.formatEther(balance)
        console.log("Native TEA balance (from MetaMask):", formattedBalance)
        return formattedBalance
      }
    } catch (metaMaskError) {
      console.warn("Failed to get balance from MetaMask:", metaMaskError)
    }

    // Fallback to read-only provider
    const balance = await readProvider.getBalance(address)
    const formattedBalance = ethers.formatEther(balance)

    console.log("Native TEA balance:", formattedBalance)
    return formattedBalance
  } catch (error) {
    console.error("Error fetching native balance:", error)
    return "0"
  }
}

// Add a new function to estimate gas with fallback values
export const estimateGasWithFallback = async (
  contract: ethers.Contract,
  method: string,
  args: any[] = [],
  value = "0",
) => {
  try {
    // Try to estimate gas
    const gasEstimate = await contract[method].estimateGas(...args, {
      value: value !== "0" ? ethers.parseEther(value) : undefined,
    })

    // Add a buffer to the gas estimate (20% more)
    return (gasEstimate * BigInt(120)) / BigInt(100)
  } catch (error) {
    console.warn(`Gas estimation failed for ${method}:`, error)

    // Return a reasonable fallback gas limit based on the method
    switch (method) {
      case "deposit":
        return BigInt(100000) // Higher gas for payable functions
      case "withdraw":
      case "stake":
      case "unstake":
        return BigInt(80000)
      case "vote":
      case "createProposal":
        return BigInt(150000) // Higher gas for state-changing operations
      case "closeProposal":
        return BigInt(100000)
      default:
        return BigInt(100000) // Default fallback
    }
  }
}

