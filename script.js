let images = [];

// Tool navigation
document.querySelectorAll("nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tool").forEach(t => t.classList.remove("active"));
    document.querySelector("#tool-" + btn.dataset.tool).classList.add("active");
  });
});

// Helper: load image as <img>
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------------- Image to PDF ----------------
const pdfInput = document.getElementById("pdfImages");
const pdfPreview = document.getElementById("pdfPreview");

pdfInput.addEventListener("change", e => {
  const files = Array.from(e.target.files);
  if (files.length + images.length > 100) {
    alert("Maximum 100 images allowed!");
    return;
  }
  images.push(...files);
  renderPdfPreview();
});

function renderPdfPreview() {
  pdfPreview.innerHTML = "";
  images.forEach((file, i) => {
    const imgEl = document.createElement("img");
    imgEl.src = URL.createObjectURL(file);

    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.appendChild(imgEl);

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "x";
    removeBtn.style.position = "absolute";
    removeBtn.style.top = "0";
    removeBtn.style.right = "0";
    removeBtn.style.background = "red";
    removeBtn.style.color = "white";
    removeBtn.onclick = () => {
      images.splice(i, 1);
      renderPdfPreview();
    };

    wrapper.appendChild(removeBtn);
    pdfPreview.appendChild(wrapper);
  });
}

document.getElementById("downloadPdf").addEventListener("click", async () => {
  if (!images.length) return alert("Upload images first!");
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  for (let i = 0; i < images.length; i++) {
    const img = await loadImage(images[i]);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let w = img.width, h = img.height;
    const ratio = Math.min(pageWidth / w, pageHeight / h);
    w *= ratio; h *= ratio;
    const x = (pageWidth - w) / 2;
    const y = (pageHeight - h) / 2;
    if (i > 0) pdf.addPage();
    pdf.addImage(img, "JPEG", x, y, w, h);
  }

  const name = prompt("Enter PDF filename:", "images.pdf") || "images.pdf";
  pdf.save(name);
});

// ---------------- Image Compression ----------------
const compressInput = document.getElementById("compressInput");
const compressInfo = document.getElementById("compressInfo");
const compressCanvas = document.getElementById("compressCanvas");
let compressedBlob = null;

compressInput.addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  const img = await loadImage(file);
  const ctx = compressCanvas.getContext("2d");
  compressCanvas.width = img.width;
  compressCanvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  file.arrayBuffer().then(buf => {
    compressInfo.innerHTML = `<p>Original size: ${(buf.byteLength/1024).toFixed(1)} KB</p>`;
  });

  compressCanvas.toBlob(blob => {
    compressedBlob = blob;
    compressInfo.innerHTML += `<p>Compressed size: ${(blob.size/1024).toFixed(1)} KB</p>`;
  }, "image/jpeg", 0.6);
});

document.getElementById("downloadCompressed").addEventListener("click", () => {
  if (!compressedBlob) return alert("Upload an image first!");
  const name = prompt("Enter image filename:", "compressed.jpg") || "compressed.jpg";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(compressedBlob);
  a.download = name;
  a.click();
});

// ---------------- Image to JPG ----------------
document.getElementById("jpgInput").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.width; canvas.height = img.height;
  canvas.getContext("2d").drawImage(img, 0, 0);
  document.getElementById("jpgPreview").innerHTML = `<img src="${canvas.toDataURL("image/jpeg")}">`;
  document.getElementById("downloadJpg").onclick = () => {
    const name = prompt("Enter JPG filename:", "image.jpg") || "image.jpg";
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/jpeg");
    a.download = name;
    a.click();
  };
});

// ---------------- Image to PNG ----------------
document.getElementById("pngInput").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.width; canvas.height = img.height;
  canvas.getContext("2d").drawImage(img, 0, 0);
  document.getElementById("pngPreview").innerHTML = `<img src="${canvas.toDataURL("image/png")}">`;
  document.getElementById("downloadPng").onclick = () => {
    const name = prompt("Enter PNG filename:", "image.png") || "image.png";
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = name;
    a.click();
  };
});

// ---------------- PDF Compression ----------------
document.getElementById("pdfInput").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
  const bytes = await pdfDoc.save({ useObjectStreams: true });
  document.getElementById("pdfInfo").innerHTML = `
    <p>Original size: ${(arrayBuffer.byteLength/1024).toFixed(1)} KB</p>
    <p>Compressed size: ${(bytes.byteLength/1024).toFixed(1)} KB</p>
  `;
  document.getElementById("downloadCompressedPdf").onclick = () => {
    const name = prompt("Enter PDF filename:", "compressed.pdf") || "compressed.pdf";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    a.download = name;
    a.click();
  };
});

