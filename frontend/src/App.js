import React, { useState } from 'react';
import './App.css';

const formatSuggestionText = (text) => {
  if (!text) return null;

  const lines = text.split('\n');
  const renderedElements = [];
  let currentList = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
      const cleanLine = trimmed.replace(/^[\s*-]+/, '');
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const renderedLine = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.replace(/\*\*/g, '')}</strong>;
        }
        return part;
      });
      currentList.push(<li key={`li-${index}`}>{renderedLine}</li>);
    } else {
      if (currentList.length > 0) {
        renderedElements.push(<ul key={`ul-${index}`}>{currentList}</ul>);
        currentList = [];
      }
      if (trimmed === '') return;
      const parts = trimmed.split(/(\*\*.*?\*\*)/g);
      const renderedParagraph = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.replace(/\*\*/g, '')}</strong>;
        }
        return part;
      });
      renderedElements.push(<p key={`p-${index}`}>{renderedParagraph}</p>);
    }
  });

  if (currentList.length > 0) {
    renderedElements.push(<ul key="ul-trailing">{currentList}</ul>);
  }

  return renderedElements;
};

const gradeClass = (g) => {
  const map = { A: 'grade-a', B: 'grade-b', C: 'grade-c', D: 'grade-d', F: 'grade-f' };
  return map[g] || '';
};

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

    for (const [subject, val] of Object.entries(marks)) {
      const num = Number(val);
      if (isNaN(num) || num < 0 || num > 100) {
        return alert(`Please enter valid marks between 0 and 100 for ${subject.charAt(0).toUpperCase() + subject.slice(1)}!`);
      }
    }

    setLoading(true);
    setAiSuggestion('');
    setResult(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName, marks })
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to calculate result.');
      } else {
        const data = await response.json();
        setResult(data);
      }
    } catch (error) {
      alert('Error connecting to server! Make sure backend is running.');
    }
    setLoading(false);
  };

  const handleAISuggestion = async () => {
    if (!result) return;
    setAiLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/suggestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: result.studentName,
          marks: result.marks,
          percentage: result.percentage,
          grade: result.grade,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Error generating AI suggestion.');
      } else {
        const data = await response.json();
        setAiSuggestion(data.aiSuggestion || 'No suggestion available.');
      }
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

      <div className="masthead">
        <div className="masthead-seal">SR</div>
        <p className="masthead-eyebrow">Academic Record</p>
        <h1>Student Result Card</h1>
        <p className="masthead-sub">Enter marks to generate your result certificate</p>
      </div>

      <div className="form-card">
        <div className="name-field">
          <label>Student Name</label>
          <input
            type="text"
            placeholder="Full name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />
        </div>

        {['math', 'science', 'english', 'hindi', 'computer'].map((subject) => (
          <div className="field-row" key={subject}>
            <label>{subject.charAt(0).toUpperCase() + subject.slice(1)}</label>
            <div className="input-wrap">
              <input
                type="number"
                min="0"
                max="100"
                placeholder="—"
                value={marks[subject]}
                onChange={(e) => setMarks({ ...marks, [subject]: e.target.value })}
              />
              <span className="out-of">/ 100</span>
            </div>
          </div>
        ))}

        <div className="form-actions">
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Calculating…' : 'Get Result'}
          </button>
          <button className="btn-text" onClick={handleReset}>Reset</button>
        </div>
      </div>

      {result && (
        <div className="result-card">
          <p className="cert-eyebrow">Certificate of Result</p>
          <p className="cert-name">{result.studentName}</p>

          <div className={`grade-stamp ${gradeClass(result.grade)}`}>
            {result.grade}
            <span>Grade</span>
          </div>

          <div className="subject-table">
            {Object.entries(result.marks).map(([subject, mark]) => (
              <div key={subject} className="subject-row">
                <span>{subject.charAt(0).toUpperCase() + subject.slice(1)}</span>
                <span className="marks">{mark} / 100</span>
              </div>
            ))}
          </div>

          <div className="stats-row">
            <div className="stat">
              <div className="stat-value">{result.total}</div>
              <div className="stat-label">Total</div>
            </div>
            <div className="stat">
              <div className="stat-value">{result.percentage}%</div>
              <div className="stat-label">Percentage</div>
            </div>
            <div className="stat">
              <div className="stat-value">{result.grade}</div>
              <div className="stat-label">Grade</div>
            </div>
          </div>

          <button className="btn-outline" onClick={handleAISuggestion} disabled={aiLoading}>
            {aiLoading ? 'Generating remarks…' : '🤖 Get AI Suggestion'}
          </button>

          {aiSuggestion && (
            <div className="remarks-panel">
              <p className="remarks-eyebrow">AI Study Remarks</p>
              <div className="remarks-body">
                {formatSuggestionText(aiSuggestion)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
