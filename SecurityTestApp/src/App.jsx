import React, { useState, useEffect } from 'react';
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
import { handleChat, signIn, getIsSignedIn, getSignedInAccount, signOut, Deployed_LLM_model_endpoints, accessToken } from './azureOpenAI';
import config from './config';
import { AZURE_PROJECTS } from './config';
import { fetchDeployments } from './AdminPage';

const systemPrompt = `You are a helpful travel companion AI responsible for researching and providing customized travel information. Based on the traveler's specified location and travel dates, create a thoughtful and detailed itinerary, including activities, top attractions, dining recommendations, and local tips.`;

const Default_Azure_Endpoint = AZURE_PROJECTS[0].endpoint;

export default function App({ signedIn, userName, status, onSignIn, onSignOut, setStatus, selectedModel, setSelectedModel }) {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(getTodayISO());
  const [endDate, setEndDate] = useState(getFutureISO(5));
  const [history, setHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
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
    const travelInfo = `\n\n[Travel Info]\nDestination: ${destination || 'N/A'}\nStart Date: ${startDate || 'N/A'}\nEnd Date: ${endDate || 'N/A'}`;
    const fullPrompt = userInput + travelInfo;
    const lastMessage = { role: 'user', content: fullPrompt };

    // Prevent duplicate messages
    if (history.length > 0 && history[history.length - 1].content === fullPrompt) {
      console.warn('Duplicate message detected, not sending again.');
      return;
    }

    const newHistory = [...history, lastMessage];
    setHistory(newHistory);
    setLoading(true);
    setStatus('Thinking...');
    try {
      console.log('[MainApp] Sending to OpenAI:', fullPrompt);
      const selectedEndpoint = Deployed_LLM_model_endpoints.find(endpoint => endpoint.name === selectedModel);
      console.log('[MainApp] Selected Endpoint:', selectedEndpoint);

      if (!selectedEndpoint || !selectedEndpoint.endpoint_url) {
        throw new Error('Selected endpoint is undefined or missing endpoint_url.');
      }
      const aiResponse = await handleChat(fullPrompt, systemPrompt, [lastMessage], {
        endpoint_url: selectedEndpoint.endpoint_url,
        name: selectedEndpoint.name,
        api_version: selectedEndpoint.api_version || '2025-01-01-preview',
        modelPublisher: selectedEndpoint.modelPublisher,
      });
      setHistory(current => [...current, { role: 'assistant', content: aiResponse }]);
      setStatus('');
    } catch (err) {
      console.error('[MainApp] OpenAI error:', err);
      let errorMsg = 'There was an error connecting to the AI service.';
      if (err && typeof err === 'object') {
        let code = err.code || (err.error && err.error.code);
        let message = err.error && err.error.message;
        let filterResult = err.error && err.error.innererror && err.error.innererror.content_filter_result;
        if (code || filterResult || message) {
          errorMsg += message ? `\n\n**Error message:**\n${message}` : '';
          errorMsg += code ? `\n\n**Error code:** \`${code}\`` : '';
          if (filterResult && typeof filterResult === 'object') {
            const filteredDetails = Object.entries(filterResult)
              .filter(([cat, val]) => val && val.filtered)
              .map(([cat, val]) => {
                const detected = val.detected !== undefined ? `Detected: **${val.detected}**` : '';
                return `Detection: **${cat}**\nFiltered: **${val.filtered}**\n${detected}`;
              });
            if (filteredDetails.length > 0) {
              errorMsg += `\n\n**Filtered Details:**\n\n${filteredDetails.join('\n')}`;
            }
          }
        } else {
          errorMsg += (err.error && err.error.message ? `\n\n**Error message:**\n${err.error.message}` : '');
          errorMsg += `\n\n**Error object:**\n\u007f${JSON.stringify(err, null, 2)}`;
        }
      } else {
        errorMsg += (err ? `\n\n**Error:** ${err}` : '');
      }
      setHistory(current => [
        ...current,
        {
          role: 'assistant',
          content: errorMsg
        }
      ]);
      setStatus('Error: ' + (err.message || err));
    }
    setUserInput('');
    setLoading(false);
  };

  const stopMessage = () => {
    setLoading(false);
    setStatus('');
    console.warn('OpenAI call stopped by user.');
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

  const handleModelChange = (e) => {
    const selectedDeployment = e.target.value;
    const selectedEndpoint = Deployed_LLM_model_endpoints.find(endpoint => endpoint.name === selectedDeployment);
    setSelectedModel(selectedDeployment);
    console.log('Selected Endpoint:', selectedEndpoint);

    // Interrupt the API call if ongoing
    if (loading) {
      setLoading(false);
      setStatus('');
      console.warn('OpenAI call interrupted due to model change.');
    }

    // Clear the chat history
    setHistory([]);

    // Add a message to the chat history indicating the selected model
    setHistory(current => [
      ...current,
      {
        role: 'system',
        content: `Model selected: ${selectedDeployment}`
      }
    ]);
  };

  const handleProjectChange = (event) => {
    setSelectedProject(event.target.value);
    console.log('Selected Project:', event.target.value);
  };

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (signedIn) {
        try {
          const { status, data } = await fetchDeployments(Default_Azure_Endpoint);
          console.log('Fetch Deployments Response Status:', status);
          if (status === 200) {
            setIsAdmin(true);
            console.log('Admin status confirmed:', data);
          } else {
            setIsAdmin(false);
            console.warn('Admin status denied with status:', status);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      }
    };
    checkAdminStatus();
  }, [signedIn, selectedModel]);

  /*const fetchDeployments = async () => {
    let response;
    try {
      const { accessTokenAI } = await obtainMultipleTokens();
      const resourcename = config.AZURE_AI_PROJECT_NAME || 'travelcompanionai'; // Fallback to default if not set
      const resource = `${resourcename}-resource`; // Set resource using resourcename
      const endpoint = `https://${resource}.services.ai.azure.com/api/projects/${resourcename}/deployments?api-version=v1`;
      console.log('Using endpoint:', endpoint);
      response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${accessTokenAI}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          console.error(`Unauthorized access to endpoint: ${endpoint}`);
          setStatus(`Unauthorized access to endpoint. Make sure the user has permission`);
        } else if (response.status === 403) {
          console.error(`Access denied to endpoint: ${endpoint}`);
        }
        throw new Error(`Failed to fetch deployments: ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format: Expected JSON');
      }
      const deployments = await response.json();
      console.log('Deployments:', deployments);
      return deployments;
    } catch (error) {
      console.error('Error fetching deployments:', error);
      setStatus(`Error fetching deployments: ${error.message}`);
      if (response && error.message.includes('Invalid response format')) {
        console.error('Response body:', await response.text());
      }
      throw error;
    }
  };*/

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
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <button
            style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', cursor: 'pointer' }}
            onClick={() => navigate('/red-team')}
          >
            Go to Red Team Page
          </button>
          {signedIn && isAdmin && (
            <button
              style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', cursor: 'pointer' }}
              onClick={() => navigate('/admin', { state: { signedIn } })}
            >
              Go to Admin Page
            </button>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <strong>Select LLM Model:</strong>
          <select value={selectedModel} onChange={handleModelChange} style={{ marginLeft: 8, padding: '0.3rem 0.7rem', borderRadius: 6 }}>
            <option value="">-- Select a model --</option>
            {Deployed_LLM_model_endpoints.map((endpoint, idx) => (
              <option key={idx} value={endpoint.name}>{endpoint.name}</option>
            ))}
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
          style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', minWidth: 140, backgroundColor: selectedModel ? 'white' : '#f0f0f0' }}
          disabled={!selectedModel}
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
      <div className="chat-box" style={{ opacity: selectedModel ? 1 : 0.5, pointerEvents: selectedModel ? 'auto' : 'none' }}>
        {history.length === 0 && (
          <div className="chat-message ai">Welcome! Sign in and select the LLM model to start chatting.</div>
        )}
        {signedIn && userName && history.length === 0 && (
          <div className="chat-message ai">Hi {userName}, how can I help you with your next adventure?</div>
        )}
        {history.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.role === 'user' ? 'user' : msg.role === 'system' ? 'system' : 'ai'}`} style={msg.role === 'system' ? { backgroundColor: '#e0e0e0', padding: '0.5rem', borderRadius: '6px' } : {}}>
            {msg.role === 'user' ? (
              <>
                You: {msg.content.split('[Travel Info]')[0]}
                {msg.content.includes('[Travel Info]') && (
                  <div style={{ fontStyle: 'italic', color: 'gray' }}>
                    [Travel Info]{msg.content.split('[Travel Info]')[1]}
                  </div>
                )}
              </>
            ) : msg.role === 'system' ? (
              msg.content
            ) : (
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
          disabled={!signedIn || loading || !destination || !selectedModel}
        />
        <button onClick={sendMessage} disabled={!signedIn || loading || !destination || !selectedModel}>Send</button>
      </div>
      <div style={{ color: '#888', marginTop: 10 }}>
        {status}
        {loading && (
          <button
            onClick={stopMessage}
            style={{ marginLeft: 8, padding: '0.3rem 0.7rem', borderRadius: 6, border: '1px solid #d32f2f', background: '#fbe9e7', color: '#d32f2f', cursor: 'pointer' }}
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}
