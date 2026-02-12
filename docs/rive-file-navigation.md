# Rive File Navigation

`.riv` files are binary, but they embed all identifier strings (artboard names, state machine names, inputs, ViewModel properties, etc.) as plain text. You can extract them with `strings` + `grep`.

## Quick Commands

**Dump all readable strings:**
```bash
strings public/monkey_new.riv
```

**Find specific identifiers (artboards, inputs, ViewModels, etc.):**
```bash
strings public/monkey_new.riv | grep -iE '(state|machine|trigger|input|artboard|viewmodel|left|right)' | sort -u
```

**Full extraction of meaningful names:**
```bash
strings public/monkey_new.riv | grep -iE '(state|machine|trigger|input|artboard|viewmodel|lobby|profile|shop|top|left|right|coin|name|score)' | sort -u
```

## Current File: `monkey_new.riv`

Extracted 2026-02-12.

### Artboards
| Name | Used for |
|------|----------|
| `Lobby` | Game tab (main screen with swords) |
| `Profile` | Profile tab |
| `Top` | Leaderboard tab |
| `Shop` | Shop tab |

### State Machine
- `State Machine 1` (shared across artboards)

### Trigger Inputs
| Name | Note |
|------|------|
| `Left ` | **Has trailing space!** Carousel swipe |
| `Right` | Carousel swipe |
| `Trigger 1` | Unknown purpose |
| `moveMonkey` | Plays monkey animation (use on any action) |
| `buttonStars` | Fires when Stars wallet button is tapped |
| `buttonTon` | Fires when TON wallet button is tapped |

### Number Inputs
| Name | Note |
|------|------|
| `Number Left` | |
| `Number Right` | |

### ViewModel: `ViewModel1`

**Triggers (game mode buttons):**
- `singleGame` — Solo mode
- `duelGame` — Duel/1v1 mode
- `tournamentGame` — Tournament mode

**Numeric properties:**
- `tonCoins`
- `starsCoins`
- `gameCoins`
- `heightCoins` — 0-100, controls coin stack height animation (Lobby only for now)

**String properties (leaderboard):**
- `topName1` through `topName13`
- `topScore1` through `topScore13`

### Other Identifiers
| Name | Type (guessed) |
|------|----------------|
| `goShop` | Trigger/event |
| `Animation lobby` | Animation name |
| `Full Name` | String property |
| `goldenGamepad` | Visual element |
| `Hight Coins` / `Hight Coins Up` / `Hight Coins Down` | Coin height animation states |
| `Monkey L` / `Monkey R` | Monkey directional elements |

## Troubleshooting: "Input not found"

When a Rive property isn't working, `strings` showing the name in the .riv file only proves it exists — NOT how to access it. There are two completely different access mechanisms:

**State Machine Inputs** → `useStateMachineInput(rive, 'State Machine 1', name)`
- Triggers: `Left `, `Right`, `ButtonPlay`
- Numbers: `Number Left`, `Number Right`
- These are wired directly into the state machine graph

**ViewModel Properties** → `useViewModelInstanceNumber(name, vmi)`, `useViewModelInstanceString(name, vmi)`, etc.
- Numbers: `tonCoins`, `starsCoins`, `gameCoins`, `heightCoins`
- Strings: `topName1`–`topName13`, `topScore1`–`topScore13`
- Triggers: `singleGame`, `duelGame`, `tournamentGame`, `buttonStars`, `buttonTon`
- These live on `ViewModel1` and require a `viewModelInstance`

**When something doesn't work, check in this order:**
1. Look at how similar properties are already accessed in the code — follow existing patterns first
2. Verify the exact name with `strings` (trailing spaces, casing)
3. Try the other access mechanism (SM input vs ViewModel property)
4. Use `rive.stateMachineInputs('State Machine 1')` at runtime to list what the SM actually has
5. Only after exhausting the above — ask the designer

## Gotchas

- **Trailing spaces in names:** The `Left ` trigger has a trailing space. Always verify exact names with `strings` before using in code.
- **`strings` shows raw bytes** — some matches may be false positives from embedded images/fonts. Filter with relevant keywords.
- **Font metadata** is also embedded (e.g. Fredoka One license text). Ignore those.
