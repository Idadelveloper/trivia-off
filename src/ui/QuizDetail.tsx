import { useState, useEffect } from "react";
import "./App.css";

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
}

interface QuizWithQuestions {
  id: number;
  title: string;
  createdAt: string;
  questions: Question[];
}

interface QuizDetailProps {
  quizId: number;
}

function QuizDetail({ quizId }: QuizDetailProps) {
  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizDetails();
  }, [quizId]);

  const fetchQuizDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const quizData = await window.electron.getQuizWithQuestions(quizId);

      if (!quizData) {
        setError("Quiz not found");
        return;
      }

      setQuiz(quizData);
    } catch (error) {
      console.error('Error fetching quiz details:', error);
      setError("Failed to load quiz details");
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuiz = () => {
    // Dispatch an event to navigate to the quiz edit page
    window.dispatchEvent(new CustomEvent("editQuiz", { detail: { quizId } }));
  };

  const handleDeleteQuiz = async () => {
    // Confirm before deleting
    if (window.confirm("Are you sure you want to delete this quiz?")) {
      try {
        console.log("Deleting quiz:", quizId);
        const result = await window.electron.deleteQuiz(quizId);
        console.log("Delete quiz result:", result);
        // Navigate back to all quizzes
        window.dispatchEvent(new Event("backToAllQuizzes"));
      } catch (error) {
        console.error('Error deleting quiz:', error);
      }
    }
  };

  const handlePublishQuiz = () => {
    // Implement publish functionality when available
    console.log("Publish quiz:", quizId);
  };

  const handleBackToAllQuizzes = () => {
    window.dispatchEvent(new Event("backToAllQuizzes"));
  };

  if (loading) {
    return <div className="quiz-detail-container"><p>Loading quiz details...</p></div>;
  }

  if (error || !quiz) {
    return (
      <div className="quiz-detail-container">
        <div className="error-message">
          <p>{error || "Quiz not found"}</p>
          <button className="back-btn" onClick={handleBackToAllQuizzes}>
            Back to All Quizzes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-detail-container">
      <div className="page-header">
        <h1>{quiz.title}</h1>
        <div className="header-actions">
          <button className="back-btn" onClick={handleBackToAllQuizzes}>
            Back to All Quizzes
          </button>
        </div>
      </div>

      <div className="quiz-metadata">
        <p>Created: {new Date(quiz.createdAt).toLocaleDateString()}</p>
        <p>Total Questions: {quiz.questions.length}</p>
      </div>

      <div className="quiz-actions">
        <button className="action-btn edit-btn" onClick={handleEditQuiz}>
          Edit Quiz
        </button>
        <button className="action-btn delete-btn" onClick={handleDeleteQuiz}>
          Delete Quiz
        </button>
        <button className="action-btn publish-btn" onClick={handlePublishQuiz}>
          Publish Quiz
        </button>
      </div>

      <div className="questions-list">
        <h2>Questions</h2>
        {quiz.questions.map((question, index) => (
          <div key={question.id} className="question-item">
            <h3>Question {index + 1}: {question.text}</h3>
            <div className="options-list">
              {question.options.map((option, optIndex) => (
                <div 
                  key={optIndex} 
                  className={`option-item ${optIndex === question.correctAnswer ? 'correct-option' : ''}`}
                >
                  {option} {optIndex === question.correctAnswer && <span className="correct-badge">✓</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuizDetail;
