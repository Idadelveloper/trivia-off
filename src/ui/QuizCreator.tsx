import { useState } from "react";
import "./App.css";

declare global {
  interface Window {
    electron: {
      saveQuiz: (title: string, questions: { text: string; options: string[]; correctAnswer: number }[]) => Promise<{ id: number; title: string; createdAt: string }>;
      getQuizzes: () => Promise<any[]>;
      getQuizWithQuestions: (quizId: number) => Promise<any>;
      subscribeStatistics: (callback: (stats: any) => void) => () => void;
      getStaticData: () => Promise<any>;
      subscribeChangeView: (callback: (view: any) => void) => () => void;
    }
  }
}

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
}

function QuizCreator() {
  const [quizTitle, setQuizTitle] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: 1,
    text: "",
    options: ["", "", "", ""],
    correctAnswer: -1,
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);

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

  const addQuestion = () => {
    // Validate the question
    if (
      !currentQuestion.text ||
      currentQuestion.options.some((option) => !option) ||
      currentQuestion.correctAnswer === -1
    ) {
      alert("Please fill in all fields and select a correct answer");
      return;
    }

    // Add the current question to the questions array
    setQuestions([...questions, currentQuestion]);

    // Reset the current question form with a new ID
    setCurrentQuestion({
      id: currentQuestion.id + 1,
      text: "",
      options: ["", "", "", ""],
      correctAnswer: -1,
    });
  };

  const handleQuizTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuizTitle(e.target.value);
  };

  const saveQuiz = async () => {
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
      // Call the Electron API to save the quiz
      const result = await window.electron.saveQuiz(quizTitle, questions);
      alert(`Quiz "${result.title}" saved successfully!`);

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
      console.error("Error saving quiz:", error);
      alert("Failed to save quiz. Please try again.");
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
      <h1>Create Quiz</h1>

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
              <li key={q.id}>
                <strong>{q.text}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Question form */}
      <div className="question-form">
        <h2>Add New Question</h2>

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
          <button onClick={addQuestion} className="add-question-btn">
            Add Question
          </button>
          {questions.length > 0 && (
            <button 
              onClick={saveQuiz} 
              className="save-quiz-btn"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Quiz"}
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
