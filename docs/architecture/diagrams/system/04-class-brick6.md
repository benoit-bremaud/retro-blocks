# Menus, Hall of Fame, i18n and audio classes (brick 6)

Decisions (owner-validated MCDA, issue #14): one `Scene` per screen with `SceneMachine` delegating
(415/500 vs extended switch 315); arcade three-letter name entry on the existing `Intent` flags
(480 vs typed text 300); EN/FR catalogue in unaccented capitals with the font unchanged (445 vs EN
only 385, accented font 345); WebAudio synthesis with no asset (450 vs samples 295).

```mermaid
classDiagram
  class Scene {
    <<interface>>
    +enter()
    +step(frame: IntentFrame) SceneId | null
    +render()
  }
  class SceneMachine {
    -scenes: Record~SceneId, Scene~
    -current: SceneId
    +step(frame)
    +render()
  }
  class MenuScene
  class SettingsScene
  class HallOfFameScene
  class RunScene
  class NameEntryScene
  class SavePort {
    <<interface>>
    +loadScores() ScoreEntry[]
    +saveScores(entries: ScoreEntry[])
    +loadSettings() Settings
    +saveSettings(s: Settings)
  }
  class SceneContext {
    +settings
    +scores
    +lastRun
    +text MessageSet
    +updateSettings(s)
    +updateScores(e)
  }
  class RunResult {
    points
    lines
    level
    seed
  }
  class ToneOutput {
    <<interface>>
    +tone(hz, delay, seconds, wave, gain)
  }
  class WebAudioTones
  class HallOfFame {
    <<domain>>
    +qualifies(entries, points) boolean
    +insertScore(entries, entry) ScoreEntry[]
  }
  class ScoreEntry {
    name: 3 letters
    points
    lines
    level
    seed
  }
  class Settings {
    language: en | fr
    muted: boolean
    volume: 0..3
  }
  class Messages {
    <<catalogue>>
    +messages(lang) MessageSet
  }
  class AudioPort {
    <<interface>>
    +play(sfx)
    +setVolume(level, muted)
  }
  class LocalStorageSave
  class AudioSynth
  SceneMachine --> Scene
  MenuScene ..|> Scene
  SettingsScene ..|> Scene
  HallOfFameScene ..|> Scene
  RunScene ..|> Scene
  NameEntryScene ..|> Scene
  RunScene --> Simulation
  RunScene --> RunPresenter
  NameEntryScene --> HallOfFame
  SceneContext --> SavePort
  SceneContext --> AudioPort
  Scene ..> SceneContext
  Scene ..> Messages
  Scene ..> RenderPort
  SceneContext --> RunResult
  AudioSynth --> ToneOutput
  WebAudioTones ..|> ToneOutput
  LocalStorageSave ..|> SavePort
  AudioSynth ..|> AudioPort
  HallOfFame ..> ScoreEntry
  SavePort ..> Settings
```

## Rules carried by the model

- **Scene contract:** `step` returns the next `SceneId` or `null` to stay; `SceneMachine` calls `enter()` on the target. Scenes receive one shared `SceneContext` (settings, scores, last run, save and audio ports) in their constructor. Scenes never import each other (the shared `moveCursor` lives with `Scene`).
- **Navigation inputs** reuse the existing flags: ↑ = RotateCw, ↓ = SoftDrop, ← → = Left / Right, Enter = Confirm, Esc / P = Pause (back). No `InputPort` change.
- **Menu:** START, SCORES, SETTINGS. **Settings:** language, volume (0–3), mute; every change is saved at once.
- **Run → end:** on top-out, if `qualifies(scores, points)` the scene goes straight to NameEntry; otherwise the game over overlay offers retry (Enter) or Menu (Esc).
- **NameEntry:** three letters A–Z, ↑↓ change the letter, ←→ move the cursor, Enter on the last cell saves and goes to HallOfFame, Esc skips and discards the score (deliberate, arcade style).
- **Hall of Fame:** top 10, ordered by points desc then insertion order; the seed is stored with the entry (replays later).
- **SavePort:** `loadScores` / `loadSettings` never throw: corrupt, missing or wrong-shaped JSON, or storage disabled, returns defaults (empty table, EN, volume 2, unmuted). `save*` swallows `QuotaExceededError` and storage errors. Stored shape is validated field by field (no cast); versioned keys `retro-blocks.v1.scores` and `retro-blocks.v1.settings`.
- **i18n:** `messages(lang)` returns a typed `MessageSet` (every key in both languages, enforced by the type); text is capitals A–Z, digits, space, `-` only, so the font and the port are unchanged. A test checks that every string uses only supported characters. Default language: EN (no `navigator` read in the domain; `main.ts` may pass the browser language as the first-run default).
- **AudioSynth:** WebAudio `OscillatorNode` + gain envelope per `SfxId`; the `AudioContext` is created lazily on the first sound and resumed when suspended (autoplay policy: sounds follow a key press); `setVolume` scales the master gain; failure to create a context degrades to silence. Browser-free parts (the note table per sfx) are data in the adapter, tested by a fake context.
- **No allocation per frame:** `render` builds no strings or arrays (labels are cached per language, row texts built in `enter`).
- **Lint:** adapters still import only `domain/ports/**`; `Settings` and `ScoreEntry` therefore live in `ports/save-port.ts`; `SceneId` stays in `scenes/`.
- **Out of scope:** key remapping (the brick 5 note "remapping is brick 6" is dropped: the map stays fixed).

## Scene states (replaces the brick 5 subset in gameplay/02-state)

```mermaid
stateDiagram-v2
  [*] --> Menu
  Menu --> Run: start
  Menu --> HallOfFame: scores
  Menu --> Settings: settings
  Settings --> Menu: back
  HallOfFame --> Menu: back
  Run --> Run: pause toggle
  Run --> NameEntry: topped out and score qualifies
  Run --> GameOver: topped out, no entry
  GameOver --> Run: retry
  GameOver --> Menu: menu
  NameEntry --> HallOfFame: saved
  NameEntry --> HallOfFame: skip
```

Paused remains an explicit state inside `RunScene`; `GameOver` is an overlay state of `RunScene`.
