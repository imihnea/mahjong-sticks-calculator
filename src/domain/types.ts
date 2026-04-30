export type PlayerId = string;
export type SeatWind = "east" | "south" | "west" | "north";
export type RoundWind = "east" | "south" | "west";
export type GameLength = "east" | "south";
export type WinType = "ron" | "tsumo";
export type TileSuit = "man" | "pin" | "sou" | "honor";
export type AbortiveDrawType = "kyuushu-kyuuhai" | "suufuu-renda" | "suukaikan" | "suucha-riichi";

export interface Player {
  id: PlayerId;
  name: string;
  score: number;
  initialSeat: SeatWind;
  seatWind: SeatWind;
  isDealer: boolean;
  riichi: boolean;
}

export interface DiceRoll {
  die1: number;
  die2: number;
  diceTotal: number;
  wallOwnerIndex: number;
  breakAfterStacksFromRight: number;
  countPath: number[];
  instruction: string;
}

export interface GameState {
  id: string;
  gameLength: GameLength;
  players: Player[];
  dealerIndex: number;
  roundWind: RoundWind;
  handNumber: number;
  honba: number;
  riichiSticks: number;
  currentDice?: DiceRoll;
  history: HandEvent[];
  undoStack: GameStateSnapshot[];
  ended: boolean;
}

export type GameStateSnapshot = Omit<GameState, "undoStack">;

export type HandEvent =
  | { type: "dice"; dice: DiceRoll }
  | { type: "riichi"; playerId: PlayerId }
  | { type: "exhaustive-draw"; tenpaiPlayerIds: PlayerId[] }
  | { type: "abortive-draw"; drawType: AbortiveDrawType }
  | { type: "win"; entries: WinEntry[] };

export interface Tile {
  suit: TileSuit;
  value: number;
  red?: boolean;
}

export interface Meld {
  type: "chi" | "pon" | "open-kan" | "closed-kan" | "added-kan";
  tiles: Tile[];
}

export interface WinEntry {
  winnerId: PlayerId;
  winType: WinType;
  discarderId?: PlayerId;
  winningTile: Tile;
  concealedTiles: Tile[];
  melds: Meld[];
  doraIndicators: Tile[];
  uraDoraIndicators: Tile[];
  conditions: WinCondition[];
}

export type WinCondition =
  | "riichi"
  | "double-riichi"
  | "ippatsu"
  | "haitei"
  | "houtei"
  | "rinshan"
  | "chankan"
  | "tenhou"
  | "chiihou"
  | "nagashi-mangan";
