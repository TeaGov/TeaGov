"use client"

interface NetworkAlertProps {
  account: string
  isCorrectNetwork: boolean
  handleSwitchNetwork: () => Promise<void>
  loading: boolean
}

export default function NetworkAlert({ account, isCorrectNetwork, handleSwitchNetwork, loading }: NetworkAlertProps) {
  if (!account || isCorrectNetwork) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white py-3 px-4 z-50 shadow-md">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-2 text-center sm:text-left">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 flex-shrink-0 animate-pulse"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">
              Wrong network detected! Please switch to Tea Sepolia network to use this application.
            </span>
          </div>
          <button
            onClick={handleSwitchNetwork}
            disabled={loading}
            className="bg-white text-amber-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors w-full sm:w-auto shadow-sm hover:shadow-md"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2"
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
                Switching...
              </div>
            ) : (
              "Switch to Tea Sepolia"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

