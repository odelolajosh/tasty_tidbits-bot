const socket = io();

const chatBox = document.getElementById('chat-box');
const messageForm = document.getElementById('msg-form');

const scrollMessages = () => {
  if (chatBox.scrollHeight > window.innerHeight - 100) {
    window.scrollTo(0, chatBox.scrollHeight, { behavior: 'smooth' });
  }
}

const addBotMessage = ({ text, options }) => {
  if (!chatBox || !text) return;

  const chatEl = document.createElement('div');
  chatEl.classList.add('w-full', 'bg-sky-50/50', 'py-4');

  const chatInnerEl = document.createElement('div');
  chatInnerEl.classList.add('max-w-4xl', 'mx-auto', 'px-4', 'lg:px-0');

  const chatInnerText = document.createElement('pre');
  chatInnerText.classList.add('min-h-[40px]', 'text-base', 'font-mono', 'whitespace-pre-wrap');
  chatInnerText.innerHTML = text;
  chatInnerEl.appendChild(chatInnerText)

  if (options) {
    const optionsList = document.createElement('ul');
    optionsList.classList.add('my-4', 'text-base', 'flex', 'flex-col', 'gap-2');
    options.forEach((option) => {
      if (!option.text) return;
      const optionEl = document.createElement('li');
      optionEl.classList.add('cursor-pointer', 'inline', 'w-fit', 'font-mono', 'font-light', 'hover:underline', 'text-sm');
      if (option.value !== undefined) {
        optionEl.innerHTML = `${option.text} <img width="18" class="inline origin-center -rotate-45" src="/images/right.png" />`
        optionEl.addEventListener('click', () => {
          sendMessage(option.value)
        })
      } else {
        optionEl.innerHTML = option.text
      }
      optionsList.appendChild(optionEl);
      chatInnerEl.appendChild(optionsList);
    });
  }

  chatEl.appendChild(chatInnerEl);
  chatBox.appendChild(chatEl);
  scrollMessages();
}

const addSelfMessage = (message) => {
  if (!chatBox) return;
  const chatEl = document.createElement('div');
  chatEl.classList.add('w-full', 'py-4');
  chatEl.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 lg:px-0">
      <pre class="min-h-[40px] text-base font-mono whitespace-pre-wrap">${String(message).trim()}</pre>
    </div>
  `;
  chatBox.appendChild(chatEl);
  scrollMessages();
}

const sendMessage = (message) => {
  addSelfMessage(message);
  socket.emit('message', {
    text: message
  }, (response) => {
    if (response.ok) {
      messageForm.querySelector('input').value = '';
    }
  });
}

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('message', (message) => {
  console.log(message)
  if (message.type === 'bot') {
    addBotMessage(message);
  } else {
    addSelfMessage(message.text);
  }
});

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = e.target.elements.message.value;
  sendMessage(message);
});
