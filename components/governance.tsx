"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import {
  Vote,
  PlusCircle,
  LightbulbIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "../utils"
import { getSignedContract, getProposals, estimateGasWithFallback } from "../contract-utils"

interface Proposal {
  id: number
  description: string
  voteCount: number
  active: boolean
}

interface GovernanceProps {
  account: string
  hasVoted: boolean
  proposals: Proposal[]
  loading: boolean
  setLoading: (loading: boolean) => void
  setProposals: (proposals: Proposal[]) => void
  setPendingTransactions: (callback: (prev: any[]) => any[]) => void
  loadData: () => Promise<void>
}

export default function Governance({
  account,
  hasVoted,
  proposals,
  loading,
  setLoading,
  setProposals,
  setPendingTransactions,
  loadData,
}: GovernanceProps) {
  const [newProposal, setNewProposal] = useState("")
  const [proposalsLoading, setProposalsLoading] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [proposalsPerPage] = useState(5)
  const [allProposals, setAllProposals] = useState<Proposal[]>([])
  const [totalPages, setTotalPages] = useState(1)

  // Refresh proposals function
  const refreshProposals = async () => {
    try {
      setProposalsLoading(true)
      // Load up to 100 proposals
      const proposalsList = await getProposals(100)
      // Sort proposals from newest to oldest
      const sortedProposals = [...proposalsList].sort((a, b) => b.id - a.id)

      // Set all proposals and calculate total pages
      setAllProposals(sortedProposals)
      setTotalPages(Math.max(1, Math.ceil(sortedProposals.length / proposalsPerPage)))

      // Update the main proposals state with the current page
      updateCurrentPageProposals(sortedProposals, currentPage)

      console.log(
        `Loaded ${sortedProposals.length} proposals, ${Math.ceil(sortedProposals.length / proposalsPerPage)} pages`,
      )
    } catch (error) {
      console.error("Error refreshing proposals:", error)
      toast.error("Failed to load latest proposals. Please try again.", {
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
      setProposalsLoading(false)
    }
  }

  // Function to update proposals based on current page
  const updateCurrentPageProposals = (allProps = allProposals, page = currentPage) => {
    const startIndex = (page - 1) * proposalsPerPage
    const endIndex = startIndex + proposalsPerPage
    const currentPageProposals = allProps.slice(startIndex, endIndex)
    setProposals(currentPageProposals)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateCurrentPageProposals(allProposals, page)
  }

  // Load proposals on component mount
  useEffect(() => {
    refreshProposals()
  }, [])

  // Update current page proposals when page changes
  useEffect(() => {
    updateCurrentPageProposals()
  }, [currentPage])

  // Modificar la función handleCreateProposal para verificar la red antes de proceder
  const handleCreateProposal = async () => {
    if (!newProposal.trim()) {
      toast("Please enter a proposal description", {
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
            color: "#0c4c67",
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
        toast.error("Harap beralih ke jaringan Tea Sepolia untuk melanjutkan", {
          duration: 5000,
          style: {
            borderRadius: "10px",
            background: "#fff",
            color: "#0c4c67",
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
          color: "#0c4c67",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e2e8f0",
        },
      })

      try {
        const contract = await getSignedContract()

        // Dismiss preparing toast
        toast.dismiss(preparingToastId)

        // Show waiting for confirmation toast
        const waitingToastId = toast.loading("Waiting for wallet confirmation...", {
          style: {
            borderRadius: "10px",
            background: "#fff",
            color: "#0c4c67",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
          },
        })

        try {
          // Estimate gas with fallback
          const gasLimit = await estimateGasWithFallback(contract, "createProposal", [newProposal])

          const tx = await contract.createProposal(newProposal, { gasLimit })

          // Dismiss waiting toast
          toast.dismiss(waitingToastId)

          // Add transaction to pending transactions
          setPendingTransactions((prev) => [
            ...prev,
            {
              hash: tx.hash,
              type: "createProposal",
              timestamp: Date.now(),
            },
          ])

          // Show transaction submitted toast
          toast.success(`Proposal successfully created! Check status in MetaMask.`, {
            duration: 5000,
            style: {
              borderRadius: "10px",
              background: "#fff",
              color: "#0c4c67",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
            },
          })

          // Add transaction hash to console for debugging
          console.log(`Transaction hash: ${tx.hash}`)

          // Clear the input field
          setNewProposal("")

          // Refresh proposals after a short delay
          setTimeout(async () => {
            await refreshProposals()
            // Go to first page to see the new proposal
            setCurrentPage(1)
          }, 2000)
        } catch (txError) {
          // Always dismiss the waiting toast in case of error
          toast.dismiss(waitingToastId)
          throw txError
        }
      } catch (error) {
        // Dismiss preparing toast if it's still showing
        toast.dismiss(preparingToastId)

        console.error("Error creating proposal:", error)

        // Extract a more user-friendly error message
        let errorMessage = "Failed to create proposal"
        if (error.message) {
          if (error.message.includes("user rejected")) {
            errorMessage = "Transaction rejected"
          } else if (error.message.includes("JsonRpcEngine")) {
            errorMessage = "Network connection issue. Please try again."
          }
        }

        toast(errorMessage, {
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
    } finally {
      setLoading(false)
    }
  }

  // Modificar la función handleCloseProposal para verificar la red antes de proceder
  const handleCloseProposal = async (proposalId: number) => {
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
            color: "#0c4c67",
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
        toast.error("Harap beralih ke jaringan Tea Sepolia untuk melanjutkan", {
          duration: 5000,
          style: {
            borderRadius: "10px",
            background: "#fff",
            color: "#0c4c67",
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
          color: "#0c4c67",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e2e8f0",
        },
      })

      try {
        const contract = await getSignedContract()

        // Dismiss preparing toast
        toast.dismiss(preparingToastId)

        // Show waiting for confirmation toast
        const waitingToastId = toast.loading("Waiting for wallet confirmation...", {
          style: {
            borderRadius: "10px",
            background: "#fff",
            color: "#0c4c67",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
          },
        })

        try {
          // Estimate gas with fallback
          const gasLimit = await estimateGasWithFallback(contract, "closeProposal", [proposalId])

          const tx = await contract.closeProposal(proposalId, { gasLimit })

          // Dismiss waiting toast
          toast.dismiss(waitingToastId)

          // Add transaction to pending transactions
          setPendingTransactions((prev) => [
            ...prev,
            {
              hash: tx.hash,
              type: "closeProposal",
              timestamp: Date.now(),
            },
          ])

          // Show transaction submitted toast
          toast.success(`Proposal successfully closed! Check status in MetaMask.`, {
            duration: 5000,
            style: {
              borderRadius: "10px",
              background: "#fff",
              color: "#0c4c67",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
            },
          })

          // Add transaction hash to console for debugging
          console.log(`Transaction hash: ${tx.hash}`)

          // Refresh proposals after a short delay
          setTimeout(async () => {
            await refreshProposals()
          }, 2000)
        } catch (txError) {
          // Always dismiss the waiting toast in case of error
          toast.dismiss(waitingToastId)
          throw txError
        }
      } catch (error) {
        // Dismiss preparing toast if it's still showing
        toast.dismiss(preparingToastId)

        console.error("Error closing proposal:", error)

        // Extract a more user-friendly error message
        let errorMessage = "Failed to close proposal"
        if (error.message) {
          if (error.message.includes("user rejected")) {
            errorMessage = "Transaction rejected"
          } else if (error.message.includes("JsonRpcEngine")) {
            errorMessage = "Network connection issue. Please try again."
          }
        }

        toast(errorMessage, {
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
    } finally {
      setLoading(false)
    }
  }

  // Modificar la función handleVote para verificar la red antes de proceder
  const handleVote = async (proposalId: number) => {
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
            color: "#0c4c67",
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
        toast.error("Harap beralih ke jaringan Tea Sepolia untuk melanjutkan", {
          duration: 5000,
          style: {
            borderRadius: "10px",
            background: "#fff",
            color: "#0c4c67",
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
          color: "#0c4c67",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e2e8f0",
        },
      })

      try {
        const contract = await getSignedContract()

        // Dismiss preparing toast
        toast.dismiss(preparingToastId)

        // Show waiting for confirmation toast
        const waitingToastId = toast.loading("Waiting for wallet confirmation...", {
          style: {
            borderRadius: "10px",
            background: "#fff",
            color: "#0c4c67",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
          },
        })

        try {
          // Estimate gas with fallback
          const gasLimit = await estimateGasWithFallback(contract, "vote", [proposalId])

          const tx = await contract.vote(proposalId, { gasLimit })

          // Dismiss waiting toast
          toast.dismiss(waitingToastId)

          // Add transaction to pending transactions
          setPendingTransactions((prev) => [
            ...prev,
            {
              hash: tx.hash,
              type: "vote",
              timestamp: Date.now(),
            },
          ])

          // Show transaction submitted toast
          toast.success(`Vote successful! Check status in MetaMask.`, {
            duration: 5000,
            style: {
              borderRadius: "10px",
              background: "#fff",
              color: "#0c4c67",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
            },
          })

          // Add transaction hash to console for debugging
          console.log(`Transaction hash: ${tx.hash}`)

          // Refresh proposals after a short delay
          setTimeout(async () => {
            await refreshProposals()
            await loadData()
          }, 2000)
        } catch (txError) {
          // Always dismiss the waiting toast in case of error
          toast.dismiss(waitingToastId)
          throw txError
        }
      } catch (error) {
        // Dismiss preparing toast if it's still showing
        toast.dismiss(preparingToastId)

        console.error("Error voting:", error)

        // Extract a more user-friendly error message
        let errorMessage = "Failed to vote"
        if (error.message) {
          if (error.message.includes("user rejected")) {
            errorMessage = "Transaction rejected"
          } else if (error.message.includes("JsonRpcEngine")) {
            errorMessage = "Network connection issue. Please try again."
          }
        }

        toast(errorMessage, {
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
    } finally {
      setLoading(false)
    }
  }

  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null

    return (
      <div className="flex justify-center items-center mt-6 space-x-1">
        <button
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={cn(
            "p-2 rounded-md border",
            currentPage === 1
              ? "text-gray-400 border-gray-200 cursor-not-allowed"
              : "text-[#0c4c67] border-[#0c4c67]/20 hover:bg-[#0c4c67]/10",
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center">
          {/* Show page numbers with ellipsis for many pages */}
          {(() => {
            // For small number of pages, show all
            if (totalPages <= 5) {
              return Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePageChange(idx + 1)}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-md mx-1",
                    currentPage === idx + 1 ? "bg-[#0c4c67] text-white" : "text-[#0c4c67] hover:bg-[#0c4c67]/10",
                  )}
                >
                  {idx + 1}
                </button>
              ))
            }

            // For many pages, show first, last, and pages around current
            const pageNumbers = []

            // Always show first page
            pageNumbers.push(
              <button
                key={1}
                onClick={() => handlePageChange(1)}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-md mx-1",
                  currentPage === 1 ? "bg-[#0c4c67] text-white" : "text-[#0c4c67] hover:bg-[#0c4c67]/10",
                )}
              >
                1
              </button>,
            )

            // Show ellipsis if current page is far from first page
            if (currentPage > 3) {
              pageNumbers.push(
                <span key="ellipsis1" className="px-2 py-1 text-gray-500">
                  ...
                </span>,
              )
            }

            // Show pages around current page
            const startPage = Math.max(2, currentPage - 1)
            const endPage = Math.min(totalPages - 1, currentPage + 1)

            for (let i = startPage; i <= endPage; i++) {
              if (i !== 1 && i !== totalPages) {
                // Skip first and last pages as they're always shown
                pageNumbers.push(
                  <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-md mx-1",
                      currentPage === i ? "bg-[#0c4c67] text-white" : "text-[#0c4c67] hover:bg-[#0c4c67]/10",
                    )}
                  >
                    {i}
                  </button>,
                )
              }
            }

            // Show ellipsis if current page is far from last page
            if (currentPage < totalPages - 2) {
              pageNumbers.push(
                <span key="ellipsis2" className="px-2 py-1 text-gray-500">
                  ...
                </span>,
              )
            }

            // Always show last page
            if (totalPages > 1) {
              pageNumbers.push(
                <button
                  key={totalPages}
                  onClick={() => handlePageChange(totalPages)}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-md mx-1",
                    currentPage === totalPages ? "bg-[#0c4c67] text-white" : "text-[#0c4c67] hover:bg-[#0c4c67]/10",
                  )}
                >
                  {totalPages}
                </button>,
              )
            }

            return pageNumbers
          })()}
        </div>

        <button
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={cn(
            "p-2 rounded-md border",
            currentPage === totalPages
              ? "text-gray-400 border-gray-200 cursor-not-allowed"
              : "text-[#0c4c67] border-[#0c4c67]/20 hover:bg-[#0c4c67]/10",
          )}
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0c4c67]">Governance</h1>
        <div className="text-sm text-gray-500">
          {hasVoted ? (
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>You have voted</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>You haven't voted yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Create Proposal */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-4 md:p-6 shadow-md">
        <h2 className="text-xl font-bold mb-4 flex items-center text-[#0c4c67]">
          <LightbulbIcon className="w-5 h-5 md:w-6 md:h-6 text-[#0c4c67] mr-2" />
          Create Proposal
        </h2>
        <div className="space-y-4">
          <textarea
            value={newProposal}
            onChange={(e) => setNewProposal(e.target.value)}
            placeholder="Enter your proposal description..."
            rows={3}
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0c4c67] focus:border-transparent"
          />
          <div className="flex justify-end">
            <button
              onClick={handleCreateProposal}
              disabled={loading || !newProposal.trim()}
              className={cn(
                "flex items-center justify-center space-x-2 bg-[#0c4c67]",
                "text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-200 w-full md:w-auto",
                "hover:bg-[#0c4c67]/90 hover:shadow-lg hover:shadow-[#0c4c67]/20",
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
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  <span>Create Proposal</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Proposals List */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-4 md:p-6 shadow-md">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="text-xl font-bold flex items-center text-[#0c4c67]">
            <Vote className="w-5 h-5 md:w-6 md:h-6 text-[#0c4c67] mr-2" />
            Proposals
          </h2>
          <div className="flex items-center space-x-2">
            {allProposals.length > 0 && (
              <span className="text-sm text-gray-500 hidden md:inline">
                Showing {proposals.length} of {allProposals.length} proposals
              </span>
            )}
            <button
              onClick={refreshProposals}
              disabled={proposalsLoading}
              className="flex items-center space-x-1 text-sm text-[#0c4c67] hover:bg-[#0c4c67]/10 px-2 py-1 rounded-md transition-colors"
            >
              {proposalsLoading ? (
                <svg
                  className="animate-spin h-4 w-4"
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
              <span>{proposalsLoading ? "Loading..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Mobile-only proposal count */}
        {allProposals.length > 0 && (
          <div className="md:hidden text-sm text-gray-500 mb-4">
            Showing {proposals.length} of {allProposals.length} proposals
          </div>
        )}

        <div className="space-y-4">
          {proposalsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0c4c67]"></div>
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-8 md:py-12 border border-dashed border-gray-200 rounded-lg">
              <LightbulbIcon className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-3 md:mb-4" />
              <p className="text-gray-600">No proposals yet</p>
              <p className="text-sm text-gray-500 mt-2">Be the first to create a proposal!</p>
            </div>
          ) : (
            <>
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className={cn(
                    "bg-white rounded-lg border shadow-sm transition-all",
                    proposal.active ? "border-green-500/20" : "border-red-500/20",
                  )}
                >
                  <div className="p-4">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-[#0c4c67]">Proposal #{proposal.id + 1}</h3>
                          {proposal.active ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                              Closed
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Vote className="w-4 h-4" />
                          <span>{proposal.voteCount} votes</span>
                        </div>
                      </div>

                      <p className="text-gray-700 text-sm md:text-base">{proposal.description}</p>

                      <div className="flex space-x-2 pt-2">
                        {proposal.active && !hasVoted && (
                          <button
                            onClick={() => handleVote(proposal.id)}
                            disabled={loading}
                            className={cn(
                              "bg-[#0c4c67] hover:bg-[#0c4c67]/90 text-white px-4 py-2 rounded-lg",
                              "transition-colors flex items-center justify-center space-x-2",
                              "disabled:opacity-50 disabled:cursor-not-allowed",
                              "w-full md:w-auto",
                            )}
                          >
                            <Vote className="w-4 h-4" />
                            <span>Vote</span>
                          </button>
                        )}
                        {proposal.active && (
                          <button
                            onClick={() => handleCloseProposal(proposal.id)}
                            disabled={loading}
                            className={cn(
                              "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg",
                              "transition-colors flex items-center justify-center space-x-2",
                              "disabled:opacity-50 disabled:cursor-not-allowed",
                              "w-full md:w-auto",
                            )}
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Close</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination Controls */}
              {renderPagination()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

