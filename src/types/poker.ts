// Card suits and ranks
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
}

// Player information
export interface Player {
  id: string;
  name: string;
  chips: number;
  seatPosition: number;
  isActive: boolean;
  hasActed: boolean;
  isFolded: boolean;
  isAllIn: boolean;
  currentBet: number;
  cards: Card[];
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  isCurrentTurn: boolean;
}

// Game phases
export type GamePhase = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

// Player actions
export type PlayerAction = 'fold' | 'check' | 'call' | 'raise' | 'all-in';

// Game state
export interface GameState {
  id: string;
  phase: GamePhase;
  communityCards: Card[];
  pot: number;
  currentBet: number;
  dealerPosition: number;
  currentPlayerId: string | null;
  players: Player[];
  deck: Card[];
  minRaise: number;
  smallBlind: number;
  bigBlind: number;
  roundBets: Map<string, number>;
  winners: string[];
}

// Hand rankings (highest to lowest)
// Hand rankings (highest to lowest)
export const HandRank = {
  ROYAL_FLUSH: 10,
  STRAIGHT_FLUSH: 9,
  FOUR_OF_A_KIND: 8,
  FULL_HOUSE: 7,
  FLUSH: 6,
  STRAIGHT: 5,
  THREE_OF_A_KIND: 4,
  TWO_PAIR: 3,
  ONE_PAIR: 2,
  HIGH_CARD: 1,
} as const;

export type HandRank = typeof HandRank[keyof typeof HandRank];

export interface HandResult {
  rank: HandRank;
  rankName: string;
  highCards: number[];
  cards: Card[];
}

// Realtime events
export interface GameEvent {
  type: 'player-join' | 'player-leave' | 'player-action' | 'game-update' | 'new-round' | 'showdown';
  playerId?: string;
  action?: PlayerAction;
  amount?: number;
  gameState?: Partial<GameState>;
}

// Supabase database types
export interface DbPlayer {
  id: string;
  name: string;
  chips: number;
  seat_position: number;
  is_active: boolean;
  created_at: string;
}

export interface DbGameState {
  id: string;
  phase: GamePhase;
  community_cards: Card[];
  pot: number;
  current_bet: number;
  dealer_position: number;
  current_player: string | null;
  deck: Card[];
  small_blind: number;
  big_blind: number;
}

export interface DbPlayerHand {
  id: string;
  player_id: string;
  game_state_id: string;
  cards: Card[];
  current_bet: number;
  has_folded: boolean;
  is_all_in: boolean;
}
