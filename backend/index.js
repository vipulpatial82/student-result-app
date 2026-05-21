const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

console.log('🔑 Gemini Key Exists:', !!process.env.GEMINI_API_KEY);
console.log('🔑 Grok Key Exists:', !!process.env.GROK_API_KEY);

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

function validateMarks(marks) {
  const subjects = ['math', 'science', 'english', 'hindi', 'computer'];
  for (const subject of subjects) {
    const val = marks[subject];
    if (val === undefined || val === null || val === '') {
      return `Marks for ${subject} are required`;
    }
    const num = Number(val);
    if (isNaN(num) || num < 0 || num > 100) {
      return `Marks for ${subject} must be a number between 0 and 100`;
    }
  }
  return null;
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

async function fetchGrokSuggestion(studentName, marks, percentage, grade) {
  if (!process.env.GROK_API_KEY) {
    console.log('❌ No Grok API key found');
    return null;
  }

  console.log('🚀 Trying Grok API as fallback for', studentName);

  try {
    const prompt = buildSuggestionPrompt(
      studentName,
      marks,
      percentage,
      grade
    );

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-1',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Grok API Error:', response.status, error);
      return null;
    }

    const data = await response.json();

    if (data.choices && data.choices[0]?.message?.content) {
      console.log('✅ Grok Suggestion Generated Successfully');
      return data.choices[0].message.content.trim();
    }

    console.log('⚠️ Empty Grok response');
    return null;

  } catch (error) {
    console.error('❌ Grok API Error:', error.message || error);
    return null;
  }
}

async function fetchAISuggestion(studentName, marks, percentage, grade) {
  if (genAI) {
    console.log('🚀 Trying Gemini API for', studentName);
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = buildSuggestionPrompt(studentName, marks, percentage, grade);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text && text.trim()) {
        console.log('✅ Gemini Suggestion Generated Successfully');
        return text.trim();
      }
    } catch (error) {
      console.error('❌ Gemini API Error:', error.message || error);
    }
  }

  // Fallback to Grok
  const grokSuggestion = await fetchGrokSuggestion(studentName, marks, percentage, grade);
  if (grokSuggestion) {
    return grokSuggestion;
  }

  console.log('⚠️ Using default AI suggestion fallback');
  return DEFAULT_AI_SUGGESTION;
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

    const validationError = validateMarks(marks);
    if (validationError) {
      return res.status(400).json({
        error: validationError,
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

    console.log('Suggestion API called for', studentName, 'body:', JSON.stringify(req.body));

    if (!marks || typeof marks !== 'object') {
      return res.status(400).json({
        error: 'Marks are required',
      });
    }

    const validationError = validateMarks(marks);
    if (validationError) {
      return res.status(400).json({
        error: validationError,
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
