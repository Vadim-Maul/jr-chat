{
	const container = document.querySelector('.messages');

	function renderMessages(messages) {
		for (const message of messages) {
			const messageElement = document.createElement('article');
			messageElement.className = 'message';
			const hours = new Date(message.timestamp).getHours();
			const minutes = new Date(message.timestamp).getMinutes();
			messageElement.innerHTML = `
        <div class="message-author">${message.username}</div>
        <button class="message-control">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <p class="message-text">${message.text}</p>
        <time>${hours}:${minutes}</time>
      `;

			container.appendChild(messageElement);
		}
	}

	function initChat() {
		fetch('http://localhost:4000/messages', {
			method: 'GET',
		})
			.then(function (messagesResponse) {
				if (messagesResponse.status !== 200) {
					throw new Error("Couldn't get messages from server");
				}

				return messagesResponse.json();
			})
			.then(function (messagesList) {
				console.log(messagesList);
				renderMessages(messagesList);
			});
	}

	initChat();
}
