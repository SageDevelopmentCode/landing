'use client'

import { colors, radius, shadows, spacing } from '../design-system'

interface TopBarProps {
  userEmail?: string
  signOutAction?: (formData: FormData) => Promise<void>
}

export function TopBar({ userEmail, signOutAction }: TopBarProps) {
  return (
    <div
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 lg:px-8"
      style={{
        backgroundColor: colors.softCloud,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      {/* Search Bar (Visual Only) */}
      <div className="flex-1 max-w-xl">
        <div
          className="relative"
          style={{
            backgroundColor: 'white',
            borderRadius: radius.lg,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div className="absolute inset-y-0 left-0 flex items-center pl-4">
            <svg
              className="w-5 h-5"
              style={{ color: colors.textTertiary }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-full py-2.5 pl-12 pr-4 bg-transparent outline-none"
            style={{
              color: colors.textPrimary,
              borderRadius: radius.lg,
            }}
            disabled
          />
        </div>
      </div>

      {/* Right Side: Notifications & Profile */}
      <div className="flex items-center gap-4 ml-6">
        {/* Notification Bell (Visual Only) */}
        <button
          className="p-2.5 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            backgroundColor: 'white',
            border: `1px solid ${colors.border}`,
            boxShadow: shadows.soft,
          }}
          disabled
          aria-label="Notifications"
        >
          <svg
            className="w-5 h-5"
            style={{ color: colors.textSecondary }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button>

        {/* Profile & Sign Out */}
        <div className="flex items-center gap-3">
          {/* User Avatar */}
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm"
            style={{
              backgroundColor: colors.pastelSage,
              color: colors.mistyForest,
              boxShadow: shadows.soft,
            }}
          >
            {userEmail ? userEmail.charAt(0).toUpperCase() : 'A'}
          </div>

          {/* User Email & Sign Out */}
          {userEmail && (
            <div className="hidden md:flex items-center gap-3">
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  {userEmail}
                </p>
              </div>
              {signOutAction && (
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      color: colors.mistyForest,
                      backgroundColor: colors.warmLinen,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    Sign out
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
