let conversationId = null;

const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const status = document.getElementById('status');

function appendMessage(sender, content) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'agent-message');
    messageDiv.textContent = content;
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function initConversation() {
    try {
        const response = await fetch('/v1/conversations', { method: 'POST' });
        const data = await response.json();
        conversationId = data.conversationId;
        status.textContent = 'Connected';
        status.style.color = '#4caf50';
        
        // Load history
        const historyResponse = await fetch(`/v1/history/${conversationId}`);
        const history = await historyResponse.json();
        history.forEach(msg => {
            appendMessage(msg.sender, msg.content);
        });
    } catch (error) {
        console.error('Failed to initialize conversation:', error);
        status.textContent = 'Connection Error';
        status.style.color = '#f44336';
    }
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message || !conversationId) return;

    userInput.value = '';
    appendMessage('user', message);

    sendBtn.disabled = true;

    try {
        const response = await fetch(`/v1/chat/${conversationId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        
        if (data.response) {
            appendMessage('agent', data.response);
        } else if (data.error) {
            appendMessage('agent', `Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Failed to send message:', error);
        appendMessage('agent', 'Error: Failed to communicate with server.');
    } finally {
        sendBtn.disabled = false;
    }
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

initConversation();
