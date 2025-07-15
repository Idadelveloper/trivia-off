import { useState, useEffect } from "react";
import "./App.css";

// Define the Quiz type
interface Quiz {
  id: number;
  title: string;
  createdAt: string;
}

function AllQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch quizzes when component mounts
    fetchQuizzes();
  }, []);

  // Log when quizzes state changes
  useEffect(() => {
    console.log('Quizzes state updated:', quizzes);
  }, [quizzes]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const fetchedQuizzes = await window.electron.getQuizzes();
      console.log('Fetched quizzes:', fetchedQuizzes);
      setQuizzes(fetchedQuizzes);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuiz = (quizId: number) => {
    // Dispatch an event to navigate to the quiz detail page
    window.dispatchEvent(new CustomEvent("viewQuiz", { detail: { quizId } }));
  };

  const handleEditQuiz = (quizId: number) => {
    // Dispatch an event to navigate to the quiz edit page
    window.dispatchEvent(new CustomEvent("editQuiz", { detail: { quizId } }));
  };

  const handleDeleteQuiz = async (quizId: number) => {
    console.log('Delete button clicked for quiz ID:', quizId);
    // Confirm before deleting
    if (window.confirm("Are you sure you want to delete this quiz?")) {
      try {
        console.log('Deleting quiz with ID:', quizId);
        const result = await window.electron.deleteQuiz(quizId);
        console.log('Delete quiz result:', result);
        // Refresh the list after deletion
        console.log('Refreshing quiz list after deletion');
        fetchQuizzes();
      } catch (error) {
        console.error('Error deleting quiz:', error);
      }
    }
  };

  const handlePublishQuiz = (quizId: number) => {
    // Implement publish functionality when available
    console.log("Publish quiz:", quizId);
  };

  const handleBackToHome = () => {
    window.dispatchEvent(new Event("backToHome"));
  };

  return (
    <div className="all-quizzes-container">
      <div className="page-header">
        <h1>All Quizzes</h1>
        <button className="back-btn" onClick={handleBackToHome}>
          Back to Home
        </button>
      </div>

      {loading ? (
        <p>Loading quizzes...</p>
      ) : quizzes.length === 0 ? (
        <div className="no-quizzes">
          <p>You haven't created any quizzes yet.</p>
          <button className="quiz-button" onClick={handleBackToHome}>
            Create Your First Quiz
          </button>
        </div>
      ) : (
        <div className="quizzes-grid">
          {console.log('Rendering quizzes:', quizzes)}
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-card">
              <h3>{quiz.title}</h3>
              <p>Created: {new Date(quiz.createdAt).toLocaleDateString()}</p>
              <div className="quiz-actions">
                <button 
                  className="action-btn view-btn" 
                  onClick={() => handleViewQuiz(quiz.id)}
                >
                  View
                </button>
                <button 
                  className="action-btn edit-btn" 
                  onClick={() => handleEditQuiz(quiz.id)}
                >
                  Edit
                </button>
                <button 
                  className="action-btn delete-btn" 
                  onClick={() => handleDeleteQuiz(quiz.id)}
                >
                  Delete
                </button>
                <button 
                  className="action-btn publish-btn" 
                  onClick={() => handlePublishQuiz(quiz.id)}
                >
                  Publish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AllQuizzes;
