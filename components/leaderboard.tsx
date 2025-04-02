"use client"

import { Award } from "lucide-react"
import { cn, formatAddress, formatNumber } from "../utils"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"

interface LeaderboardProps {
  account: string
  leaderboardData: {
    addresses: string[]
    amounts: string[]
  }
  currentPage: number
  setCurrentPage: (page: number) => void
  itemsPerPage: number
  refreshLeaderboardData: () => Promise<any>
  isLoading?: boolean
  usingDirectSTEA?: boolean
}

export default function Leaderboard({
  account,
  leaderboardData,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  refreshLeaderboardData,
  isLoading = false,
  usingDirectSTEA = false,
}: LeaderboardProps) {
  // Tambahkan state untuk auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Ubah fungsi refreshLeaderboard untuk menampilkan pesan jika loading terlalu lama
  const refreshLeaderboard = async () => {
    try {
      setIsRefreshing(true)

      // Add a timeout to show a message if it's taking too long
      const timeoutId = setTimeout(() => {
        // Show a toast message if it's taking too long
        toast.loading("Leaderboard is taking longer than expected to load...", {
          id: "leaderboard-loading",
          duration: 5000,
        })
      }, 5000)

      try {
        await refreshLeaderboardData()

        // Clear the timeout
        clearTimeout(timeoutId)
        toast.dismiss("leaderboard-loading")

        // Reset countdown
        setCountdown(30)
      } catch (error) {
        // Clear the timeout
        clearTimeout(timeoutId)
        toast.dismiss("leaderboard-loading")

        console.error("Error in refreshLeaderboard:", error)
        toast.error("Failed to refresh leaderboard. Showing available data.", {
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("Error refreshing leaderboard:", error)
      toast.error("Failed to refresh leaderboard. Showing available data.", {
        duration: 3000,
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Effect untuk auto-refresh
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (autoRefresh) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            refreshLeaderboard()
            return 30
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [autoRefresh])

  // Tambahkan useEffect untuk menampilkan pesan jika loading awal terlalu lama
  useEffect(() => {
    // Show a message if initial loading takes too long
    const initialLoadingTimeout = setTimeout(() => {
      if (leaderboardData.addresses.length === 0 && !isLoading) {
        toast.loading("Loading leaderboard data...", {
          id: "initial-leaderboard-loading",
          duration: 5000,
        })
      }
    }, 3000)

    return () => clearTimeout(initialLoadingTimeout)
  }, [leaderboardData.addresses.length, isLoading])

  // Function to paginate leaderboard data
  const paginateLeaderboard = (data) => {
    const { addresses, amounts } = data

    // Calculate total pages
    const totalPages = Math.ceil(addresses.length / itemsPerPage)

    // Calculate start and end indices for current page
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage

    // Slice the data for current page
    const currentAddresses = addresses.slice(startIndex, endIndex)
    const currentAmounts = amounts.slice(startIndex, endIndex)

    return {
      currentAddresses,
      currentAmounts,
      totalPages,
      currentPage,
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0c4c67]">Leaderboard</h1>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">Top stakers by sTEA balance</div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshLeaderboard}
              disabled={isRefreshing || isLoading}
              className="p-1.5 rounded-md text-[#0c4c67] hover:bg-[#0c4c67]/10 transition-colors"
              title="Refresh leaderboard"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 ${isRefreshing || isLoading ? "animate-spin" : ""}`}
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
            </button>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  autoRefresh ? "bg-[#0c4c67] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {autoRefresh ? "Auto: ON" : "Auto: OFF"}
              </button>
              {autoRefresh && <span className="text-xs text-gray-500">{countdown}s</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-4 md:p-6 shadow-md">
        <h2 className="text-xl font-bold mb-4 md:mb-6 flex items-center text-[#0c4c67]">
          <Award className="w-5 h-5 md:w-6 md:h-6 text-[#0c4c67] mr-2" />
          Top Stakers (sTEA Balance)
        </h2>

        <div className="space-y-3 md:space-y-4">
          {isLoading || isRefreshing ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0c4c67]"></div>
            </div>
          ) : leaderboardData.addresses.length === 0 ? (
            <div className="text-center py-8 md:py-12 border border-dashed border-gray-200 rounded-lg">
              <Award className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-3 md:mb-4" />
              <p className="text-gray-600">No stakers found</p>
              <p className="text-sm text-gray-500 mt-2">Be the first to stake your TEA tokens!</p>
            </div>
          ) : (
            <>
              {(() => {
                const { currentAddresses, currentAmounts, totalPages } = paginateLeaderboard(leaderboardData)

                return (
                  <>
                    {currentAddresses.map((address, index) => {
                      // Calculate the actual ranking number
                      const rankNumber = (currentPage - 1) * itemsPerPage + index + 1

                      return (
                        <div
                          key={address}
                          className={cn(
                            "bg-white p-3 md:p-5 rounded-lg border border-gray-100 shadow-sm",
                            "transform transition-transform hover:scale-[1.01]",
                            rankNumber === 1 && "bg-gradient-to-r from-[#0c4c67]/5 to-[#0c4c67]/20 border-[#0c4c67]/30",
                          )}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                              <div
                                className={cn(
                                  "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center",
                                  rankNumber === 1
                                    ? "bg-[#0c4c67] text-white"
                                    : rankNumber === 2
                                      ? "bg-[#0c4c67]/80 text-white"
                                      : rankNumber === 3
                                        ? "bg-[#0c4c67]/60 text-white"
                                        : "bg-[#0c4c67]/20 text-[#0c4c67]",
                                )}
                              >
                                <span className="font-bold text-sm md:text-base">#{rankNumber}</span>
                              </div>
                              <div>
                                <span className="font-mono text-sm md:text-base text-[#0c4c67]">
                                  {formatAddress(address)}
                                </span>
                                {address.toLowerCase() === account.toLowerCase() && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#0c4c67]/10 text-[#0c4c67] border border-[#0c4c67]/20">
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 md:space-x-2">
                              <span className="font-bold text-lg md:text-xl text-[#0c4c67]">
                                {formatNumber(currentAmounts[index])}
                              </span>
                              <span className="text-[#0c4c67] text-sm md:text-base">sTEA</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center space-x-1 pt-4 mt-4 border-t border-gray-100">
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className={cn(
                            "p-2 rounded-md border",
                            currentPage === 1
                              ? "text-gray-400 border-gray-200 cursor-not-allowed"
                              : "text-[#0c4c67] border-[#0c4c67]/20 hover:bg-[#0c4c67]/10",
                          )}
                          aria-label="Previous page"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>

                        <div className="flex items-center">
                          {/* Show page numbers with ellipsis for many pages */}
                          {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                            let pageNumber

                            // Logic to show first, last, and pages around current
                            if (totalPages <= 5) {
                              pageNumber = idx + 1
                            } else if (currentPage <= 3) {
                              pageNumber = idx + 1
                              if (idx === 4) pageNumber = totalPages
                            } else if (currentPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + idx
                            } else {
                              pageNumber = currentPage - 2 + idx
                            }

                            // Show ellipsis
                            if (
                              totalPages > 5 &&
                              ((idx === 3 && currentPage <= 3) ||
                                (idx === 1 && currentPage >= totalPages - 2) ||
                                (idx === 1 && currentPage > 3 && currentPage < totalPages - 2) ||
                                (idx === 3 && currentPage > 3 && currentPage < totalPages - 2))
                            ) {
                              return (
                                <span key={idx} className="px-2 py-1 text-gray-500">
                                  ...
                                </span>
                              )
                            }

                            // Skip some numbers when using ellipsis
                            if (
                              totalPages > 5 &&
                              ((idx === 2 && currentPage <= 3) ||
                                (idx === 2 && currentPage >= totalPages - 2) ||
                                (idx === 0 && currentPage > 3 && currentPage < totalPages - 2) ||
                                (idx === 4 && currentPage > 3 && currentPage < totalPages - 2))
                            ) {
                              return null
                            }

                            return (
                              <button
                                key={idx}
                                onClick={() => setCurrentPage(pageNumber)}
                                className={cn(
                                  "w-8 h-8 flex items-center justify-center rounded-md mx-1",
                                  currentPage === pageNumber
                                    ? "bg-[#0c4c67] text-white"
                                    : "text-[#0c4c67] hover:bg-[#0c4c67]/10",
                                )}
                              >
                                {pageNumber}
                              </button>
                            )
                          })}
                        </div>

                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className={cn(
                            "p-2 rounded-md border",
                            currentPage === totalPages
                              ? "text-gray-400 border-gray-200 cursor-not-allowed"
                              : "text-[#0c4c67] border-[#0c4c67]/20 hover:bg-[#0c4c67]/10",
                          )}
                          aria-label="Next page"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </>
                )
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

