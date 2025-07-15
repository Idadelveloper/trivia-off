import express from 'express';
import http from 'http';
import {Server as SocketIOServer} from 'socket.io';
import path from 'path';
import {BrowserWindow} from 'electron';
import {fileURLToPath} from 'url';

// Get the directory name for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Player interface
export interface Player {
    id: string;
    name: string;
    joinedAt: Date;
    socketId: string;
    score: number;
    answers: {
        questionIndex: number;
        answerIndex: number;
        isCorrect: boolean;
        timeToAnswer: number; // in milliseconds
    }[];
}

// Game state enum
export enum GameState {
    WAITING = 'waiting',
    COUNTDOWN = 'countdown',
    QUESTION = 'question',
    ANSWER_REVEAL = 'answer_reveal',
    LEADERBOARD = 'leaderboard',
    GAME_OVER = 'game_over'
}

// Game server class
export class GameServer {
    private app: express.Express;
    private server: http.Server;
    private io: SocketIOServer;
    private players: Map<string, Player> = new Map();
    private socketToPlayerId: Map<string, string> = new Map(); // Map from socket.id to player.id
    private mainWindow: BrowserWindow | null = null;
    private quizId: number | null = null;
    private quizTitle: string | null = null;
    private port: number = 3000;
    private networkStatus: NetworkStatus | null = null;
    private isRunning: boolean = false;

    // Game state
    private gameState: GameState = GameState.WAITING;
    private questions: Question[] = [];
    private currentQuestionIndex: number = 0;
    private countdownTimer: NodeJS.Timeout | null = null;
    private questionTimer: NodeJS.Timeout | null = null;
    private countdownSeconds: number = 5; // 5-second countdown
    private questionSeconds: number = 15; // 15 seconds per question
    private currentTimerValue: number = 0;

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
                this.socketToPlayerId.clear();

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
                    socketId: socket.id,
                    score: 0,
                    answers: []
                };

                // Add player to the map
                this.players.set(playerId, player);

                // Add mapping from socket.id to player.id
                this.socketToPlayerId.set(socket.id, playerId);

                // Send player ID back to the client
                socket.emit('player:joined', {
                    playerId,
                    quizTitle: this.quizTitle
                });

                // If game is already in progress, send current game state
                if (this.gameState !== GameState.WAITING) {
                    socket.emit('game:state', {
                        state: this.gameState,
                        currentQuestion: this.getCurrentQuestionData(),
                        timerValue: this.currentTimerValue
                    });
                }

                // Notify the main window that a player has joined
                this.notifyPlayersChanged();

                console.log(`Player joined: ${player.name} (${player.id})`);
            });

            // Handle player answer
            socket.on('player:answer', (data: { questionIndex: number, answerIndex: number }) => {
                const playerId = this.socketToPlayerId.get(socket.id);
                if (!playerId) return;

                const player = this.players.get(playerId);
                if (!player) return;

                // Only accept answers for the current question and if in QUESTION state
                if (data.questionIndex !== this.currentQuestionIndex || this.gameState !== GameState.QUESTION) {
                    return;
                }

                const question = this.questions[this.currentQuestionIndex];
                if (!question) return;

                // Calculate time to answer in seconds
                const timeToAnswer = this.questionSeconds - this.currentTimerValue;

                // Check if answer is correct
                const isCorrect = data.answerIndex === question.correctAnswer;

                // Calculate score based on accuracy and speed
                let accuracyScore = 0;
                let speedScore = 0;

                // Accuracy score: 20 points for correct answer, 0 for incorrect
                if (isCorrect) {
                    accuracyScore = 20;

                    // Speed score: 15 points if answered in ≤1 second, decreasing by 1 point per second
                    // Minimum speed score is 1 point if answered in the last second
                    speedScore = Math.max(1, Math.min(15, Math.ceil(16 - timeToAnswer)));
                }

                // Total score for this question
                const score = accuracyScore + speedScore;

                // Record the answer
                player.answers.push({
                    questionIndex: data.questionIndex,
                    answerIndex: data.answerIndex,
                    isCorrect,
                    timeToAnswer: timeToAnswer * 1000 // convert to milliseconds
                });

                // Update player score
                player.score += score;

                // Log score update for debugging
                console.log(`Player score updated: ${player.name} (${player.id}), question score: ${score}, total score: ${player.score}`);

                // Send result back to the player
                socket.emit('answer:result', {
                    isCorrect,
                    score,
                    totalScore: player.score
                });

                // Notify the main window that a player has answered
                this.notifyPlayersChanged();

                console.log(`Player ${player.name} answered question ${data.questionIndex}, correct: ${isCorrect}, score: ${score}`);
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
        const playerId = this.socketToPlayerId.get(socketId);
        if (playerId) {
            const player = this.players.get(playerId);
            if (player) {
                console.log(`Player left: ${player.name} (${player.id})`);
                this.players.delete(playerId);
                this.socketToPlayerId.delete(socketId);
                this.notifyPlayersChanged();
            }
        }
    }

    // Notify the main window that the players list has changed
    private notifyPlayersChanged() {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('players:updated', this.getPlayers());
        }
    }

    // Get current question data (sanitized for players)
    private getCurrentQuestionData() {
        if (this.currentQuestionIndex >= this.questions.length) {
            return null;
        }

        const question = this.questions[this.currentQuestionIndex];
        return {
            index: this.currentQuestionIndex,
            text: question.text,
            options: question.options,
            totalQuestions: this.questions.length
        };
    }

    // Set quiz questions
    setQuestions(questions: Question[]) {
        this.questions = questions;
    }

    // Start the game
    startGame() {
        // Reset game state
        this.gameState = GameState.WAITING;
        this.currentQuestionIndex = 0;
        this.currentTimerValue = 0;

        // Reset player scores
        for (const player of this.players.values()) {
            player.score = 0;
            player.answers = [];
        }

        // Notify the main window that players have been updated
        this.notifyPlayersChanged();

        // Start the countdown
        this.startCountdown();
    }

    // Start the countdown before the first question
    private startCountdown() {
        // Set game state to countdown
        this.gameState = GameState.COUNTDOWN;
        this.currentTimerValue = this.countdownSeconds;

        // Notify all clients and the main window about the countdown
        this.io.emit('game:countdown', {seconds: this.countdownSeconds});
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('game:countdown', {seconds: this.countdownSeconds});
        }

        // Start the countdown timer
        this.countdownTimer = setInterval(() => {
            this.currentTimerValue--;

            // Notify all clients and the main window about the timer update
            this.io.emit('timer:update', {value: this.currentTimerValue});
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('timer:update', {value: this.currentTimerValue});
            }

            // When countdown reaches 0, show the first question
            if (this.currentTimerValue <= 0) {
                clearInterval(this.countdownTimer!);
                this.showQuestion();
            }
        }, 1000);
    }

    // Show the current question
    private showQuestion() {
        // If we've gone through all questions, end the game
        if (this.currentQuestionIndex >= this.questions.length) {
            this.endGame();
            return;
        }

        // Set game state to question
        this.gameState = GameState.QUESTION;
        this.currentTimerValue = this.questionSeconds;

        // Get the current question data
        const questionData = this.getCurrentQuestionData();

        // Notify all clients and the main window about the question
        this.io.emit('game:question', questionData);
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('game:question', questionData);
        }

        // Start the question timer
        this.questionTimer = setInterval(() => {
            this.currentTimerValue--;

            // Notify all clients and the main window about the timer update
            this.io.emit('timer:update', {value: this.currentTimerValue});
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('timer:update', {value: this.currentTimerValue});
            }

            // When timer reaches 0, show the answer
            if (this.currentTimerValue <= 0) {
                clearInterval(this.questionTimer!);
                this.showAnswer();
            }
        }, 1000);
    }

    // Show the answer for the current question
    private showAnswer() {
        // Set game state to answer reveal
        this.gameState = GameState.ANSWER_REVEAL;

        // Get the current question
        const question = this.questions[this.currentQuestionIndex];

        // Notify all clients and the main window about the answer
        this.io.emit('game:answer', {
            questionIndex: this.currentQuestionIndex,
            correctAnswer: question.correctAnswer
        });
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('game:answer', {
                questionIndex: this.currentQuestionIndex,
                correctAnswer: question.correctAnswer
            });
        }

        // After a delay, show the leaderboard
        setTimeout(() => {
            this.showLeaderboard();
        }, 3000);
    }

    // Show the leaderboard
    private showLeaderboard() {
        // Set game state to leaderboard
        this.gameState = GameState.LEADERBOARD;

        // Get the top players
        const leaderboard = this.getLeaderboard();

        // Notify all clients and the main window about the leaderboard
        this.io.emit('game:leaderboard', {leaderboard, isGameOver: false});
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('game:leaderboard', {leaderboard, isGameOver: false});
        }

        // After a delay, move to the next question or end the game
        setTimeout(() => {
            this.currentQuestionIndex++;
            if (this.currentQuestionIndex < this.questions.length) {
                this.showQuestion();
            } else {
                this.endGame();
            }
        }, 5000);
    }

    // End the game and show final results
    private endGame() {
        // Set game state to game over
        this.gameState = GameState.GAME_OVER;

        // Get the final leaderboard
        const leaderboard = this.getLeaderboard();

        // Notify all clients and the main window about the game over
        this.io.emit('game:leaderboard', {leaderboard, isGameOver: true});
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('game:leaderboard', {leaderboard, isGameOver: true});
        }
    }

    // Get the leaderboard (sorted by score)
    private getLeaderboard() {
        const players = Array.from(this.players.values());

        // Log players before sorting for debugging
        console.log('Players before sorting:', players.map(p => ({ id: p.id, name: p.name, score: p.score })));

        const leaderboard = players
            .sort((a, b) => b.score - a.score)
            .map(player => ({
                id: player.id,
                name: player.name,
                score: player.score
            }));

        // Log leaderboard after sorting for debugging
        console.log('Leaderboard after sorting:', leaderboard);

        return leaderboard;
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
