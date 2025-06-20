import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './style.css';
import App from './App';
import RedTeamPage from './RedTeamPage.jsx';
import { signIn, signOut, getIsSignedIn, getSignedInAccount } from './azureOpenAI';

function MainRouter() {
  const [signedIn, setSignedIn] = useState(getIsSignedIn());
  const [userName, setUserName] = useState('');
  const [status, setStatus] = useState('Please sign in to start chatting.');
  const [selectedModel, setSelectedModel] = useState('');

  const onSignIn = async () => {
    setStatus('Signing in...');
    try {
      await signIn();
      setSignedIn(true);
      const account = getSignedInAccount();
      const name = account?.name || account?.username || '';
      setUserName(name);
      setStatus(`Signed in as ${name}! You can now chat.`);
    } catch (err) {
      setStatus('Sign-in failed: ' + (err.message || err));
    }
  };

  const onSignOut = async () => {
    await signOut();
    setSignedIn(false);
    setUserName('');
    setStatus('Signed out. Please sign in to start chatting.');
  };

  const sharedProps = {
    signedIn,
    userName,
    status,
    onSignIn,
    onSignOut,
    setStatus,
    selectedModel,
    setSelectedModel,
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App {...sharedProps} />} />
        <Route path="/red-team" element={<RedTeamPage {...sharedProps} />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <MainRouter />
  </React.StrictMode>
);
