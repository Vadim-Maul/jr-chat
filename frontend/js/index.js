document.addEventListener('DOMContentLoaded', () => {
	const container = document.querySelector('.messages');

	function renderMessages(messages) {
		container.innerHTML = '';
		const pad = (num) => String(num).padStart(2, '0');
		for (const message of messages) {
			const messageElement = document.createElement('article');
			messageElement.className = 'message';

			const date = new Date(message.timestamp);
			const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

			messageElement.innerHTML = `
        <div class="message-author">${message.username}</div>
        <button class="message-control">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <p class="message-text">${message.text}</p>
        <time>${time}</time>
      `;

			container.appendChild(messageElement);
		}
	}

	async function getMessages() {
		try {
			const res = await fetch('http://localhost:4000/messages');
			if (!res.ok) throw new Error("Couldn't get messages");
			const messages = await res.json();
			renderMessages(messages);
		} catch (err) {
			console.error('Fetch messages error:', err);
		}
	}

	async function sendMessage(message) {
		try {
			const res = await fetch('http://localhost:4000/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(message),
			});
			if (res.status !== 201) throw new Error("Couldn't send message");
			await getMessages();
		} catch (err) {
			console.error('Send message error:', err);
		}
	}

	async function setupFormHandlers() {
		const form = document.querySelector('.footer-form');

		const textInput = form.querySelector('input[name="text"]');
		const formButton = form.querySelector('button[type="submit"]');

		form.addEventListener('submit', async (e) => {
			e.preventDefault();

			const text = textInput.value.trim();
			if (text.length < 2) return alert('Message is too short');
			if (text.length > 400) return alert('Message is too long');
			const formData = new FormData(form);
			const messageData = {
				username: formData.get('username'),
				text: formData.get('text'),
			};

			formButton.disabled = true;
			textInput.disabled = true;

			await sendMessage(messageData);

			textInput.value = '';
			textInput.disabled = false;
			formButton.disabled = false;

			textInput.focus();
		});
	}

	async function initializeChatApp() {
		await getMessages();
		await setupFormHandlers();
	}

	initializeChatApp();
});
