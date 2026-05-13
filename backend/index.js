const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

console.log('🔑 Gemini Key Exists:', !!process.env.GEMINI_API_KEY);

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const DEFAULT_AI_SUGGESTION = `
Math: Practice algebra daily on Khan Academy and solve at least 5 equations every day.

Science: Watch biology and physics videos on YouTube channels like Amoeba Sisters and Physics Wallah.

English: Improve vocabulary by reading articles and writing short summaries daily.

Hindi: Practice grammar exercises and read Hindi newspapers regularly.

Computer: Practice coding problems on LeetCode, HackerRank, and build small projects regularly.
`;

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
  return `
A student named ${studentName || 'the student'} scored ${percentage}% and received grade ${grade}.

Marks:
- Math: ${marks.math}
- Science: ${marks.science}
- English: ${marks.english}
- Hindi: ${marks.hindi}
- Computer: ${marks.computer}

For EACH subject:
1. Give one improvement tip
2. Suggest best study platform/resource
3. Give one practical revision method

Keep response motivational, simple, and student-friendly.
`;
}

async function fetchAISuggestion(studentName, marks, percentage, grade) {
  if (!genAI) {
    console.log('❌ No Gemini API key found');
    return DEFAULT_AI_SUGGESTION;
  }

  try {
    console.log('🚀 Starting Gemini Request');

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    const prompt = buildSuggestionPrompt(
      studentName,
      marks,
      percentage,
      grade
    );

    console.log('📄 Prompt Created');

    const result = await model.generateContent(prompt);

    console.log('✅ Gemini Response Received');

    const response = await result.response;

    const text = response.text();

    if (text) {
      console.log('✅ AI Suggestion Generated Successfully');
      return text.trim();
    }

    console.log('⚠️ Empty AI response, using fallback');

    return DEFAULT_AI_SUGGESTION;

  } catch (error) {
    console.error('❌ FULL AI ERROR:', error);
    return DEFAULT_AI_SUGGESTION;
  }
}

// ---------------- RESULT API ----------------

app.post('/api/result', (req, res) => {
  try {
    const { studentName, marks } = req.body;

    if (!marks || typeof marks !== 'object') {
      return res.status(400).json({
        error: 'Marks are required',
      });
    }

    const normalizedMarks = normalizeMarks(marks);

    const total = Object.values(normalizedMarks).reduce(
      (sum, mark) => sum + mark,
      0
    );

    const percentage = Number(((total / 500) * 100).toFixed(2));

    const grade = getGrade(percentage);

    res.json({
      studentName: studentName || 'Student',
      total,
      percentage,
      grade,
      marks: normalizedMarks,
    });

  } catch (error) {
    console.error('❌ Result API Error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
    });
  }
});

// ---------------- AI SUGGESTION API ----------------

app.post('/api/suggestion', async (req, res) => {
  try {
    const { studentName, marks, percentage, grade } = req.body;

    if (!marks || typeof marks !== 'object') {
      return res.status(400).json({
        error: 'Marks are required',
      });
    }

    const normalizedMarks = normalizeMarks(marks);

    const total = Object.values(normalizedMarks).reduce(
      (sum, mark) => sum + mark,
      0
    );

    const computedPercentage = Number(
      ((total / 500) * 100).toFixed(2)
    );

    const finalPercentage =
      typeof percentage === 'number'
        ? percentage
        : computedPercentage;

    const finalGrade = grade || getGrade(finalPercentage);

    const aiSuggestion = await fetchAISuggestion(
      studentName,
      normalizedMarks,
      finalPercentage,
      finalGrade
    );

    res.json({
      success: true,
      aiSuggestion,
    });

  } catch (error) {
    console.error('❌ Suggestion API Error:', error);

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
    });
  }
});

app.get('/', (req, res) => {
  res.send('✅ Backend Running Successfully');
});

app.listen(5000, () => {
  console.log('✅ Server running on http://localhost:5000');
});
