import { getTelegramUser } from './lib/telegram'

export function ProfileUserInfo() {
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
