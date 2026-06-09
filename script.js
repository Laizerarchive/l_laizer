import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    serverTimestamp,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAC5ulcLBtrRbmQ4deK1HTOQ5LPSbR7-78",
  authDomain: "laizer-e5803.firebaseapp.com",
  projectId: "laizer-e5803",
  storageBucket: "laizer-e5803.firebasestorage.app",
  messagingSenderId: "719956823015",
  appId: "1:719956823015:web:cd83b1536824c8127a0b42",
  measurementId: "G-6L04YDQTRR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag]));
}

function makeDraggable(element) {
    const titleBar = element.querySelector('.title-bar');
    if (!titleBar) return;

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    titleBar.addEventListener('mousedown', (e) => {
        isDragging = true;

        const rect = element.getBoundingClientRect();
        element.style.transform = 'none';
        element.style.left = `${rect.left}px`;
        element.style.top = `${rect.top}px`;

        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        const allWindows = document.querySelectorAll('.window');
        let maxZ = 0;

        allWindows.forEach(w => {
            const z = parseInt(w.style.zIndex || 0);
            if (z > maxZ) maxZ = z;
        });

        element.style.zIndex = maxZ + 1;
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            element.style.left = `${e.clientX - offsetX}px`;
            element.style.top = `${e.clientY - offsetY}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');

    // ========== INDEX PAGE (SMS Chat Input) ==========
    const sendBtn = document.getElementById('sendBtn');
    const dreamInput = document.getElementById('dreamInput');
    const inputWindow = document.getElementById('inputWindow');
    const smsMessages = document.getElementById('smsMessages');

    if (sendBtn && dreamInput && inputWindow && smsMessages) {
        console.log('Index SMS chat page detected');
        dreamInput.focus();

        sendBtn.addEventListener('click', async () => {
            const text = dreamInput.value.trim();

            if (!text) {
                alert("Please enter your dream.");
                return;
            }

            // Add message to chat immediately
            const messageBubble = document.createElement('div');
            messageBubble.className = 'sms-bubble sent';
            messageBubble.innerHTML = `<p>${escapeHTML(text)}</p>`;
            smsMessages.appendChild(messageBubble);
            smsMessages.scrollTop = smsMessages.scrollHeight;

            const loadingContainer = document.getElementById('loadingContainer');
            const loadingBar = document.getElementById('loadingBar');
            const sendBtnContainer = document.getElementById('sendBtnContainer');

            sendBtnContainer.style.display = 'none';
            loadingContainer.style.display = 'block';

            let progress = 0;

            const interval = setInterval(async () => {
                progress += Math.random() * 20;

                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);

                    try {
                        await addDoc(collection(db, "dreams"), {
                            text: text,
                            createdAt: serverTimestamp()
                        });

                        console.log('Message sent successfully');
                        dreamInput.value = '';

                        setTimeout(() => {
                            window.location.href = "archive.html";
                        }, 1000);
                    } catch (error) {
                        console.error("Error adding dream:", error);
                        alert("Message was not sent. Please try again.");
                        loadingContainer.style.display = 'none';
                        sendBtnContainer.style.display = 'flex';
                    }
                }

                loadingBar.style.width = `${progress}%`;
            }, 100);
        });

        makeDraggable(inputWindow);
    }

    // ========== ARCHIVE PAGE (Dreams Display as SMS bubbles above player) ==========
    const archiveContainer = document.getElementById('dreamsArchiveContainer');

    if (archiveContainer) {
        console.log('Archive page detected');

        function createSmsChatWindow(dreams) {
            if (dreams.length === 0) return;

            const chatWindow = document.createElement('div');
            chatWindow.className = 'window sms-archive-window';
            chatWindow.style.cssText = 'position: fixed; top: 80px; left: 50%; transform: translateX(-50%); z-index: 500; width: 400px; height: 300px; max-height: calc(50% - 400px);';

            const titleBar = document.createElement('div');
            titleBar.className = 'title-bar';
            titleBar.innerHTML = `
                <div class="title-bar-text">💬 All Dreams</div>
                <div class="title-bar-controls">
                    <button aria-label="Close" class="close-btn"></button>
                </div>
            `;

            const chatBody = document.createElement('div');
            chatBody.style.cssText = 'flex: 1; overflow-y: auto; padding: 10px; background: #c0c0c0; border: inset 2px #dfdfdf; display: flex; flex-direction: column; gap: 8px;';

            dreams.forEach(dream => {
                const bubble = document.createElement('div');
                bubble.className = 'sms-bubble received';
                bubble.innerHTML = `<p>${escapeHTML(dream.text)}</p>`;
                chatBody.appendChild(bubble);
            });

            chatWindow.appendChild(titleBar);
            chatWindow.appendChild(chatBody);

            const closeBtn = chatWindow.querySelector('.close-btn');
            closeBtn.addEventListener('click', () => {
                chatWindow.style.display = 'none';
            });

            makeDraggable(chatWindow);
            archiveContainer.appendChild(chatWindow);
        }

        // Load dreams
        const q = query(collection(db, "dreams"), orderBy("createdAt", "desc"));
        let allDreams = [];

        onSnapshot(q, (snapshot) => {
            allDreams = [];
            console.log('Dreams loaded:', snapshot.docs.length);

            snapshot.forEach((docItem) => {
                const data = docItem.data();
                allDreams.push({
                    text: data.text || ''
                });
            });

            // Remove old chat window if exists
            const oldWindow = archiveContainer.querySelector('.sms-archive-window');
            if (oldWindow) oldWindow.remove();

            // Create new one with updated dreams
            if (allDreams.length > 0) {
                createSmsChatWindow(allDreams);
            }
        }, (error) => {
            console.error("Error loading dreams:", error);
        });
    }

    // ========== AUDIO PLAYER (Archive Page) ==========
    const audioPlayerContainer = document.getElementById('audioPlayerContainer');
    const audioPlayer = document.getElementById('mainAudioPlayer');
    const btnPlay = document.getElementById('btnPlay');
    const btnPause = document.getElementById('btnPause');
    const btnStop = document.getElementById('btnStop');
    const progressBar = document.getElementById('range2');
    const audioDisplay = document.getElementById('audioDisplay');
    const listenBtn = document.getElementById('listenBtn');
    const platformLinks = document.getElementById('platformLinks');
    const socialBtn =
  document.getElementById("socialBtn");

const socialLinks =
  document.getElementById("socialLinks");

    if (audioPlayerContainer) {
        console.log('Audio player found');
        makeDraggable(audioPlayerContainer);
    }

    if (audioPlayer && btnPlay && btnPause && btnStop && progressBar) {
        console.log('Setting up audio controls');

        audioPlayer.addEventListener('loadedmetadata', () => {
            if (audioDisplay) {
                audioDisplay.textContent = `00:00 / ${formatTime(audioPlayer.duration)}`;
            }
        });

        btnPlay.addEventListener('click', () => {
            audioPlayer.play();
        });

        btnPause.addEventListener('click', () => {
            audioPlayer.pause();
        });

        btnStop.addEventListener('click', () => {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            if (audioDisplay) {
                audioDisplay.textContent = `00:00 / ${formatTime(audioPlayer.duration)}`;
            }
        });

        audioPlayer.addEventListener('timeupdate', () => {
            if (audioPlayer.duration) {
                progressBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                if (audioDisplay) {
                    audioDisplay.textContent = `${formatTime(audioPlayer.currentTime)} / ${formatTime(audioPlayer.duration)}`;
                }
            }
        });

        progressBar.addEventListener('input', () => {
            if (audioPlayer.duration) {
                audioPlayer.currentTime = (progressBar.value / 100) * audioPlayer.duration;
            }
        });
    }
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    serverTimestamp,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAC5ulcLBtrRbmQ4deK1HTOQ5LPSbR7-78",
  authDomain: "laizer-e5803.firebaseapp.com",
  projectId: "laizer-e5803",
  storageBucket: "laizer-e5803.firebasestorage.app",
  messagingSenderId: "719956823015",
  appId: "1:719956823015:web:cd83b1536824c8127a0b42",
  measurementId: "G-6L04YDQTRR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag]));
}

function makeDraggable(element) {
    const titleBar = element.querySelector('.title-bar');
    if (!titleBar) return;

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    titleBar.addEventListener('mousedown', (e) => {
        isDragging = true;

        const rect = element.getBoundingClientRect();
        element.style.transform = 'none';
        element.style.left = `${rect.left}px`;
        element.style.top = `${rect.top}px`;

        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        const allWindows = document.querySelectorAll('.window');
        let maxZ = 0;

        allWindows.forEach(w => {
            const z = parseInt(w.style.zIndex || 0);
            if (z > maxZ) maxZ = z;
        });

        element.style.zIndex = maxZ + 1;
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            element.style.left = `${e.clientX - offsetX}px`;
            element.style.top = `${e.clientY - offsetY}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');

    // ========== INDEX PAGE (SMS Chat Input) ==========
    const sendBtn = document.getElementById('sendBtn');
    const dreamInput = document.getElementById('dreamInput');
    const inputWindow = document.getElementById('inputWindow');
    const smsMessages = document.getElementById('smsMessages');

    if (sendBtn && dreamInput && inputWindow && smsMessages) {
        console.log('Index SMS chat page detected');
        dreamInput.focus();

        sendBtn.addEventListener('click', async () => {
            const text = dreamInput.value.trim();

            if (!text) {
                alert("Please enter your dream.");
                return;
            }

            // Add message to chat immediately
            const messageBubble = document.createElement('div');
            messageBubble.className = 'sms-bubble sent';
            messageBubble.innerHTML = `<p>${escapeHTML(text)}</p>`;
            smsMessages.appendChild(messageBubble);
            smsMessages.scrollTop = smsMessages.scrollHeight;

            const loadingContainer = document.getElementById('loadingContainer');
            const loadingBar = document.getElementById('loadingBar');
            const sendBtnContainer = document.getElementById('sendBtnContainer');

            sendBtnContainer.style.display = 'none';
            loadingContainer.style.display = 'block';

            let progress = 0;

            const interval = setInterval(async () => {
                progress += Math.random() * 20;

                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);

                    try {
                        await addDoc(collection(db, "dreams"), {
                            text: text,
                            createdAt: serverTimestamp()
                        });

                        console.log('Message sent successfully');
                        dreamInput.value = '';

                        setTimeout(() => {
                            window.location.href = "archive.html";
                        }, 1000);
                    } catch (error) {
                        console.error("Error adding dream:", error);
                        alert("Message was not sent. Please try again.");
                        loadingContainer.style.display = 'none';
                        sendBtnContainer.style.display = 'flex';
                    }
                }

                loadingBar.style.width = `${progress}%`;
            }, 100);
        });

        makeDraggable(inputWindow);
    }

    // ========== ARCHIVE PAGE (Dreams Display as SMS bubbles above player) ==========
    const archiveContainer = document.getElementById('dreamsArchiveContainer');

    if (archiveContainer) {
        console.log('Archive page detected');

        function createSmsChatWindow(dreams) {
            if (dreams.length === 0) return;

            const chatWindow = document.createElement('div');
            chatWindow.className = 'window sms-archive-window';
            chatWindow.style.cssText = 'position: fixed; top: 80px; left: 50%; transform: translateX(-50%); z-index: 500; width: 400px; height: 300px; max-height: calc(50% - 400px);';

            const titleBar = document.createElement('div');
            titleBar.className = 'title-bar';
            titleBar.innerHTML = `
                <div class="title-bar-text">💬 All Dreams</div>
                <div class="title-bar-controls">
                    <button aria-label="Close" class="close-btn"></button>
                </div>
            `;

            const chatBody = document.createElement('div');
            chatBody.style.cssText = 'flex: 1; overflow-y: auto; padding: 10px; background: #c0c0c0; border: inset 2px #dfdfdf; display: flex; flex-direction: column; gap: 8px;';

            dreams.forEach(dream => {
                const bubble = document.createElement('div');
                bubble.className = 'sms-bubble received';
                bubble.innerHTML = `<p>${escapeHTML(dream.text)}</p>`;
                chatBody.appendChild(bubble);
            });

            chatWindow.appendChild(titleBar);
            chatWindow.appendChild(chatBody);

            const closeBtn = chatWindow.querySelector('.close-btn');
            closeBtn.addEventListener('click', () => {
                chatWindow.style.display = 'none';
            });

            makeDraggable(chatWindow);
            archiveContainer.appendChild(chatWindow);
        }

        // Load dreams
        const q = query(collection(db, "dreams"), orderBy("createdAt", "desc"));
        let allDreams = [];

        onSnapshot(q, (snapshot) => {
            allDreams = [];
            console.log('Dreams loaded:', snapshot.docs.length);

            snapshot.forEach((docItem) => {
                const data = docItem.data();
                allDreams.push({
                    text: data.text || ''
                });
            });

            // Remove old chat window if exists
            const oldWindow = archiveContainer.querySelector('.sms-archive-window');
            if (oldWindow) oldWindow.remove();

            // Create new one with updated dreams
            if (allDreams.length > 0) {
                createSmsChatWindow(allDreams);
            }
        }, (error) => {
            console.error("Error loading dreams:", error);
        });
    }

    // ========== AUDIO PLAYER (Archive Page) ==========
    const audioPlayerContainer = document.getElementById('audioPlayerContainer');
    const audioPlayer = document.getElementById('mainAudioPlayer');
    const btnPlay = document.getElementById('btnPlay');
    const btnPause = document.getElementById('btnPause');
    const btnStop = document.getElementById('btnStop');
    const progressBar = document.getElementById('range2');
    const audioDisplay = document.getElementById('audioDisplay');
    const listenBtn = document.getElementById('listenBtn');
    const platformLinks = document.getElementById('platformLinks');
    const socialBtn =
  document.getElementById("socialBtn");

const socialLinks =
  document.getElementById("socialLinks");

    if (audioPlayerContainer) {
        console.log('Audio player found');
        makeDraggable(audioPlayerContainer);
    }

    if (audioPlayer && btnPlay && btnPause && btnStop && progressBar) {
        console.log('Setting up audio controls');

        audioPlayer.addEventListener('loadedmetadata', () => {
            if (audioDisplay) {
                audioDisplay.textContent = `00:00 / ${formatTime(audioPlayer.duration)}`;
            }
        });

        btnPlay.addEventListener('click', () => {
            audioPlayer.play();
        });

        btnPause.addEventListener('click', () => {
            audioPlayer.pause();
        });

        btnStop.addEventListener('click', () => {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            if (audioDisplay) {
                audioDisplay.textContent = `00:00 / ${formatTime(audioPlayer.duration)}`;
            }
        });

        audioPlayer.addEventListener('timeupdate', () => {
            if (audioPlayer.duration) {
                progressBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                if (audioDisplay) {
                    audioDisplay.textContent = `${formatTime(audioPlayer.currentTime)} / ${formatTime(audioPlayer.duration)}`;
                }
            }
        });

        progressBar.addEventListener('input', () => {
            if (audioPlayer.duration) {
                audioPlayer.currentTime = (progressBar.value / 100) * audioPlayer.duration;
            }
        });
    }

    if (listenBtn && platformLinks) {
        console.log('Setting up listen button');
        listenBtn.addEventListener('click', () => {
            const isHidden = platformLinks.style.display === 'none' || platformLinks.style.display === '';
            platformLinks.style.display = isHidden ? 'flex' : 'none';
            listenBtn.classList.toggle('active');
        });
    }
});
socialBtn.addEventListener("click", () => {
  socialLinks.classList.toggle("active");
});

    if (listenBtn && platformLinks) {
        console.log('Setting up listen button');
        listenBtn.addEventListener('click', () => {
            const isHidden = platformLinks.style.display === 'none' || platformLinks.style.display === '';
            platformLinks.style.display = isHidden ? 'flex' : 'none';
            listenBtn.classList.toggle('active');
        });
    }
});

