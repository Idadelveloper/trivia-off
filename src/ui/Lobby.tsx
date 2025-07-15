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
      // Get network status
      const status = await window.electron.getNetworkStatus();
      setNetworkStatus(status);

      if (!status.isConnected) {
        setNetworkError("Not connected to a Wi-Fi network. Please connect to a network and try again.");
        setIsLoading(false);
        return;
      }

      // Initialize server (mock for now)
      // In a real implementation, you would use the network's IP address
      setTimeout(() => {
        // Use the IP address in the URL if available
        const baseUrl = status.isConnected && status.ipAddress 
          ? `http://${status.ipAddress}:3000/join/` 
          : "http://localhost:3000/join/";

        setServerUrl(baseUrl + quizId);
        setIsLoading(false);
      }, 1000);

      // Mock player joining for demonstration
      const mockPlayerJoinInterval = setInterval(() => {
        setPlayers(prev => {
          if (prev.length < 5) {
            const newPlayer: Player = {
              id: Math.random().toString(36).substring(7),
              name: `Player ${prev.length + 1}`,
              joinedAt: new Date()
            };
            return [...prev, newPlayer];
          }
          clearInterval(mockPlayerJoinInterval);
          return prev;
        });
      }, 2000);

      return () => clearInterval(mockPlayerJoinInterval);
    } catch (error) {
      console.error("Error initializing network and server:", error);
      setNetworkError("An error occurred while checking the network status: " + (error as Error).message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check network status and initialize server when component mounts
    checkNetworkAndInitServer();
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
          <button className="retry-button" onClick={checkNetworkAndInitServer}>
            Try Again
          </button>
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
