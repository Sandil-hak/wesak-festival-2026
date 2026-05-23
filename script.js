// ඔයාගේ Google Web App URL එක
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwOR4jWSBdjB5cmUpPzSw0A017nDJqkueDEptdbK3uj2rgIR82g1lqujVhT5tpGpRdCmA/exec"; 

let currentUser = "";
let serverData = { events: {thorana: true, pahan: true, koodu: true, bhakthi: true}, songs: [] };
let thoranaInterval;
let currentSongIndex = 0;
let bhakthiPlayer = document.getElementById('bhakthi-player');
let globalAudio = document.getElementById('global-thorana-audio');
let isMuted = false;

// Initial Setup
window.onload = () => { 
    fetchServerData(); 
    setupTreeSlots(); 
    // හැම තත්පර 5කට වරක්ම සර්වර් එකෙන් Status එක චෙක් කරන්න (Real-time update)
    setInterval(fetchServerData, 5000); 
};

// ================= STATUS & EVENT LOCKS (REAL-TIME) =================
function fetchServerData() {
    fetch(SCRIPT_URL)
        .then(res => res.json())
        .then(data => {
            serverData = data;
            applyEventLocks();
            // UNAVAILABLE පණිවිඩය සඳහා පරීක්ෂාව
            checkGlobalAvailability(data.status);
            if(data.songs) setupBhakthiSongs();
            if(data.kooduList) renderTree(data.kooduList);
        }).catch(e => console.log("Fetch Error", e));
}

function checkGlobalAvailability(status) {
    if (status === "UNAVAILABLE") {
        document.body.innerHTML = "<h1 style='text-align:center; margin-top:20%; color:red;'>අද දිනයේ තොරණ ප්‍රදර්ශනය නොකෙරේ. 🙏</h1>";
    }
}

function applyEventLocks() {
    const e = serverData.events;
    setBtnState('btn-thorana', e.thorana, "🏮 සජීවී තොරණ");
    setBtnState('btn-pahan', e.pahan, "🪔 ඩිජිටල් පහන් පූජාව");
    setBtnState('btn-koodu', e.koodu, "🌲 වෙසක් ගස");
    setBtnState('btn-bhakthi', e.bhakthi, "🎶 බැති ගී");
}

function setBtnState(id, isAvailable, text) {
    const btn = document.getElementById(id);
    if(btn) {
        btn.disabled = !isAvailable;
        btn.innerHTML = isAvailable ? text : `${text} <span style='color:red;font-size:12px;'>🔒 Unavailable</span>`;
    }
}

// ================= SCREEN & AUTH =================
function showScreen(id) {
    // තොරණ ඕෆ් කරලා නම්, තොරණ ස්ක්‍රීන් එකට යන්න දෙන්න එපා
    if (id === 'thorana-screen' && !serverData.events.thorana) {
        alert("සමාවන්න, තොරණ දැනට ක්‍රියා විරහිතයි.");
        return;
    }
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    const darkOverlay = document.getElementById('dark-overlay');
    if (id === 'thorana-screen') {
        darkOverlay.classList.add('active');
        startThoranaLights();
        playThoranaAudio();
    } else {
        darkOverlay.classList.remove('active');
        clearInterval(thoranaInterval);
        if(globalAudio) globalAudio.pause();
    }
}

function loginUser() {
    const name = document.getElementById('username-input').value.trim();
    if (!name) return alert("කරුණාකර නම ඇතුළත් කරන්න.");
    currentUser = name;
    document.getElementById('welcome-text').innerText = `ආයුබෝවන් ${currentUser}!`;
    
    fetch(SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        body: JSON.stringify({action: 'login', username: currentUser})
    });
    
    applyEventLocks();
    showScreen('dashboard-screen');
}

// ================= THORANA & OTHER FUNCTIONS (එලෙසම තබා ගන්න) =================
function startThoranaLights() {
    let p = 1;
    thoranaInterval = setInterval(() => {
        let p1 = document.getElementById('t-p1');
        let p2 = document.getElementById('t-p2');
        let p3 = document.getElementById('t-p3');
        if(p1) p1.className = "t-light t-pattern-1" + (p===1 || p===4 ? " light-active":"");
        if(p2) p2.className = "t-light t-pattern-2" + (p===2 || p===5 ? " light-active":"");
        if(p3) p3.className = "t-light t-pattern-3" + (p===3 || p===6 ? " light-active":"");
        p = p >= 6 ? 1 : p + 1;
    }, 800);
}

// ඉතිරි සියලුම ෆන්ෂන්ස් (playThoranaAudio, hangKoodu, adminFunctions ආදිය කලින් තිබූ පරිදිම තබන්න)
// ...
