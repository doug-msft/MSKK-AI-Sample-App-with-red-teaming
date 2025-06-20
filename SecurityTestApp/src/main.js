

import { handleChat, signIn, getIsSignedIn } from './azureOpenAI.js';


const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const statusDiv = document.getElementById('status');
const signinBtn = document.getElementById('signin-btn');

// Disable chat form until signed in
chatForm.querySelector('button[type="submit"]').disabled = true;
chatInput.disabled = true;
statusDiv.textContent = 'Please sign in to start chatting.';

signinBtn.addEventListener('click', async () => {
  statusDiv.textContent = 'Signing in...';
  signinBtn.disabled = true;
  try {
    await signIn();
    chatForm.querySelector('button[type="submit"]').disabled = false;
    chatInput.disabled = false;
    statusDiv.textContent = 'Signed in! You can now chat.';
    signinBtn.style.display = 'none';
  } catch (err) {
    statusDiv.textContent = 'Sign-in failed: ' + (err.message || err);
    signinBtn.disabled = false;
  }
});



let history = [];

function appendMessage(role, content) {
  const msgDiv = document.createElement('div');
  msgDiv.textContent = `${role === 'user' ? 'You' : 'AI'}: ${content}`;
  msgDiv.style.marginBottom = '8px';
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!getIsSignedIn()) {
    statusDiv.textContent = 'Please sign in first.';
    return;
  }
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;
  appendMessage('user', userMessage);
  history.push({ role: 'user', content: userMessage });
  chatInput.value = '';
  statusDiv.textContent = 'Thinking...';
  try {
    const aiResponse = await handleChat(userMessage, history);
    appendMessage('assistant', aiResponse);
    history.push({ role: 'assistant', content: aiResponse });
    statusDiv.textContent = '';
  } catch (err) {
    statusDiv.textContent = 'Error: ' + (err.message || err);
  }
});
