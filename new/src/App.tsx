import { useState } from 'react'
import './App.css'

const tabs = ['Lobby', 'Profile', 'Top', 'Shop'] as const
type Tab = (typeof tabs)[number]

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Lobby')

  return (
    <div className="mobile-shell">
      <div className="screen">
        <div className="page-content">
          <h1>{activeTab}</h1>
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
