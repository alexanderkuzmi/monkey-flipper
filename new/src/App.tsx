import { useEffect, useState } from 'react'
import {
  useRive,
  useViewModel,
  useViewModelInstance,
  useViewModelInstanceNumber,
} from '@rive-app/react-canvas'
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

  return <RiveComponent className="rive-canvas" />
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Lobby')

  return (
    <div className="mobile-shell">
      <div className="screen">
        <div className="page-content">
          <RiveScreen key={activeTab} artboard={activeTab} />
        </div>

        <nav className="bottom-bar">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`tab${activeTab === tab ? ' active' : ''}`}
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
