import { useState, useEffect } from "react";
import "./App.css";

// Define the Quiz type
interface Quiz {
  id: number;
  title: string;
  createdAt: string;
}

interface QuizSelectorProps {
  onQuizSelected: (quizId: number) => void;
  onCancel: () => void;
}

function QuizSelector({ onQuizSelected, onCancel }: QuizSelectorProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);

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

  const handleSelectQuiz = (quizId: number) => {
    setSelectedQuizId(quizId);
  };

  const handlePublish = () => {
    if (selectedQuizId) {
      onQuizSelected(selectedQuizId);
    }
  };

  return (
    <div className="quiz-selector-container">
      <h2>Select a Quiz to Publish</h2>
      
      {loading ? (
        <p>Loading quizzes...</p>
      ) : quizzes.length === 0 ? (
        <div>
          <p>You haven't created any quizzes yet. Create a quiz first!</p>
          <button className="cancel-button" onClick={onCancel}>Back to Home</button>
        </div>
      ) : (
        <>
          <div className="quizzes-list">
            {quizzes.map((quiz) => (
              <div 
                key={quiz.id} 
                className={`quiz-item ${selectedQuizId === quiz.id ? 'selected' : ''}`}
                onClick={() => handleSelectQuiz(quiz.id)}
              >
                <h3>{quiz.title}</h3>
                <p>Created: {new Date(quiz.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
          
          <div className="button-container">
            <button 
              className="cancel-button" 
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              className="publish-button" 
              onClick={handlePublish}
              disabled={!selectedQuizId}
            >
              Publish Selected Quiz
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default QuizSelector;