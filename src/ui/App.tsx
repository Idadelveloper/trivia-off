import { useState, useEffect } from "react";
import "./App.css";
import QuizCreator from "./QuizCreator";
import AllQuizzes from "./AllQuizzes";
import QuizDetail from "./QuizDetail";

// Define the Quiz type
interface Quiz {
  id: number;
  title: string;
  createdAt: string;
}

function App() {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<string>("home");
    const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [viewAllQuizzes, setViewAllQuizzes] = useState<boolean>(false);

    useEffect(() => {
        // Listen for navigation events
        const handleBackToHome = () => {
            setCurrentView("home");
            setSelectedQuizId(null);
            // Refresh quizzes when returning to home
            fetchQuizzes();
        };

        const handleViewQuiz = (event: CustomEvent) => {
            const { quizId } = event.detail;
            setSelectedQuizId(quizId);
            setCurrentView("quizDetail");
        };

        const handleEditQuiz = (event: CustomEvent) => {
            const { quizId } = event.detail;
            setSelectedQuizId(quizId);
            setCurrentView("editQuiz");
        };

        const handleBackToAllQuizzes = () => {
            setCurrentView("allQuizzes");
            setSelectedQuizId(null);
        };

        window.addEventListener("backToHome", handleBackToHome);
        window.addEventListener("viewQuiz", handleViewQuiz as EventListener);
        window.addEventListener("editQuiz", handleEditQuiz as EventListener);
        window.addEventListener("backToAllQuizzes", handleBackToAllQuizzes);

        // Clean up the event listeners when the component unmounts
        return () => {
            window.removeEventListener("backToHome", handleBackToHome);
            window.removeEventListener("viewQuiz", handleViewQuiz as EventListener);
            window.removeEventListener("editQuiz", handleEditQuiz as EventListener);
            window.removeEventListener("backToAllQuizzes", handleBackToAllQuizzes);
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
        setCurrentView("createQuiz");
    };

    const handlePublishQuiz = () => {
        setSelectedOption("publish");
        // Future implementation: Navigate to quiz publishing page
        console.log("Publish quiz selected");
    };

    const handleViewAllQuizzes = () => {
        setCurrentView("allQuizzes");
    };

    const renderHomeView = () => {
        return (
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
                        <h2>Recent Quizzes</h2>
                        <button 
                            className="view-toggle-button"
                            onClick={handleViewAllQuizzes}
                        >
                            View All
                        </button>
                    </div>

                    {loading ? (
                        <p>Loading quizzes...</p>
                    ) : quizzes.length === 0 ? (
                        <p>You haven't created any quizzes yet. Click "Create Quiz" to get started!</p>
                    ) : (
                        <div className="quizzes-list">
                            {quizzes.slice(0, 5).map((quiz) => (
                                <div 
                                    key={quiz.id} 
                                    className="quiz-item"
                                    onClick={() => {
                                        setSelectedQuizId(quiz.id);
                                        setCurrentView("quizDetail");
                                    }}
                                >
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
        );
    };

    return (
        <div className="App">
            <meta
                http-equiv="Content-Security-Policy"
                content="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self';"
            />

            {currentView === "home" && renderHomeView()}
            {currentView === "createQuiz" && <QuizCreator />}
            {currentView === "allQuizzes" && <AllQuizzes />}
            {currentView === "quizDetail" && selectedQuizId && <QuizDetail quizId={selectedQuizId} />}
        </div>
    );
}

export default App;
