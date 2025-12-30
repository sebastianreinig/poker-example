import { type Card, HandRank, type HandResult, type Player } from '../types/poker';
import { getRankValue } from './card-utils';

// Evaluate the best 5-card hand from 7 cards
export const evaluateHand = (cards: Card[]): HandResult => {
    if (cards.length < 5) {
        return { rank: HandRank.HIGH_CARD, rankName: 'High Card', highCards: [], cards: [] };
    }

    // Get all 5-card combinations from 7 cards
    const combinations = getCombinations(cards, 5);

    let bestResult: HandResult = { rank: HandRank.HIGH_CARD, rankName: 'High Card', highCards: [0], cards: [] };

    for (const combo of combinations) {
        const result = evaluate5Cards(combo);
        if (result.rank > bestResult.rank ||
            (result.rank === bestResult.rank && compareHighCards(result.highCards, bestResult.highCards) > 0)) {
            bestResult = result;
        }
    }

    return bestResult;
};

// Get all combinations of n items from array
const getCombinations = <T>(arr: T[], n: number): T[][] => {
    if (n === 0) return [[]];
    if (arr.length === 0) return [];

    const [first, ...rest] = arr;
    const withFirst = getCombinations(rest, n - 1).map(combo => [first, ...combo]);
    const withoutFirst = getCombinations(rest, n);

    return [...withFirst, ...withoutFirst];
};

// Evaluate exactly 5 cards
const evaluate5Cards = (cards: Card[]): HandResult => {
    const sorted = [...cards].sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank));
    const ranks = sorted.map(c => getRankValue(c.rank));
    const suits = sorted.map(c => c.suit);

    const isFlush = suits.every(s => s === suits[0]);
    const isStraight = checkStraight(ranks);
    const isAceLowStraight = checkAceLowStraight(ranks);

    const rankCounts = getRankCounts(ranks);
    const counts = Object.values(rankCounts).sort((a, b) => b - a);

    // Royal Flush
    if (isFlush && isStraight && ranks[0] === 14) {
        return { rank: HandRank.ROYAL_FLUSH, rankName: 'Royal Flush', highCards: ranks, cards: sorted };
    }

    // Straight Flush
    if (isFlush && (isStraight || isAceLowStraight)) {
        const highCards = isAceLowStraight ? [5, 4, 3, 2, 1] : ranks;
        return { rank: HandRank.STRAIGHT_FLUSH, rankName: 'Straight Flush', highCards, cards: sorted };
    }

    // Four of a Kind
    if (counts[0] === 4) {
        const quadRank = parseInt(Object.entries(rankCounts).find(([, v]) => v === 4)![0]);
        const kicker = ranks.find(r => r !== quadRank)!;
        return { rank: HandRank.FOUR_OF_A_KIND, rankName: 'Four of a Kind', highCards: [quadRank, kicker], cards: sorted };
    }

    // Full House
    if (counts[0] === 3 && counts[1] === 2) {
        const trips = parseInt(Object.entries(rankCounts).find(([, v]) => v === 3)![0]);
        const pair = parseInt(Object.entries(rankCounts).find(([, v]) => v === 2)![0]);
        return { rank: HandRank.FULL_HOUSE, rankName: 'Full House', highCards: [trips, pair], cards: sorted };
    }

    // Flush
    if (isFlush) {
        return { rank: HandRank.FLUSH, rankName: 'Flush', highCards: ranks, cards: sorted };
    }

    // Straight
    if (isStraight || isAceLowStraight) {
        const highCards = isAceLowStraight ? [5, 4, 3, 2, 1] : ranks;
        return { rank: HandRank.STRAIGHT, rankName: 'Straight', highCards, cards: sorted };
    }

    // Three of a Kind
    if (counts[0] === 3) {
        const trips = parseInt(Object.entries(rankCounts).find(([, v]) => v === 3)![0]);
        const kickers = ranks.filter(r => r !== trips);
        return { rank: HandRank.THREE_OF_A_KIND, rankName: 'Three of a Kind', highCards: [trips, ...kickers], cards: sorted };
    }

    // Two Pair
    if (counts[0] === 2 && counts[1] === 2) {
        const pairs = Object.entries(rankCounts)
            .filter(([, v]) => v === 2)
            .map(([k]) => parseInt(k))
            .sort((a, b) => b - a);
        const kicker = ranks.find(r => !pairs.includes(r))!;
        return { rank: HandRank.TWO_PAIR, rankName: 'Two Pair', highCards: [...pairs, kicker], cards: sorted };
    }

    // One Pair
    if (counts[0] === 2) {
        const pair = parseInt(Object.entries(rankCounts).find(([, v]) => v === 2)![0]);
        const kickers = ranks.filter(r => r !== pair);
        return { rank: HandRank.ONE_PAIR, rankName: 'One Pair', highCards: [pair, ...kickers], cards: sorted };
    }

    // High Card
    return { rank: HandRank.HIGH_CARD, rankName: 'High Card', highCards: ranks, cards: sorted };
};

// Check for regular straight (5 consecutive ranks)
const checkStraight = (ranks: number[]): boolean => {
    for (let i = 0; i < ranks.length - 1; i++) {
        if (ranks[i] - ranks[i + 1] !== 1) return false;
    }
    return true;
};

// Check for Ace-low straight (A-2-3-4-5)
const checkAceLowStraight = (ranks: number[]): boolean => {
    const aceLow = [14, 5, 4, 3, 2];
    return JSON.stringify(ranks.slice().sort((a, b) => b - a)) === JSON.stringify(aceLow);
};

// Count occurrences of each rank
const getRankCounts = (ranks: number[]): Record<number, number> => {
    return ranks.reduce((acc, rank) => {
        acc[rank] = (acc[rank] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);
};

// Compare high cards arrays
const compareHighCards = (a: number[], b: number[]): number => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i] !== b[i]) return a[i] - b[i];
    }
    return 0;
};

// Determine winner(s) from players
export const determineWinners = (players: Player[], communityCards: Card[]): string[] => {
    const activePlayers = players.filter(p => !p.isFolded && p.cards.length === 2);

    if (activePlayers.length === 0) return [];
    if (activePlayers.length === 1) return [activePlayers[0].id];

    const results = activePlayers.map(player => ({
        playerId: player.id,
        result: evaluateHand([...player.cards, ...communityCards])
    }));

    // Sort by hand rank, then by high cards
    results.sort((a, b) => {
        if (a.result.rank !== b.result.rank) {
            return b.result.rank - a.result.rank;
        }
        return compareHighCards(b.result.highCards, a.result.highCards);
    });

    // Find all players with the best hand (for split pots)
    const bestResult = results[0].result;
    const winners = results.filter(r =>
        r.result.rank === bestResult.rank &&
        compareHighCards(r.result.highCards, bestResult.highCards) === 0
    );

    return winners.map(w => w.playerId);
};

// Get hand rank name
export const getHandRankName = (rank: HandRank): string => {
    const names: Record<HandRank, string> = {
        [HandRank.ROYAL_FLUSH]: 'Royal Flush',
        [HandRank.STRAIGHT_FLUSH]: 'Straight Flush',
        [HandRank.FOUR_OF_A_KIND]: 'Four of a Kind',
        [HandRank.FULL_HOUSE]: 'Full House',
        [HandRank.FLUSH]: 'Flush',
        [HandRank.STRAIGHT]: 'Straight',
        [HandRank.THREE_OF_A_KIND]: 'Three of a Kind',
        [HandRank.TWO_PAIR]: 'Two Pair',
        [HandRank.ONE_PAIR]: 'One Pair',
        [HandRank.HIGH_CARD]: 'High Card'
    };
    return names[rank];
};
