"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { toast, Toaster } from "react-hot-toast"
import { Wallet, Coffee, Menu, X } from "lucide-react"
import { cn, formatAddress } from "./utils"
import {
  getLeaderboard,
  getUserBalances,
  getNativeBalance,
  checkNetworkConnectivity,
  getStakedBalancesLeaderboard,
  getDirectSTEALeaderboard,
  checkCorrectNetwork,
  switchToTeaSepoliaNetwork,
} from "./contract-utils"

// Import components
import Dashboard from "./components/dashboard"
import Governance from "./components/governance"
import Leaderboard from "./components/leaderboard"
import { Footer } from "./footer"
import NetworkAlert from "./components/network-alert"

interface Proposal {
  id: number
  description: string
  voteCount: number
  active: boolean
}

// Track pending transactions
interface PendingTransaction {
  hash: string
  type: "deposit" | "withdraw" | "stake" | "unstake" | "vote" | "createProposal" | "closeProposal"
  timestamp: number
}

function App() {
  const [account, setAccount] = useState("")
  const [balance, setBalance] = useState("0")
  const [stakedBalance, setStakedBalance] = useState("0")
  const [totalStaked, setTotalStaked] = useState("0")
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [leaderboardData, setLeaderboardData] = useState({ addresses: [], amounts: [] })
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"dashboard" | "governance" | "leaderboard">("dashboard")
  const [hasVoted, setHasVoted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // Add a new state for native balance
  const [nativeBalance, setNativeBalance] = useState("0")
  // Add a function to show network status
  const [networkStatus, setNetworkStatus] = useState<"connected" | "disconnected" | "unknown">("unknown")
  // Add these state variables after the other state declarations (around line 40)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  // Add state for pending transactions
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([])
  // Add state for tab transition
  const [tabChanging, setTabChanging] = useState(false)
  // Add state to track if leaderboard is currently loading
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  // Add state to track if we're using direct sTEA data
  const [usingDirectSTEA, setUsingDirectSTEA] = useState(false)
  // Add a new state for network status
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)

  // Update document title based on active tab
  useEffect(() => {
    const tabName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
    document.title = `${tabName} | TEA Protocol`
  }, [activeTab])

  useEffect(() => {
    checkIfWalletIsConnected()
    checkNetwork()
  }, [])

  // Load data when account or active tab changes
  useEffect(() => {
    if (account) {
      loadData()
    }
  }, [account, activeTab])

  // Check for pending transactions periodically
  useEffect(() => {
    if (pendingTransactions.length > 0 && account) {
      const interval = setInterval(() => {
        checkPendingTransactions()
      }, 10000) // Check every 10 seconds

      return () => clearInterval(interval)
    }
  }, [pendingTransactions, account])

  // Function to check pending transactions
  const checkPendingTransactions = async () => {
    if (!account || pendingTransactions.length === 0) return

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum)

      // Create a new array to track which transactions to keep
      const updatedPendingTransactions = [...pendingTransactions]
      let hasConfirmed = false

      // Check each pending transaction
      for (let i = pendingTransactions.length - 1; i >= 0; i--) {
        const tx = pendingTransactions[i]

        try {
          // Try to get receipt - if successful, transaction is confirmed
          const receipt = await provider.getTransactionReceipt(tx.hash)

          if (receipt) {
            // Transaction confirmed
            console.log(`Transaction ${tx.hash} confirmed!`)
            toast.success(`${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} transaction confirmed!`, {
              id: `confirmed-${tx.hash.slice(0, 10)}`,
            })

            // Remove from pending transactions
            updatedPendingTransactions.splice(i, 1)
            hasConfirmed = true
          } else {
            // Still pending
            const elapsedMinutes = (Date.now() - tx.timestamp) / 60000

            // If transaction has been pending for more than 30 minutes, suggest speeding it up
            if (elapsedMinutes > 30) {
              toast(
                `Transaction still pending after ${Math.floor(elapsedMinutes)} minutes. Consider speeding it up in MetaMask.`,
                {
                  icon: "⏳",
                  duration: 5000,
                  id: `pending-long-${tx.hash.slice(0, 10)}`,
                },
              )
            }
          }
        } catch (error) {
          console.log(`Error checking transaction ${tx.hash}:`, error)
          // Keep the transaction in the pending list if there's an error checking it
        }
      }

      // Update pending transactions state
      setPendingTransactions(updatedPendingTransactions)

      // Refresh data if any transaction confirmed
      if (hasConfirmed) {
        await loadData()
      }
    } catch (error) {
      console.error("Error checking pending transactions:", error)
    }
  }

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window as any
      if (!ethereum) {
        toast("Please install MetaMask!", {
          icon: "⚠️",
          style: {
            borderRadius: "10px",
            background: "#fff",
            color: "#0c4c67",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
          },
        })
        return
      }

      const accounts = await ethereum.request({ method: "eth_accounts" })
      if (accounts.length > 0) {
        setAccount(accounts[0])
      }
    } catch (error) {
      console.error(error)
      toast("Error connecting to wallet", {
        icon: "❌",
        style: {
          borderRadius: "10px",
          background: "#fff",
          color: "#0c4c67",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e2e8f0",
        },
      })
    }
  }

  // Add this function after the checkIfWalletIsConnected function
  const checkNetwork = async () => {
    const onCorrectNetwork = await checkCorrectNetwork()
    setIsCorrectNetwork(onCorrectNetwork)
    return onCorrectNetwork
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window as any
      if (!ethereum) {
        toast("Please install MetaMask!", {
          icon: "⚠️",
          style: {
            borderRadius: "10px",
            background: "#fff",
            color: "#0c4c67",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
          },
        })
        return
      }

      setLoading(true)

      // Primero conectar la wallet
      const accounts = await ethereum.request({ method: "eth_requestAccounts" })
      setAccount(accounts[0])

      // Luego verificarmethod: "eth_requestAccounts"})
      setAccount(accounts[0])

      // Luego verificar la red
      const onCorrectNetwork = await checkNetwork()

      // Si no está en la red correcta, preguntar si quiere cambiar
      if (!onCorrectNetwork) {
        toast.warning("You need to switch to Tea Sepolia network to use this application", {
          duration: 5000,
          style: {
            borderRadius: "10px",
            background: "#fff",
            color: "#0c4c67",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
          },
        })

        // Preguntar si quiere cambiar automáticamente
        const wantToSwitch = window.confirm("Would you like to switch to Tea Sepolia network automatically?")

        if (wantToSwitch) {
          try {
            // Mostrar toast de carga
            const switchingToastId = toast.loading("Switching to Tea Sepolia network...", {
              style: {
                borderRadius: "10px",
                background: "#fff",
                color: "#0c4c67",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e2e8f0",
              },
            })

            await switchToTeaSepoliaNetwork()
            await checkNetwork()

            // Eliminar toast de carga
            toast.dismiss(switchingToastId)
          } catch (networkError) {
            console.error("Failed to switch network:", networkError)
            toast.error("Failed to switch network. Please try manually in MetaMask.", {
              duration: 5000,
              style: {
                borderRadius: "10px",
                background: "#fff",
                color: "#0c4c67",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e2e8f0",
              },
            })
          }
        }
      }

      setLoading(false)

      toast.success("Wallet connected successfully!", {
        duration: 3000,
        style: {
          borderRadius: "10px",
          background: "#fff",
          color: "#0c4c67",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e2e8f0",
        },
      })
    } catch (error) {
      console.error(error)
      toast.error("Error connecting wallet", {
        duration: 3000,
        style: {
          borderRadius: "10px",
          background: "#fff",
          color: "#0c4c67",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e2e8f0",
        },
      })
      setLoading(false)
    }
  }

  // Add a function to handle network switching
  const handleSwitchNetwork = async () => {
    try {
      setLoading(true)

      // Mostrar toast de carga
      const switchingToastId = toast.loading("Switching to Tea Sepolia network...", {
        style: {
          borderRadius: "10px",
          background: "#fff",
          color: "#0c4c67",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e2e8f0",
        },
      })

      await switchToTeaSepoliaNetwork()
      const networkSwitched = await checkNetwork()

      // Eliminar toast de carga
      toast.dismiss(switchingToastId)

      if (networkSwitched) {
        toast.success("Successfully switched to Tea Sepolia network!", {
          duration: 3000,
          style: {
            borderRadius: "10px",
            background: "#fff",
            color: "#0c4c67",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
          },
        })
      } else {
        toast.error("Failed to switch network. Please try manually in MetaMask.", {
          duration: 5000,
          style: {
            borderRadius: "10px",
            background: "#fff",
            color: "#0c4c67",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
          },
        })
      }
    } catch (error) {
      console.error("Error switching network:", error)
      toast.error("Failed to switch network. Please try manually in MetaMask.", {
        duration: 5000,
        style: {
          borderRadius: "10px",
          background: "#fff",
          color: "#0c4c67",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e2e8f0",
        },
      })
    } finally {
      setLoading(false)
    }
  }

  // Add a disconnectWallet function after the connectWallet function
  const disconnectWallet = () => {
    try {
      // Clear the account and related states
      setAccount("")
      setBalance("0")
      setStakedBalance("0")
      setTotalStaked("0")
      setNativeBalance("0")
      setProposals([])
      setLeaderboardData({ addresses: [], amounts: [] })
      setHasVoted(false)
      setPendingTransactions([])

      toast.success("Wallet disconnected successfully!", {
        duration: 3000,
        style: {
          borderRadius: "10px",
          background: "#fff",
          color: "#0c4c67",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e2e8f0",
        },
      })
    } catch (error) {
      console.error("Error disconnecting wallet:", error)
    }
  }

  // Update the loadData function to also fetch native balance
  const loadData = async () => {
    if (!account) return

    setDataLoading(true)
    try {
      // Check network connectivity first
      const isConnected = await checkNetworkConnectivity()
      setNetworkStatus(isConnected ? "connected" : "disconnected")

      // Load user balances
      const balances = await getUserBalances(account)
      setBalance(balances.balance)
      setStakedBalance(balances.stakedBalance)
      setTotalStaked(balances.totalStaked)
      setHasVoted(balances.hasVoted)

      // Get native TEA balance
      const native = await getNativeBalance(account)
      setNativeBalance(native)

      // Load tab-specific data
      if (activeTab === "governance") {
        // Proposals will be loaded by the Governance component itself
      } else if (activeTab === "leaderboard") {
        await refreshLeaderboardData()
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Error loading data. Please try again.", {
        duration: 3000,
        style: {
          borderRadius: "10px",
          background: "#fff",
          color: "#0c4c67",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e2e8f0",
        },
      })
    } finally {
      setDataLoading(false)
    }
  }

  // Add a separate function to refresh leaderboard data
  const refreshLeaderboardData = async () => {
    try {
      // Set loading state
      setLeaderboardLoading(true)

      // Add timeout for the entire operation - increase to 30 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.warn("Leaderboard refresh timeout")
          reject(new Error("Leaderboard refresh timeout"))
        }, 30000) // 30 second timeout (increased from 15)
      })

      const fetchPromise = (async () => {
        try {
          // Try to get sTEA balances directly from the sTEA contract
          const directSTEALeaderboard = await getDirectSTEALeaderboard()
          if (directSTEALeaderboard.addresses.length > 0) {
            setLeaderboardData(directSTEALeaderboard)
            setUsingDirectSTEA(true)
            return directSTEALeaderboard
          }

          // If direct method fails, try the old method
          const stakedLeaderboard = await getStakedBalancesLeaderboard()
          if (stakedLeaderboard.addresses.length > 0) {
            setLeaderboardData(stakedLeaderboard)
            setUsingDirectSTEA(false)
            return stakedLeaderboard
          }

          // Fall back to regular leaderboard if both methods fail
          const leaderboard = await getLeaderboard()
          setLeaderboardData(leaderboard)
          setUsingDirectSTEA(false)
          return leaderboard
        } catch (error) {
          console.warn("Error in fetchPromise:", error)
          // Fall back to regular leaderboard
          const leaderboard = await getLeaderboard()
          setLeaderboardData(leaderboard)
          setUsingDirectSTEA(false)
          return leaderboard
        }
      })()

      // Race between the fetch operation and the timeout
      return await Promise.race([fetchPromise, timeoutPromise]).catch((error) => {
        console.error("Leaderboard refresh error or timeout:", error)
        // In case of timeout, still try to get regular leaderboard
        toast.error("Leaderboard refresh timed out. Showing available data.", {
          duration: 3000,
        })
        return getLeaderboard().then((leaderboard) => {
          setLeaderboardData(leaderboard)
          setUsingDirectSTEA(false)
          return leaderboard
        })
      })
    } catch (error) {
      console.error("Error refreshing leaderboard data:", error)
      // Try to get at least some data
      try {
        const leaderboard = await getLeaderboard()
        setLeaderboardData(leaderboard)
        setUsingDirectSTEA(false)
        return leaderboard
      } catch (e) {
        console.error("Failed to get any leaderboard data:", e)
        toast.error("Failed to load leaderboard data.", {
          duration: 3000,
        })
        return { addresses: [], amounts: [] }
      }
    } finally {
      // Clear loading state
      setLeaderboardLoading(false)
    }
  }

  // Add a function to handle network changes
  useEffect(() => {
    const handleNetworkChange = async () => {
      // Check if we're on the correct network
      await checkNetwork()

      // Reload data when network changes
      if (account) {
        loadData()
      }
    }

    const { ethereum } = window as any
    if (ethereum) {
      ethereum.on("chainChanged", handleNetworkChange)
      ethereum.on("accountsChanged", handleNetworkChange)
    }

    return () => {
      if (ethereum) {
        ethereum.removeListener("chainChanged", handleNetworkChange)
        ethereum.removeListener("accountsChanged", handleNetworkChange)
      }
    }
  }, [account])

  // Render pending transactions indicator
  const renderPendingTransactionsIndicator = () => {
    if (pendingTransactions.length === 0) return null

    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => checkPendingTransactions()}
          className="flex items-center space-x-2 bg-[#0c4c67] text-white px-4 py-2 rounded-lg shadow-lg hover:bg-[#0c4c67]/90 transition-colors"
        >
          <div className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
          <span>
            {pendingTransactions.length} Pending {pendingTransactions.length === 1 ? "Transaction" : "Transactions"}
          </span>
        </button>
      </div>
    )
  }

  const handleTabChange = (tab: "dashboard" | "governance" | "leaderboard") => {
    if (tab === activeTab) return

    // Set tab changing state to true to trigger transition animation
    setTabChanging(true)

    // After a short delay, change the tab
    setTimeout(() => {
      setActiveTab(tab)
      setMobileMenuOpen(false)

      // After tab is changed, reset the tab changing state
      setTimeout(() => {
        setTabChanging(false)
      }, 100)
    }, 200)
  }

  const renderSidebar = () => (
    <aside
      className={cn(
        "bg-gradient-to-b from-[#0c4c67] to-[#0c4c67]/90 h-full fixed left-0 top-0 z-40 w-64 transition-transform duration-300 ease-in-out shadow-lg",
        "transform lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-[#0c4c67]/30">
          <div className="flex items-center space-x-3">
            <Coffee className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">TEA Protocol</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => handleTabChange("dashboard")}
            className={cn(
              "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
              activeTab === "dashboard"
                ? "bg-white/10 text-white border border-white/20"
                : "text-white/80 hover:bg-white/5 hover:text-white",
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleTabChange("governance")}
            className={cn(
              "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
              activeTab === "governance"
                ? "bg-white/10 text-white border border-white/20"
                : "text-white/80 hover:bg-white/5 hover:text-white",
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>Governance</span>
          </button>

          <button
            onClick={() => handleTabChange("leaderboard")}
            className={cn(
              "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
              activeTab === "leaderboard"
                ? "bg-white/10 text-white border border-white/20"
                : "text-white/80 hover:bg-white/5 hover:text-white",
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span>Leaderboard</span>
          </button>
        </nav>

        <div className="p-4 border-t border-[#0c4c67]/30">
          {account ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 bg-white/10 p-3 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="font-mono text-sm text-white">{formatAddress(account)}</span>
              </div>
              <button
                onClick={disconnectWallet}
                className="w-full flex items-center justify-center space-x-2 bg-white/20 hover:bg-white/30
                  text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
              >
                <X className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={loading}
              className={cn(
                "w-full flex items-center justify-center space-x-2 bg-white/20",
                "text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200",
                "hover:bg-white/30 hover:shadow-lg",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              <Wallet className="w-5 h-5" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  )

  return (
    <>
      <NetworkAlert
        account={account}
        isCorrectNetwork={isCorrectNetwork}
        handleSwitchNetwork={handleSwitchNetwork}
        loading={loading}
      />

      {/* Mobile Header */}
      <header
        className={cn(
          "lg:hidden sticky z-40 backdrop-blur-lg bg-[#0c4c67] border-b border-[#0c4c67]/20 shadow-md",
          !isCorrectNetwork && account ? "top-[41px]" : "top-0",
        )}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-white/10 text-white transition-transform duration-200 hover:scale-105 active:scale-95"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <div className="flex items-center space-x-2">
              <Coffee className="w-6 h-6 text-white" />
              <h1 className="text-xl font-bold text-white">Tea Gov</h1>
            </div>

            {account ? (
              <div className="flex items-center">
                <div className="flex items-center space-x-1 bg-white/10 py-1.5 px-3 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="font-mono text-xs text-white">{formatAddress(account)}</span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="ml-1 p-1.5 rounded-lg bg-white/20 text-white transition-transform duration-200 hover:scale-105 active:scale-95"
                  aria-label="Disconnect wallet"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={loading}
                className={cn(
                  "flex items-center space-x-1 bg-white/20",
                  "text-white font-medium py-1.5 px-2 rounded-lg text-sm",
                  "transition-all duration-200 hover:bg-white/30 hover:scale-105 active:scale-95",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                <Wallet className="w-4 h-4" />
                <span>Connect</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-[2px] transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      {renderSidebar()}

      {/* Main Content */}
      <div className="lg:ml-64 transition-all duration-300 flex-1">
        <main className="container mx-auto px-4 py-8">
          {!account ? (
            <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
              <div className="text-center space-y-6 max-w-md">
                <div className="bg-[#0c4c67]/10 p-6 rounded-full inline-block mx-auto transition-transform duration-500 hover:scale-105">
                  <Coffee className="w-16 h-16 text-[#0c4c67] mx-auto" />
                </div>
                <h1 className="text-3xl font-bold text-[#0c4c67]">Welcome to TEA Protocol</h1>
                <p className="text-gray-600">
                  Connect your wallet to access the dashboard, participate in governance, and view the leaderboard.
                </p>
                <button
                  onClick={connectWallet}
                  disabled={loading}
                  className={cn(
                    "flex items-center justify-center space-x-2 bg-[#0c4c67] mx-auto",
                    "text-white font-medium py-3 px-8 rounded-lg",
                    "transition-all duration-300 hover:bg-[#0c4c67]/90 hover:shadow-lg hover:shadow-[#0c4c67]/20 hover:scale-105 active:scale-95",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  {loading ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5" />
                      <span>Connect Wallet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "space-y-8 pb-12 transition-opacity duration-300",
                tabChanging ? "opacity-0" : "opacity-100",
              )}
            >
              {dataLoading && (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0c4c67]"></div>
                </div>
              )}

              {/* Dashboard Tab */}
              {activeTab === "dashboard" && (
                <Dashboard
                  balance={balance}
                  stakedBalance={stakedBalance}
                  totalStaked={totalStaked}
                  nativeBalance={nativeBalance}
                  loading={loading}
                  setLoading={setLoading}
                  setPendingTransactions={setPendingTransactions}
                  loadData={loadData}
                />
              )}

              {/* Governance Tab */}
              {activeTab === "governance" && (
                <Governance
                  account={account}
                  hasVoted={hasVoted}
                  proposals={proposals}
                  loading={loading}
                  setLoading={setLoading}
                  setProposals={setProposals}
                  setPendingTransactions={setPendingTransactions}
                  loadData={loadData}
                />
              )}

              {/* Leaderboard Tab */}
              {activeTab === "leaderboard" && (
                <Leaderboard
                  account={account}
                  leaderboardData={leaderboardData}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  refreshLeaderboardData={refreshLeaderboardData}
                  isLoading={leaderboardLoading}
                  usingDirectSTEA={usingDirectSTEA}
                />
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <Footer className="mt-auto" />
      </div>

      {renderPendingTransactionsIndicator()}
      <Toaster position="bottom-right" />
    </>
  )
}

export default App

