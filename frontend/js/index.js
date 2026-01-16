document.addEventListener('DOMContentLoaded', () => {
	const USERNAME_REC = 'username';

	const container = document.querySelector('.messages');
	const userNameContainer = document.querySelector('.dialog--username');
	const dialogElement = document.querySelector('dialog--message');
	const logoutButton = document.querySelector('.header__action--btn');
	const editor = new EditorJS({
		holder: 'editorjs',
		tools: {
			header: Header,
			inlineCode: InlineCode,
			paragraph: {
				class: Paragraph,
				inlineToolbar: true,
			},
		},
		placeholder: 'Type your message here...',
	});
	const state = {
		polling: false,
		isRequestInProgress: false,
		username: null,
	};

	async function poll() {
		while (state.polling) {
			await getMessages();
			await new Promise((resolve) => setTimeout(resolve, 3000));
		}
	}

	function startPolling() {
		if (!state.polling) {
			state.polling = true;
			poll();
		}
	}

	function stopPolling() {
		state.polling = false;
	}

	function validateMessage(message) {
		if (message.length < 2) {
			return false;
		}
		if (message.length > 400) {
			return false;
		}
		return true;
	}

	function renderMessages(messages) {
		container.innerHTML = '';
		const pad = (num) => String(num).padStart(2, '0');
		for (const message of messages) {
			const messageElement = document.createElement('article');
			messageElement.className = 'message';
			messageElement.setAttribute('data-id', message.id);
			messageElement.classList.toggle(
				'message-mine',
				state.username === message.username
			);
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
		if (state.isRequestInProgress) return;
		state.isRequestInProgress = true;
		try {
			const res = await fetch('http://localhost:4000/messages');
			if (!res.ok) throw new Error("Couldn't get messages");
			const messages = await res.json();
			renderMessages(messages);
		} catch (err) {
			console.error('Fetch messages error:', err);
		} finally {
			state.isRequestInProgress = false;
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

	function initUsername() {
		const form = userNameContainer.querySelector('form');
		form.onsubmit = async function (e) {
			e.preventDefault();
			const formEl = e.target;
			const formData = new FormData(formEl);
			const username = formData.get('username').trim();
			if (username.length < 2 || username.length > 20) {
				form.querySelector('.error').textContent =
					'Username must be between 2 and 20 characters';
				return;
			}
			localStorage.setItem(USERNAME_REC, username);
			userNameContainer.close();
			form.querySelector('.error').textContent = '';
			form.onsubmit = null;
			await initializeChatApp();
		};

		userNameContainer.showModal();
	}
	function showDialog(message) {
		dialogElement.querySelector('p').textContent =
			message || 'Please enter a valid message';
		dialogElement.showModal();
		dialogElement.querySelector('button').addEventListener('click', () => {
			dialogElement.close();
		});
	}

	async function setupFormHandlers() {
		const form = document.querySelector('.footer-form');
		const userNameField = form.querySelector('input[name="username"]');
		userNameField.value = state.username;
		const emojiPicker = form.querySelector('emoji-picker');
		const emojiBtn = form.querySelector('.emoji-button');

		emojiBtn.addEventListener('click', () => {
			emojiPicker.toggleAttribute('open');
		});
		emojiPicker.addEventListener('emoji-click', (e) => {
			const emoji = e.detail.unicode;
			editor.blocks.insert('paragraph', { text: emoji });
		});

		const textInput = form.querySelector('input[name="text"]');
		const formButton = form.querySelector('button[type="submit"]');

		form.addEventListener('submit', async (e) => {
			e.preventDefault();
			try {
				const savedData = await editor.save();
				const text = savedData.blocks
					.map((block) => block.data.text)
					.join('<br>');
				text.trim();
				if (!validateMessage(text)) {
					showDialog('Please enter a valid message');
					return;
				}
				textInput.value = text;
				const formData = new FormData(form);
				const messageData = {
					username: formData.get('username'),
					text: formData.get('text'),
				};
				formButton.disabled = true;
				await sendMessage(messageData);
				formButton.disabled = false;
				editor.clear();
			} catch (error) {
				console.error('Error in form submission:', error);
				showDialog('An error occurred while sending the message');
			}
			const text = textInput.value.trim();
		});
	}

	async function initChat() {
		startPolling();
		await setupFormHandlers();
	}
	function logoutHandler() {
		localStorage.removeItem(USERNAME_REC);
		stopPolling();
		window.location.reload();
	}
	async function initializeChatApp() {
		state.username = localStorage.getItem(USERNAME_REC);
		if (!state.username) {
			initUsername(state.username);
			return;
		}
		logoutButton.onclick = logoutHandler;
		await initChat();
	}

	initializeChatApp();
});
