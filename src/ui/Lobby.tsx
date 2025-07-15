import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import "./App.css";

// Define the HotspotStatus interface
interface HotspotStatus {
  isEnabled: boolean;
  ssid?: string;
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
  const [hotspotStatus, setHotspotStatus] = useState<HotspotStatus | null>(null);
  const [hotspotError, setHotspotError] = useState<string | null>(null);

  useEffect(() => {
    // Check and enable hotspot, then initialize server
    const initHotspotAndServer = async () => {
      setIsLoading(true);
      try {
        // Check hotspot status
        const status = await window.electron.checkHotspotStatus();
        setHotspotStatus(status);

        // If hotspot is not enabled, try to enable it
        if (!status.isEnabled && !status.error) {
          // Default SSID and password - in a real app, you might want to make these configurable
          const ssid = "TriviaOffHotspot";
          const password = "trivia123";

          const enabled = await window.electron.enableHotspot(ssid, password);
          if (enabled) {
            // Check status again after enabling
            const updatedStatus = await window.electron.checkHotspotStatus();
            setHotspotStatus(updatedStatus);

            if (!updatedStatus.isEnabled) {
              setHotspotError("Failed to enable hotspot. Please enable it manually.");
            }
          } else {
            setHotspotError("Failed to enable hotspot. Please enable it manually.");
          }
        }

        // Initialize server (mock for now)
        // In a real implementation, you would use the hotspot's IP address
        setTimeout(() => {
          // Use the hotspot SSID in the URL if available
          const baseUrl = status.isEnabled && status.ssid 
            ? `http://${status.ssid}.local:3000/join/` 
            : "http://localhost:3000/join/";

          setServerUrl(baseUrl + quizId);
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
        console.error("Error initializing hotspot and server:", error);
        setHotspotError("An error occurred while setting up the hotspot: " + error.message);
        setIsLoading(false);
      }
    };

    initHotspotAndServer();
  }, [quizId]);

  return (
    <div className="lobby-container">
      <h2>Lobby: {quizTitle}</h2>

      {isLoading ? (
        <div className="loading-container">
          <p>Setting up the hotspot and game server...</p>
        </div>
      ) : hotspotError ? (
        <div className="error-container">
          <p className="error-message">{hotspotError}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      ) : (
        <div className="lobby-content">
          <div className="qr-section">
            <h3>Scan to Join</h3>
            <div className="hotspot-status">
              <p>
                Hotspot Status: 
                <strong className={hotspotStatus?.isEnabled ? "status-enabled" : "status-disabled"}>
                  {hotspotStatus?.isEnabled ? " Enabled" : " Disabled"}
                </strong>
              </p>
              {hotspotStatus?.ssid && (
                <p>Network Name: <strong>{hotspotStatus.ssid}</strong></p>
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
