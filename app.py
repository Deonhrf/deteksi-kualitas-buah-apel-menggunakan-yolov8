# ari saya mulai dengan memeriksa file-file yang ada.

# Read file:
# app.py
from flask import Flask, render_template, request, jsonify, send_file
from ultralytics import YOLO
import os
import cv2
import numpy as np
from werkzeug.utils import secure_filename
from datetime import datetime
import io

# Inisialisasi Flask
app = Flask(__name__, template_folder='templates', static_folder='static')

# Konfigurasi
UPLOAD_FOLDER = 'uploads'
RESULTS_FOLDER = os.path.join('static', 'results')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

# Buat folder jika belum ada
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Load model YOLO sekali saat startup
try:
    model = YOLO('best.pt')
    print("✓ Model YOLO berhasil dimuat")
except Exception as e:
    print(f"✗ Error loading model: {e}")
    model = None


def allowed_file(filename):
    """Cek apakah file adalah gambar yang diizinkan"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def index():
    """Render halaman utama"""
    return render_template('index1.html')


@app.route('/predict', methods=['POST'])
def predict():
    """Endpoint untuk prediksi gambar"""
    try:
        # Cek apakah file ada di request
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'Tidak ada file yang diunggah'}), 400

        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'File tidak dipilih'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Format file tidak didukung. Gunakan PNG, JPG, atau GIF'}), 400
        
        if model is None:
            return jsonify({'success': False, 'error': 'Model tidak berhasil dimuat'}), 500
        
        # Simpan file sementara
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
        filename = timestamp + filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Jalankan prediksi
        results = model.predict(source=filepath, conf=0.5, save=False)
        
        # Proses hasil prediksi
        result = results[0]
        annotated_image = result.plot()
        
        # Simpan gambar hasil anotasi
        output_filename = 'result_' + filename
        output_path = os.path.join(RESULTS_FOLDER, output_filename)
        cv2.imwrite(output_path, annotated_image)
        
        # Ekstrak informasi deteksi
        detections = []
        if result.boxes is not None:
            boxes = result.boxes
            for i in range(len(boxes)):
                detection = {
                    'class': int(boxes.cls[i].item()),
                    'class_name': result.names[int(boxes.cls[i].item())],
                    'confidence': float(boxes.conf[i].item()),
                    'bbox': boxes.xyxy[i].tolist()
                }
                detections.append(detection)
        
        os.remove(filepath)

        # Siapkan response sesuai dengan HTML
        if detections:
            detected = True
            object_name = detections[0]['class_name']  # Ambil nama kelas pertama
            count = len(detections)
            max_conf = max(d['confidence'] for d in detections) * 100
            description = f"Apel terdeteksi dengan kepercayaan tinggi. Gambar hasil: /static/results/{output_filename}"
        else:
            detected = False
            object_name = ""
            count = 0
            max_conf = 0
            description = "Tidak ada apel yang terdeteksi dalam gambar."

        # Return hasil
        return jsonify({
            'detected': detected,
            'object': object_name,
            'description': description,
            'count': count,
            'confidence': round(max_conf, 1)
        }), 200
    
    except Exception as e:
        print(f"Error dalam prediksi: {e}")
        return jsonify({'success': False, 'error': f'Error: {str(e)}'}), 500


@app.route('/health', methods=['GET'])
def health():
    """Endpoint untuk cek status aplikasi"""
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None
    }), 200


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)