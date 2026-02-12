import { useEffect } from 'react'
import type { RiveFile } from '@rive-app/canvas'
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
import { useBalances, useLeaderboard } from './lib/api'
import { debugLog } from './debug-overlay'
import { Loader } from './loader'

function formatScore(score: number): string {
  return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function RiveScreen({
  riveFile,
  artboard,
  onGameEvent,
}: {
  riveFile: RiveFile
  artboard: string
  onGameEvent?: (mode: string) => void
}) {
  const { rive, RiveComponent } = useRive({
    riveFile,
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
  const { data: leaderboard } = useLeaderboard(13)

  useEffect(() => {
    if (!vmi) return

    if (balances) {
      setTon(balances.tonCoins)
      setStars(balances.starsCoins)
      setGame(balances.gameCoins)
    }

    if (artboard === 'Top') {
      const entries = leaderboard ?? []
      for (let i = 0; i < 13; i++) {
        const entry = entries[i]
        const nameProp = vmi.string(`topName${i + 1}`)
        if (nameProp) nameProp.value = entry ? (entry.username || `Player ${entry.user_id}`) : ''
        const scoreProp = vmi.string(`topScore${i + 1}`)
        if (scoreProp) scoreProp.value = entry ? formatScore(entry.score) : ''
      }
    }
  }, [vmi, balances, leaderboard])

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
