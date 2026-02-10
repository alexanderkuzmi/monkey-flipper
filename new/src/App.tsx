import { useEffect, useState } from 'react'
import {
  useRive,
  useStateMachineInput,
  useViewModel,
  useViewModelInstance,
  useViewModelInstanceNumber,
  Layout,
  Fit,
  Alignment,
} from '@rive-app/react-canvas'
import { useSwipeable } from 'react-swipeable'
import { cn } from './lib/utils'
import { getTelegramUser } from './lib/telegram'
import './App.css'

const tabs = ['Game', 'Profile', 'Top', 'Shop'] as const
type Tab = (typeof tabs)[number]

const artboardMap: Record<Tab, string> = {
  Profile: 'Profile',
  Game: 'Lobby',
  Top: 'Top',
  Shop: 'Shop',
}

const FAKE_TOP_DATA = [
  { name: 'CryptoKing', score: '152 400' },
  { name: 'MonkeyMaster', score: '148 200' },
  { name: 'FlipLord', score: '135 700' },
  { name: 'DiamondApe', score: '129 300' },
  { name: 'BananaWhale', score: '118 900' },
  { name: 'TokenHero', score: '105 600' },
  { name: 'ChainGuru', score: '98 400' },
  { name: 'MoonRider', score: '87 200' },
  { name: 'StarPlayer', score: '76 500' },
  { name: 'GoldRush', score: '65 800' },
  { name: 'SilverFox', score: '54 300' },
  { name: 'BronzeApe', score: '43 100' },
  { name: 'RookieFlip', score: '31 900' },
]

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
    layout: new Layout({ fit: Fit.Cover, alignment: Alignment.TopCenter }),
    autoplay: true,
    autoBind: false,
  })

  const viewModel = useViewModel(rive, { name: 'ViewModel1' })
  const vmi = useViewModelInstance(viewModel, { rive })

  const leftTrigger = useStateMachineInput(rive, 'State Machine 1', 'Left ')
  const rightTrigger = useStateMachineInput(rive, 'State Machine 1', 'Right')

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => rightTrigger?.fire(),
    onSwipedRight: () => leftTrigger?.fire(),
    trackMouse: true,
    preventScrollOnSwipe: true,
  })

  const { setValue: setTon } = useViewModelInstanceNumber('tonCoins', vmi)
  const { setValue: setStars } = useViewModelInstanceNumber('starsCoins', vmi)
  const { setValue: setGame } = useViewModelInstanceNumber('gameCoins', vmi)

  useEffect(() => {
    if (!vmi) return
    setTon(3.52)
    setStars(1240)
    setGame(8900)

    if (artboard === 'Top') {
      FAKE_TOP_DATA.forEach((entry, i) => {
        const nameProp = vmi.string(`topName${i + 1}`)
        if (nameProp) nameProp.value = entry.name
        const scoreProp = vmi.string(`topScore${i + 1}`)
        if (scoreProp) scoreProp.value = entry.score
      })
    }
  }, [vmi])

  return (
    <>
      {!rive && <Loader />}
      <div {...swipeHandlers} className="h-full w-full">
        <RiveComponent className="h-full w-full" />
      </div>
    </>
  )
}

function ProfileUserInfo() {
  const tgUser = getTelegramUser()

  const name = tgUser
    ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')
    : 'Guest'
  const id = tgUser?.id ?? ''

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 pb-3 text-center font-fredoka text-[13px] leading-[100%] tracking-[0] text-[#FEF9F1]/35">
      {name} | ID {id}
    </div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Game')

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative flex h-full w-full max-w-[430px] max-h-[932px] flex-col overflow-hidden bg-black font-sans text-white desktop:rounded-[20px] desktop:border-2 desktop:border-[#333]">
        <div className="relative flex flex-1 overflow-hidden">
          <RiveScreen key={activeTab} artboard={artboardMap[activeTab]} />
          {activeTab === 'Profile' && <ProfileUserInfo />}
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
