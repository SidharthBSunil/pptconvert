const { PDFDocument } = PDFLib;

const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const fileNameDisplay = document.getElementById('fileName');
const status = document.getElementById('status');

// Update UI when file is selected
pdfInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        fileNameDisplay.innerText = e.target.files[0].name;
        processBtn.disabled = false;
    }
});

processBtn.addEventListener('click', async () => {
    const file = pdfInput.files[0];
    if (!file) return;

    status.innerText = "Processing... please wait.";
    processBtn.disabled = true;

    try {
        const arrayBuffer = await file.arrayBuffer();
        const srcDoc = await PDFDocument.load(arrayBuffer);
        const outDoc = await PDFDocument.create();

        const pages = srcDoc.getPages();
        
        // Loop through pages in pairs
        for (let i = 0; i < pages.length; i += 2) {
            // Get original page dimensions
            const page1 = pages[i];
            const { width, height } = page1.getSize();

            // Create new page with double height (Portrait stack)
            const newPage = outDoc.addPage([width, height * 2]);

            // Embed the original pages into the new document
            const [embeddedPage1] = await outDoc.embedPages([pages[i]]);
            
            // Draw First Slide on TOP (y-axis starts at bottom, so move it up by 'height')
            newPage.drawPage(embeddedPage1, {
                x: 0,
                y: height,
                width: width,
                height: height,
            });

            // Draw Second Slide on BOTTOM (if it exists)
            if (i + 1 < pages.length) {
                const [embeddedPage2] = await outDoc.embedPages([pages[i + 1]]);
                newPage.drawPage(embeddedPage2, {
                    x: 0,
                    y: 0,
                    width: width,
                    height: height,
                });
            }
        }

        // Generate PDF bytes and trigger download
        const pdfBytes = await outDoc.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "combined_2up.pdf";
        link.click();

        status.innerText = "Done! Your download should start.";
    } catch (err) {
        console.error(err);
        status.innerText = "Error processing PDF.";
    } finally {
        processBtn.disabled = false;
    }
});