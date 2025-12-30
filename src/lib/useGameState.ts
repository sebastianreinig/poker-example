import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameState, Player, GamePhase, PlayerAction } from '../types/poker';
import { createDeck, shuffleDeck, dealCards } from './card-utils';
import { determineWinners } from './poker-logic';
import { soundManager } from './sounds';
import { supabase, isSupabaseConfigured } from './supabase';

const STARTING_CHIPS = 1000;
const SMALL_BLIND = 10;
const BIG_BLIND = 20;
const TURN_TIME = 30; // seconds
const STORAGE_KEY = 'poker_player_id';
const CHANNEL_NAME = 'poker_gladiators_v1';
const MAX_SEATS = 9;

interface UseGameStateReturn {
    gameState: GameState;
    currentPlayer: Player | null;
    myPlayer: Player | null;
    joinGame: (name: string) => void;
    leaveGame: () => void;
    performAction: (action: PlayerAction, amount?: number) => void;
    startGame: () => void;
    nextRound: () => void;
    canCheck: boolean;
    canCall: boolean;
    callAmount: number;
    minRaise: number;
    isMyTurn: boolean;
    turnTimeLeft: number;
}

const createInitialState = (): GameState => ({
    id: 'game_1', // Fixed ID for single table simplicity
    phase: 'waiting',
    communityCards: [],
    pot: 0,
    currentBet: 0,
    dealerPosition: 0,
    currentPlayerId: null,
    players: [],
    deck: [],
    minRaise: BIG_BLIND,
    smallBlind: SMALL_BLIND,
    bigBlind: BIG_BLIND,
    roundBets: new Map(),
    winners: []
});

export const useGameState = (): UseGameStateReturn => {
    const [gameState, setGameState] = useState<GameState>(createInitialState);
    const [myPlayerId, setMyPlayerId] = useState<string | null>(() => {
        return localStorage.getItem(STORAGE_KEY);
    });
    const [turnTimeLeft, setTurnTimeLeft] = useState(TURN_TIME);

    const turnTimerRef = useRef<number | null>(null);
    const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
    const supabaseChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const myPlayer = gameState.players.find(p => p.id === myPlayerId) || null;
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId) || null;
    const isMyTurn = myPlayerId === gameState.currentPlayerId;

    // Persist session
    useEffect(() => {
        if (myPlayerId) {
            localStorage.setItem(STORAGE_KEY, myPlayerId);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [myPlayerId]);

    // Broadcast helper
    const broadcastState = useCallback((newState: GameState) => {
        setGameState(newState); // Update local immediately

        if (isSupabaseConfigured() && supabaseChannelRef.current) {
            supabaseChannelRef.current.send({
                type: 'broadcast',
                event: 'game_update',
                payload: newState
            });
        } else if (broadcastChannelRef.current) {
            broadcastChannelRef.current.postMessage({
                type: 'game_update',
                payload: newState
            });
        }
    }, []);

    // Realtime Connection Setup
    useEffect(() => {
        const handleGameUpdate = (newState: GameState) => {
            setGameState(prev => {
                if (prev.players.length > newState.players.length) return prev;
                return newState;
            });
        };

        const handleRequestState = () => {
            setGameState(currentState => {
                const isLeader = currentState.players.length > 0 &&
                    (currentState.players[0].id === myPlayerId || currentState.players.find(p => p.isDealer)?.id === myPlayerId);

                if (isLeader) {
                    broadcastState(currentState);
                }
                return currentState;
            });
        };

        if (isSupabaseConfigured()) {
            const channel = supabase.channel(CHANNEL_NAME)
                .on('broadcast', { event: 'game_update' }, (payload) => {
                    if (payload.payload) handleGameUpdate(payload.payload as GameState);
                })
                .on('broadcast', { event: 'request_state' }, () => {
                    handleRequestState();
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        channel.send({
                            type: 'broadcast',
                            event: 'request_state',
                            payload: {}
                        });
                    }
                });
            supabaseChannelRef.current = channel;

            return () => {
                supabase.removeChannel(channel);
            };
        } else {
            const channel = new BroadcastChannel(CHANNEL_NAME);
            channel.onmessage = (event) => {
                if (event.data.type === 'game_update' && event.data.payload) {
                    handleGameUpdate(event.data.payload);
                } else if (event.data.type === 'request_state') {
                    handleRequestState();
                }
            };
            broadcastChannelRef.current = channel;

            channel.postMessage({ type: 'request_state', payload: {} });

            return () => {
                channel.close();
            };
        }
    }, [myPlayerId, broadcastState]);

    const canCheck = currentPlayer
        ? gameState.currentBet - currentPlayer.currentBet === 0
        : false;

    const callAmount = currentPlayer
        ? gameState.currentBet - currentPlayer.currentBet
        : 0;

    const canCall = callAmount > 0 && (currentPlayer?.chips || 0) >= callAmount;
    const minRaise = gameState.currentBet + gameState.bigBlind;

    // Turn timer logic
    useEffect(() => {
        if (turnTimerRef.current) clearInterval(turnTimerRef.current);

        if (gameState.phase !== 'waiting' && gameState.currentPlayerId) {
            setTurnTimeLeft(TURN_TIME);

            turnTimerRef.current = window.setInterval(() => {
                setTurnTimeLeft(prev => {
                    if (prev <= 1) return 0;
                    if (prev === 5) soundManager.playTimerWarning();
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (turnTimerRef.current) clearInterval(turnTimerRef.current);
        };
    }, [gameState.currentPlayerId, gameState.phase]);

    // Turn notification sound
    useEffect(() => {
        if (isMyTurn && gameState.phase !== 'waiting') {
            soundManager.playTurnNotification();
        }
    }, [isMyTurn, gameState.currentPlayerId, gameState.phase]);

    const joinGame = useCallback((name: string) => {
        const existing = gameState.players.find(p => p.id === myPlayerId);
        if (existing) return;

        const pid = myPlayerId || crypto.randomUUID();

        const newPlayer: Player = {
            id: pid,
            name,
            chips: STARTING_CHIPS,
            seatPosition: gameState.players.length,
            isActive: true,
            hasActed: false,
            isFolded: false,
            isAllIn: false,
            currentBet: 0,
            cards: [],
            isDealer: false,
            isSmallBlind: false,
            isBigBlind: false,
            isCurrentTurn: false
        };

        setMyPlayerId(pid);

        const newState = {
            ...gameState,
            players: [...gameState.players, newPlayer]
        };
        broadcastState(newState);
    }, [gameState, myPlayerId, broadcastState]);

    const leaveGame = useCallback(() => {
        if (!myPlayerId) return;
        const newState = {
            ...gameState,
            players: gameState.players.filter(p => p.id !== myPlayerId)
        };
        setMyPlayerId(null);
        broadcastState(newState);
    }, [gameState, myPlayerId, broadcastState]);

    const startGame = useCallback(() => {
        if (gameState.players.length < 2) return;

        const deck = shuffleDeck(createDeck());
        let remainingDeck = deck;

        const updatedPlayers = gameState.players.map((player) => {
            const { dealt, remaining } = dealCards(remainingDeck, 2);
            remainingDeck = remaining;
            return {
                ...player,
                cards: dealt,
                currentBet: 0,
                hasActed: false,
                isFolded: false,
                isAllIn: false,
                isActive: true,
                isDealer: false,
                isSmallBlind: false,
                isBigBlind: false,
                isCurrentTurn: false
            };
        });

        soundManager.playCardDeal();

        // Rotate dealer
        const nextDealerPos = (gameState.dealerPosition + 1) % updatedPlayers.length;
        const playerCount = updatedPlayers.length;

        updatedPlayers[nextDealerPos].isDealer = true;

        let sbPos: number;
        let bbPos: number;
        let firstToActPos: number;

        if (playerCount === 2) {
            // Heads-up Rules: Dealer is SB, Other is BB
            // Dealer/SB acts first preflop
            sbPos = nextDealerPos;
            bbPos = (nextDealerPos + 1) % playerCount;
            firstToActPos = sbPos;
        } else {
            // Normal Rules: Dealer, then SB, then BB
            // UTG (BB+1) acts first
            sbPos = (nextDealerPos + 1) % playerCount;
            bbPos = (nextDealerPos + 2) % playerCount;
            firstToActPos = (nextDealerPos + 3) % playerCount;
        }

        updatedPlayers[sbPos].isSmallBlind = true;
        updatedPlayers[sbPos].chips -= SMALL_BLIND;
        updatedPlayers[sbPos].currentBet = SMALL_BLIND;

        updatedPlayers[bbPos].isBigBlind = true;
        updatedPlayers[bbPos].chips -= BIG_BLIND;
        updatedPlayers[bbPos].currentBet = BIG_BLIND;

        const firstPlayerId = updatedPlayers[firstToActPos].id;

        const newState: GameState = {
            ...gameState,
            phase: 'preflop',
            deck: remainingDeck,
            players: updatedPlayers,
            pot: 0,
            currentBet: BIG_BLIND,
            dealerPosition: nextDealerPos,
            currentPlayerId: firstPlayerId,
            communityCards: [],
            winners: []
        };

        broadcastState(newState);
    }, [gameState, broadcastState]);

    const nextRound = useCallback(() => {
        // Only allow if we are in showdown
        if (gameState.phase !== 'showdown') return;

        // Reset players for new round but KEEP CHIPS
        const deck = shuffleDeck(createDeck());
        let remainingDeck = deck;

        const updatedPlayers = gameState.players.map((player) => {
            const { dealt, remaining } = dealCards(remainingDeck, 2);
            remainingDeck = remaining;

            // Check for bankruptcy 
            let chips = player.chips;
            let isActive = chips > 0;
            let isAllIn = false;

            return {
                ...player,
                cards: dealt,
                currentBet: 0,
                hasActed: false,
                isFolded: false,
                isAllIn,
                isActive,
                chips,
                isDealer: false,
                isSmallBlind: false,
                isBigBlind: false,
                isCurrentTurn: false
            };
        });

        soundManager.playCardDeal();

        // Rotate dealer logic (simplified for reliability)
        const nextDealerPos = (gameState.dealerPosition + 1) % updatedPlayers.length;
        const playerCount = updatedPlayers.length;

        updatedPlayers[nextDealerPos].isDealer = true;

        let sbPos: number;
        let bbPos: number;
        let firstToActPos: number;

        if (playerCount === 2) {
            sbPos = nextDealerPos;
            bbPos = (nextDealerPos + 1) % playerCount;
            firstToActPos = sbPos;
        } else {
            sbPos = (nextDealerPos + 1) % playerCount;
            bbPos = (nextDealerPos + 2) % playerCount;
            firstToActPos = (nextDealerPos + 3) % playerCount;
        }

        // Apply Blinds - Handle all-in scenarios if short stacked
        const payBlind = (playerIdx: number, amount: number) => {
            if (updatedPlayers[playerIdx].chips > amount) {
                updatedPlayers[playerIdx].chips -= amount;
                updatedPlayers[playerIdx].currentBet = amount;
            } else {
                updatedPlayers[playerIdx].currentBet = updatedPlayers[playerIdx].chips;
                updatedPlayers[playerIdx].chips = 0;
                updatedPlayers[playerIdx].isAllIn = true;
            }
        };

        payBlind(sbPos, SMALL_BLIND);
        updatedPlayers[sbPos].isSmallBlind = true;

        payBlind(bbPos, BIG_BLIND);
        updatedPlayers[bbPos].isBigBlind = true;

        const firstPlayerId = updatedPlayers[firstToActPos].id;

        const newState: GameState = {
            ...gameState,
            id: crypto.randomUUID(),
            phase: 'preflop',
            deck: remainingDeck,
            players: updatedPlayers,
            pot: 0,
            currentBet: BIG_BLIND,
            dealerPosition: nextDealerPos,
            currentPlayerId: firstPlayerId,
            communityCards: [],
            winners: []
        };

        broadcastState(newState);
    }, [gameState, broadcastState]);


    const performAction = useCallback((action: PlayerAction, amount?: number) => {
        const updatedPlayers = [...gameState.players];
        let pot = gameState.pot;
        let currentBet = gameState.currentBet;

        const playerIndex = updatedPlayers.findIndex(p => p.id === gameState.currentPlayerId);
        if (playerIndex === -1) return;

        const player = { ...updatedPlayers[playerIndex] };

        switch (action) {
            case 'fold':
                player.isFolded = true;
                player.hasActed = true;
                soundManager.playFold();
                break;
            case 'check':
                if (currentBet > player.currentBet) {
                    console.error("Illegal check attempted");
                    return;
                }
                player.hasActed = true;
                soundManager.playCheck();
                break;
            case 'call':
                const callAmt = currentBet - player.currentBet;
                if (callAmt <= 0 && currentBet > 0) {
                    // Already matched? check (should be handled by canCheck on UI, but safe to allow "zero call" as check?)
                    // Better to just treat as check or ignore if logic forces call.
                }
                const actualCall = Math.min(callAmt, player.chips);
                player.chips -= actualCall;
                player.currentBet += actualCall;
                // Pot is updated at end of round
                if (player.chips === 0) player.isAllIn = true;
                player.hasActed = true;
                soundManager.playChips();
                break;
            case 'raise':
                const raiseAmount = amount || currentBet * 2;
                const totalBet = raiseAmount - player.currentBet;
                player.chips -= totalBet;
                // Pot is updated at end of round
                player.currentBet = raiseAmount;
                currentBet = raiseAmount;
                if (player.chips === 0) player.isAllIn = true;
                player.hasActed = true;
                soundManager.playRaise();
                soundManager.playChips();
                break;
            case 'all-in':
                const allInAmount = player.chips;
                // Pot is updated at end of round
                player.currentBet += allInAmount;
                if (player.currentBet > currentBet) {
                    currentBet = player.currentBet;
                }
                player.chips = 0;
                player.isAllIn = true;
                player.hasActed = true;
                soundManager.playAllIn();
                soundManager.playChips();
                break;
        }

        updatedPlayers[playerIndex] = player;

        // Check Win Condition (Folded)
        const nonFolded = updatedPlayers.filter(p => !p.isFolded);
        if (nonFolded.length === 1) {
            soundManager.playWin();
            const winner = nonFolded[0];
            // Collect all current bets to pot
            const currentRoundPot = updatedPlayers.reduce((sum, p) => sum + p.currentBet, 0);
            const totalPot = pot + currentRoundPot;

            updatedPlayers.forEach(p => {
                if (p.id === winner.id) p.chips += totalPot;
            });
            broadcastState({
                ...gameState,
                players: updatedPlayers,
                pot: 0,
                currentBet: 0,
                phase: 'showdown',
                currentPlayerId: null,
                winners: [winner.id]
            });
            return;
        }

        // Check Round Completion
        const activePlayers = updatedPlayers.filter(p => !p.isFolded && (p.isActive || p.isAllIn));
        const playersWhoCanAct = activePlayers.filter(p => !p.isAllIn);

        const allMatched = playersWhoCanAct.every(p => p.currentBet === currentBet);
        const allActed = playersWhoCanAct.every(p => p.hasActed);

        let bbNeedsToAct = false;
        if (gameState.phase === 'preflop' && currentBet === gameState.bigBlind) {
            const bb = playersWhoCanAct.find(p => p.isBigBlind);
            if (bb && !bb.hasActed) bbNeedsToAct = true;
        }

        if (allMatched && allActed && !bbNeedsToAct) {
            // Check if we should auto-run to showdown (everyone all-in or only 1 active player left)
            const activeNonAllIn = updatedPlayers.filter(p => !p.isFolded && !p.isAllIn);
            const shouldAutoRun = activeNonAllIn.length < 2;

            if (shouldAutoRun) {
                // Collect bets
                const currentRoundPot = updatedPlayers.reduce((sum, p) => sum + p.currentBet, 0);
                pot += currentRoundPot;

                // Clear bets for players
                updatedPlayers.forEach(p => {
                    p.currentBet = 0;
                    p.hasActed = true;
                });

                // Deal remaining community cards
                let nextCommunityCards = [...gameState.communityCards];
                let nextDeck = [...gameState.deck];

                // Determine how many cards needed
                // If preflop (0 cards) -> need 5
                // If flop (3 cards) -> need 2
                // If turn (4 cards) -> need 1
                // If river (5 cards) -> need 0

                const currentCardCount = nextCommunityCards.length;
                const needed = 5 - currentCardCount;

                if (needed > 0) {
                    const d = dealCards(nextDeck, needed);
                    nextCommunityCards = [...nextCommunityCards, ...d.dealt];
                    nextDeck = d.remaining;
                    // Play sound for each? Just one for speed.
                    soundManager.playCardFlip();
                }

                const winners = determineWinners(updatedPlayers, nextCommunityCards);
                // Distribute Pot (Simple Winner Takes All for now, Split pots needed later)
                // Note: Logic for side pots is complex, assuming simple case for now or equal split
                const potShare = Math.floor(pot / winners.length);
                const finalPlayers = updatedPlayers.map(p => ({
                    ...p,
                    chips: winners.includes(p.id) ? p.chips + potShare : p.chips,
                    currentBet: 0,
                    hasActed: true // Ensure reset
                }));

                soundManager.playWin();
                broadcastState({
                    ...gameState,
                    players: finalPlayers,
                    communityCards: nextCommunityCards,
                    deck: nextDeck,
                    phase: 'showdown',
                    winners,
                    pot: 0,
                    currentBet: 0,
                    currentPlayerId: null
                });
                return;
            }

            // Normal Phase Transition
            const phases: GamePhase[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];
            const idx = phases.indexOf(gameState.phase);
            const nextPhase = phases[idx + 1] || 'showdown';

            // Collect bets to pot
            const currentRoundPot = updatedPlayers.reduce((sum, p) => sum + p.currentBet, 0);
            pot += currentRoundPot;

            let nextCommunityCards = [...gameState.communityCards];
            let nextDeck = [...gameState.deck];

            if (nextPhase === 'flop') {
                const d = dealCards(nextDeck, 3);
                nextCommunityCards = d.dealt;
                nextDeck = d.remaining;
                d.dealt.forEach(() => soundManager.playCardFlip());
            } else if (nextPhase === 'turn' || nextPhase === 'river') {
                const d = dealCards(nextDeck, 1);
                nextCommunityCards = [...nextCommunityCards, ...d.dealt];
                nextDeck = d.remaining;
                soundManager.playCardFlip();
            }

            if (nextPhase === 'showdown') {
                const winners = determineWinners(updatedPlayers, nextCommunityCards);
                const potShare = Math.floor(pot / winners.length);
                const finalPlayers = updatedPlayers.map(p => ({
                    ...p,
                    chips: winners.includes(p.id) ? p.chips + potShare : p.chips
                }));
                soundManager.playWin();
                broadcastState({
                    ...gameState,
                    players: finalPlayers,
                    communityCards: nextCommunityCards,
                    deck: nextDeck,
                    phase: 'showdown',
                    winners,
                    pot: 0,
                    currentBet: 0,
                    currentPlayerId: null
                });
                return;
            }

            // Normal Phase Transition (continued)
            const resetPlayers = updatedPlayers.map(p => ({
                ...p,
                currentBet: 0,
                hasActed: false
            }));

            // Next player is Left of Dealer
            const dealerPlayer = resetPlayers.find(p => p.isDealer);
            const dealerSeat = dealerPlayer ? dealerPlayer.seatPosition : gameState.dealerPosition;

            let nextId = null;
            for (let i = 1; i <= MAX_SEATS; i++) {
                const targetSeat = (dealerSeat + i) % MAX_SEATS;
                const p = resetPlayers.find(pl => pl.seatPosition === targetSeat);
                if (p && !p.isFolded && !p.isAllIn) {
                    nextId = p.id;
                    break;
                }
            }

            broadcastState({
                ...gameState,
                players: resetPlayers,
                pot,
                currentBet: 0,
                phase: nextPhase,
                communityCards: nextCommunityCards,
                deck: nextDeck,
                currentPlayerId: nextId
            });

        } else {
            // Next Turn (Same Phase)
            const sortedPlayers = [...updatedPlayers].sort((a, b) => a.seatPosition - b.seatPosition);
            const currentIdx = sortedPlayers.findIndex(p => p.id === player.id);

            let nextId = null;
            for (let i = 1; i < sortedPlayers.length; i++) {
                const p = sortedPlayers[(currentIdx + i) % sortedPlayers.length];
                if (!p.isFolded && !p.isAllIn) {
                    nextId = p.id;
                    break;
                }
            }

            broadcastState({
                ...gameState,
                players: updatedPlayers,
                pot,
                currentBet,
                currentPlayerId: nextId
            });
        }
    }, [gameState, broadcastState]);

    return {
        gameState,
        currentPlayer,
        myPlayer,
        joinGame,
        leaveGame,
        performAction,
        startGame,
        nextRound,
        canCheck,
        canCall,
        callAmount,
        minRaise,
        isMyTurn,
        turnTimeLeft
    };
};
