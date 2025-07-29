import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './style.css';
import App from './App';
import RedTeamPage from './RedTeamPage.jsx';
import AdminPage, { fetchDeployments } from './AdminPage';
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
      setStatus(`Signed in as ${name}!`);
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
        <Route path="/" element={<App fetchDeployments={fetchDeployments} {...sharedProps} />} />
        <Route path="/red-team" element={<RedTeamPage {...sharedProps} />} />
        <Route path="/admin" element={<AdminPage fetchDeployments={fetchDeployments} setStatus={setStatus} signedIn={signedIn} userName={userName} />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <MainRouter />
  </React.StrictMode>
);
