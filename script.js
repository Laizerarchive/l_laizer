document.addEventListener('DOMContentLoaded', () => {
    // ---- Index Page Logic ----
    const sendBtn = document.getElementById('sendBtn');
    const dreamInput = document.getElementById('dreamInput');

    if (sendBtn && dreamInput) {
        // Auto focus the input field for the user to type immediately
        dreamInput.focus();

        sendBtn.addEventListener('click', () => {
            const text = dreamInput.value.trim();
            if (text) {
                // Show loading simulation
                const loadingContainer = document.getElementById('loadingContainer');
                const loadingBar = document.getElementById('loadingBar');
                const sendBtnContainer = document.getElementById('sendBtnContainer');
                
                sendBtnContainer.style.display = 'none';
                loadingContainer.style.display = 'block';
                
                // Simulate loading progress
                let progress = 0;
                const interval = setInterval(() => {
                    progress += Math.random() * 20;
                    if (progress >= 100) {
                        progress = 100;
                        clearInterval(interval);
                        
                        // Save to localStorage
                        const dreams = JSON.parse(localStorage.getItem('laizerDreams') || '[]');
                        dreams.push({
                            text: text,
                            date: new Date().toISOString()
                        });
                        localStorage.setItem('laizerDreams', JSON.stringify(dreams));
                        
                        // Add delay before redirect to show completed progress bar
                        setTimeout(() => {
                            window.location.href = 'archive.html';
                        }, 500);
                    }
                    loadingBar.style.width = `${progress}%`;
                }, 100);

            } else {
                alert("Please enter your dream.");
            }
        });
    }

    // ---- Archive Page Logic ----
    const archiveContainer = document.getElementById('dreamsArchiveContainer');
    
    if (archiveContainer) {
        const dreams = JSON.parse(localStorage.getItem('laizerDreams') || '[]');
        
        if (dreams.length === 0) {
            // Show a default message if empty
            createDreamWindow({ text: "No dreams recorded yet. Go back and add one!", date: new Date().toISOString() }, 0, true);
        } else {
            // Display all dreams randomly
            dreams.forEach((dream, index) => {
                createDreamWindow(dream, index);
            });
        }
    }

    function createDreamWindow(dream, index, isCentered = false) {
        const dreamEl = document.createElement('div');
        dreamEl.className = 'window dream-window';
        
        // Random positioning
        // Calculate max bounds to keep windows inside the viewport
        const padding = 20;
        const maxLeft = window.innerWidth - 320; 
        const maxTop = window.innerHeight - 200; 
        
        let randomLeft = padding + Math.random() * (maxLeft > 0 ? maxLeft : 10);
        let randomTop = padding + Math.random() * (maxTop > 0 ? maxTop : 10);

        if (isCentered) {
            randomLeft = (window.innerWidth / 2) - 150;
            randomTop = (window.innerHeight / 2) - 75;
        }

        dreamEl.style.left = `${randomLeft}px`;
        dreamEl.style.top = `${randomTop}px`;
        // Bring newer windows to the front slightly
        dreamEl.style.zIndex = index + 10;

        const randomHue = Math.floor(Math.random() * 360);
        const randomColor = `hsl(${randomHue}, 70%, 40%)`;

        dreamEl.innerHTML = `
            <div class="title-bar" style="background: ${randomColor};">
                <div class="title-bar-text">Dream_${index + 1}.txt</div>
                <div class="title-bar-controls">
                    <button aria-label="Close" class="close-btn"></button>
                </div>
            </div>
            <div class="window-body">
                <p class="dream-text-content">${escapeHTML(dream.text)}</p>
            </div>
        `;
        
        // Close button functionality
        const closeBtn = dreamEl.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            dreamEl.style.display = 'none';
        });

        // Make window draggable (basic implementation)
        const titleBar = dreamEl.querySelector('.title-bar');
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        titleBar.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - dreamEl.offsetLeft;
            offsetY = e.clientY - dreamEl.offsetTop;
            // Bring to front
            const allWindows = document.querySelectorAll('.dream-window');
            let maxZ = 0;
            allWindows.forEach(w => {
                if (parseInt(w.style.zIndex || 0) > maxZ) {
                    maxZ = parseInt(w.style.zIndex);
                }
            });
            dreamEl.style.zIndex = maxZ + 1;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                dreamEl.style.left = `${e.clientX - offsetX}px`;
                dreamEl.style.top = `${e.clientY - offsetY}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        archiveContainer.appendChild(dreamEl);
    }

    // Make Audio Player Draggable
    const audioPlayerContainer = document.getElementById('audioPlayerContainer');
    if (audioPlayerContainer) {
        const audioTitleBar = audioPlayerContainer.querySelector('.title-bar');
        let isDraggingAudio = false;
        let audioOffsetX = 0;
        let audioOffsetY = 0;

        audioTitleBar.addEventListener('mousedown', (e) => {
            isDraggingAudio = true;
            // Since it's fixed with translate(-50%, -50%), we need to reset transform and use normal top/left
            const rect = audioPlayerContainer.getBoundingClientRect();
            audioPlayerContainer.style.transform = 'none';
            audioPlayerContainer.style.left = `${rect.left}px`;
            audioPlayerContainer.style.top = `${rect.top}px`;
            
            audioOffsetX = e.clientX - rect.left;
            audioOffsetY = e.clientY - rect.top;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDraggingAudio) {
                audioPlayerContainer.style.left = `${e.clientX - audioOffsetX}px`;
                audioPlayerContainer.style.top = `${e.clientY - audioOffsetY}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDraggingAudio = false;
        });
    }

    // Audio Player Logic
    const audioPlayer = document.getElementById('mainAudioPlayer');
    const btnPlay = document.getElementById('btnPlay');
    const btnPause = document.getElementById('btnPause');
    const btnStop = document.getElementById('btnStop');
    const progressBar = document.getElementById('range2');

    if (audioPlayer && btnPlay) {
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

        // Update progress bar
        audioPlayer.addEventListener('timeupdate', () => {
            if (audioPlayer.duration) {
                const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                progressBar.value = progress;
            }
        });

        // Seek functionality
        progressBar.addEventListener('input', () => {
            if (audioPlayer.duration) {
                const seekTime = (progressBar.value / 100) * audioPlayer.duration;
                audioPlayer.currentTime = seekTime;
            }
        });
    }

    // Utility function to prevent XSS
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag])
        );
    }
});
