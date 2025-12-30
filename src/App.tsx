import { useGameState } from './lib/useGameState';
import { JoinScreen } from './components/JoinScreen/JoinScreen';
import { PokerTable } from './components/PokerTable/PokerTable';
import './App.css';

function App() {
  const {
    gameState,
    myPlayer,
    joinGame,
    performAction,
    startGame,
    nextRound,
    canCheck,
    canCall,
    minRaise,
    isMyTurn,
    turnTimeLeft
  } = useGameState();

  // Show join screen if player hasn't joined yet
  if (!myPlayer) {
    return (
      <JoinScreen
        players={gameState.players}
        onJoin={joinGame}
      />
    );
  }

  // Show poker table
  return (
    <PokerTable
      gameState={gameState}
      myPlayer={myPlayer}
      isMyTurn={isMyTurn}
      turnTimeLeft={turnTimeLeft}
      canCheck={canCheck}
      canCall={canCall}
      minRaise={minRaise}
      onAction={performAction}
      onStartGame={startGame}
      onNextRound={nextRound}
    />
  );
}

export default App;
