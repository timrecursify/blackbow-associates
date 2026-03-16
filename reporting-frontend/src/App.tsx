import { useState, useEffect } from 'react'
import './index.css'
import CodeEntry from './pages/CodeEntry'
import ReportingDashboard from './pages/ReportingDashboard'
import { getStatus } from './api/reporting'
import type { WorkdayStatus } from './api/reporting'

function DayCompleted({ onNewDay }: { onNewDay: () => void }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York'
  })

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Day Completed!</h1>
        <p className="text-gray-500 mb-6">{today}</p>
        <p className="text-gray-600 mb-8">
          Your daily summary has been generated and emailed to management. Great work today!
        </p>
        <button
          onClick={onNewDay}
          className="w-full py-3 px-6 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors"
        >
          Start New Day
        </button>
      </div>
    </div>
  )
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [status, setStatus] = useState<WorkdayStatus | null>(null)
  const [dayCompleted, setDayCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if already authenticated on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const data = await getStatus()
      setStatus(data)
      setIsAuthenticated(true)
      setDayCompleted(false)
    } catch {
      setIsAuthenticated(false)
    }
  }

  const handleClockIn = (newStatus: WorkdayStatus) => {
    setStatus(newStatus)
    setIsAuthenticated(true)
    setDayCompleted(false)
  }

  const handleEndDay = () => {
    setDayCompleted(true)
    setIsAuthenticated(false)
    setStatus(null)
  }

  const handleDayAlreadyCompleted = () => {
    setDayCompleted(true)
    setIsAuthenticated(false)
    setStatus(null)
  }

  const handleNewDay = () => {
    setDayCompleted(false)
  }

  const handleError = (msg: string) => {
    setError(msg)
    setTimeout(() => setError(null), 5000)
  }

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}

      {dayCompleted ? (
        <DayCompleted onNewDay={handleNewDay} />
      ) : isAuthenticated && status ? (
        <ReportingDashboard
          status={status}
          onStatusUpdate={setStatus}
          onEndDay={handleEndDay}
          onError={handleError}
        />
      ) : (
        <CodeEntry
          onClockIn={handleClockIn}
          onDayAlreadyCompleted={handleDayAlreadyCompleted}
          onError={handleError}
        />
      )}
    </div>
  )
}

export default App
