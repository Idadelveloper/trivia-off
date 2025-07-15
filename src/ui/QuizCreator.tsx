import { useState, useEffect } from "react";
import "./App.css";

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
}

interface QuizCreatorProps {
  quizId?: number;
}

function QuizCreator({ quizId }: QuizCreatorProps = {}) {
  const [quizTitle, setQuizTitle] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: 1,
    text: "",
    options: ["", "", "", ""],
    correctAnswer: -1,
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(!!quizId);

  // Fetch quiz data when in edit mode
  useEffect(() => {
    if (quizId) {
      fetchQuizData(quizId);
    }
  }, [quizId]);

  const fetchQuizData = async (id: number) => {
    try {
      const quizData = await window.electron.getQuizWithQuestions(id);
      if (quizData) {
        // Set quiz title
        setQuizTitle(quizData.title);

        // Set questions
        const fetchedQuestions = quizData.questions.map((q: any) => ({
          id: q.id,
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer
        }));
        setQuestions(fetchedQuestions);

        // Set next question ID
        const maxId = Math.max(...fetchedQuestions.map((q: Question) => q.id), 0);
        setCurrentQuestion({
          id: maxId + 1,
          text: "",
          options: ["", "", "", ""],
          correctAnswer: -1,
        });
      }
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      alert("Failed to load quiz data. Please try again.");
    }
  };

  const handleQuestionTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentQuestion({
      ...currentQuestion,
      text: e.target.value,
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions,
    });
  };

  const handleCorrectAnswerChange = (index: number) => {
    setCurrentQuestion({
      ...currentQuestion,
      correctAnswer: index,
    });
  };

  const addOrUpdateQuestion = () => {
    // Validate the question
    if (
      !currentQuestion.text ||
      currentQuestion.options.some((option) => !option) ||
      currentQuestion.correctAnswer === -1
    ) {
      alert("Please fill in all fields and select a correct answer");
      return;
    }

    // Check if we're updating an existing question or adding a new one
    const existingQuestionIndex = questions.findIndex(q => q.id === currentQuestion.id);

    if (existingQuestionIndex >= 0) {
      // Update existing question
      const updatedQuestions = [...questions];
      updatedQuestions[existingQuestionIndex] = currentQuestion;
      setQuestions(updatedQuestions);
    } else {
      // Add new question
      setQuestions([...questions, currentQuestion]);
    }

    // Get the next available ID
    const nextId = Math.max(...questions.map(q => q.id), currentQuestion.id) + 1;

    // Reset the current question form with a new ID
    setCurrentQuestion({
      id: nextId,
      text: "",
      options: ["", "", "", ""],
      correctAnswer: -1,
    });
  };

  const handleQuizTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuizTitle(e.target.value);
  };

  const saveOrUpdateQuiz = async () => {
    // Validate that we have a title and at least one question
    if (!quizTitle.trim()) {
      alert("Please enter a quiz title");
      return;
    }

    if (questions.length === 0) {
      alert("Please add at least one question to the quiz");
      return;
    }

    try {
      setIsSaving(true);

      let result;
      if (isEditMode && quizId) {
        // Update existing quiz
        result = await window.electron.updateQuiz(quizId, quizTitle, questions);
        alert(`Quiz "${result.title}" updated successfully!`);
      } else {
        // Create new quiz
        result = await window.electron.saveQuiz(quizTitle, questions);
        alert(`Quiz "${result.title}" saved successfully!`);
      }

      // Reset the form
      setQuizTitle("");
      setQuestions([]);
      setCurrentQuestion({
        id: 1,
        text: "",
        options: ["", "", "", ""],
        correctAnswer: -1,
      });

      // Redirect back to home page
      goBack();
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'saving'} quiz:`, error);
      alert(`Failed to ${isEditMode ? 'update' : 'save'} quiz. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const goBack = () => {
    // This function will be implemented in App.tsx to return to the main screen
    window.dispatchEvent(new CustomEvent("backToHome"));
  };

  return (
    <div className="quiz-creator">
      <h1>{isEditMode ? "Edit Quiz" : "Create Quiz"}</h1>

      {/* Quiz Title */}
      <div className="form-group quiz-title-group">
        <label htmlFor="quizTitle">Quiz Title:</label>
        <input
          type="text"
          id="quizTitle"
          value={quizTitle}
          onChange={handleQuizTitleChange}
          placeholder="Enter quiz title"
        />
      </div>

      {/* Display existing questions */}
      {questions.length > 0 && (
        <div className="existing-questions">
          <h2>Questions Added: {questions.length}</h2>
          <ul>
            {questions.map((q) => (
              <li key={q.id} className="question-list-item">
                <strong>{q.text}</strong>
                <div className="question-actions">
                  <button 
                    className="edit-question-btn" 
                    onClick={() => {
                      // Load this question into the current question form
                      setCurrentQuestion({...q});
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="remove-question-btn" 
                    onClick={() => {
                      // Remove this question from the list
                      setQuestions(questions.filter(question => question.id !== q.id));
                    }}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Question form */}
      <div className="question-form">
        <h2>{isEditMode ? "Add or Edit Questions" : "Add New Question"}</h2>

        <div className="form-group">
          <label htmlFor="questionText">Question:</label>
          <input
            type="text"
            id="questionText"
            value={currentQuestion.text}
            onChange={handleQuestionTextChange}
            placeholder="Enter your question"
          />
        </div>

        <h3>Options:</h3>
        {currentQuestion.options.map((option, index) => (
          <div key={index} className="option-group">
            <div className="form-group">
              <label htmlFor={`option${index}`}>Option {index + 1}:</label>
              <input
                type="text"
                id={`option${index}`}
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Enter option ${index + 1}`}
              />
            </div>
            <div className="correct-answer">
              <input
                type="radio"
                id={`correct${index}`}
                name="correctAnswer"
                checked={currentQuestion.correctAnswer === index}
                onChange={() => handleCorrectAnswerChange(index)}
              />
              <label htmlFor={`correct${index}`}>Correct Answer</label>
            </div>
          </div>
        ))}

        <div className="button-group">
          <button onClick={addOrUpdateQuestion} className="add-question-btn">
            {currentQuestion.id && questions.some(q => q.id === currentQuestion.id) 
              ? "Update Question" 
              : "Add Question"
            }
          </button>
          {questions.length > 0 && (
            <button 
              onClick={saveOrUpdateQuiz} 
              className="save-quiz-btn"
              disabled={isSaving}
            >
              {isSaving 
                ? (isEditMode ? "Updating..." : "Saving...") 
                : (isEditMode ? "Update Quiz" : "Save Quiz")
              }
            </button>
          )}
          <button onClick={goBack} className="back-btn">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizCreator;
