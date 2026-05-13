const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const DEFAULT_AI_SUGGESTION = `Math: Practice algebra daily on Khan Academy. Focus on weak areas like equations. Science: Review biology concepts on YouTube channels like Amoeba Sisters. English: Read novels and write summaries. Hindi: Practice grammar with Hindi textbooks. Computer: Code on platforms like LeetCode for logic building.`;

function getGrade(percentage) {
  if (percentage >= 90) return 'A';
  if (percentage >= 75) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 45) return 'D';
  return 'F';
}

function normalizeMarks(marks = {}) {
  return {
    math: Number(marks.math) || 0,
    science: Number(marks.science) || 0,
    english: Number(marks.english) || 0,
    hindi: Number(marks.hindi) || 0,
    computer: Number(marks.computer) || 0,
  };
}

function buildSuggestionPrompt(studentName, marks, percentage, grade) {
  return `A student named ${studentName || 'the student'} scored ${percentage}% and received grade ${grade}. 
  Their marks are: Math ${marks.math}, Science ${marks.science}, English ${marks.english}, Hindi ${marks.hindi}, Computer ${marks.computer}. 
  For each subject, give one specific improvement tip, the best place or resource to study that subject, and one practical way to practice or review it. 
  Keep the tone friendly and encouraging, with clear steps for how to improve in every subject, where to study, and how to stay focused.`;
}

async function fetchAISuggestion(studentName, marks, percentage, grade) {
  if (!genAI) {
    console.log('No Gemini API key found, using fallback');
    return DEFAULT_AI_SUGGESTION;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(
      buildSuggestionPrompt(studentName, marks, percentage, grade)
    );
    const text = result?.response?.text?.();
    if (text) {
      console.log('✅ AI suggestion generated successfully');
      return text.trim();
    } else {
      console.log('No text in AI response, using fallback');
      return DEFAULT_AI_SUGGESTION;
    }
  } catch (error) {
    console.error('❌ AI suggestion error:', error?.message || error);
    return DEFAULT_AI_SUGGESTION;
  }
}

// Result API
app.post('/api/result', (req, res) => {
  const { studentName, marks } = req.body;
  const normalizedMarks = normalizeMarks(marks);
  const total = Object.values(normalizedMarks).reduce((sum, mark) => sum + mark, 0);
  const percentage = Number(((total / 500) * 100).toFixed(2));
  const grade = getGrade(percentage);

  res.json({
    studentName: studentName || 'Student',
    total,
    percentage,
    grade,
    marks: normalizedMarks,
  });
});

// AI Suggestion API
app.post('/api/suggestion', async (req, res) => {
  const { studentName, marks, percentage, grade } = req.body;
  const normalizedMarks = normalizeMarks(marks);
  const total = Object.values(normalizedMarks).reduce((sum, mark) => sum + mark, 0);
  const computedPercentage = Number(((total / 500) * 100).toFixed(2));
  const finalPercentage = typeof percentage === 'number' ? percentage : computedPercentage;
  const finalGrade = grade || getGrade(finalPercentage);

  const aiSuggestion = await fetchAISuggestion(
    studentName,
    normalizedMarks,
    finalPercentage,
    finalGrade
  );

  res.json({ aiSuggestion });
});

app.listen(5000, () => {
  console.log('✅ Server running on http://localhost:5000');
});
