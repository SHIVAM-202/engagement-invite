document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. CONFIGURATION & DETAILS
    // -------------------------------------------------------------
    const EVENT_DATE = new Date('November 22, 2026 17:00:00').getTime();
    const VENUE_ADDRESS = "Gokul Party Plot, Vadodara, Gujarat";
    const MAPS_URL = "https://maps.google.com/?q=Gokul+Party+Plot+Vadodara";
    
    // Paste your Google Apps Script Web App URL here after deployment:
    const GOOGLE_SHEET_URL = "";

    // -------------------------------------------------------------
    // 2. COUNTDOWN TIMER
    // -------------------------------------------------------------
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minsEl = document.getElementById('minutes');
    const secsEl = document.getElementById('seconds');

    function updateCountdown() {
        const now = new Date().getTime();
        const difference = EVENT_DATE - now;

        if (difference <= 0) {
            document.getElementById('countdown').innerHTML = "<div class='celebration-text'>The Ceremony Has Begun!</div>";
            clearInterval(timerInterval);
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        daysEl.textContent = String(days).padStart(2, '0');
        hoursEl.textContent = String(hours).padStart(2, '0');
        minsEl.textContent = String(minutes).padStart(2, '0');
        secsEl.textContent = String(seconds).padStart(2, '0');
    }

    const timerInterval = setInterval(updateCountdown, 1000);
    updateCountdown(); // Initial run

    // -------------------------------------------------------------
    // 3. BACKGROUND MUSIC CONTROL
    // -------------------------------------------------------------
    const bgMusic = document.getElementById('bgMusic');
    const audioToggleBtn = document.getElementById('audioToggle');
    let isMusicPlaying = false;

    // Autoplay attempt helper
    function tryAutoplay() {
        bgMusic.volume = 0.4;
        bgMusic.play().then(() => {
            isMusicPlaying = true;
            audioToggleBtn.classList.add('audio-playing');
        }).catch(err => {
            console.log('Autoplay blocked by browser. Awaiting user interaction.', err);
        });
        document.removeEventListener('click', tryAutoplay);
    }
    
    // Attempt playback on first user click anywhere on screen
    document.addEventListener('click', tryAutoplay);

    audioToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Avoid triggering document-level triggers
        if (isMusicPlaying) {
            bgMusic.pause();
            audioToggleBtn.classList.remove('audio-playing');
            isMusicPlaying = false;
        } else {
            bgMusic.volume = 0.4;
            bgMusic.play();
            audioToggleBtn.classList.add('audio-playing');
            isMusicPlaying = true;
        }
    });

    // -------------------------------------------------------------
    // 4. ACTION BUTTONS (Map, Copy, Calendar)
    // -------------------------------------------------------------
    const btnDirections = document.getElementById('btnDirections');
    const btnCopyAddress = document.getElementById('btnCopyAddress');
    const btnCalendar = document.getElementById('btnCalendar');
    const toast = document.getElementById('toast');

    // Show custom toast notification
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    btnDirections.addEventListener('click', () => {
        window.open(MAPS_URL, '_blank');
    });

    btnCopyAddress.addEventListener('click', () => {
        navigator.clipboard.writeText(VENUE_ADDRESS).then(() => {
            showToast("Venue address copied to clipboard!");
        }).catch(err => {
            console.error('Could not copy text: ', err);
            showToast("Failed to copy address. Please highlight and copy manually.");
        });
    });

    btnCalendar.addEventListener('click', () => {
        // Universal .ics File Generation
        const title = "Shivam & Richa Engagement Ceremony";
        const desc = "We are getting engaged! Please join us in celebrating our love at Gokul Party Plot, Vadodara.";
        const loc = VENUE_ADDRESS;
        
        // Start: Nov 22, 2026 17:00 IST -> 11:30 UTC
        // End: Nov 22, 2026 21:00 IST -> 15:30 UTC
        const dtstart = "20261122T113000Z";
        const dtend = "20261122T153000Z";

        const icsLines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "CALSCALE:GREGORIAN",
            "BEGIN:VEVENT",
            `SUMMARY:${title}`,
            `DESCRIPTION:${desc}`,
            `LOCATION:${loc}`,
            `DTSTART:${dtstart}`,
            `DTEND:${dtend}`,
            "STATUS:CONFIRMED",
            "SEQUENCE:0",
            "BEGIN:VALARM",
            "TRIGGER:-PT1440M", // 1 day before
            "ACTION:DISPLAY",
            "DESCRIPTION:Reminder: Shivam & Richa Engagement tomorrow!",
            "END:VALARM",
            "END:VEVENT",
            "END:VCALENDAR"
        ];

        const blob = new Blob([icsLines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute("download", "Shivam_Richa_Engagement.ics");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Calendar file (.ics) downloaded!");
    });

    // -------------------------------------------------------------
    // 5. RSVP & BLESSINGS WALL (LocalStorage)
    // -------------------------------------------------------------
    const rsvpForm = document.getElementById('rsvpForm');
    const rsvpStatus = document.getElementById('rsvpStatus');
    const guestsCountGroup = document.getElementById('guestsCountGroup');
    const blessingsWall = document.getElementById('blessingsWall');

    // Toggle guests count drop-down based on attendance
    rsvpStatus.addEventListener('change', () => {
        if (rsvpStatus.value === 'no') {
            guestsCountGroup.style.display = 'none';
        } else {
            guestsCountGroup.style.display = 'block';
        }
    });

    // Preloaded Wishes if storage is empty
    const DEFAULT_WISHES = [
        { name: "Aarav & Pooja Patel", status: "yes", guests: "2", message: "Congratulations Shivam and Richa! So happy for both of you. Wishing you a beautiful journey ahead!" },
        { name: "Neha Darji", status: "yes", guests: "1", message: "Loads of love to the lovely couple! Can't wait to celebrate with you guys in Vadodara!" },
        { name: "Kunal Shah", status: "no", guests: "0", message: "Heartiest congratulations guys! Truly sorry I won't be able to make it, but sending my best blessings and wishes!" }
    ];

    const isLocalFile = window.location.protocol === 'file:';

    function renderBlessings(wishes) {
        blessingsWall.innerHTML = '';
        wishes.forEach(wish => {
            const card = document.createElement('div');
            card.className = 'blessing-card';

            const badgeText = wish.status === 'yes' 
                ? `Attending (${wish.guests} ${wish.guests === '1' ? 'guest' : 'guests'})`
                : 'Declined';
            const badgeClass = wish.status === 'yes' ? 'badge-attending' : 'badge-declined';

            card.innerHTML = `
                <div class="blessing-meta">
                    <span class="blessing-name">${escapeHTML(wish.name)}</span>
                    <span class="blessing-badge ${badgeClass}">${badgeText}</span>
                </div>
                <p class="blessing-text">"${escapeHTML(wish.message || 'Sending best wishes and warm blessings!')}"</p>
            `;
            blessingsWall.appendChild(card);
        });
    }

    function loadBlessings() {
        if (GOOGLE_SHEET_URL) {
            fetch(GOOGLE_SHEET_URL)
                .then(res => res.json())
                .then(wishes => {
                    renderBlessings(wishes);
                })
                .catch(err => {
                    console.error('Error fetching RSVPs from Google Sheets, using default preloads', err);
                    renderBlessings(DEFAULT_WISHES);
                });
        } else if (isLocalFile) {
            let wishes = JSON.parse(localStorage.getItem('engagement_wishes'));
            if (!wishes) {
                wishes = DEFAULT_WISHES;
                localStorage.setItem('engagement_wishes', JSON.stringify(wishes));
            }
            renderBlessings(wishes);
        } else {
            fetch('/api/rsvps')
                .then(res => res.json())
                .then(wishes => {
                    renderBlessings(wishes);
                })
                .catch(err => {
                    console.error('Error fetching RSVPs from server, using default preloads', err);
                    renderBlessings(DEFAULT_WISHES);
                });
        }
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    rsvpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('guestName').value.trim();
        const status = rsvpStatus.value;
        const guests = status === 'yes' ? document.getElementById('guestsCount').value : '0';
        const message = document.getElementById('guestMessage').value.trim();

        if (!name) return;

        const newWish = { name, status, guests, message };

        if (GOOGLE_SHEET_URL) {
            fetch(GOOGLE_SHEET_URL, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'text/plain' }, // Bypass preflight request
                body: JSON.stringify(newWish)
            })
            .then(res => {
                if (!res.ok) throw new Error('Apps Script error');
                return res.json();
            })
            .then(data => {
                loadBlessings();
                rsvpForm.reset();
                guestsCountGroup.style.display = 'block';
                showToast("RSVP Saved! Thank you for responding.");
            })
            .catch(err => {
                console.error('Error saving RSVP to Google Sheet:', err);
                showToast("Server error. Saving locally...");
                
                // Fallback to local storage
                let wishes = JSON.parse(localStorage.getItem('engagement_wishes')) || [];
                wishes.unshift(newWish);
                localStorage.setItem('engagement_wishes', JSON.stringify(wishes));
                loadBlessings();
                rsvpForm.reset();
                guestsCountGroup.style.display = 'block';
            });
        } else if (isLocalFile) {
            let wishes = JSON.parse(localStorage.getItem('engagement_wishes')) || [];
            wishes.unshift(newWish); // Add to beginning of list
            localStorage.setItem('engagement_wishes', JSON.stringify(wishes));

            loadBlessings();
            rsvpForm.reset();
            guestsCountGroup.style.display = 'block'; // Reset display state
            showToast("RSVP Submitted! Thank you for responding.");
        } else {
            fetch('/api/rsvp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newWish)
            })
            .then(res => {
                if (!res.ok) throw new Error('Server error');
                return res.json();
            })
            .then(data => {
                loadBlessings();
                rsvpForm.reset();
                guestsCountGroup.style.display = 'block';
                showToast("RSVP Saved! Thank you for responding.");
            })
            .catch(err => {
                console.error('Error saving RSVP to server:', err);
                showToast("Server error. Saving locally...");
                
                // Fallback to local storage
                let wishes = JSON.parse(localStorage.getItem('engagement_wishes')) || [];
                wishes.unshift(newWish);
                localStorage.setItem('engagement_wishes', JSON.stringify(wishes));
                loadBlessings();
                rsvpForm.reset();
                guestsCountGroup.style.display = 'block';
            });
        }
    });

    loadBlessings(); // Initial load

    // -------------------------------------------------------------
    // 6. FLOATING PARTICLES CANVAS ANIMATION
    // -------------------------------------------------------------
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * -canvas.height;
            this.size = Math.random() * 8 + 4;
            this.speedY = Math.random() * 1.5 + 0.8;
            this.speedX = Math.random() * 0.8 - 0.4;
            this.type = Math.random() > 0.4 ? 'petal' : 'gold'; // Petals vs gold dust
            
            // For swaying motion
            this.angle = Math.random() * Math.PI * 2;
            this.angleSpeed = Math.random() * 0.02 + 0.01;
            
            // Color variations
            this.alpha = Math.random() * 0.6 + 0.4;
            if (this.type === 'petal') {
                const colors = ['#8c1c30', '#a6243b', '#c23c52', '#d4576c'];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            } else {
                this.color = '#d4af37'; // Gold
            }
        }

        update() {
            this.y += this.speedY;
            this.angle += this.angleSpeed;
            this.x += Math.sin(this.angle) * 0.5 + this.speedX;

            // Reset when falling off bottom
            if (this.y > canvas.height + 15) {
                this.y = -15;
                this.x = Math.random() * canvas.width;
                this.speedY = Math.random() * 1.5 + 0.8;
                this.alpha = Math.random() * 0.6 + 0.4;
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.globalAlpha = this.alpha;

            if (this.type === 'petal') {
                // Drawing an elegant curved rose petal
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(this.size / 2, -this.size, this.size, 0);
                ctx.quadraticCurveTo(this.size / 2, this.size, 0, 0);
                ctx.closePath();
                ctx.fill();
            } else {
                // Drawing a glowing gold dust particle
                ctx.shadowBlur = 6;
                ctx.shadowColor = '#fff5b7';
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.size / 4, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // Initialize particles based on screen width
    const particleCount = Math.min(60, Math.floor(window.innerWidth / 15));
    for (let i = 0; i < particleCount; i++) {
        const p = new Particle();
        // Distribute them evenly vertically at first so they don't all cluster at the top
        p.y = Math.random() * canvas.height;
        particles.push(p);
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        animationFrameId = requestAnimationFrame(animate);
    }

    // -------------------------------------------------------------
    // 7. ADMIN DASHBOARD TOGGLE & RENDERING
    // -------------------------------------------------------------
    const urlParams = new URLSearchParams(window.location.search);
    const isAdmin = urlParams.get('admin') === 'true';
    const adminDashboard = document.getElementById('adminDashboard');
    const closeAdminBtn = document.getElementById('closeAdminBtn');
    
    if (isAdmin && adminDashboard) {
        adminDashboard.style.display = 'flex';
        setupAdminDashboard();
    }

    if (closeAdminBtn) {
        closeAdminBtn.addEventListener('click', () => {
            adminDashboard.style.display = 'none';
        });
    }

    function setupAdminDashboard() {
        const statAttending = document.getElementById('statAttending');
        const statDeclined = document.getElementById('statDeclined');
        const statTotal = document.getElementById('statTotal');
        const adminTableBody = document.getElementById('adminTableBody');

        function populateAdminData(wishes) {
            let attendingCount = 0;
            let declinedCount = 0;
            let totalGuestsCount = 0;

            adminTableBody.innerHTML = '';
            wishes.forEach(wish => {
                const tr = document.createElement('tr');
                const isYes = wish.status === 'yes';
                
                if (isYes) {
                    attendingCount++;
                    const count = parseInt(wish.guests) || 1;
                    totalGuestsCount += count;
                } else {
                    declinedCount++;
                }

                tr.innerHTML = `
                    <td style="font-weight: 600; color: var(--color-primary);">${escapeHTML(wish.name)}</td>
                    <td><span class="blessing-badge ${isYes ? 'badge-attending' : 'badge-declined'}">${isYes ? 'Attending' : 'Declined'}</span></td>
                    <td>${isYes ? wish.guests : '0'}</td>
                    <td style="font-style: italic; color: var(--color-text-muted);">${escapeHTML(wish.message || '-')}</td>
                `;
                adminTableBody.appendChild(tr);
            });

            statAttending.textContent = totalGuestsCount;
            statDeclined.textContent = declinedCount;
            statTotal.textContent = wishes.length;
        }

        if (GOOGLE_SHEET_URL) {
            fetch(GOOGLE_SHEET_URL)
                .then(res => res.json())
                .then(wishes => populateAdminData(wishes))
                .catch(err => {
                    console.error('Error fetching admin data from Google Sheet:', err);
                });
        } else if (isLocalFile) {
            const wishes = JSON.parse(localStorage.getItem('engagement_wishes')) || DEFAULT_WISHES;
            populateAdminData(wishes);
        } else {
            fetch('/api/rsvps')
                .then(res => res.json())
                .then(wishes => populateAdminData(wishes))
                .catch(err => {
                    console.error('Error fetching admin data:', err);
                });
        }
    }

    animate();
});
