// 🏮 ඔයාගේ අලුත්ම Google Web App URL එක
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxZRl2PmsPGWi8Mt1E9irO150OUclI-CLUAIlE5BOYm-2h0nOYZRDHx7mNAjnBnc-wwpg/exec"; 

let currentUser = "";
let serverData = { status: "ON", events: {thorana: true, pahan: true, koodu: true, bhakthi: true}, songs: [], kooduList: [] };
let thoranaInterval;
let currentSongIndex = 0;
let bhakthiPlayer = document.getElementById('bhakthi-player');
let globalAudio = document.getElementById('global-thorana-audio');
let isMuted = false;

// Initial Setup
window.onload = () => { 
    fetchServerData(); 
    setupTreeSlots(); 
    // තත්පර 5කට වරක් සර්වර් එකෙන් Status සහ අනෙකුත් සියලු දත්ත Real-time පරීක්ෂා කිරීම
    setInterval(fetchServerData, 5000); 
};

// ================= SCREEN CONTROL =================
function showScreen(id) {
    // තොරණ OFF කරලා නම්, තොරණ ස්ක්‍රීන් එකට යන්න නොදේ
    if (id === 'thorana-screen' && !serverData.events.thorana) {
        alert("සමාවන්න, තොරණ දැනට ක්‍රියා විරහිතයි.");
        return;
    }

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    // Thorana background dim & Audio logic
    const darkOverlay = document.getElementById('dark-overlay');
    if (id === 'thorana-screen') {
        if(darkOverlay) darkOverlay.classList.add('active');
        startThoranaLights();
        playThoranaAudio();
    } else {
        if(darkOverlay) darkOverlay.classList.remove('active');
        clearInterval(thoranaInterval);
        if(globalAudio) globalAudio.pause();
    }
}

// ================= AUTHENTICATION =================
function loginUser() {
    const name = document.getElementById('username-input').value.trim();
    if (!name) return alert("කරුණාකර නම ඇතුළත් කරන්න.");
    currentUser = name;
    document.getElementById('welcome-text').innerText = `ආයුබෝවන් ${currentUser}!`;
    
    // Save to sheet
    fetch(SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        body: JSON.stringify({action: 'login', username: currentUser})
    });
    
    applyEventLocks();
    showScreen('dashboard-screen');
}

function logout() { currentUser = ""; showScreen('login-screen'); }

// ================= FETCH SERVER DATA (REAL-TIME STATUS CHECK) =================
function fetchServerData() {
    fetch(SCRIPT_URL)
        .then(res => res.json())
        .then(data => {
            serverData = data;
            
            // 1. Global Availability (UNAVAILABLE) පරීක්ෂාව
            if (data.status === "UNAVAILABLE") {
                document.body.innerHTML = "<div style='text-align:center; margin-top:20%; font-family:sans-serif;'><h1 style='color:red;'>අද දිනයේ තොරණ ප්‍රදර්ශනය නොකෙරේ. 🙏</h1><p style='color:#555;'>කරුණාකර පසුව රැඳී සිටින්න.</p></div>";
                return;
            }

            // 2. Event Locks (ON/OFF) පාලනය
            applyEventLocks();
            
            // 3. අනෙකුත් දත්ත අප්ඩේට් කිරීම
            if(data.songs && data.songs.length > 0 && serverData.songs.length === 0) setupBhakthiSongs();
            if(data.kooduList) renderTree(data.kooduList);
            
        }).catch(e => console.log("Fetch Error", e));
}

// ================= EVENT LOCKS (ADMIN CONTROL) =================
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
        
        // යම් හෙයකින් පරිශීලකයා දැනටමත් OFF කරපු Screen එකක ඉන්නවා නම් ඔහුව Dashboard එකට හරවා යවයි
        if(!isAvailable && document.getElementById(id.replace('btn-', '') + '-screen')?.classList.contains('active')) {
            showScreen('dashboard-screen');
        }
    }
}

// ================= THORANA =================
function startThoranaLights() {
    clearInterval(thoranaInterval);
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

function playThoranaAudio() {
    if(!globalAudio) return;
    if(globalAudio.readyState >= 2) {
        let now = Date.now() / 1000;
        globalAudio.currentTime = now % globalAudio.duration; 
    }
    globalAudio.play().catch(e => console.log("Audio Blocked"));
}

function toggleMute() {
    if(!globalAudio) return;
    isMuted = !isMuted;
    globalAudio.muted = isMuted;
    document.getElementById('mute-btn').innerText = isMuted ? "🔇 Unmute" : "🔊 Mute";
}

// ================= PAHAN POOJA =================
function lightMyPahan() {
    document.getElementById('pahan-display').classList.add('lit');
    document.getElementById('pahan-msg').innerText = "සාදු! ඔබ පහනක් දැල්වුවා.";
    fetch(SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        body: JSON.stringify({action: 'light_pahan', username: currentUser})
    });
}

// ================= WESAK KOODU =================
const slotsPositions = [ {t:'20%', l:'30%'}, {t:'40%', l:'70%'}, {t:'60%', l:'20%'}, {t:'75%', l:'60%'} ];

function setupTreeSlots() {
    const container = document.getElementById('tree-container');
    if(!container) return;
    container.innerHTML = "";
    slotsPositions.forEach((pos, i) => {
        let div = document.createElement('div');
        div.className = "koodu-slot";
        div.id = "koodu-" + i;
        div.style.top = pos.t; div.style.left = pos.l;
        div.innerText = "+";
        div.onclick = () => hangKoodu(i);
        container.appendChild(div);
    });
}

function renderTree(kooduList) {
    if(!kooduList) return;
    // මුලින්ම ඔක්කොම ස්ලොට්ස් රීසෙට් කරලා ඉන්නවා සර්වර් දත්ත දාන්න කලින්
    setupTreeSlots(); 
    
    kooduList.forEach(k => {
        let slot = document.getElementById("koodu-" + k.slot);
        if(slot) {
            slot.className = "koodu-slot koodu-lit";
            slot.innerText = "🏮";
            slot.onclick = null; 
        }
    });
}

function hangKoodu(index) {
    let slot = document.getElementById("koodu-" + index);
    if(slot) {
        slot.className = "koodu-slot koodu-lit";
        slot.innerText = "🏮";
    }
    fetch(SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        body: JSON.stringify({action: 'hang_koodu', username: currentUser, slot: index})
    });
}

// ================= BHAKTHI GEETHA =================
function setupBhakthiSongs() {
    if (!bhakthiPlayer || serverData.songs.length === 0) return;
    playSong(0);
    
    bhakthiPlayer.addEventListener('ended', () => {
        currentSongIndex = (currentSongIndex + 1) % serverData.songs.length; 
        playSong(currentSongIndex);
    });
}

function playSong(index) {
    if(!serverData.songs[index] || !bhakthiPlayer) return;
    document.getElementById('current-song-title').innerText = "දැන් වාදනය වේ: " + serverData.songs[index].title;
    bhakthiPlayer.src = serverData.songs[index].url;
    bhakthiPlayer.play().catch(e=>console.log("Autoplay issue"));
}

// ================= ADMIN FUNCTIONS =================
function checkAdmin() {
    const pass = document.getElementById('admin-pass').value;
    if (pass === "d3mika@1234") { 
        document.getElementById('adm-thorana').checked = serverData.events.thorana;
        document.getElementById('adm-pahan').checked = serverData.events.pahan;
        document.getElementById('adm-koodu').checked = serverData.events.koodu;
        document.getElementById('adm-bhakthi').checked = serverData.events.bhakthi;
        showScreen('admin-panel');
    } else {
        alert("මුරපදය වැරදියි!");
    }
}

// Admin පැනල් එකෙන් status එක (ON / OFF / UNAVAILABLE) වෙනස් කිරීමට
function updateGlobalStatus(newStatus) {
    fetch(SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        body: JSON.stringify({action: 'update_status', value: newStatus})
    });
    alert(`පද්ධතියේ තත්ත්වය ${newStatus} ලෙස යාවත්කාලීන කරන ලදී! ✅`);
}

function updateEventSettings() {
    serverData.events = {
        thorana: document.getElementById('adm-thorana').checked,
        pahan: document.getElementById('adm-pahan').checked,
        koodu: document.getElementById('adm-koodu').checked,
        bhakthi: document.getElementById('adm-bhakthi').checked
    };
    fetch(SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        body: JSON.stringify({action: 'update_events', events: serverData.events})
    });
    alert("සැකසුම් සාර්ථකව සුරකින ලදී! 💾");
}

function adminAddSong() {
    const title = document.getElementById('new-song-title').value;
    const url = document.getElementById('new-song-url').value;
    if(title && url) {
        fetch(SCRIPT_URL, {
            method: 'POST', mode: 'no-cors',
            body: JSON.stringify({action: 'add_song', title: title, url: url})
        });
        alert("ගීතය සාර්ථකව එක් කරන ලදී!");
        document.getElementById('new-song-title').value = "";
        document.getElementById('new-song-url').value = "";
    }
}
