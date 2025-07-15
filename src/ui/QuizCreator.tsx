import { useState } from "react";
import "./App.css";

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
}

function QuizCreator() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: 1,
    text: "",
    options: ["", "", "", ""],
    correctAnswer: -1,
  });

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

  const goBack = () => {
    // This function will be implemented in App.tsx to return to the main screen
    window.dispatchEvent(new CustomEvent("backToHome"));
  };

  return (
    <div className="quiz-creator">
      <h1>Create Quiz</h1>
      
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
          <button onClick={goBack} className="back-btn">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizCreator;