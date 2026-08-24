document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const surpriseBtn = document.getElementById('surprise-btn');
    const toCakeBtn = document.getElementById('to-cake-btn');
    const fallbackBlowBtn = document.getElementById('fallback-blow-btn');
    
    // Views
    const initialView = document.getElementById('initial-view');
    const slideshowView = document.getElementById('slideshow-view');
    const slideshowView2 = document.getElementById('slideshow-view-2');
    const cakeView = document.getElementById('cake-view');
    const mainView = document.getElementById('main-view');
    const finalView = document.getElementById('final-view');
    
    const bgMusic = document.getElementById('bg-music');
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

    // View Switching Logic
    function switchView(hideView, showView, callback = null) {
        hideView.classList.remove('active');
        setTimeout(() => {
            showView.classList.add('active');
            if(callback) callback();
        }, 800); // Wait for transition
    }

    // 1. Initial -> Grid View (formerly Slideshow)
    surpriseBtn.addEventListener('click', () => {
        bgMusic.volume = 0.4;
        bgMusic.play().catch(e => console.log("Bg audio not found or blocked."));
        switchView(initialView, slideshowView);
    });
    
    // 1.5 Grid 1 -> Grid 2 (Singing)
    const toMemories2Btn = document.getElementById('to-memories-2-btn');
    if(toMemories2Btn) {
        toMemories2Btn.addEventListener('click', () => {
            switchView(slideshowView, slideshowView2);
        });
    }

    // 2. Grid 2 -> Cake
    toCakeBtn.addEventListener('click', () => {
        // Pause singing videos if playing
        document.querySelectorAll('.video-grid video').forEach(v => v.pause());
        
        bgMusic.pause();
        playHappyBirthday();
        switchView(slideshowView2, cakeView, setupMicrophone);
    });

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
            switchView(cakeView, mainView, () => {
                mainView.classList.add('show-main');
                fireConfetti();
                // Attempt to autoplay the greeting video
                const greetingVideo = document.getElementById('greeting-video');
                if (greetingVideo) {
                    greetingVideo.play().catch(e => console.log("Video autoplay blocked, user must press play."));
                }
            });
        }, 1500); // 1.5s delay after blowing candle
    }

    fallbackBlowBtn.addEventListener('click', blowOutCandle);

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
    
    // TTU Gift Green Screen Logic
    const ttuVideo = document.getElementById('ttu-video');
    const ttuCanvas = document.getElementById('ttu-canvas');
    const ctx = ttuCanvas.getContext('2d', { willReadFrequently: true });
    
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    let animationFrameId;
    
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

    generateCollage('bg-collage');
    generateCollage('bg-collage-cake');
    generateCollage('bg-collage-final');

    // Auto-play TTU when greeting video finishes
    const greetingVideo = document.getElementById('greeting-video');
    if (greetingVideo) {
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

    ttuVideo.addEventListener('ended', () => {
        cancelAnimationFrame(animationFrameId);
        ttuCanvas.style.display = 'none';
        ctx.clearRect(0, 0, ttuCanvas.width, ttuCanvas.height);
        
        // Transition to Final View
        switchView(mainView, finalView, () => {
            finalView.classList.add('show-main');
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
});
