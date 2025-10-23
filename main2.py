import cv2
from ultralytics import YOLO

def main():
    # Muat model
    model = YOLO('best.pt')

    cap = cv2.VideoCapture(0)  # Load kamera
    if not cap.isOpened():
        print('Tidak bisa membuka kamera webcam')
        return

    while True:
        ret, frame = cap.read()
        if not ret:
            print('Tidak dapat membaca frame')
            break

        # Memprediksi gambar dalam frame
        results = model.predict(source=frame, conf=0.5, save=False)
        annotated_frame = results[0].plot()  # Bounding box & labeling img

        cv2.imshow('Yolov8 Detection', annotated_frame)

        # Keluar webcam
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    print('Proses Selesai')

if __name__ == "__main__":
    main()