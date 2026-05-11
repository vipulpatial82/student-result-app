import React, { useState } from 'react';
import './App.css';

function App() {
  const [studentName, setStudentName] = useState('');
  const [marks, setMarks] = useState({
    math: '', science: '', english: '', hindi: '', computer: ''
  });
  const [result, setResult] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleSubmit = async () => {
    if (!studentName) return alert('Please enter student name!');
    const allFilled = Object.values(marks).every(m => m !== '');
    if (!allFilled) return alert('Please enter all subject marks!');

    setLoading(true);
    setAiSuggestion('');
    setResult(null);

    try {
      const response = await fetch('http://localhost:5000/api/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName, marks })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      alert('Error connecting to server! Make sure backend is running.');
    }
    setLoading(false);
  };

  const handleAISuggestion = async () => {
    if (!result) return;
    setAiLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: result.studentName,
          marks: result.marks,
          percentage: result.percentage,
          grade: result.grade,
        }),
      });

      const data = await response.json();
      setAiSuggestion(data.aiSuggestion || 'No suggestion available.');
    } catch (error) {
      alert('Error generating AI suggestion. Please try again.');
    }

    setAiLoading(false);
  };

  const handleReset = () => {
    setStudentName('');
    setMarks({ math: '', science: '', english: '', hindi: '', computer: '' });
    setResult(null);
    setAiSuggestion('');
  };

  return (
    <div className="app">
      <h1>🎓 Student Result Card</h1>

      <div className="form-card">
        <input
          type="text"
          placeholder="Enter Student Name"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
        />

        {['math', 'science', 'english', 'hindi', 'computer'].map((subject) => (
          <input
            key={subject}
            type="number"
            min="0"
            max="100"
            placeholder={`Enter ${subject.charAt(0).toUpperCase() + subject.slice(1)} marks (out of 100)`}
            value={marks[subject]}
            onChange={(e) => setMarks({ ...marks, [subject]: e.target.value })}
          />
        ))}

        <button onClick={handleSubmit} disabled={loading}>
          {loading ? '⏳ Calculating...' : '🎯 Get Result'}
        </button>

        <button className="reset-button" onClick={handleReset}>
          🔄 Reset
        </button>
      </div>

      {result && (
        <div className="result-card">
          <h2>📋 Result Card</h2>
          <p><strong>Name:</strong> {result.studentName}</p>
          <p><strong>Total:</strong> {result.total} / 500</p>
          <p><strong>Percentage:</strong> {result.percentage}%</p>
          <p><strong>Grade:</strong> <span className={`grade ${result.grade}`}>{result.grade}</span></p>

          <div className="subjects">
            <h3>📚 Subject Wise Marks</h3>
            {Object.entries(result.marks).map(([subject, mark]) => (
              <div key={subject} className="subject-row">
                <span>{subject.charAt(0).toUpperCase() + subject.slice(1)}</span>
                <span>{mark} / 100</span>
              </div>
            ))}
          </div>

          <button className="ai-button" onClick={handleAISuggestion} disabled={aiLoading}>
            {aiLoading ? ' Generating AI suggestion...' : '🤖 Get AI Suggestion'}
          </button>

          {aiSuggestion && (
            <div className="ai-suggestion">
              <h3>🤖 AI Study Suggestion</h3>
              <p>{aiSuggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
