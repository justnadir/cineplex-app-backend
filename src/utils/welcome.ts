export const welcome = () => {
  return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <title>Welcome to the Backend</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="icon" href="/favicon.ico" sizes="any">
            <link rel="icon" type="image/png" href="/favicon.png">
            <link rel="apple-touch-icon" href="/apple-touch-icon.png">
            <!-- Google Font -->
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

            <style>
                :root {
                    --bg: #070707;
                    --card: #0f0f0f;
                    --border: #1c1c1c;
                    --text: #eaeaea;
                    --muted: #9b9b9b;
                    --accent: #ff9f1c;
                    --green: #3cff7f;
                    --glow: rgba(255, 159, 28, 0.35);
                }

                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Inter', sans-serif;
                }

                body {
                    background:
                        radial-gradient(circle at top, #111 0%, #070707 60%),
                        repeating-linear-gradient(
                        90deg,
                        rgba(255,255,255,0.02) 0,
                        rgba(255,255,255,0.02) 1px,
                        transparent 1px,
                        transparent 40px
                    );
                    color: var(--text);
                    min-height: 100vh;
                    padding: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .dashboard {
                    max-width: 1300px;
                    margin: auto;
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 24px;
                }

                .card {
                    background: linear-gradient(180deg, #0f0f0f, #0b0b0b);
                    border: 1px solid var(--border);
                    border-radius: 18px;
                    padding: 28px;
                    position: relative;
                    box-shadow: 0 0 40px rgba(0,0,0,0.6);
                }

                /* SERVER STATUS */
                .status small {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--muted);
                    letter-spacing: 1px;
                }

                .dot {
                    width: 10px;
                    height: 10px;
                    background: var(--green);
                    border-radius: 50%;
                    box-shadow: 0 0 10px var(--green);
                }

                .status h1 {
                    margin-top: 20px;
                    font-size: 56px;
                    line-height: 1.1;
                }

                .status h1 span {
                    color: var(--accent);
                }

                .live {
                    position: absolute;
                    bottom: 24px;
                    left: 28px;
                    right: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    color: var(--green);
                    font-size: 13px;
                    letter-spacing: 3px;
                }

                .live::before, .live::after {
                    content: "";
                    flex: 1;
                    height: 1px;
                    background: rgba(60,255,127,0.3);
                }

                .time {
                    width: 385px;
                }

                /* TIME CARD */
                .time small {
                    color: var(--muted);
                }

                .time h2 {
                    margin-top: 10px;
                    font-size: 45px;
                    letter-spacing: 3px;
                }

                .time span {
                    color: var(--accent);
                    font-size: 18px;
                    margin-left: 6px;
                }

                .date {
                    margin-top: 10px;
                    color: var(--accent);
                    font-size: 14px;
                    letter-spacing: 1px;
                }

                /* FEATURES */
                .features {
                    grid-column: 1 / -1;
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                }

                .feature {
                    text-align: center;
                }

                .feature h4 {
                    margin-top: 12px;
                    font-size: 15px;
                }
        
                .feature h1 {
                    font-size: 45px;
                }

                .feature p {
                    margin-top: 4px;
                    color: var(--muted);
                    font-size: 13px;
                }

                /* POWERED BY */
                .powered {
                    grid-column: 1 / 2;
                }

                .powered h4 {
                    color: var(--muted);
                    font-size: 12px;
                    letter-spacing: 2px;
                    margin-bottom: 16px;
                }

                .tech {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 14px;
                }

                .tech div {
                    text-align: center;
                    padding: 12px;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    font-size: 12px;
                    color: var(--muted);
                }

                /* AUTHOR */
                .author {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .author h3 {
                    text-align: center;
                }
                

                .author p {
                    color: var(--muted);
                    font-size: 13px;
                }

                .author h3 {
                    margin: 10px 0;
                    color: var(--accent);
                }

                .badge {
                    display: inline-block;
                    padding: 6px 14px;
                    border-radius: 20px;
                    background: rgba(255,159,28,0.15);
                    border: 1px solid rgba(255,159,28,0.4);
                    color: var(--accent);
                    font-size: 12px;
                }

                /* FOOTER STRIP */
                .footer {
                    grid-column: 1 / -1;
                    margin-top: 10px;
                    display: flex;
                    gap: 24px;
                    justify-content: center;
                    color: var(--muted);
                    font-size: 13px;
                    flex-wrap: wrap;
                }

                .footer span {
                    color: var(--accent);
                }

                @media (max-width: 900px) {
                    .dashboard {
                        grid-template-columns: 1fr;
                    }
                    .features {
                        grid-template-columns: 1fr 1fr;
                    }
                    .tech {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }

                .dot {
                    width: 10px;
                    height: 10px;
                    background: var(--green);
                    border-radius: 50%;
                    box-shadow: 0 0 10px var(--green);
                    animation: pulse 1.5s infinite;
                }

                @keyframes pulse {
                    0% {
                        transform: scale(0.9);
                        box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.7);
                    }

                    70% {
                        transform: scale(1);
                        box-shadow: 0 0 0 10px rgba(0, 255, 0, 0);
                    }

                    100% {
                        transform: scale(0.9);
                        box-shadow: 0 0 0 0 rgba(0, 255, 0, 0);
                    }
                }
            </style>
        </head>
        <body>
            <div class="dashboard">
                <!-- SERVER STATUS -->
                <div class="card status">
                <small>
                    <div class="dot"></div>
                    CINEPLEX WEB SYSTEM STATUS
                </small>

                <h1>
                    🚀 <span>SERVER ONLINE</span><br>
                </h1>

                <div class="live">LIVE & ACTIVE</div>
            </div>

            <!-- TIME -->
            <div class="card time">
                <small id="location"></small>
                <br>
                <small id="greeting"></small>
                <h2 id="clock"></h2>
                <div class="date" id="today"></div>
            </div>

            <!-- FEATURES -->
            <div class="features">
                <div class="card feature">
                    <h1>⚡</h1>
                    <h4>Lightning Fast</h4>
                    <p>Optimized</p>
                </div>

                <div class="card feature">
                    <h1>🛡️</h1>
                    <h4>Secure</h4>
                    <p>Encrypted</p>
                </div>

                <div class="card feature">
                    <h1>🌍</h1>
                    <h4>Global</h4>
                    <p>Worldwide</p>
                </div>

                <div class="card feature">
                    <h1>🎯</h1>
                    <h4>Precise</h4>
                    <p>Accurate</p>
                </div>
            </div>

            <!-- POWERED BY -->
            <div class="card powered">
                <h4>POWERED BY</h4>

                <div class="tech">
                    <div>Node.js</div>
                    <div>TypeScript</div>
                    <div>Express</div>
                    <div>Mongoose</div>
                    <div>MongoDB</div>
                    <div>BullMQ</div>
                    <div>Redis</div>
                    <div>Stripe</div>
                    <div>Docker</div>
                </div>
            </div>

            <!-- AUTHOR -->
            <div class="card author">
                <div>
                    <h3>Nadir Hossain</h3>
                    <div class="badge">&lt;/&gt; Backend Developer</div>
                </div>
            </div>

        </div>

        <script>
            function updateTime() {
                const now = new Date();

                // time (auto locale + auto 12/24 based on user country)
                const timeStr = new Intl.DateTimeFormat(navigator.language, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }).format(now);

                // date (auto locale)
                const dateStr = new Intl.DateTimeFormat(navigator.language, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }).format(now);

                // greeting
                const hour24 = now.getHours();
                let greeting = "Good Evening! 🌙";
                if (hour24 < 12) greeting = "Good Morning! 🌞";
                else if (hour24 < 18) greeting = "Good Afternoon! 🌤️";

                document.getElementById("clock").textContent = timeStr;
                document.getElementById("today").textContent = dateStr;
                document.getElementById("greeting").textContent = greeting;
            }

            updateTime();
            setInterval(updateTime, 1000);

            document.getElementById("location").textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
        </script>

    </body>
    </html>

    `;
};
