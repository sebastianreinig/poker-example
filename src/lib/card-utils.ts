import type { Card, Suit, Rank } from '../types/poker';

// All suits and ranks
export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Get numeric value of a rank (for comparisons)
export const getRankValue = (rank: Rank): number => {
    const values: Record<Rank, number> = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    return values[rank];
};

// Get suit symbol
export const getSuitSymbol = (suit: Suit): string => {
    const symbols: Record<Suit, string> = {
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
        spades: '♠'
    };
    return symbols[suit];
};

// Get suit color
export const getSuitColor = (suit: Suit): 'red' | 'black' => {
    return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
};

// Create a fresh deck of 52 cards
export const createDeck = (): Card[] => {
    const deck: Card[] = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ suit, rank });
        }
    }
    return deck;
};

// Fisher-Yates shuffle
export const shuffleDeck = (deck: Card[]): Card[] => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Deal cards from the deck
export const dealCards = (deck: Card[], count: number): { dealt: Card[]; remaining: Card[] } => {
    const dealt = deck.slice(0, count);
    const remaining = deck.slice(count);
    return { dealt, remaining };
};

// Compare two cards by rank
export const compareCards = (a: Card, b: Card): number => {
    return getRankValue(b.rank) - getRankValue(a.rank);
};

// Format card for display
export const formatCard = (card: Card): string => {
    return `${card.rank}${getSuitSymbol(card.suit)}`;
};

// Check if two cards are equal
export const cardsEqual = (a: Card, b: Card): boolean => {
    return a.suit === b.suit && a.rank === b.rank;
};
