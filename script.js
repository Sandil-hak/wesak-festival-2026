// ඔයාගේ Google Web App URL එක මෙහි දාන්න.
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby_Tpt6je7BgNMtjidWlMApUCdP1b8DB4jNR720k14B5DhgRAGjbaYd4v02m2_EvpdJfw/exec"; 

let currentUser = "";
let serverData = { events: {thorana: true, pahan: true, koodu: true, bhakthi: true}, songs: [] };
let thoranaInterval;
let currentSongIndex = 0;
let bhakthiPlayer = document.getElementById('bhakthi-player');
let globalAudio = document.getElementById('global-thorana-audio');
let isMuted = false;

// Initial Setup
window.onload = () => { fetchServerData(); setupTreeSlots(); };


//
// සර්වර් එකෙන් හැම වෙලේම රටාව චෙක් කරයි
setInterval(() => {
    fetch("https://script.google.com/macros/s/AKfycby_Tpt6je7BgNMtjidWlMApUCdP1b8DB4jNR720k14B5DhgRAGjbaYd4v02m2_EvpdJfw/exec")
    .then(res => res.text())
    .then(pattern => {
        // අවසාන රටාව දැන් තියෙන එකත් එක්ක වෙනස් නම් විතරක් මාරු කරන්න
        if(currentPattern != pattern) {
            currentPattern = pattern;
            changeThoranaPattern(parseInt(pattern));
        }
    });
}, 2000); // හැම තත්පර 2කට සැරයක්ම

// Admin පැනල් එකෙන් රටාව මාරු කරන විට සර්වර් එකට යැවීම
function adminChangePattern(val) {
    fetch("https://script.google.com/macros/s/AKfycby_Tpt6je7BgNMtjidWlMApUCdP1b8DB4jNR720k14B5DhgRAGjbaYd4v02m2_EvpdJfw/exec", {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ action: "set_pattern", value: val })
    });
}


//


function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    // Thorana background dim & Audio logic
    const darkOverlay = document.getElementById('dark-overlay');
    if (id === 'thorana-screen') {
        darkOverlay.classList.add('active');
        startThoranaLights();
        playThoranaAudio();
    } else {
        darkOverlay.classList.remove('active');
        clearInterval(thoranaInterval);
        globalAudio.pause();
    }
}

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

// ================= FETCH SERVER DATA =================
function fetchServerData() {
    if(SCRIPT_URL === "https://script.google.com/macros/s/AKfycby_Tpt6je7BgNMtjidWlMApUCdP1b8DB4jNR720k14B5DhgRAGjbaYd4v02m2_EvpdJfw/exec") return; // Skip if URL not set
    fetch(SCRIPT_URL)
        .then(res => res.json())
        .then(data => {
            serverData = data;
            applyEventLocks();
            setupBhakthiSongs();
            renderTree(data.kooduList);
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
    }
}

// ================= THORANA =================
function startThoranaLights() {
    let p = 1;
    thoranaInterval = setInterval(() => {
        document.getElementById('t-p1').className = "t-light t-pattern-1" + (p===1 || p===4 ? " light-active":"");
        document.getElementById('t-p2').className = "t-light t-pattern-2" + (p===2 || p===5 ? " light-active":"");
        document.getElementById('t-p3').className = "t-light t-pattern-3" + (p===3 || p===6 ? " light-active":"");
        p = p >= 6 ? 1 : p + 1;
    }, 800);
}

function playThoranaAudio() {
    if(globalAudio.readyState >= 2) {
        // ලෝකේ කොහේ හිටියත් එකම තැනින් ඇහෙන්න සකසන 'Global Sync' ලොජික් එක
        let now = Date.now() / 1000;
        globalAudio.currentTime = now % globalAudio.duration; 
    }
    globalAudio.play().catch(e => console.log("Audio Blocked"));
}

function toggleMute() {
    isMuted = !isMuted;
    globalAudio.muted = isMuted;
    document.getElementById('mute-btn').innerText = isMuted ? "🔇 Unmute" : "🔊 Mute";
}

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyQqbDrOa_58BezB9QXDs9PeLKymi3u9JCknQzDf-acmn4vHolHhVV-VRdjEEt9BfNL/exec";

// තොරණේ තත්ත්වය පරීක්ෂා කිරීම
function checkEventStatus() {
    fetch(WEB_APP_URL)
    .then(res => res.text())
    .then(status => {
        if (status === "OFF") {
            // තොරණ ඕෆ් කරන්න (උදා: ලයිට් නිවීම)
            console.log("Event is currently OFF");
        } else if (status === "UNAVAILABLE") {
            // පද්ධතිය නොමැති බව පෙන්වන්න
            alert("අද දිනයේ තොරණ ප්‍රදර්ශනය නොකෙරේ.");
        } else {
            // තොරණ ක්‍රියාත්මකයි
            console.log("Event is ON");
        }
    });
}

// Admin Panel එකෙන් තත්ත්වය වෙනස් කිරීම
function updateEventStatus(newStatus) {
    fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ action: "update_status", value: newStatus })
    });
}

// තත්පර 5කට වරක් ස්වයංක්‍රීයව පරීක්ෂා කිරීම
setInterval(checkEventStatus, 5000);

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
    kooduList.forEach(k => {
        let slot = document.getElementById("koodu-" + k.slot);
        if(slot) {
            slot.className = "koodu-slot koodu-lit";
            slot.innerText = "🏮";
            slot.onclick = null; // Disable clicking again
        }
    });
}

function hangKoodu(index) {
    let slot = document.getElementById("koodu-" + index);
    slot.className = "koodu-slot koodu-lit";
    slot.innerText = "🏮";
    fetch(SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        body: JSON.stringify({action: 'hang_koodu', username: currentUser, slot: index})
    });
}

// ================= BHAKTHI GEETHA =================
function setupBhakthiSongs() {
    if (serverData.songs.length === 0) return;
    playSong(0);
    
    bhakthiPlayer.addEventListener('ended', () => {
        currentSongIndex = (currentSongIndex + 1) % serverData.songs.length; // Loop effect
        playSong(currentSongIndex);
    });
}

function playSong(index) {
    if(!serverData.songs[index]) return;
    document.getElementById('current-song-title').innerText = "දැන් වාදනය වේ: " + serverData.songs[index].title;
    bhakthiPlayer.src = serverData.songs[index].url;
    bhakthiPlayer.play().catch(e=>console.log("Autoplay issue"));
}

// ================= ADMIN FUNCTIONS =================
function checkAdmin() {
    const pass = document.getElementById('admin-pass').value;
    if (pass === "d3mika@1234") { // සරල මුරපදය
        document.getElementById('adm-thorana').checked = serverData.events.thorana;
        document.getElementById('adm-pahan').checked = serverData.events.pahan;
        document.getElementById('adm-koodu').checked = serverData.events.koodu;
        document.getElementById('adm-bhakthi').checked = serverData.events.bhakthi;
        showScreen('admin-panel');
    } else {
        alert("මුරපදය වැරදියි!");
    }
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
