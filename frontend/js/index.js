document.addEventListener('DOMContentLoaded', () => {
	const container = document.querySelector('.messages');
	const dialogElement = document.querySelector('dialog');
	const editor = new EditorJS({
		holder: 'editorjs',
		tools: {
			header: Header,
			list: {
				class: EditorjsList,
				inlineToolbar: true,
				config: {
					defaultStyle: 'unordered',
				},
			},
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
				textInput.value = JSON.stringify(savedData);
				const text = textInput.value.trim();
				console.log('Содержимое редактора:', textInput.value);
				return;
				if (text.length < 2) {
					showDialog('Message is too short');
					return;
				}
				if (text.length > 400) {
					showDialog('Message is too long');
					return;
				}
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
			} catch (error) {
				console.error('Error in form submission:', error);
				showDialog('An error occurred while sending the message');
			}
			const text = textInput.value.trim();
		});
	}

	async function initializeChatApp() {
		startPolling();
		await setupFormHandlers();
	}

	initializeChatApp();
});
