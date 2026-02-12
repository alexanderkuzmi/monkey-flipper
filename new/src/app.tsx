import { useCallback, useState } from 'react'
import { DebugOverlay } from './debug-overlay'
import { RiveScreen } from './rive-screen'
import { ProfileUserInfo } from './profile-user-info'
import { BottomBar, type Tab } from './bottom-bar'
import './app.css'

const artboardMap: Record<Tab, string> = {
  Profile: 'Profile',
  Game: 'Lobby',
  Top: 'Top',
  Shop: 'Shop',
}

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Game')

  const handleGameEvent = useCallback((mode: string) => {
    const params = new URLSearchParams(window.location.search)
    params.set('mode', mode)
    window.location.href = `/game.html?${params.toString()}`
  }, [])

  return (
    <div className="flex h-full w-full items-center justify-center">
      <DebugOverlay />
      <div className="relative flex h-full w-full max-w-[430px] max-h-[932px] flex-col overflow-hidden bg-black font-sans text-white desktop:rounded-[20px] desktop:border-2 desktop:border-[#333]">
        <div className="relative flex flex-1 overflow-hidden">
          <RiveScreen
            key={activeTab}
            artboard={artboardMap[activeTab]}
            onGameEvent={activeTab === 'Game' ? handleGameEvent : undefined}
          />
          {activeTab === 'Profile' && <ProfileUserInfo />}
        </div>

        <BottomBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  )
}
