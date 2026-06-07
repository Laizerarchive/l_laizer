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

document.addEventListener('DOMContentLoaded', () => {
    // ========== INDEX PAGE (Input Page) ==========
    const sendBtn = document.getElementById('sendBtn');
    const dreamInput = document.getElementById('dreamInput');
    const inputWindow = document.getElementById('inputWindow');

    if (sendBtn && dreamInput) {
        dreamInput.focus();

        sendBtn.addEventListener('click', async () => {
            const text = dreamInput.value.trim();

            if (!text) {
                alert("Please enter your dream.");
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
                            text: text,
                            createdAt: serverTimestamp()
                        });

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

        if (inputWindow) {
            makeDraggable(inputWindow);
        }
    }

    // ========== ARCHIVE PAGE (Dreams Display) ==========
    const archiveContainer = document.getElementById('dreamsArchiveContainer');

    function loadAndDisplayDreams() {
        if (!archiveContainer) return;

        const q = query(collection(db, "dreams"), orderBy("createdAt", "desc"));

        onSnapshot(q, (snapshot) => {
            archiveContainer.innerHTML = '';

            snapshot.forEach((docItem, index) => {
                const data = docItem.data();

                const dream = {
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
                <div class="title-bar-text">dream.txt</div>
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

    loadAndDisplayDreams();

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

    if (audioPlayerContainer) {
        makeDraggable(audioPlayerContainer);
    }

    // Format time for display
    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    if (audioPlayer && btnPlay && btnPause && btnStop && progressBar) {
        // Update display when metadata loads
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

    // Listen button - toggle platform links
    if (listenBtn && platformLinks) {
        listenBtn.addEventListener('click', () => {
            if (platformLinks.style.display === 'none' || platformLinks.style.display === '') {
                platformLinks.style.display = 'flex';
                listenBtn.classList.add('active');
            } else {
                platformLinks.style.display = 'none';
                listenBtn.classList.remove('active');
            }
        });
    }

    // ========== UTILITY FUNCTIONS ==========
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
