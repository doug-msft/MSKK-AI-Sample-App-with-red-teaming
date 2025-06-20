import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
// Date helpers
function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}
function getFutureISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
import { useNavigate } from 'react-router-dom';
import './style.css';

import logoMain from './assets/Logo-mainpage.png';
import { handleChat, signIn, getIsSignedIn, getSignedInAccount, signOut, endpoints } from './azureOpenAI';



export default function App({ signedIn, userName, status, onSignIn, onSignOut, setStatus, selectedModel, setSelectedModel }) {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(getTodayISO());
  const [endDate, setEndDate] = useState(getFutureISO(5));
  const [history, setHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Ensure end date is never before start date
  const handleStartDateChange = (value) => {
    setStartDate(value);
    if (endDate < value) {
      setEndDate(value);
    }
  };
  const handleEndDateChange = (value) => {
    if (value < startDate) {
      setEndDate(startDate);
    } else {
      setEndDate(value);
    }
  };

  // onSignIn, onSignOut, status, signedIn, userName, setStatus are now passed as props

  const sendMessage = async () => {
    if (!userInput.trim() || loading || !selectedModel) return;
    // Compose the prompt with travel info
    const systemPrompt = `You are a helpful travel companion AI responsible for researching and providing customized travel information. Based on the traveler's specified location and travel dates, create a thoughtful and detailed itinerary, including activities, top attractions, dining recommendations, and local tips.\n\nUse the traveler’s preferences, if provided, to tailor the recommendations (e.g., focus on nature, history, food, adventure, etc.). If no preferences are given, include a variety of activities suitable for general travelers.\n\nFollow these steps:\n1. Understand Input: Extract the location (city, region, or country) and travel dates. If preferences or special requirements are provided, take note of these.\n2. Research and Recommendations:\n   - Attractions & Activities: Identify must-visit attractions, landmarks, or experiences unique to the location. Highlight seasonal activities, if applicable.\n   - Dining Options: Recommend popular restaurants, local cuisines, or food experiences. Include a range of options for various budgets.\n   - Local Events: If specific events or festivals are happening during the travel dates, include these details.\n   - Practical Information: Offer local tips, such as transportation options, best times to visit certain attractions, or cultural etiquette.\n3. Itinerary Creation: Based on the duration of travel:\n   - Create a day-by-day itinerary organized by time slots (morning, afternoon, evening) with suggested activities and locations.\n   - Ensure activities within a day are geographically convenient to minimize unnecessary travel time.\n   - Leave room for flexibility, such as downtime or optional experiences.\n4. Output Format: Present the information in a clear, structured format for easy readability.\n\nOutput Format:\n---\n### Destination: [Location]\n### Travel Dates: [Start Date] to [End Date]\n#### Summary:\n- Trip Duration: [Number of Days]\n- Traveler Preferences: [If provided]\n---\n### Itinerary:\n#### Day [1]: [Date]\n**Morning:**\n- [Activity/Attraction Name] - [Short description, if useful]\n- [Additional details such as entry fees or best visiting hours]\n**Afternoon:**\n- [Activity/Attraction Name]\n- [Recommended lunch spot: Name (Cuisine, price range, location)]\n**Evening:**\n- [Activity/Attraction Name]\n- [Recommended dinner spot: Name (Cuisine, price range, location)]\n#### Day [2]: [Date]\n(Repeat structure as needed)\n---\n### Key Recommendations:\n- Top Attractions: [Name 1, Name 2, etc.]\n- Dining Highlights: [Name 1, Name 2, etc.]\n- Events/Festivals (if applicable): [Name, date, and description of the event]\n- Practical Tips: [E.g., transportation advice, cultural etiquette, packing tips]\n---`;
    const travelInfo = `\n\n[Travel Info]\nDestination: ${destination || 'N/A'}\nStart Date: ${startDate || 'N/A'}\nEnd Date: ${endDate || 'N/A'}`;
    const fullPrompt = userInput + travelInfo;
    setHistory([...history, { role: 'user', content: fullPrompt }]);
    setLoading(true);
    setStatus('Thinking...');
    try {
      const selectedEndpoint = endpoints.find(endpoint => endpoint.modelName === selectedModel);
      const aiResponse = await handleChat(fullPrompt, systemPrompt, history, selectedEndpoint);
      setHistory(current => [...current, { role: 'assistant', content: aiResponse }]);
      setStatus('');
    } catch (err) {
      setStatus('Error: ' + (err.message || err));
    }
    setUserInput('');
    setLoading(false);
  };


  // Clear the chat history
  const handleClearChat = () => {
    setHistory([]);
  };

  // Copy latest AI response to clipboard
  const handleCopy = () => {
    const lastAI = [...history].reverse().find(m => m.role === 'assistant');
    if (lastAI) {
      navigator.clipboard.writeText(lastAI.content);
    }
  };

  // Export latest AI response to Word document
  const handleExport = () => {
    const lastAI = [...history].reverse().find(m => m.role === 'assistant');
    if (!lastAI) return;
    const html = `<html><head><meta charset='utf-8'></head><body>${lastAI.content.replace(/\n/g, '<br>')}</body></html>`;
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'itinerary.doc';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="trip-companion-container">
      {/* Sign in/out button at the top */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        {!signedIn ? (
          <button
            onClick={onSignIn}
            style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', cursor: 'pointer' }}
          >
            Sign in with Microsoft
          </button>
        ) : (
          <button
            onClick={onSignOut}
            style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', cursor: 'pointer' }}
          >
            Sign out
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <img src={logoMain} alt="Main Logo" className="logo" style={{ width: '100%', maxWidth: '100%', height: 'auto', maxHeight: 120, objectFit: 'cover', borderRadius: 12, background: 'transparent', boxShadow: 'none', marginBottom: 16 }} />
        <button
          style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', cursor: 'pointer', marginBottom: 16 }}
          onClick={() => navigate('/red-team')}
        >
          Go to Red Team Page
        </button>
        <div style={{ marginBottom: 16 }}>
          <strong>Select LLM Model:</strong>
          <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} style={{ marginLeft: 8, padding: '0.3rem 0.7rem', borderRadius: 6 }}>
            <option value="">-- Select a model --</option>
            <option value="o4-mini">o4-mini</option>
            <option value="model-router">model-router</option>
          </select>
        </div>
      </div>
      <p className="subtitle" style={{ margin: 0, marginTop: 8, marginBottom: 24, color: '#1976d2', fontSize: 14, fontWeight: 500, textAlign: 'center' }}>
        Find attractions, things to do, and plan your itinerary with AI!
        </p>

      {/* Travel Inputs */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Destination"
          value={destination}
          onChange={e => setDestination(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', minWidth: 140 }}
        />
        <input
          type="date"
          value={startDate}
          min={getTodayISO()}
          onChange={e => handleStartDateChange(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc' }}
        />
        <input
          type="date"
          value={endDate}
          min={startDate}
          onChange={e => handleEndDateChange(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc' }}
        />
      </div>
      <div className="chat-box">
        {history.length === 0 && (
          <div className="chat-message ai">Welcome! Sign in and start chatting with Azure OpenAI.</div>
        )}
        {history.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.role === 'user' ? 'user' : 'ai'}`}>
            {msg.role === 'user' ? (
              <>You: {msg.content}</>
            ) : (
              // Render AI response as markdown for formatting
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            )}
          </div>
        ))}
        {loading && (
          <div className="chat-message ai">
            <span className="ai-typing">AI is preparing a response...</span>
          </div>
        )}
      </div>
      {/* Clear/Copy/Export buttons */}
      <div style={{ display: 'flex', gap: 8, margin: '8px 0 16px 0' }}>
        <button onClick={handleClearChat} style={{ fontSize: 12, padding: '0.3rem 0.7rem', borderRadius: 6, border: '1px solid #bdbdbd', background: '#f5f5f5', color: '#333', cursor: 'pointer' }}>Clear Chat</button>
        <button onClick={handleCopy} style={{ fontSize: 12, padding: '0.3rem 0.7rem', borderRadius: 6, border: '1px solid #1976d2', background: '#e3f0fc', color: '#1976d2', cursor: 'pointer' }}>Copy response</button>
        <button onClick={handleExport} style={{ fontSize: 12, padding: '0.3rem 0.7rem', borderRadius: 6, border: '1px solid #388e3c', background: '#e8f5e9', color: '#388e3c', cursor: 'pointer' }}>Export to Word</button>
      </div>
      <div className="chat-input-row">
        <input
          type="text"
          placeholder={destination ? "Ask about this trip" : "Please enter a destination"}
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          onKeyDown={e => (e.key === 'Enter' && destination && sendMessage())}
          disabled={!signedIn || loading || !destination}
        />
        <button onClick={sendMessage} disabled={!signedIn || loading || !destination}>Send</button>
      </div>
      <div style={{ color: '#888', marginTop: 10 }}>{status}</div>
    </div>
  );
}
