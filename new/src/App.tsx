import { useEffect, useState } from 'react'
import {
  useRive,
  useViewModel,
  useViewModelInstance,
  useViewModelInstanceNumber,
} from '@rive-app/react-canvas'
import { cn } from './lib/utils'
import './App.css'

const tabs = ['Lobby', 'Profile', 'Top', 'Shop'] as const
type Tab = (typeof tabs)[number]

function RiveScreen({ artboard }: { artboard: string }) {
  const { rive, RiveComponent } = useRive({
    src: '/monkey_new.riv',
    artboard,
    stateMachines: 'State Machine 1',
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

  return <RiveComponent className="h-full w-full" />
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Lobby')

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative flex h-full w-full max-w-[430px] max-h-[932px] flex-col overflow-hidden bg-[#1a1a2e] font-sans text-white desktop:rounded-[20px] desktop:border-2 desktop:border-[#333]">
        <div className="relative flex flex-1 overflow-hidden">
          <RiveScreen key={activeTab} artboard={activeTab} />
        </div>

        <nav className="flex border-t border-[#2a2a4a] bg-[#16162b] py-2 pb-[max(8px,env(safe-area-inset-bottom))]">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={cn(
                'flex-1 cursor-pointer border-none bg-transparent py-2 text-[13px] font-medium text-[#555] transition-colors duration-150',
                activeTab === tab && 'text-white',
              )}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default App
