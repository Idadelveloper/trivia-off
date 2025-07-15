import express from 'express';
import http from 'http';
import {Server as SocketIOServer} from 'socket.io';
import path from 'path';
import {BrowserWindow} from 'electron';
import { fileURLToPath } from 'url';

// Get the directory name for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Player interface
export interface Player {
    id: string;
    name: string;
    joinedAt: Date;
    socketId: string;
}

// Game server class
export class GameServer {
    private app: express.Express;
    private server: http.Server;
    private io: SocketIOServer;
    private players: Map<string, Player> = new Map();
    private mainWindow: BrowserWindow | null = null;
    private quizId: number | null = null;
    private quizTitle: string | null = null;
    private port: number = 3000;
    private networkStatus: NetworkStatus | null = null;
    private isRunning: boolean = false;

    constructor() {
        // Initialize Express app
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new SocketIOServer(this.server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        // Set up static files
        this.app.use(express.static(path.join(__dirname, 'public')));
        this.app.use(express.json());

        // Set up routes
        this.setupRoutes();

        // Set up socket.io
        this.setupSocketIO();
    }

    // Set the main window reference
    setMainWindow(window: BrowserWindow) {
        this.mainWindow = window;
    }

    // Set the quiz information
    setQuizInfo(quizId: number, quizTitle: string) {
        this.quizId = quizId;
        this.quizTitle = quizTitle;
    }

    // Set network status
    setNetworkStatus(status: NetworkStatus) {
        this.networkStatus = status;
    }

    // Start the server
    start(): Promise<void> {
        return new Promise((resolve, reject) => {
            // If server is already running, resolve immediately
            if (this.isRunning) {
                console.log(`Game server already running on port ${this.port}`);
                resolve();
                return;
            }

            try {
                this.server.listen(this.port, () => {
                    console.log(`Game server running on port ${this.port}`);
                    this.isRunning = true;
                    resolve();
                });
            } catch (error) {
                console.error('Failed to start game server:', error);
                reject(error);
            }
        });
    }

    // Stop the server
    stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            // If server is not running, resolve immediately
            if (!this.isRunning) {
                console.log('Game server is not running');
                resolve();
                return;
            }

            try {
                // Clear all players
                this.players.clear();

                // Notify the main window that all players have left
                this.notifyPlayersChanged();

                // Close the server
                this.server.close(() => {
                    console.log('Game server stopped');
                    this.isRunning = false;

                    // Recreate the server to ensure a clean state for next start
                    this.app = express();
                    this.server = http.createServer(this.app);
                    this.io = new SocketIOServer(this.server, {
                        cors: {
                            origin: '*',
                            methods: ['GET', 'POST']
                        }
                    });

                    // Set up static files
                    this.app.use(express.static(path.join(__dirname, 'public')));
                    this.app.use(express.json());

                    // Set up routes
                    this.setupRoutes();

                    // Set up socket.io
                    this.setupSocketIO();

                    resolve();
                });
            } catch (error) {
                console.error('Failed to stop game server:', error);
                reject(error);
            }
        });
    }

    // Get all players
    getPlayers(): Player[] {
        return Array.from(this.players.values());
    }

    // Set up Express routes
    private setupRoutes() {
        // Route for the join page
        this.app.get('/join/:quizId', (req, res) => {
            const quizId = parseInt(req.params.quizId);

            // Check if this is the current quiz
            if (this.quizId !== quizId) {
                return res.status(404).send('Game not found');
            }

            // Serve the join page
            res.sendFile(path.join(__dirname, 'public', 'join.html'));
        });

        // API route to get quiz info
        this.app.get('/api/quiz/:quizId', (req, res) => {
            const quizId = parseInt(req.params.quizId);

            // Check if this is the current quiz
            if (this.quizId !== quizId) {
                return res.status(404).json({error: 'Game not found'});
            }

            // Return quiz info
            res.json({
                quizId: this.quizId,
                quizTitle: this.quizTitle
            });
        });
    }

    // Set up Socket.IO
    private setupSocketIO() {
        this.io.on('connection', (socket) => {
            console.log('New client connected:', socket.id);

            // Handle player join
            socket.on('player:join', (data: { name: string }) => {
                const playerId = Math.random().toString(36).substring(2, 15);
                const player: Player = {
                    id: playerId,
                    name: data.name,
                    joinedAt: new Date(),
                    socketId: socket.id
                };

                // Add player to the map
                this.players.set(socket.id, player);

                // Send player ID back to the client
                socket.emit('player:joined', {
                    playerId,
                    quizTitle: this.quizTitle
                });

                // Notify the main window that a player has joined
                this.notifyPlayersChanged();

                console.log(`Player joined: ${player.name} (${player.id})`);
            });

            // Handle player leave
            socket.on('player:leave', () => {
                this.removePlayer(socket.id);
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
                this.removePlayer(socket.id);
            });
        });
    }

    // Remove a player
    private removePlayer(socketId: string) {
        const player = this.players.get(socketId);
        if (player) {
            console.log(`Player left: ${player.name} (${player.id})`);
            this.players.delete(socketId);
            this.notifyPlayersChanged();
        }
    }

    // Notify the main window that the players list has changed
    private notifyPlayersChanged() {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('players:updated', this.getPlayers());
        }
    }

    // Start the game
    startGame() {
        // Notify all connected clients that the game has started
        this.io.emit('game:start');
    }

    // Get the server URL
    getServerUrl(): string | null {
        if (!this.networkStatus || !this.networkStatus.ipAddress || !this.quizId) {
            return null;
        }
        return `http://${this.networkStatus.ipAddress}:${this.port}/join/${this.quizId}`;
    }
}

// Create a singleton instance
const gameServer = new GameServer();
export default gameServer;
