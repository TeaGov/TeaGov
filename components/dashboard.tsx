"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"
import { Wallet, PlusCircle, MinusCircle, BarChart3, Layers, ArrowRight } from "lucide-react"
import { cn, formatNumber } from "../utils"
import { getSignedContract, estimateGasWithFallback } from "../contract-utils"
import { ethers } from "ethers"

interface DashboardProps {
  balance: string
  stakedBalance: string
  totalStaked: string
  nativeBalance: string
  loading: boolean
  setLoading: (loading: boolean) => void
  setPendingTransactions: (callback: (prev: any[]) => any[]) => void
  loadData: () => Promise<void>
}

export default function Dashboard({
  balance,
  stakedBalance,
  totalStaked,
  nativeBalance,
  loading,
  setLoading,
  setPendingTransactions,
  loadData,
}: DashboardProps) {
  const [amount, setAmount] = useState("")
  const [actionType, setActionType] = useState<"deposit" | "withdraw" | "stake" | "unstake">("deposit")

  // Modificar la función handleAction para verificar la red antes de proceder
  const handleAction = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast("Please enter a valid amount", {
        icon: "⚠️",
        style: {
          borderRadius: "10px",
          background: "#fff",
          color: "#1A5F7A",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e2e8f0",
        },
      })
      return
    }

    try {
      setLoading(true)

      // Verificar si estamos en la red correcta
      const { ethereum } = window as any
      if (!ethereum) {
        toast.error("MetaMask not installed!", {
          duration: 3000,
          style: {
            borderRadius: "10px",
            background: "#fff",
            color: "#1A5F7A",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
          },
        })
        setLoading(false)
        return
      }

      // Verificar la red actual
      const currentChainId = await ethereum.request({ method: "eth_chainId" })
      const teaSepoliaChainId = `0x${(10218).toString(16)}` // '0x27ea'

      if (currentChainId !== teaSepoliaChainId) {
        toast.error("Please switch to Tea Sepolia network to continue", {
          duration: 5000,
          style: {
            borderRadius: "10px",
            background: "#fff",
            color: "#1A5F7A",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
          },
        })
        setLoading(false)
        return
      }

      // Show transaction preparation toast
      const preparingToastId = toast.loading("Preparing transaction...", {
        style: {
          borderRadius: "10px",
          background: "#fff",
          color: "#1A5F7A",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e2e8f0",
        },
      })

      const contract = await getSignedContract()

      let tx
      try {
        // Dismiss preparing toast
        toast.dismiss(preparingToastId)

        // Show waiting for confirmation toast
        const waitingToastId = toast.loading("Waiting for wallet confirmation...", {
          style: {
            borderRadius: "10px",
            background: "#fff",
            color: "#1A5F7A",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
          },
        })

        try {
          // Prepare transaction options with gas estimation
          let gasLimit
          let txOptions = {}

          switch (actionType) {
            case "deposit":
              gasLimit = await estimateGasWithFallback(contract, "deposit", [], amount)
              txOptions = {
                value: ethers.parseEther(amount),
                gasLimit,
              }
              tx = await contract.deposit(txOptions)
              break
            case "withdraw":
              gasLimit = await estimateGasWithFallback(contract, "withdraw", [ethers.parseEther(amount)])
              txOptions = { gasLimit }
              tx = await contract.withdraw(ethers.parseEther(amount), txOptions)
              break
            case "stake":
              gasLimit = await estimateGasWithFallback(contract, "stake", [ethers.parseEther(amount)])
              txOptions = { gasLimit }
              tx = await contract.stake(ethers.parseEther(amount), txOptions)
              break
            case "unstake":
              gasLimit = await estimateGasWithFallback(contract, "unstake", [ethers.parseEther(amount)])
              txOptions = { gasLimit }
              tx = await contract.unstake(ethers.parseEther(amount), txOptions)
              break
          }

          // Dismiss waiting toast
          toast.dismiss(waitingToastId)

          // Add transaction to pending transactions
          setPendingTransactions((prev) => [
            ...prev,
            {
              hash: tx.hash,
              type: actionType,
              timestamp: Date.now(),
            },
          ])

          // Show transaction submitted toast
          toast.success(`Transaction submitted! Check status in MetaMask.`, {
            duration: 5000,
            style: {
              borderRadius: "10px",
              background: "#fff",
              color: "#1A5F7A",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
            },
          })

          // Add transaction hash to console for debugging
          console.log(`Transaction hash: ${tx.hash}`)

          // Clear the input field
          setAmount("")

          // Refresh data after a short delay to show updated UI
          setTimeout(async () => {
            await loadData()
          }, 2000)
        } catch (txError) {
          // Always dismiss the waiting toast in case of error
          toast.dismiss(waitingToastId)

          console.error("Transaction error:", txError)

          // Extract a more user-friendly error message
          let errorMessage = "Transaction failed"
          if (txError.message) {
            if (txError.message.includes("insufficient funds")) {
              errorMessage = "Insufficient funds for this transaction"
            } else if (txError.message.includes("user rejected")) {
              errorMessage = "Transaction was rejected"
            } else if (txError.message.includes("cannot estimate gas")) {
              errorMessage = "Cannot estimate gas. The transaction may fail."
            } else if (txError.message.includes("timeout")) {
              errorMessage = "Transaction confirmation timed out. Check your wallet for status."
            } else if (txError.message.includes("JsonRpcEngine")) {
              errorMessage = "Network communication error. Please try again with a higher gas price."
            } else if (txError.message.includes("replacement fee too low")) {
              errorMessage = "Gas price too low. Please try again with a higher gas price."
            }
          }

          toast(errorMessage, {
            icon: "❌",
            style: {
              borderRadius: "10px",
              background: "#fff",
              color: "#1A5F7A",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
            },
          })
          throw txError // Re-throw to be caught by the outer catch
        }
      } catch (error) {
        console.error("Error in handleAction:", error)
        toast(`Error during ${actionType}. Please check your connection and try again.`, {
          icon: "❌",
          style: {
            borderRadius: "10px",
            background: "#fff",
            color: "#1A5F7A",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
          },
        })
      } finally {
        setLoading(false)
      }
    } catch (error) {
      console.error("Error:", error)
      setLoading(false)
    }
  }

  const getActionColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "bg-gradient-to-r from-teal-500 to-teal-600"
      case "withdraw":
        return "bg-gradient-to-r from-rose-500 to-rose-600"
      case "stake":
        return "bg-gradient-to-r from-blue-500 to-blue-600"
      case "unstake":
        return "bg-gradient-to-r from-amber-500 to-amber-600"
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600"
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <PlusCircle className="w-5 h-5" />
      case "withdraw":
        return <MinusCircle className="w-5 h-5" />
      case "stake":
        return <Layers className="w-5 h-5" />
      case "unstake":
        return <ArrowRight className="w-5 h-5" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A5F7A]">Dashboard</h1>
        <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:border-[#1A5F7A]/30 transition-colors shadow-sm hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Available Balance</p>
              <p className="text-2xl font-bold mt-1 text-[#1A5F7A]">{formatNumber(balance)}</p>
              <div className="flex items-center mt-1">
                <span className="text-[#1A5F7A] font-medium">TEA</span>
              </div>
            </div>
            <div className="bg-[#1A5F7A]/10 p-3 rounded-lg">
              <Wallet className="w-6 h-6 text-[#1A5F7A]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:border-[#1A5F7A]/30 transition-colors shadow-sm hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Staked Balance</p>
              <p className="text-2xl font-bold mt-1 text-[#1A5F7A]">{formatNumber(stakedBalance)}</p>
              <div className="flex items-center mt-1">
                <span className="text-[#1A5F7A] font-medium">sTEA</span>
              </div>
            </div>
            <div className="bg-[#1A5F7A]/10 p-3 rounded-lg">
              <Layers className="w-6 h-6 text-[#1A5F7A]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:border-[#1A5F7A]/30 transition-colors shadow-sm hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Total Protocol Staked</p>
              <p className="text-2xl font-bold mt-1 text-[#1A5F7A]">{formatNumber(totalStaked)}</p>
              <div className="flex items-center mt-1">
                <span className="text-[#1A5F7A] font-medium">TEA</span>
              </div>
            </div>
            <div className="bg-[#1A5F7A]/10 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-[#1A5F7A]" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-[#1A5F7A]">Actions</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Action Type Selector */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setActionType("deposit")}
                className={cn(
                  "flex items-center justify-center space-x-2 p-4 rounded-lg border transition-all",
                  actionType === "deposit"
                    ? "bg-[#1A5F7A]/10 border-[#1A5F7A] text-[#1A5F7A]"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50",
                )}
              >
                <PlusCircle className="w-5 h-5" />
                <span>Deposit</span>
              </button>

              <button
                onClick={() => setActionType("withdraw")}
                className={cn(
                  "flex items-center justify-center space-x-2 p-4 rounded-lg border transition-all",
                  actionType === "withdraw"
                    ? "bg-[#1A5F7A]/10 border-[#1A5F7A] text-[#1A5F7A]"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50",
                )}
              >
                <MinusCircle className="w-5 h-5" />
                <span>Withdraw</span>
              </button>

              <button
                onClick={() => setActionType("stake")}
                className={cn(
                  "flex items-center justify-center space-x-2 p-4 rounded-lg border transition-all",
                  actionType === "stake"
                    ? "bg-[#1A5F7A]/10 border-[#1A5F7A] text-[#1A5F7A]"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50",
                )}
              >
                <Layers className="w-5 h-5" />
                <span>Stake</span>
              </button>

              <button
                onClick={() => setActionType("unstake")}
                className={cn(
                  "flex items-center justify-center space-x-2 p-4 rounded-lg border transition-all",
                  actionType === "unstake"
                    ? "bg-[#1A5F7A]/10 border-[#1A5F7A] text-[#1A5F7A]"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50",
                )}
              >
                <ArrowRight className="w-5 h-5" />
                <span>Unstake</span>
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex items-center space-x-2 mb-2">
                {getActionIcon(actionType)}
                <h3 className="font-medium capitalize text-[#1A5F7A]">{actionType}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {actionType === "deposit" && "Add TEA tokens to your account balance."}
                {actionType === "withdraw" && "Withdraw TEA tokens from your account balance."}
                {actionType === "stake" && "Stake your TEA tokens to earn rewards and voting rights."}
                {actionType === "unstake" && "Unstake your TEA tokens back to your available balance."}
              </p>
            </div>
          </div>

          {/* Action Form */}
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-600">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1A5F7A] focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-[#1A5F7A] font-medium">TEA</span>
                </div>
              </div>

              {/* Update the display of available balance in the action form */}
              <div className="flex justify-between text-sm text-gray-500">
                <span>
                  Available:{" "}
                  {formatNumber(
                    actionType === "deposit" ? nativeBalance : actionType === "unstake" ? stakedBalance : balance,
                  )}{" "}
                  {actionType === "unstake" ? "sTEA" : "TEA"}
                </span>
                <button
                  onClick={() =>
                    setAmount(
                      actionType === "deposit" ? nativeBalance : actionType === "unstake" ? stakedBalance : balance,
                    )
                  }
                  className="text-[#1A5F7A] hover:underline"
                >
                  Max
                </button>
              </div>
            </div>

            <button
              onClick={handleAction}
              disabled={loading || !amount || Number.parseFloat(amount) <= 0}
              className={cn(
                "w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg",
                "text-white font-medium transition-all",
                "hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
                getActionColor(actionType),
              )}
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <>
                  {getActionIcon(actionType)}
                  <span className="capitalize">{actionType}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

