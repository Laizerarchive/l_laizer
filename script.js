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
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('sendBtn');
    const dreamInput = document.getElementById('dreamInput');
    const dreamUsername = document.getElementById('dreamUsername');
    const archiveContainer = document.getElementById('dreamsArchiveContainer');
    const inputWindow = document.getElementById('inputWindow');

    function loadAndDisplayDreams() {
        if (!archiveContainer) return;

        const q = query(collection(db, "dreams"), orderBy("createdAt", "desc"));

        onSnapshot(q, (snapshot) => {
            archiveContainer.innerHTML = '';

            snapshot.forEach((docItem, index) => {
                const data = docItem.data();

                const dream = {
                    username: data.username || 'Anonymous',
                    text: data.text || '',
                    date: data.createdAt?.toDate?.() || new Date()
                };

                createDreamWindow(dream, index);
            });
        });
    }

    function createDreamWindow(dream, index) {
        const dreamEl = document.createElement('div');
        dreamEl.className = 'window dream-window';

        const padding = 20;
        const maxLeft = window.innerWidth - 320;
        const maxTop = window.innerHeight - 200;

        const randomLeft = padding + Math.random() * (maxLeft > 0 ? maxLeft : 10);
        const randomTop = padding + Math.random() * (maxTop > 0 ? maxTop : 10);

        dreamEl.style.left = `${randomLeft}px`;
        dreamEl.style.top = `${randomTop}px`;
        dreamEl.style.zIndex = index + 10;

        const randomHue = Math.floor(Math.random() * 360);
        const randomColor = `hsl(${randomHue}, 70%, 40%)`;

        const dreamDate = new Date(dream.date);
        const formattedDate = dreamDate.toLocaleString();

        dreamEl.innerHTML = `
            <div class="title-bar" style="background: ${randomColor};">
                <div class="title-bar-text">${escapeHTML(dream.username)}</div>
                <div class="title-bar-controls">
                    <button aria-label="Close" class="close-btn"></button>
                </div>
            </div>
            <div class="window-body">
                <p class="dream-text-content">${escapeHTML(dream.text)}</p>
                <div class="timestamp">${formattedDate}</div>
            </div>
        `;

        const closeBtn = dreamEl.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            dreamEl.style.display = 'none';
        });

        makeDraggable(dreamEl);

        archiveContainer.appendChild(dreamEl);
    }

    if (sendBtn && dreamInput && dreamUsername) {
        dreamInput.focus();

        sendBtn.addEventListener('click', async () => {
            const username = dreamUsername.value.trim();
            const text = dreamInput.value.trim();

            if (!username || !text) {
                alert("Please enter your name and your dream.");
                return;
            }

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
                            username: username,
                            text: text,
                            createdAt: serverTimestamp()
                        });

                        dreamUsername.value = '';
                        dreamInput.value = '';
                        dreamInput.focus();

                        window.location.href = "archive.html";
                    } catch (error) {
                        console.error("Error adding dream:", error);
                        alert("Message was not sent. Please try again.");
                    }

                    setTimeout(() => {
                        loadingContainer.style.display = 'none';
                        sendBtnContainer.style.display = 'flex';
                    }, 500);
                }

                loadingBar.style.width = `${progress}%`;
            }, 100);
        });
    }

    loadAndDisplayDreams();

    if (inputWindow) {
        makeDraggable(inputWindow);
    }

    const audioPlayerContainer = document.getElementById('audioPlayerContainer');
    if (audioPlayerContainer) {
        makeDraggable(audioPlayerContainer);
    }

    const audioPlayer = document.getElementById('mainAudioPlayer');
    const btnPlay = document.getElementById('btnPlay');
    const btnPause = document.getElementById('btnPause');
    const btnStop = document.getElementById('btnStop');
    const progressBar = document.getElementById('range2');

    if (audioPlayer && btnPlay && btnPause && btnStop && progressBar) {
        btnPlay.addEventListener('click', () => {
            audioPlayer.play();
        });

        btnPause.addEventListener('click', () => {
            audioPlayer.pause();
        });

        btnStop.addEventListener('click', () => {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
        });

        audioPlayer.addEventListener('timeupdate', () => {
            if (audioPlayer.duration) {
                progressBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            }
        });

        progressBar.addEventListener('input', () => {
            if (audioPlayer.duration) {
                audioPlayer.currentTime = (progressBar.value / 100) * audioPlayer.duration;
            }
        });
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

    function escapeHTML(str) {
        return String(str).replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
    }
});
