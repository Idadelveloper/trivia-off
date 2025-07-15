import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import "./App.css";

interface Player {
  id: string;
  name: string;
  joinedAt: Date;
}

interface LobbyProps {
  quizId: number;
  quizTitle: string;
  onCancel: () => void;
  onStartGame: () => void;
}

function Lobby({ quizId, quizTitle, onCancel, onStartGame }: LobbyProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [serverUrl, setServerUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // This would be replaced with actual server initialization code
    const initServer = async () => {
      setIsLoading(true);
      try {
        // Mock data for now - this would be replaced with actual server initialization
        // and getting the local IP address
        setTimeout(() => {
          setServerUrl("http://localhost:3000/join/" + quizId);
          setIsLoading(false);
        }, 1000);

        // Mock player joining for demonstration
        const mockPlayerJoinInterval = setInterval(() => {
          if (players.length < 5) {
            const newPlayer: Player = {
              id: Math.random().toString(36).substring(7),
              name: `Player ${players.length + 1}`,
              joinedAt: new Date()
            };
            setPlayers(prev => [...prev, newPlayer]);
          } else {
            clearInterval(mockPlayerJoinInterval);
          }
        }, 2000);

        return () => clearInterval(mockPlayerJoinInterval);
      } catch (error) {
        console.error("Error initializing server:", error);
        setIsLoading(false);
      }
    };

    initServer();
  }, [quizId]);

  return (
    <div className="lobby-container">
      <h2>Lobby: {quizTitle}</h2>

      {isLoading ? (
        <div className="loading-container">
          <p>Setting up the game server...</p>
        </div>
      ) : (
        <div className="lobby-content">
          <div className="qr-section">
            <h3>Scan to Join</h3>
            <div className="qr-placeholder">
              {serverUrl && (
                <div style={{ margin: "0 auto", width: "200px" }}>
                  <QRCodeSVG
                    value={serverUrl}
                    size={200}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    level={"L"}
                    includeMargin={false}
                  />
                </div>
              )}
            </div>
            <div className="server-url">
              <p>Or join at: <strong>{serverUrl}</strong></p>
            </div>
          </div>

          <div className="players-section">
            <h3>Players ({players.length})</h3>
            {players.length === 0 ? (
              <p>Waiting for players to join...</p>
            ) : (
              <div className="players-list">
                {players.map(player => (
                  <div key={player.id} className="player-item">
                    <span className="player-name">{player.name}</span>
                    <span className="player-joined">Joined {player.joinedAt.toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="button-container">
            <button 
              className="cancel-button" 
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              className="start-game-button" 
              onClick={onStartGame}
              disabled={players.length === 0}
            >
              Start Game ({players.length} players)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Lobby;
