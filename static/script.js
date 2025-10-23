/* ================================================================
   SCRIPT.JS - JAVASCRIPT UNTUK APLIKASI DETEKSI KUALITAS APEL
   ================================================================
   Interaktivitas halaman, manajemen upload, preview, dan prediksi.
   ================================================================ */

// ================================================================
// DEKLARASI VARIABEL - Mengambil elemen HTML
// ================================================================
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const predictButton = document.getElementById('predictButton');
const loading = document.getElementById('loading');
const resultContainer = document.getElementById('resultContainer');
const resetButton = document.getElementById('resetButton');

// ================================================================
// VARIABEL GLOBAL
// ================================================================
let selectedFile = null;

// ================================================================
// EVENT LISTENERS
// ================================================================

// Klik Upload Area: Memicu klik pada input file tersembunyi
uploadArea.addEventListener('click', () => fileInput.click());

// Drag Over: Mengubah styling saat file di-drag ke atas area
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

// Drag Leave: Mengembalikan styling saat file keluar dari area
uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

// Drop: Memproses file yang di-drop
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    
    if (file && file.type.startsWith('image/')) {
        handleFile(file);
    }
});

// File Input Change: Memproses file yang dipilih dari file picker
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
});

// Predict Button Click: Mengirim gambar ke backend untuk prediksi
predictButton.addEventListener('click', async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    predictButton.style.display = 'none';
    loading.style.display = 'block';
    resultContainer.style.display = 'none';

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        loading.style.display = 'none';
        showResult(data);
        
    } catch (error) {
        loading.style.display = 'none';
        showResult({
            detected: false,
            description: 'Terjadi kesalahan saat memproses gambar.'
        });
    }
});

// Reset Button Click: Mengembalikan tampilan ke kondisi awal
resetButton.addEventListener('click', () => {
    fileInput.value = '';
    selectedFile = null;
    
    previewContainer.style.display = 'none';
    predictButton.style.display = 'none';
    resultContainer.style.display = 'none';
    resetButton.style.display = 'none';
    uploadArea.style.display = 'block';
});

// ================================================================
// FUNGSI UTAMA
// ================================================================

/**
 * Memproses file gambar yang dipilih:
 * 1. Menyimpan file
 * 2. Menampilkan preview gambar
 * 3. Mengubah visibilitas elemen UI
 * @param {File} file - File object dari input atau drag-drop.
 */
function handleFile(file) {
    selectedFile = file;
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        
        previewContainer.style.display = 'block';
        predictButton.style.display = 'block';
        uploadArea.style.display = 'none';
        resultContainer.style.display = 'none';
        resetButton.style.display = 'none';
    };
    
    reader.readAsDataURL(file);
}

/**
 * Menampilkan hasil prediksi dari backend:
 * Mengubah konten dan styling resultContainer berdasarkan data.
 * @param {object} data - Object berisi hasil prediksi ({detected: boolean, description: string, ...}).
 */
function showResult(data) {
    resultContainer.style.display = 'block';
    resetButton.style.display = 'block';

    if (data.detected) {
        resultContainer.className = 'result-container result-success';
        
        // Logika rekomendasi untuk kemudahan
        const rekomendasi = data.confidence >= 80 ? 
                            'Hasil prediksi sangat akurat. Apel dapat dikategorikan dengan percaya diri.' :
                            data.confidence >= 50 ?
                            'Hasil prediksi cukup akurat. Pertimbangkan untuk verifikasi manual jika diperlukan.' :
                            'Hasil prediksi kurang akurat. Disarankan untuk mengambil foto ulang dengan pencahayaan lebih baik.';
        
        resultContainer.innerHTML = `
            <div class="result-icon">✅</div>
            <div class="result-title">${data.object} Terdeteksi!</div>

            
            <div class="result-stats">
                <div class="stat-box">
                    <div class="stat-label">Jumlah Apel</div>
                    <div class="stat-value">${data.count}</div>
                </div>
                
                <div class="stat-box">
                    <div class="stat-label">Tingkat Kepercayaan</div>
                    <div class="stat-value">${data.confidence}%</div>
                </div>
            </div>
            
            <div class="detailed-result">
                <div class="result-item">
                    <div class="result-label">📊 Analisis Hasil:</div>
                    <div class="result-value">
                        Model AI berhasil mendeteksi ${data.count} apel dengan tingkat kepercayaan ${data.confidence}%.
                        Semakin tinggi persentase, semakin akurat prediksi model.
                    </div>
                </div>
                <div class="result-item">
                    <div class="result-label">💡 Penjelasan:</div>
                    <div class="result-value">
                        Confidence score menunjukkan seberapa yakin model dalam membuat prediksi.
                        Score di atas 80% dianggap sangat akurat.
                    </div>
                </div>
                <div class="result-item">
                    <div class="result-label">🎯 Rekomendasi:</div>
                    <div class="result-value">${rekomendasi}</div>
                </div>
            </div>
        `;
        
    } else {
        resultContainer.className = 'result-container result-fail';
        
        resultContainer.innerHTML = `
            <div class="result-icon">❌</div>
            <div class="result-title">Tidak Ada Apel Terdeteksi</div>
            <div class="result-details">${data.description}</div>
            
            <div class="detailed-result">
                <div class="result-item">
                    <div class="result-label">⚠️ Kemungkinan Penyebab:</div>
                    <div class="result-value">
                        <ul style="margin-left: 20px; margin-top: 10px;">
                            <li>Gambar tidak mengandung apel</li>
                            <li>Apel terlalu kecil atau tidak jelas</li>
                            <li>Pencahayaan terlalu gelap atau terang</li>
                        </ul>
                    </div>
                </div>
                <div class="result-item">
                    <div class="result-label">💡 Saran Perbaikan:</div>
                    <div class="result-value">
                        <ul style="margin-left: 20px; margin-top: 10px;">
                            <li>Pastikan gambar berisi apel yang jelas</li>
                            <li>Ambil foto dengan pencahayaan yang baik</li>
                            <li>Pastikan apel terlihat penuh dalam frame</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
}