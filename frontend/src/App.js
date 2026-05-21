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
      
      if (trimmed === '') {
        return;
      }
      
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
      const response = await fetch('http://localhost:5000/api/result', {
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
              <div className="ai-suggestion-content">
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
