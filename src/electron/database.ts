import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

// Define the Quiz and Question types
export interface Quiz {
  id?: number;
  title: string;
  createdAt: string;
}

export interface Question {
  id?: number;
  quizId: number;
  text: string;
  options: string;
  correctAnswer: number;
}

// Initialize the database
let db: Database.Database;

export function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'quizzes.db');

  db = new Database(dbPath);

  // Enable foreign key constraints
  db.pragma('foreign_keys = ON');
  console.log('Foreign key constraints enabled:', db.pragma('foreign_keys', { simple: true }));

  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quizId INTEGER NOT NULL,
      text TEXT NOT NULL,
      options TEXT NOT NULL,
      correctAnswer INTEGER NOT NULL,
      FOREIGN KEY (quizId) REFERENCES quizzes (id) ON DELETE CASCADE
    );
  `);

  return db;
}

// Get the database instance
export function getDb() {
  if (!db) {
    initDatabase();
  } else {
    // Ensure foreign key constraints are enabled
    db.pragma('foreign_keys = ON');
  }
  return db;
}

// Save a quiz with its questions
export function saveQuiz(title: string, questions: { text: string; options: string[]; correctAnswer: number }[]) {
  const db = getDb();

  // Start a transaction
  const transaction = db.transaction(() => {
    // Insert the quiz
    const createdAt = new Date().toISOString();
    const insertQuiz = db.prepare('INSERT INTO quizzes (title, createdAt) VALUES (?, ?)');
    const quizResult = insertQuiz.run(title, createdAt);
    const quizId = quizResult.lastInsertRowid as number;

    // Insert the questions
    const insertQuestion = db.prepare('INSERT INTO questions (quizId, text, options, correctAnswer) VALUES (?, ?, ?, ?)');

    for (const question of questions) {
      // Store options as JSON string
      const optionsJson = JSON.stringify(question.options);
      insertQuestion.run(quizId, question.text, optionsJson, question.correctAnswer);
    }

    return { id: quizId, title, createdAt };
  });

  return transaction();
}

// Get all quizzes
export function getQuizzes() {
  console.log('Database getQuizzes called');
  const db = getDb();
  const quizzes = db.prepare('SELECT * FROM quizzes ORDER BY createdAt DESC').all();
  console.log('Database getQuizzes returning:', quizzes);
  return quizzes as Quiz[];
}

// Get a quiz with its questions
export function getQuizWithQuestions(quizId: number) {
  const db = getDb();

  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId) as Quiz | undefined;

  if (!quiz) {
    return null;
  }

  const questions = db.prepare('SELECT * FROM questions WHERE quizId = ?').all(quizId) as Question[];

  // Parse the options JSON string for each question
  const parsedQuestions = questions.map(q => ({
    ...q,
    options: JSON.parse(q.options as unknown as string)
  }));

  return {
    ...quiz,
    questions: parsedQuestions
  };
}

// Update a quiz with its questions
export function updateQuiz(quizId: number, title: string, questions: { id?: number; text: string; options: string[]; correctAnswer: number }[]) {
  const db = getDb();

  // Start a transaction
  const transaction = db.transaction(() => {
    // Update the quiz title
    const updateQuiz = db.prepare('UPDATE quizzes SET title = ? WHERE id = ?');
    updateQuiz.run(title, quizId);

    // Delete all existing questions for this quiz
    const deleteQuestions = db.prepare('DELETE FROM questions WHERE quizId = ?');
    deleteQuestions.run(quizId);

    // Insert the updated questions
    const insertQuestion = db.prepare('INSERT INTO questions (quizId, text, options, correctAnswer) VALUES (?, ?, ?, ?)');

    for (const question of questions) {
      // Store options as JSON string
      const optionsJson = JSON.stringify(question.options);
      insertQuestion.run(quizId, question.text, optionsJson, question.correctAnswer);
    }

    // Get the updated quiz
    const updatedQuiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId) as Quiz;
    return updatedQuiz;
  });

  return transaction();
}

// Delete a quiz and its questions
export function deleteQuiz(quizId: number) {
  console.log('Database deleteQuiz called with ID:', quizId);
  const db = getDb();

  // Check if the quiz exists before deletion
  const quizExists = db.prepare('SELECT id FROM quizzes WHERE id = ?').get(quizId);
  console.log('Quiz exists before deletion:', quizExists);

  if (!quizExists) {
    console.log('Quiz does not exist, cannot delete');
    return { success: false };
  }

  // Start a transaction
  const transaction = db.transaction(() => {
    // Delete the quiz (questions will be deleted automatically due to ON DELETE CASCADE)
    const deleteQuizStmt = db.prepare('DELETE FROM quizzes WHERE id = ?');
    const result = deleteQuizStmt.run(quizId);
    console.log('Delete result:', result);

    // Verify the quiz was deleted
    const quizStillExists = db.prepare('SELECT id FROM quizzes WHERE id = ?').get(quizId);
    console.log('Quiz still exists after deletion:', quizStillExists);

    const success = { success: result.changes > 0 };
    console.log('Returning success object:', success);
    return success;
  });

  const transactionResult = transaction();
  console.log('Transaction result:', transactionResult);

  // Double-check after transaction
  const quizStillExistsAfterTransaction = db.prepare('SELECT id FROM quizzes WHERE id = ?').get(quizId);
  console.log('Quiz still exists after transaction:', quizStillExistsAfterTransaction);

  return transactionResult;
}
