import { useState, useEffect } from "react";
import "./App.css";
import QuizCreator from "./QuizCreator";

// Define the Quiz type
interface Quiz {
  id: number;
  title: string;
  createdAt: string;
}

function App() {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showQuizCreator, setShowQuizCreator] = useState<boolean>(false);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [viewAllQuizzes, setViewAllQuizzes] = useState<boolean>(false);

    useEffect(() => {
        // Listen for the backToHome event from QuizCreator
        const handleBackToHome = () => {
            setShowQuizCreator(false);
            // Refresh quizzes when returning to home
            fetchQuizzes();
        };

        window.addEventListener("backToHome", handleBackToHome);

        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener("backToHome", handleBackToHome);
        };
    }, []);

    useEffect(() => {
        // Fetch quizzes when component mounts
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const fetchedQuizzes = await window.electron.getQuizzes();
            setQuizzes(fetchedQuizzes);
        } catch (error) {
            console.error('Error fetching quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateQuiz = () => {
        setSelectedOption("create");
        setShowQuizCreator(true);
    };

    const handlePublishQuiz = () => {
        setSelectedOption("publish");
        // Future implementation: Navigate to quiz publishing page
        console.log("Publish quiz selected");
    };

    return (
        <div className="App">
            <meta
                http-equiv="Content-Security-Policy"
                content="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self';"
            />

            {showQuizCreator ? (
                <QuizCreator />
            ) : (
                <div className="home-container">
                    <h1>Welcome to Trivia Off</h1>
                    <p className="welcome-text">
                        The ultimate offline multiplayer quiz game for your local network.
                        Host a game and let players join using their web browsers!
                    </p>

                    <div className="button-container">
                        <button 
                            className={`quiz-button ${selectedOption === "create" ? "selected" : ""}`} 
                            onClick={handleCreateQuiz}
                        >
                            Create Quiz
                        </button>
                        <button 
                            className={`quiz-button ${selectedOption === "publish" ? "selected" : ""}`} 
                            onClick={handlePublishQuiz}
                        >
                            Publish Quiz
                        </button>
                    </div>

                    {/* Recent Quizzes Section */}
                    <div className="recent-quizzes-section">
                        <div className="section-header">
                            <h2>{viewAllQuizzes ? "All Quizzes" : "Recent Quizzes"}</h2>
                            <button 
                                className="view-toggle-button"
                                onClick={() => setViewAllQuizzes(!viewAllQuizzes)}
                            >
                                {viewAllQuizzes ? "Show Recent" : "View All"}
                            </button>
                        </div>

                        {loading ? (
                            <p>Loading quizzes...</p>
                        ) : quizzes.length === 0 ? (
                            <p>You haven't created any quizzes yet. Click "Create Quiz" to get started!</p>
                        ) : (
                            <div className="quizzes-list">
                                {(viewAllQuizzes ? quizzes : quizzes.slice(0, 5)).map((quiz) => (
                                    <div key={quiz.id} className="quiz-item">
                                        <h3>{quiz.title}</h3>
                                        <p>Created: {new Date(quiz.createdAt).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="info-section">
                        <h2>How to Play</h2>
                        <ol>
                            <li>Create a new quiz or select an existing one</li>
                            <li>Publish the quiz to your local network</li>
                            <li>Players join using their web browsers</li>
                            <li>Start the game and have fun!</li>
                        </ol>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
