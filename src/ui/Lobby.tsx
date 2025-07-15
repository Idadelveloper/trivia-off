import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import "./App.css";

// Define the NetworkStatus interface
interface NetworkStatus {
  isConnected: boolean;
  ssid?: string;
  ipAddress?: string;
  hostname?: string;
  error?: string;
}

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
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Function to check network status and initialize server
  const checkNetworkAndInitServer = async () => {
    setIsLoading(true);
    setNetworkError(null);

    // Clear existing players when retrying
    if (networkError) {
      setPlayers([]);
    }

    try {
      // Start the game server
      const result = await window.electron.startGameServer(quizId, quizTitle);

      // Set network status and server URL
      setNetworkStatus(result.networkStatus);
      setServerUrl(result.serverUrl);

      if (!result.networkStatus.isConnected) {
        setNetworkError("Not connected to a Wi-Fi network. Please connect to a network and try again.");
        setIsLoading(false);
        return;
      }

      // Get initial players list
      const initialPlayers = await window.electron.getGamePlayers();
      setPlayers(initialPlayers);

      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing game server:", error);
      setNetworkError("An error occurred while starting the game server: " + (error as Error).message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check network status and initialize server when component mounts
    checkNetworkAndInitServer();

    // Subscribe to player updates
    const unsubscribe = window.electron.subscribePlayers((updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    // Clean up when component unmounts
    return () => {
      // Unsubscribe from player updates
      unsubscribe();

      // Stop the game server
      window.electron.stopGameServer().catch(error => {
        console.error("Error stopping game server:", error);
      });
    };
  }, [quizId]);

  return (
    <div className="lobby-container">
      <h2>Lobby: {quizTitle}</h2>

      {isLoading ? (
        <div className="loading-container">
          <p>Checking network status and setting up the game server...</p>
        </div>
      ) : networkError ? (
        <div className="error-container">
          <p className="error-message">{networkError}</p>
          <div className="button-container">
            <button className="cancel-button" onClick={onCancel}>
              Cancel
            </button>
            <button className="retry-button" onClick={checkNetworkAndInitServer}>
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div className="lobby-content">
          <div className="qr-section">
            <h3>Scan to Join</h3>
            <div className="network-status">
              <p>
                Network Status: 
                <strong className={networkStatus?.isConnected ? "status-enabled" : "status-disabled"}>
                  {networkStatus?.isConnected ? " Connected" : " Disconnected"}
                </strong>
              </p>
              {networkStatus?.ssid && (
                <p className="wifi-name">Wi-Fi Network Name (Connect to this): <strong>{networkStatus.ssid}</strong></p>
              )}
              {networkStatus?.ipAddress && (
                <p>IP Address: <strong>{networkStatus.ipAddress}</strong></p>
              )}
              {networkStatus?.hostname && (
                <p className="secondary-info">Device Name: <strong>{networkStatus.hostname}</strong></p>
              )}
            </div>
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
              onClick={() => {
                // Start the game on the server
                window.electron.startGame(quizId).then(() => {
                  // Call the parent component's onStartGame handler
                  onStartGame();
                }).catch(error => {
                  console.error("Error starting game:", error);
                });
              }}
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
