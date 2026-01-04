// 1. Initialize the QR Code with default settings
// We use the same Sage Green (#4E7052) we set in the HTML so it matches.
const qrCode = new QRCodeStyling({
    width: 300,
    height: 300,
    type: "svg", // "svg" renders faster and looks sharper in the browser
    data: "https://example.com",
    image: "",
    dotsOptions: {
        color: "#4E7052",
        type: "rounded" // "rounded" looks more modern than square
    },
    backgroundOptions: {
        color: "#ffffff",
    },
    imageOptions: {
        crossOrigin: "anonymous",
        margin: 10 // Gives the logo some breathing room
    }
});

// 2. Render the QR code immediately on screen
qrCode.append(document.getElementById("qr-code"));

// --- LIVE PREVIEW LOGIC ---

// A. Text Input Listener
// When the user types, we update the QR data instantly
document.getElementById("data-input").addEventListener("input", function(event) {
    qrCode.update({
        data: event.target.value
    });
});

// B. Color Listeners
// Update dots color
document.getElementById("dots-color").addEventListener("input", function(event) {
    qrCode.update({
        dotsOptions: {
            color: event.target.value
        }
    });
});

// Update background color
document.getElementById("bg-color").addEventListener("input", function(event) {
    qrCode.update({
        backgroundOptions: {
            color: event.target.value
        }
    });
});
// --- Body Patterns (Fix) ---
// 1. Select the DIVs (the cards), not the IMAGES
const patternItems = document.querySelectorAll('.pattern-item');

function selectPattern(pattern) {
    // Update the QR Code
    qrCode.update({
        dotsOptions: { type: pattern }
    });

    // Update the visual "Selected" green border
    patternItems.forEach(item => {
        if (item.dataset.pattern === pattern) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

// 2. Add Click Listeners to the CARDS
patternItems.forEach(item => {
    item.addEventListener('click', () => {
        // Read the data-pattern from the div we just clicked
        const p = item.dataset.pattern;
        selectPattern(p);
    });
});

// Set initial selected pattern
selectPattern('rounded');

// --- LOGO EMBEDDING LOGIC ---

// C. File Upload Listener
document.getElementById("logo-input").addEventListener("change", function(event) {
    const file = event.target.files[0];
    
    if (!file) return; // Stop if no file was selected

    // Create a FileReader to read the image file
    const reader = new FileReader();

    // When the file is done reading...
    reader.onload = function() {
        // ...pass the result (the image data) to the QR code
        qrCode.update({
            image: reader.result
        });
    };

    // Start reading the file as a Data URL (base64 string)
    reader.readAsDataURL(file);
});

// --- DOWNLOAD LOGIC ---

// D. Download Dropdown + single button
// --- NEW DOWNLOAD LOGIC ---
document.getElementById("btn-download").addEventListener("click", async () => {
    const format = document.getElementById("download-format").value;

    if (format === "pdf") {
        // 1. PDF requires special handling (converting image to PDF doc)
        const blob = await qrCode.getRawData("png");
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function() {
            const base64data = reader.result;
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            // Add image to PDF (centered)
            doc.text("Scan this QR Code:", 20, 20);
            // Fit image width to page (leave margins)
            const pageWidth = doc.internal.pageSize.getWidth();
            const imgWidth = pageWidth - 40;
            doc.addImage(base64data, "PNG", 20, 30, imgWidth, imgWidth);
            doc.save("QR_Code.pdf");
        };
    } else {
        // 2. Standard formats (PNG, JPG, SVG) use the library directly
        let ext = format === 'jpeg' ? 'jpg' : format;
        qrCode.download({ name: "my-qr-code", extension: ext });
    }
});