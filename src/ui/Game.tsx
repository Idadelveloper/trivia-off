import { useState, useEffect } from "react";
import "./App.css";

// Define the GameState enum to match the server
enum GameState {
  WAITING = 'waiting',
  COUNTDOWN = 'countdown',
  QUESTION = 'question',
  ANSWER_REVEAL = 'answer_reveal',
  LEADERBOARD = 'leaderboard',
  GAME_OVER = 'game_over'
}

interface GameProps {
  quizId: number;
  quizTitle: string;
  onEndGame: () => void;
}

function Game({ quizId, quizTitle, onEndGame }: GameProps) {
  // Game state
  const [gameState, setGameState] = useState<GameState>(GameState.WAITING);
  const [countdown, setCountdown] = useState<number>(5);
  const [currentQuestion, setCurrentQuestion] = useState<{
    index: number;
    text: string;
    options: string[];
    totalQuestions: number;
  } | null>(null);
  const [timerValue, setTimerValue] = useState<number>(15);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<{
    id: string;
    name: string;
    score: number;
  }[]>([]);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Subscribe to game events
  useEffect(() => {
    // Subscribe to countdown event
    const unsubscribeCountdown = window.electron.subscribeGameCountdown((data) => {
      setGameState(GameState.COUNTDOWN);
      setCountdown(data.seconds);
    });

    // Subscribe to question event
    const unsubscribeQuestion = window.electron.subscribeGameQuestion((data) => {
      setGameState(GameState.QUESTION);
      setCurrentQuestion({
        index: data.index,
        text: data.text,
        options: Array.isArray(data.options) ? data.options : JSON.parse(data.options as string),
        totalQuestions: data.totalQuestions
      });
      setCorrectAnswer(null);
    });

    // Subscribe to timer updates
    const unsubscribeTimer = window.electron.subscribeTimerUpdate((data) => {
      setTimerValue(data.value);
    });

    // Subscribe to answer reveal event
    const unsubscribeAnswer = window.electron.subscribeGameAnswer((data) => {
      setGameState(GameState.ANSWER_REVEAL);
      setCorrectAnswer(data.correctAnswer);
    });

    // Subscribe to leaderboard event
    const unsubscribeLeaderboard = window.electron.subscribeGameLeaderboard((data) => {
      setGameState(GameState.LEADERBOARD);
      setLeaderboard(data.leaderboard);
      setIsGameOver(data.isGameOver);
    });

    // Subscribe to player updates
    const unsubscribePlayers = window.electron.subscribePlayers((players) => {
      // This is handled by the Lobby component, but we might want to show player info during the game
    });

    // Clean up subscriptions
    return () => {
      unsubscribeCountdown();
      unsubscribeQuestion();
      unsubscribeTimer();
      unsubscribeAnswer();
      unsubscribeLeaderboard();
      unsubscribePlayers();
    };
  }, []);

  // Render different screens based on game state
  const renderGameContent = () => {
    switch (gameState) {
      case GameState.COUNTDOWN:
        return (
          <div className="countdown-container">
            <h2>Get Ready!</h2>
            <p>The game is about to start...</p>
            <div className="countdown">{countdown}</div>
          </div>
        );

      case GameState.QUESTION:
        return (
          <div className="question-container">
            <div className="question-header">
              <h2>{quizTitle}</h2>
              <div className="question-number">
                Question {currentQuestion?.index! + 1} of {currentQuestion?.totalQuestions}
              </div>
            </div>
            <div className="timer">Time remaining: {timerValue}s</div>
            <div className="question-text">{currentQuestion?.text}</div>
            <div className="options-container">
              {currentQuestion?.options.map((option, index) => (
                <div key={index} className="option">
                  {option}
                </div>
              ))}
            </div>
          </div>
        );

      case GameState.ANSWER_REVEAL:
        return (
          <div className="answer-container">
            <h2>Answer Revealed</h2>
            <div className="question-text">{currentQuestion?.text}</div>
            <div className="options-container">
              {currentQuestion?.options.map((option, index) => (
                <div
                  key={index}
                  className={`option ${index === correctAnswer ? "correct" : ""}`}
                >
                  {option}
                </div>
              ))}
            </div>
          </div>
        );

      case GameState.LEADERBOARD:
      case GameState.GAME_OVER:
        return (
          <div className="leaderboard-container">
            <h2>{isGameOver ? "Final Results" : "Current Standings"}</h2>
            <div className="leaderboard">
              {leaderboard.map((player, index) => (
                <div key={player.id} className={`leaderboard-item ${index < 3 ? "top" : ""}`}>
                  <span><span className="rank">{index + 1}.</span> {player.name}</span>
                  <span className="player-score">{player.score}</span>
                </div>
              ))}
            </div>
            {isGameOver && (
              <div className="winners-container">
                <h3>Winners</h3>
                {leaderboard.length > 0 && (
                  <div className="winner first">
                    1st Place: {leaderboard[0].name} ({leaderboard[0].score} pts)
                  </div>
                )}
                {leaderboard.length > 1 && (
                  <div className="winner second">
                    2nd Place: {leaderboard[1].name} ({leaderboard[1].score} pts)
                  </div>
                )}
                {leaderboard.length > 2 && (
                  <div className="winner third">
                    3rd Place: {leaderboard[2].name} ({leaderboard[2].score} pts)
                  </div>
                )}
              </div>
            )}
            <div className="button-container">
              <button className="end-game-button" onClick={onEndGame}>
                {isGameOver ? "Return to Home" : "End Game"}
              </button>
              {!isGameOver && (
                <div className="next-question-message">
                  Next question coming up...
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="loading-container">
            <p>Waiting for game to start...</p>
          </div>
        );
    }
  };

  return (
    <div className="game-container">
      {renderGameContent()}
    </div>
  );
}

export default Game;