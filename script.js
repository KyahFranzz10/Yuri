document.addEventListener('DOMContentLoaded', () => {
    const bgMusic = document.getElementById('bg-music');
    const ttuVideo = document.getElementById('ttu-video');
    const ttuCanvas = document.getElementById('ttu-canvas');
    const ctx = ttuCanvas.getContext('2d', { willReadFrequently: true });
    
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    let animationFrameId;
    
    let audioContext;
    let micStream;
    let hbdAudioCtx; // For the Web Audio API melody
    
    // Web audio API synth function
    function playHappyBirthday() {
        if (!hbdAudioCtx) {
            hbdAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } else {
            hbdAudioCtx.resume();
        }
        
        const notes = [
            { f: 392.00, d: 0.5 }, { f: 392.00, d: 0.5 }, { f: 440.00, d: 1.0 }, { f: 392.00, d: 1.0 }, { f: 523.25, d: 1.0 }, { f: 493.88, d: 2.0 },
            { f: 392.00, d: 0.5 }, { f: 392.00, d: 0.5 }, { f: 440.00, d: 1.0 }, { f: 392.00, d: 1.0 }, { f: 587.33, d: 1.0 }, { f: 523.25, d: 2.0 },
            { f: 392.00, d: 0.5 }, { f: 392.00, d: 0.5 }, { f: 783.99, d: 1.0 }, { f: 659.25, d: 1.0 }, { f: 523.25, d: 1.0 }, { f: 493.88, d: 1.0 }, { f: 440.00, d: 1.0 },
            { f: 698.46, d: 0.5 }, { f: 698.46, d: 0.5 }, { f: 659.25, d: 1.0 }, { f: 523.25, d: 1.0 }, { f: 587.33, d: 1.0 }, { f: 523.25, d: 2.0 }
        ];
        
        let time = hbdAudioCtx.currentTime;
        const tempo = 0.5; // seconds per beat
        
        notes.forEach(note => {
            const osc = hbdAudioCtx.createOscillator();
            const gainNode = hbdAudioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = note.f;
            osc.connect(gainNode);
            gainNode.connect(hbdAudioCtx.destination);
            
            gainNode.gain.setValueAtTime(0, time);
            gainNode.gain.linearRampToValueAtTime(0.3, time + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, time + note.d * tempo - 0.05);
            
            osc.start(time);
            osc.stop(time + note.d * tempo);
            time += note.d * tempo;
        });
    }

    // Dynamic Loading Logic
    async function loadView(url, onLoaded = null) {
        try {
            const response = await fetch(url);
            const html = await response.text();
            
            const temp = document.createElement('div');
            temp.innerHTML = html;
            const newView = temp.firstElementChild;
            
            const container = document.getElementById('app-container');
            const currentView = container.querySelector('.view.active');
            
            container.appendChild(newView);
            
            // Randomize background
            generateCollage('global-bg-collage');
            
            if (currentView) {
                currentView.classList.remove('active');
                setTimeout(() => {
                    newView.classList.add('active');
                    if(onLoaded) onLoaded();
                    setTimeout(() => {
                        currentView.remove();
                    }, 1000); // Wait for transition before removing
                }, 800);
            } else {
                // First load
                setTimeout(() => {
                    newView.classList.add('active');
                    if(onLoaded) onLoaded();
                }, 50);
            }
            
        } catch (err) {
            console.error("Failed to load view:", err);
        }
    }

    // Event Delegation for dynamically loaded buttons
    document.body.addEventListener('click', (e) => {
        // Balloon popping interaction
        const balloon = e.target.closest('.balloon');
        if (balloon) {
            balloon.style.opacity = '0';
            balloon.style.pointerEvents = 'none';
            
            const popText = document.createElement('div');
            popText.innerText = '💥';
            popText.style.position = 'fixed';
            popText.style.left = e.clientX + 'px';
            popText.style.top = e.clientY + 'px';
            popText.style.transform = 'translate(-50%, -50%) scale(0.5)';
            popText.style.fontSize = '40px';
            popText.style.zIndex = '1000';
            popText.style.transition = 'all 0.2s ease-out';
            popText.style.pointerEvents = 'none';
            document.body.appendChild(popText);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    popText.style.transform = 'translate(-50%, -150%) scale(1.5)';
                    popText.style.opacity = '0';
                });
            });

            setTimeout(() => {
                popText.remove();
            }, 300);
            return;
        }

        // 1. Initial -> Transition -> Grid View
        const surpriseBtn = e.target.closest('#surprise-btn');
        if (surpriseBtn) {
            bgMusic.volume = 0.4;
            bgMusic.play().catch(err => console.log("Bg audio not found or blocked."));
            
            loadView('views/transition.html', () => {
                playTransitionEffect(() => {
                    loadView('views/memories1.html');
                });
            });
            return;
        }
        
        // 1.5 Grid 1 -> Grid 2 (Singing)
        const toMem2Btn = e.target.closest('#to-memories-2-btn');
        if (toMem2Btn) {
            loadView('views/memories2.html');
            return;
        }

        // 2. Grid 2 -> Cake
        const toCakeBtn = e.target.closest('#to-cake-btn');
        if (toCakeBtn) {
            // Pause singing videos if playing
            document.querySelectorAll('.video-grid video').forEach(v => v.pause());
            
            bgMusic.pause();
            playHappyBirthday();
            loadView('views/cake.html', setupMicrophone);
            return;
        }

        // Fallback blow button
        const fallbackBlowBtn = e.target.closest('#fallback-blow-btn');
        if (fallbackBlowBtn) {
            blowOutCandle();
            return;
        }

        // 3. Final -> Re-watch from Start
        const rewatchBtn = e.target.closest('#rewatch-btn');
        if (rewatchBtn) {
            bgMusic.pause();
            bgMusic.currentTime = 0;
            const bgCollage = document.getElementById('global-bg-collage');
            if (bgCollage) {
                bgCollage.style.opacity = 0;
                bgCollage.style.transform = 'scale(1.5)';
            }
            loadView('views/initial.html');
            return;
        }
    });

    function playTransitionEffect(callback) {
        const flashImg = document.getElementById('flash-img');
        const bgCollage = document.getElementById('global-bg-collage');
        const emojiContainer = document.getElementById('emoji-container');
        
        if(!flashImg) return callback();

        flashImg.style.display = 'block';
        
        // Comprehensive list of her photos
        const allPhotos = [
            "IMG_20240406_212807_497.jpg",
            "IMG_20240406_212811_103.jpg",
            "IMG_20240406_212812_502.jpg",
            "IMG_20240406_212816_048.jpg",
            "IMG_20240409_113926_816.jpg",
            "IMG_20240409_113932_378.jpg",
            "IMG_20240409_113940_289.jpg",
            "IMG_20240409_113943_002.jpg",
            "IMG_20240409_113959_022.jpg",
            "IMG_20240410_003913_034.jpg",
            "IMG_20240410_003914_317.jpg",
            "IMG_20240410_003915_683.jpg",
            "IMG_20240410_003917_015.jpg",
            "1714983792741.jpg",
            "IMG_20240509_142755.jpg",
            "received_439313421816813.jpeg",
            "snaptik-app-7661088120498048276-slide-1.jpg",
            "snaptik-app-7661088120498048276-slide-2.jpg"
        ];
        
        // Shuffle array so every transition shows a unique randomized order
        const shuffled = [...allPhotos].sort(() => 0.5 - Math.random());
        const totalFlashes = Math.min(15, shuffled.length);
        
        let flashCount = 0;
        const flashInterval = setInterval(() => {
            flashImg.src = `assets/image/${shuffled[flashCount]}`;
            flashImg.style.opacity = 1;
            flashImg.style.transform = `translate(-50%, -50%) scale(${0.8 + (flashCount * 0.025)})`;
            
            setTimeout(() => {
                if(flashCount < totalFlashes) flashImg.style.opacity = 0;
            }, 90);
            
            flashCount++;
            if (flashCount >= totalFlashes) {
                clearInterval(flashInterval);
                
                flashImg.style.display = 'none';
                
                // Show background collage
                bgCollage.style.opacity = 0.25;
                bgCollage.style.transform = 'scale(1)';
                
                // Spawn emojis
                spawnEmojis(emojiContainer);
                
                setTimeout(() => {
                    callback();
                }, 3500);
            }
        }, 130);
    }
    
    function spawnEmojis(container) {
        if(!container) return;
        const emojis = ['🐱', '🦁', '🍒', '✨', '💖', '🎁'];
        for (let i = 0; i < 40; i++) {
            setTimeout(() => {
                const el = document.createElement('div');
                el.className = 'floating-emoji';
                el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
                el.style.left = `${Math.random() * 90}%`;
                el.style.animationDuration = `${2 + Math.random() * 2}s`;
                el.style.fontSize = `${2 + Math.random() * 3}rem`;
                container.appendChild(el);
            }, i * 100);
        }
    }

    // 3. Cake -> Main Reveal
    function blowOutCandle() {
        document.querySelectorAll('.flame').forEach(f => f.classList.add('out'));
        
        // Stop HBD song
        if(hbdAudioCtx) hbdAudioCtx.suspend();
        
        // Pause background music so the video greeting can be heard clearly
        bgMusic.pause();
        
        // Clean up microphone if active
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
        }

        setTimeout(() => {
            loadView('views/message.html', () => {
                const mainView = document.getElementById('main-view');
                if(mainView) mainView.classList.add('show-main');
                fireConfetti();
                // Attempt to autoplay the greeting video
                const greetingVideo = document.getElementById('greeting-video');
                if (greetingVideo) {
                    greetingVideo.play().catch(e => console.log("Video autoplay blocked, user must press play."));
                    
                    greetingVideo.addEventListener('ended', () => {
                        ttuVideo.currentTime = 0;
                        ttuVideo.play().catch(e => console.log("Video play failed:", e));
                        ttuCanvas.style.display = 'block';
                        
                        // Match canvas size to window
                        ttuCanvas.width = window.innerWidth;
                        ttuCanvas.height = window.innerHeight;
                        
                        processFrame();
                    });
                }
            });
        }, 1500); // 1.5s delay after blowing candle
    }

    // Microphone Logic for blowing candle
    async function setupMicrophone() {
        try {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(micStream);
            const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;

            microphone.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);
            
            scriptProcessor.onaudioprocess = function() {
                const array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                
                let sum = 0;
                for (let i = 0; i < array.length; i++) {
                    sum += array[i];
                }
                const volume = sum / array.length;

                // Threshold for "blowing"
                if (volume > 40) {
                    blowOutCandle();
                    scriptProcessor.disconnect();
                    microphone.disconnect();
                }
            };
        } catch (err) {
            console.log("Microphone access denied or not available. Using fallback button.", err);
        }
    }

    // Confetti logic
    function fireConfetti() {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#9b5de5', '#f15bb5', '#ffffff']
            }));
            confetti(Object.assign({}, defaults, { particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#9b5de5', '#f15bb5', '#ffffff']
            }));
        }, 250);
    }
    
    // Generate Random Collages
    function generateCollage(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const images = [
            "IMG_20240406_212807_497.jpg",
            "IMG_20240406_212811_103.jpg",
            "IMG_20240406_212812_502.jpg",
            "IMG_20240406_212816_048.jpg",
            "IMG_20240409_113926_816.jpg",
            "IMG_20240409_113932_378.jpg",
            "IMG_20240409_113940_289.jpg",
            "IMG_20240409_113943_002.jpg",
            "IMG_20240409_113959_022.jpg",
            "IMG_20240410_003913_034.jpg",
            "IMG_20240410_003914_317.jpg",
            "IMG_20240410_003915_683.jpg",
            "IMG_20240410_003917_015.jpg",
            "1714983792741.jpg",
            "IMG_20240509_142755.jpg",
            "snaptik-app-7661088120498048276-slide-1.jpg",
            "snaptik-app-7661088120498048276-slide-2.jpg",
            "received_439313421816813.jpeg"
        ];
        
        // Shuffle array for randomness
        const shuffled = [...images].sort(() => 0.5 - Math.random());
        
        // Generate enough images to guarantee filling any screen size (30 elements)
        let html = '';
        for (let i = 0; i < 30; i++) {
            const imgSrc = shuffled[i % shuffled.length];
            html += `<img src="assets/image/${imgSrc}" alt="Cherry Collage">`;
        }
        container.innerHTML = html;
    }

    // Initial background generation (starts hidden)
    generateCollage('global-bg-collage');

    ttuVideo.addEventListener('ended', () => {
        cancelAnimationFrame(animationFrameId);
        ttuCanvas.style.display = 'none';
        ctx.clearRect(0, 0, ttuCanvas.width, ttuCanvas.height);
        
        // Transition to Final View
        loadView('views/final.html', () => {
            const finalView = document.getElementById('final-view');
            if(finalView) finalView.classList.add('show-main');
            fireConfetti(); // Celebrate again!
        });
    });

    function processFrame() {
        if (ttuVideo.paused || ttuVideo.ended) return;
        
        if (offCanvas.width !== ttuVideo.videoWidth && ttuVideo.videoWidth > 0) {
            offCanvas.width = ttuVideo.videoWidth;
            offCanvas.height = ttuVideo.videoHeight;
        }

        if(offCanvas.width > 0 && offCanvas.height > 0) {
            offCtx.drawImage(ttuVideo, 0, 0, offCanvas.width, offCanvas.height);
            
            let frameData;
            try {
                frameData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
                const data = frameData.data;
                const length = data.length;
                
                for (let i = 0; i < length; i += 4) {
                    const r = data[i + 0];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    // Simple green screen detection
                    if (g > 100 && g > r * 1.3 && g > b * 1.3) {
                        data[i + 3] = 0; // Make green pixels transparent
                    }
                }
                
                offCtx.putImageData(frameData, 0, 0);
                
                ctx.clearRect(0, 0, ttuCanvas.width, ttuCanvas.height);
                
                // Scale to fit screen
                const hRatio = ttuCanvas.width / offCanvas.width;
                const vRatio = ttuCanvas.height / offCanvas.height;
                const ratio  = Math.min(hRatio, vRatio);
                const centerShift_x = (ttuCanvas.width - offCanvas.width * ratio) / 2;
                const centerShift_y = (ttuCanvas.height - offCanvas.height * ratio) / 2;  

                ctx.drawImage(offCanvas, 0, 0, offCanvas.width, offCanvas.height,
                              centerShift_x, centerShift_y, offCanvas.width * ratio, offCanvas.height * ratio);
            } catch (e) {
                console.error("Canvas CORS error. Try running a local HTTP server.", e);
                // Fallback: just draw it without green screen if tainted
                ctx.drawImage(ttuVideo, 0, 0, ttuCanvas.width, ttuCanvas.height);
            }
        }
        
        animationFrameId = requestAnimationFrame(processFrame);
    }
    
    // Dynamic Full-Screen Roving Cats
    function initRovingCat() {
        const cats = document.querySelectorAll('.roving-cat');
        if (!cats || cats.length === 0) return;

        cats.forEach((cat, index) => {
            const pad = 60;
            let currentX = Math.random() * Math.max(100, window.innerWidth - pad * 2) + pad;
            let currentY = Math.random() * Math.max(100, window.innerHeight - pad * 2) + pad;
            cat.style.transform = `translate(${currentX}px, ${currentY}px)`;

            function roam() {
                const maxX = Math.max(100, window.innerWidth - pad * 2);
                const maxY = Math.max(100, window.innerHeight - pad * 2);
                
                const targetX = Math.random() * maxX + pad * 0.5;
                const targetY = Math.random() * maxY + pad * 0.5;

                const dx = targetX - currentX;
                const dy = targetY - currentY;
                const distance = Math.hypot(dx, dy);

                // Slight individual speed variation (50px to 75px per second)
                const speed = 50 + Math.random() * 25; 
                const duration = Math.max(1.8, distance / speed);

                const facing = dx >= 0 ? 1 : -1;
                // Subtle tilt along direction of diagonal movement
                const angle = Math.min(Math.max((dy / (Math.abs(dx) + 0.1)) * 12, -15), 15);

                cat.style.transition = `transform ${duration}s linear`;
                cat.style.transform = `translate(${targetX}px, ${targetY}px) scaleX(${facing}) rotate(${facing * angle}deg)`;

                currentX = targetX;
                currentY = targetY;

                setTimeout(roam, duration * 1000 + (Math.random() * 1200));
            }

            // Stagger start times so they don't all move at the exact same moment
            setTimeout(roam, 200 + index * 400);
        });
    }

    initRovingCat();

    // Finally, load the initial view!
    loadView('views/initial.html');
});
