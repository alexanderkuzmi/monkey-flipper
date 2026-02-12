import { useEffect } from 'react'
import {
  useRive,
  useStateMachineInput,
  useViewModel,
  useViewModelInstance,
  useViewModelInstanceNumber,
  useViewModelInstanceTrigger,
  Layout,
  Fit,
  Alignment,
} from '@rive-app/react-canvas'
import { useSwipeable } from 'react-swipeable'
import { useBalances } from './lib/api'
import { debugLog } from './debug-overlay'
import { Loader } from './loader'

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

export function RiveScreen({
  artboard,
  onGameEvent,
}: {
  artboard: string
  onGameEvent?: (mode: string) => void
}) {
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
  const { setValue: setHeightCoins } = useViewModelInstanceNumber('heightCoins', vmi)

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => { rightTrigger?.fire() },
    onSwipedRight: () => { leftTrigger?.fire() },
    trackMouse: true,
    preventScrollOnSwipe: true,
  })

  useViewModelInstanceTrigger('singleGame', vmi, {
    onTrigger: () => { debugLog('VM trigger: singleGame'); onGameEvent?.('solo') },
  })
  useViewModelInstanceTrigger('duelGame', vmi, {
    onTrigger: () => { debugLog('VM trigger: duelGame'); onGameEvent?.('1v1') },
  })
  useViewModelInstanceTrigger('tournamentGame', vmi, {
    onTrigger: () => { debugLog('VM trigger: tournamentGame'); onGameEvent?.('tournament') },
  })
  useViewModelInstanceTrigger('buttonStars', vmi, {
    onTrigger: () => { debugLog('VM trigger: buttonStars') },
  })
  useViewModelInstanceTrigger('buttonTon', vmi, {
    onTrigger: () => { debugLog('VM trigger: buttonTon') },
  })

  const { setValue: setTon } = useViewModelInstanceNumber('tonCoins', vmi)
  const { setValue: setStars } = useViewModelInstanceNumber('starsCoins', vmi)
  const { setValue: setGame } = useViewModelInstanceNumber('gameCoins', vmi)
  const { data: balances } = useBalances()

  useEffect(() => {
    if (!vmi) return

    if (balances) {
      setTon(balances.tonCoins)
      setStars(balances.starsCoins)
      setGame(balances.gameCoins)
    }

    if (artboard === 'Top') {
      FAKE_TOP_DATA.forEach((entry, i) => {
        const nameProp = vmi.string(`topName${i + 1}`)
        if (nameProp) nameProp.value = entry.name
        const scoreProp = vmi.string(`topScore${i + 1}`)
        if (scoreProp) scoreProp.value = entry.score
      })
    }
  }, [vmi, balances])

  useEffect(() => {
    setHeightCoins(30)
  }, [setHeightCoins])

  return (
    <>
      {!rive && <Loader />}
      <div {...swipeHandlers} className="relative h-full w-full">
        <RiveComponent className="h-full w-full" />
      </div>
    </>
  )
}
