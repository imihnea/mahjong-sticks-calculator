# Mahjong Sticks Calculator Design

Date: 2026-04-30

## Goal

Build a private, single-device web application for a four-player Riichi Mahjong table. The app replaces a generic scoring app and helps the group play with real point sticks by tracking the full table state, calculating Mahjong Soul Ranked Mode scores, and showing exactly which sticks move after each hand.

The first version is semi-automatic. A player can take a photo of the winning hand for reference, but scoring uses manually confirmed tiles and hand context so the result is reliable.

## Product Scope

The app is a local-first PWA designed for one phone or tablet at the table. It should work from Vercel over HTTPS and keep the active game saved locally in the browser. GitHub will be public for backup.

The first screen is the active game table, not a marketing page. A new game can be started when no active game exists.

### Game Modes

- Four-player East game is the default.
- Four-player South game is also available.
- Rules use a fixed preset: Mahjong Soul Ranked 4P.

### Mahjong Soul Ranked 4P Rules

The rules preset includes:

- 25,000 starting points.
- 30,000 target points.
- 25,000 return points.
- Uma 5-15 for final placement display.
- Open tanyao allowed.
- Atozuke allowed.
- Kuikae disallowed.
- Local yaku disabled.
- Three red fives: one red 5-man, one red 5-pin, one red 5-sou.
- Ippatsu, ura dora, red dora, kan dora enabled.
- Kiriage mangan disabled.
- Kazoe yakuman enabled.
- Multiple yakuman enabled, including double and triple yakuman.
- Double ron and triple ron allowed.
- Riichi deposits for multiple ron go to the winner closest in turn order to the discarder.
- Dealer continues if the dealer wins, or if the dealer is tenpai on exhaustive draw.
- On multiple ron, dealer continues if one of the winners is dealer.
- Abortive draws supported: kyuushu kyuuhai, suufuu renda, suukaikan, suucha riichi.
- Triple ron is not an abortive draw.
- Nagashi mangan supported.
- Tobi ends the game at negative points, but exact zero does not end the game.
- A player under 1,000 points cannot declare riichi.
- Leftover riichi deposits at game end go to first place.
- East games extend into South if nobody has reached 30,000 after East 4.
- South games extend into West if nobody has reached 30,000 after South 4.
- The extension ends by sudden death once any player reaches the target, with dealer continuation taking priority when applicable.
- Final ties use the initial East/South/West/North seat order as tie-breaker.
- Pao is supported for Daisangen and Daisuushi.
- Kokushi ron on concealed kan is supported.

## Main Table UI

The table view shows four players around a central status area. Each player area must clearly show:

- Player name.
- Current score.
- Current seat wind: East, South, West, or North.
- A visible dealer marker on the player whose seat wind is East.
- Riichi status when active.

The center of the table shows:

- Round wind.
- Hand number.
- Honba count.
- Riichi stick count.
- Last dice roll and wall break instruction when available.

Primary actions:

- Roll dice.
- Declare riichi.
- Win.
- Draw.
- Abortive draw.
- Undo last hand.
- Start new game.

## Dice And Wall Break

Before each hand, the dealer can roll dice in the app or enter the physical dice values.

The app uses the standard Japanese/Riichi wall break rule:

- Add the two dice.
- Count seats counterclockwise starting from the dealer as 1.
- The resulting player is the wall owner.
- On that wall, count the same number of stacks from the wall owner's right.
- Break after that stack and start dealing from the live wall side.

The UI should give a direct instruction, for example: "Break South's wall after 6 stacks from the right." It should also show a small explanatory count path so players can verify the result.

## Winning Hand Flow

The Win flow supports single winner, double ron, and triple ron in one hand event.

For each winner, the user enters:

- Winner.
- Win type: ron or tsumo.
- Discarder for ron.
- Winning tile.
- Closed/open hand state.
- Concealed hand tiles.
- Open melds, including chi, pon, open kan, closed kan, and added kan.
- Dora indicators.
- Ura dora indicators when riichi applies.
- Kan dora and kan ura dora indicators.
- Red fives.
- Special conditions: riichi, double riichi, ippatsu, haitei, houtei, rinshan, chankan, tenhou, chiihou, nagashi mangan where relevant.
- Optional photo from camera or upload as a visual reference.

The tile editor is optimized for mobile:

- A 14-tile hand row with tap-to-edit slots.
- A suit keyboard for man, pin, sou, and honors.
- Dedicated controls for dora indicators and melds.
- Clear visual difference for red fives.
- Validation that prevents impossible tile counts.

Scoring is automatic. The app shows:

- Yaku list.
- Dora count.
- Fu breakdown.
- Han total.
- Limit hand label where applicable.
- Per-player payments before applying them.

The user cannot apply a win result until the hand is valid and has at least one yaku, unless it is a supported special case such as nagashi mangan.

## Draw Flow

Exhaustive draw:

- User marks each player tenpai or noten.
- The app applies tenpai/noten payments.
- Riichi sticks remain on the table.
- Honba and dealer continuation are updated using Mahjong Soul rules.

Abortive draw:

- User selects kyuushu kyuuhai, suufuu renda, suukaikan, or suucha riichi.
- No tenpai payment is applied.
- Honba increases.
- Dealer continues on all supported abortive draws.

Nagashi mangan:

- Supported as a draw-result scoring path.
- It applies mangan payment instead of tenpai/noten settlement.
- Dealer continues if the dealer is tenpai; otherwise the dealer rotates.

## Payments And Sticks

Every hand result shows two views.

### Payment Now

This view shows the immediate transfers:

- Who pays.
- Who receives.
- Exact point amount.
- Recommended physical sticks for each transfer.

The stick denominations are:

- 10,000.
- 5,000.
- 1,000.
- 100.

When exact transfer decomposition needs change-making, the UI should show a practical instruction, such as "A gives B one 1,000 stick and receives two 100 sticks back."

### Stick Inventory

This view shows the recommended stick inventory for each player after the hand is applied. It converts each player's score into 10,000, 5,000, 1,000, and 100 sticks where possible, while preserving exact total score.

The inventory view helps the group reconcile physical sticks with the app score after each hand.

## State Model

`GameState` contains:

- Game mode: East or South.
- Rules preset id.
- Players with id, name, score, initial seat, current seat wind, and riichi status.
- Dealer index.
- Round wind.
- Hand number within round.
- Honba.
- Riichi sticks.
- Current hand dice result.
- Hand history.
- Undo snapshots.
- Game end status.

Each hand event stores:

- Event type: win, exhaustive draw, abortive draw, nagashi mangan.
- Input payload.
- Score breakdown.
- Payment result.
- Previous and next table state.
- Optional photo reference id.

## Architecture

Use Next.js, React, and TypeScript. The application is static/PWA-friendly and deploys to Vercel without a custom backend.

Main modules:

- `rules/mahjongSoulRanked4p`: game progression, round extension, renchan, honba, riichi sticks, draw behavior, end-game conditions.
- `scoring`: adapter around a proven Riichi scoring library if one fits; local patches or implementation for Mahjong Soul-specific gaps.
- `sticks`: converts point deltas into physical transfer instructions and per-player stick inventories.
- `wallBreak`: maps dice rolls to wall owner and break stack.
- `camera`: browser camera capture with upload fallback.
- `storage`: IndexedDB/localStorage persistence and undo snapshots.
- `ui/table`: table surface, player wind/dealer display, action entry points.
- `ui/hand-editor`: tile entry, meld entry, dora entry, validation.
- `ui/results`: scoring breakdown, payment now, stick inventory.

Data is saved locally:

- IndexedDB for game snapshots, history, and photos.
- localStorage for small preferences.

## Error Handling

- Camera unavailable: show manual-only mode and upload fallback.
- Browser not on HTTPS/localhost: explain that camera requires HTTPS or localhost.
- Invalid hand: list missing or conflicting inputs and block apply.
- Impossible tile count: mark duplicate count over four and block apply.
- Missing ron discarder or tsumo/ron choice: block apply with a visible reason.
- Riichi under 1,000 points: prevent declaration.
- Scoring library mismatch: adapter tests define expected Mahjong Soul results before release.

## Testing

Unit tests:

- Wall break mapping for dice sums 2-12.
- Seat wind rotation and dealer marker.
- East/South game progression and extensions.
- Tobi at negative score, not at exact zero.
- Riichi declaration restrictions.
- Exhaustive draw tenpai/noten payments.
- Abortive draw behavior.
- Single ron, tsumo, double ron, and triple ron payments.
- Riichi deposit allocation to nearest winner in multiple ron.
- Honba payments.
- Stick transfer decomposition and final stick inventory.
- Common scoring examples: pinfu ron/tsumo, tanyao, yakuhai, chiitoitsu, limit hands, yakuman, dealer and non-dealer cases.

Component tests:

- Tile editor validation.
- Dora and red five input.
- Result screen payment rendering.
- Table view player winds and dealer display.

Release checks:

- Typecheck.
- Unit test suite.
- Production build.
- Manual mobile smoke test for camera, hand input, scoring, payment, undo, and persistence.

## Deployment Plan

The project will be public on GitHub.

Vercel deployment happens after the app scaffold exists and can build successfully. The first Vercel deployment should use the production build, HTTPS camera access, and persistent local browser storage.

## Research Sources

- Riichi Wiki Japanese scoring rules: https://riichi.wiki/Japanese_mahjong_scoring_rules
- Riichi Wiki Mahjong Soul rules: https://riichi.wiki/index.php?mobileaction=toggle_view_desktop&title=Mahjong_Soul
- Mahjong Soul ranked rules mirror: https://mahjongsoul.club/content/ranked-match?language=zh-hant
- Mahjong Soul start guide: https://mahjongsoul.com/startguide/
- Riichi Wiki wall break setup: https://riichi.wiki/Wall_break
- MDN getUserMedia: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
