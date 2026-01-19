// 1. Initialize the QR Code with high-quality defaults
const qrCode = new QRCodeStyling({
    width: 400,
    height: 400,
    type: "svg", 
    data: "https://example.com",
    image: "",
    margin: 20,
    dotsOptions: {
        color: "#4E7052", 
        type: "rounded"
    },
    backgroundOptions: {
        color: "#ffffff",
    },
    imageOptions: {
        crossOrigin: "anonymous",
        margin: 10
    }
});

qrCode.append(document.getElementById("qr-code"));

// --- INSTANT LIVE PREVIEW LOGIC ---

const dataInput = document.getElementById("data-input");

// "input" fires on every keystroke for real-time changes
dataInput.addEventListener("input", (event) => {
    const value = event.target.value;
    qrCode.update({
        data: value || " " // Avoid empty data errors
    });
});

// Save to history only when user stops typing or clicks away
dataInput.addEventListener("blur", () => {
    saveToHistory(dataInput.value);
});

document.getElementById("dots-color").addEventListener("input", (e) => {
    qrCode.update({ dotsOptions: { color: e.target.value } });
});

document.getElementById("bg-color").addEventListener("input", (e) => {
    qrCode.update({ backgroundOptions: { color: e.target.value } });
});

// --- PATTERN SELECTION ---
const patternItems = document.querySelectorAll('.pattern-item');
patternItems.forEach(item => {
    item.addEventListener('click', () => {
        const pattern = item.dataset.pattern;
        qrCode.update({ dotsOptions: { type: pattern } });
        patternItems.forEach(p => p.classList.remove('selected'));
        item.classList.add('selected');
    });
});

// --- LOGO UPLOAD ---
document.getElementById("logo-input").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => qrCode.update({ image: reader.result });
        reader.readAsDataURL(file);
    }
});

// --- HISTORY LOGIC (GitHub Pages Friendly) ---
let qrHistory = JSON.parse(localStorage.getItem('qrHistory')) || [];

function saveToHistory(data) {
    if (!data || data.trim() === "" || data === "https://example.com") return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Avoid duplicate consecutive entries
    if (qrHistory.length > 0 && qrHistory[0].fullData === data) return;

    const newEntry = {
        fullData: data,
        displayData: data.length > 25 ? data.substring(0, 25) + '...' : data,
        time: timestamp
    };

    qrHistory.unshift(newEntry);
    if (qrHistory.length > 5) qrHistory.pop();

    localStorage.setItem('qrHistory', JSON.stringify(qrHistory));
    renderHistory();
}

function renderHistory() {
    const historyContainer = document.getElementById("history-list");
    if (!historyContainer) return;

    historyContainer.innerHTML = qrHistory.map((item, index) => `
        <div class="history-item" onclick="loadFromHistory(${index})" style="
            display: flex; justify-content: space-between; align-items: center; 
            padding: 12px; margin-bottom: 8px; background: #fdfdfd; 
            border-radius: 10px; cursor: pointer; border: 1px solid #eee;">
            <div>
                <div style="font-weight: 600; font-size: 14px; color: #4E7052;">${item.displayData}</div>
                <div style="font-size: 11px; color: #999;">${item.time}</div>
            </div>
            <span style="color: #4E7052; font-weight: bold;">Apply</span>
        </div>
    `).join('');
}

window.loadFromHistory = (index) => {
    const item = qrHistory[index];
    dataInput.value = item.fullData;
    qrCode.update({ data: item.fullData });
};

renderHistory();

// --- HIGH QUALITY DOWNLOAD LOGIC ---

document.getElementById("btn-download").addEventListener("click", async () => {
    const format = document.getElementById("download-format").value;
    const btn = document.getElementById("btn-download");
    
    btn.innerText = "Processing...";
    
    try {
        if (format === "pdf") {
            const blob = await qrCode.getRawData("png");
            const base64data = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            
            const margin = 35; 
            const qrSize = pageWidth - (margin * 2);

            doc.setFont("helvetica", "bold");
            doc.setTextColor(78, 112, 82);
            doc.text("Mint QR Code", pageWidth / 2, 30, { align: "center" });

            doc.addImage(base64data, "PNG", margin, 45, qrSize, qrSize);
            
            doc.setFontSize(10);
            doc.setTextColor(160, 160, 160);
            doc.text("Generate your free QR codes with unlimited downloads, no expiration.", pageWidth / 2, 45 + qrSize + 20, { align: "center" });

            doc.save("Mint_QR_Code.pdf");
        } else {
            qrCode.download({ 
                name: "Mint_QR", 
                extension: format === 'jpeg' ? 'jpg' : format,
                width: 1200,
                height: 1200
            });
        }
    } catch (err) {
        console.error(err);
        alert("Download failed.");
    } finally {
        btn.innerText = "Download QR Code";
    }
});

// --- OPTIMIZED VISITOR & LIKE COUNTER ---
window.addEventListener('load', () => {
    
    const NAMESPACE = 'mint-qr-satyam-k'; 

    const visitDisplay = document.getElementById('visit-count');
    const likeDisplay = document.getElementById('like-count');
    const likeBtn = document.getElementById('like-btn');

    // Safe Fetch Function (won't crash if API is down)
    const fetchCount = (type, action) => {
        return fetch(`https://api.counterapi.dev/v1/${NAMESPACE}/${type}/${action}`)
            .then(res => res.json())
            .catch(() => ({ count: 0 })); // Fallback to 0 if offline
    };

    const initStats = async () => {
        if (!visitDisplay || !likeDisplay) return;

        // Fetch visits and likes in parallel
        const [visitData, likeData] = await Promise.all([
            fetchCount('visits', 'up'),
            fetchCount('likes', '')
        ]);

        visitDisplay.innerText = visitData.count || 0;
        likeDisplay.innerText = likeData.count || 0;

        // Restore "Liked" state from previous visits
        if (localStorage.getItem('hasLiked') === 'true') {
            likeBtn.classList.add('liked');
        }
    };

    if (likeBtn) {
        likeBtn.addEventListener('click', () => {
            // Prevent duplicate likes from same user
            if (localStorage.getItem('hasLiked') === 'true') return;

            // Instant UI feedback
            likeBtn.classList.add('liked');
            const current = parseInt(likeDisplay.innerText || 0);
            likeDisplay.innerText = current + 1;
            
            fetchCount('likes', 'up');
            localStorage.setItem('hasLiked', 'true');
        });
    }
    initStats();
});