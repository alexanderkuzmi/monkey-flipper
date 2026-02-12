import { cn } from './lib/utils'

export const tabs = ['Game', 'Profile', 'Top', 'Shop'] as const
export type Tab = (typeof tabs)[number]

const iconMap: Record<Tab, { active: string; inactive: string }> = {
  Profile: { active: '/icons/profile-active.png', inactive: '/icons/profile.png' },
  Game: { active: '/icons/game-active.png', inactive: '/icons/game.png' },
  Top: { active: '/icons/top-active.png', inactive: '/icons/top.png' },
  Shop: { active: '/icons/shop-active.png', inactive: '/icons/shop.png' },
}

export function BottomBar({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}) {
  return (
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
          onClick={() => onTabChange(tab)}
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
  )
}
