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

Extracted 2026-02-10.

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
| `Left ` | **Has trailing space!** |
| `Right` | |
| `Trigger 1` | Unknown purpose |

### Number Inputs
| Name |
|------|
| `Number Left` |
| `Number Right` |

### ViewModel: `ViewModel1`

**Numeric properties:**
- `tonCoins`
- `starsCoins`
- `gameCoins`

**String properties (leaderboard):**
- `topName1` through `topName13`
- `topScore1` through `topScore13`

### Other Identifiers
| Name | Type (guessed) |
|------|----------------|
| `goShop` | Trigger/event |
| `tournamentGame` | Trigger/event |
| `Animation lobby` | Animation name |
| `Full Name` | String property |

## Gotchas

- **Trailing spaces in names:** The `Left ` trigger has a trailing space. Always verify exact names with `strings` before using in code.
- **`strings` shows raw bytes** — some matches may be false positives from embedded images/fonts. Filter with relevant keywords.
- **Font metadata** is also embedded (e.g. Fredoka One license text). Ignore those.
