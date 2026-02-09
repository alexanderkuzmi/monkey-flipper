import { useEffect, useState } from 'react'
import {
  useRive,
  useViewModel,
  useViewModelInstance,
  useViewModelInstanceNumber,
  Layout,
  Fit,
} from '@rive-app/react-canvas'
import { cn } from './lib/utils'
import './App.css'

const tabs = ['Game', 'Profile', 'Top', 'Shop'] as const
type Tab = (typeof tabs)[number]

const artboardMap: Record<Tab, string> = {
  Profile: 'Profile',
  Game: 'Lobby',
  Top: 'Top',
  Shop: 'Shop',
}

const iconMap: Record<Tab, { active: string; inactive: string }> = {
  Profile: { active: '/icons/profile-active.png', inactive: '/icons/profile.png' },
  Game: { active: '/icons/game-active.png', inactive: '/icons/game.png' },
  Top: { active: '/icons/top-active.png', inactive: '/icons/top.png' },
  Shop: { active: '/icons/shop-active.png', inactive: '/icons/shop.png' },
}

function Loader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F9BF2F] border-t-transparent" />
    </div>
  )
}

function RiveScreen({ artboard }: { artboard: string }) {
  const { rive, RiveComponent } = useRive({
    src: '/monkey_new.riv',
    artboard,
    stateMachines: 'State Machine 1',
    layout: new Layout({ fit: Fit.Cover }),
    autoplay: true,
    autoBind: false,
  })

  const viewModel = useViewModel(rive, { name: 'ViewModel1' })
  const vmi = useViewModelInstance(viewModel, { rive })

  const { setValue: setTon } = useViewModelInstanceNumber('tonCoins', vmi)
  const { setValue: setStars } = useViewModelInstanceNumber('starsCoins', vmi)
  const { setValue: setGame } = useViewModelInstanceNumber('gameCoins', vmi)

  useEffect(() => {
    if (vmi) {
      setTon(3.52)
      setStars(1240)
      setGame(8900)
    }
  }, [vmi])

  return (
    <>
      {!rive && <Loader />}
      <RiveComponent className="h-full w-full" />
    </>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Game')

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative flex h-full w-full max-w-[430px] max-h-[932px] flex-col overflow-hidden bg-black font-sans text-white desktop:rounded-[20px] desktop:border-2 desktop:border-[#333]">
        <div className="relative flex flex-1 overflow-hidden">
          <RiveScreen key={activeTab} artboard={artboardMap[activeTab]} />
        </div>

        <nav
          className="flex border-t border-[#4C5352] bg-gradient-to-b from-[#1A1C1D] to-[#141516] pt-[18px] px-[36px] pb-[36px]"
          style={{ boxShadow: 'inset 0 4px 4px 0 rgba(37, 39, 40, 0.52)' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              className={cn(
                "flex-1 flex flex-col items-center gap-[10px] cursor-pointer border-none bg-transparent text-center font-fredoka text-[12px] leading-[100%] tracking-[0] outline-none [&:focus]:outline-none [-webkit-tap-highlight-color:transparent]",
                activeTab === tab
                  ? 'bg-gradient-to-b from-[#F9BF2F] to-[#DE8504] bg-clip-text text-transparent'
                  : 'text-[#FEF9F1]/47',
              )}
              onClick={() => setActiveTab(tab)}
            >
              <div className="flex h-[28px] items-end justify-center">
                <img
                  src={activeTab === tab ? iconMap[tab].active : iconMap[tab].inactive}
                  alt={tab}
                  className="h-[28px] w-auto"
                />
              </div>
              {tab}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default App
