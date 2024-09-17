const messageBar = document.querySelector(".bar-wrapper input");
const sendBtn = document.querySelector(".bar-wrapper button");
const messageBox = document.querySelector(".message-box");
let selectedFile = null;  // Store the selected file
const fileInput = document.getElementById('file-upload');
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=YOUR_API_KEY";

// Voice recognition
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.continuous = false;
recognition.interimResults = false;

const voiceBtn = document.createElement('button');
voiceBtn.innerHTML = ' <span class="voicebutton"> <img alt="" class="inputboxmic" src="micphoto.png"></span>';
voiceBtn.title = 'Click to start voice input';
document.querySelector('.voicebutton').appendChild(voiceBtn);

// Start voice recognition when voice button is clicked
voiceBtn.onclick = () => {
     recognition.start();
};

// Capture the voice input and place it in the message bar
recognition.onresult = (event) => {
     const voiceMessage = event.results[0][0].transcript;
     messageBar.value = voiceMessage;
};

recognition.onerror = (event) => {
     console.error("Voice recognition error: ", event.error);
};

// Voice synthesis for bot responses
// function speak(text) {
//      const utterance = new SpeechSynthesisUtterance(text);
//      utterance.lang = 'en-US';
//      speechSynthesis.speak(utterance);
// }

// File input event listener to capture the file
fileInput.addEventListener('change', (event) => {
     selectedFile = event.target.files[0];

     if (selectedFile) {
          const fileMessage = `<div class="chatmessage"> 
            <span class="message-text">File attached: ${selectedFile.name}</span>            
        </div>
        <br>`;
          messageBox.insertAdjacentHTML("beforeend", fileMessage);
     }
});

// Send message event listener
sendBtn.onclick = function () {
     if (messageBar.value.length > 0 || selectedFile) {
          const UserTypedMessage = messageBar.value;
          messageBar.value = "";

          let message =
               `<div class="chatmessage"> 
            <span class="message-text">${UserTypedMessage}</span>
            <div class="message-options">
                <button class="edit-button">
                    <img alt="" class="editiconresponseuser" src="editicon.png">Edit</button>
                <button class="copy-button">
                    <img alt="" class="copyiconresponseuser" src="copyicon.png">Copy</button>                    
            </div>
            <img alt="" class="chatimguser" src="usericon.png">
        </div>`;

          let response =
               `<img alt="" class="chatimgbot" src="chatbot.webp"> 
            <div class="chatresponse response chatresponseforcopy">
                <span class="new">...</span> 
                <br>
                <button class="copy-button copy-buttonbot">
                    <img alt="" class="copyiconresponsebot" src="copyicon.png">Copy</button> 
            </div>
            <br>`;

          messageBox.insertAdjacentHTML("beforeend", message);

          setTimeout(() => {
               messageBox.insertAdjacentHTML("beforeend", response);

               // Create form data to send the file and message
               const formData = new FormData();
               formData.append('message', UserTypedMessage);
               if (selectedFile) {
                    formData.append('file', selectedFile);
               }

               const requestOptions = {
                    method: "POST",
                    headers: {
                         "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                         contents: [{ "parts": [{ "text": UserTypedMessage }] }]
                    })
               };

               const requestOptionsfile = {
                    method: "POST",
                    body: formData // Using FormData to handle both text and file upload
               };

               fetch(API_URL, requestOptions, requestOptionsfile).then(res => res.json()).then(data => {
                    const ChatBotResponse = document.querySelector(".response .new");
                    const botReply = data.candidates[0].content.parts[0].text;
                    ChatBotResponse.innerHTML = botReply;
                    ChatBotResponse.classList.remove("new");

                    // Call copy/edit event handlers
                    setupMessageOptions();

                    // Speak the bot's response
                    speak(botReply);
               }).catch((error) => {
                    const ChatBotResponse = document.querySelector(".response .new");
                    ChatBotResponse.innerHTML = "Oops! An error occurred. Please try again.";
                    console.error("Error:", error);
               });
          }, 100);

          // Reset the file input and selectedFile after sending
          fileInput.value = "";
          selectedFile = null;
     }
};

// Function to add copy and edit functionality to messages
function setupMessageOptions() {
     // Handle copy functionality
     const copyButtons = document.querySelectorAll(".copy-button");
     copyButtons.forEach(button => {
          button.addEventListener("click", function () {
               const messageText = this.closest(".chatmessage, .chatresponse").querySelector("span").textContent;
               navigator.clipboard.writeText(messageText).then(() => {
                    alert("Message copied to clipboard!");
               }).catch(err => {
                    console.error("Error copying text: ", err);
               });
          });
     });

     // Handle edit functionality
     const editButtons = document.querySelectorAll(".edit-button");
     editButtons.forEach(button => {
          button.addEventListener("click", function () {
               const messageSpan = this.closest(".chatmessage").querySelector("span");
               const newText = prompt("Edit your message:", messageSpan.textContent);
               if (newText !== null && newText.trim() !== "") {
                    messageSpan.textContent = newText;
               }
          });
     });
}

// Initialize once the page loads
setupMessageOptions();

// Send message when the "Enter" key is pressed 
messageBar.addEventListener("keypress", function (event) {
     if (event.key === "Enter") {
          sendBtn.click();
     }
});

fileInput.addEventListener("keypress", function (event) {
     if (event.key === "Enter") {
          sendBtn.click();
     }
});

voiceBtn.addEventListener("keypress", function (event) {
     if (event.key === "Enter") {
          sendBtn.click();
     }
});