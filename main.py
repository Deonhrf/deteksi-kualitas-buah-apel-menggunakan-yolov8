# Belajar Project Deteksi Kualitas Buah Apel

# import library yang dibutuhkan
from ultralytics import YOLO  # model yang digunakan
import os # untuk memodifikasi direktori/folder
import shutil # menyalin/menghapud folder
import cv2 # untuk memproses gambar 


# path model dan folder
train = 'trainset'
results = 'results'
model_path = 'best.pt'

def mesion_buah() :
  model = YOLO(model_path)

  if os.path.exists(results) : # memeriksa apakah folder results ada ?
    shutil.rmtree(results) # hapus dan simpan data baru
    os.makedirs(results) # membuat folder baru

    # memproses gambar 
    for images_name in os.listdir(train) :
      input_path = os.path.join(train, images_name) # menghasil path pada setiap gambar dan nama file 
      output_path = os.path.join(results, images_name) # path hasil gambar 

      # pengecekkan format file 
      if not input_path.lower().endswith(('.png', '.jpg', '.jpeg')) :
        continue


      # memprediksi dan menyimpan gambar 
      try : 
        result = model.predict(source = input_path, conf = 0.5, save=False)
        for i in result :
          annotated_image = i.plot() # gambar yang teladi didekteksi akan ada bounding box serta label 
          cv2.imwrite(output_path, annotated_image) # menyimpan gambar yang telah dianotasikan ke path output
          print(f'Hasil disimpan di{images_name}')

      except Exception as e :
        print(f'Gambar gagal diproses {images_name} : {e}')

if __name__ == '__main__' :
  mesion_buah()



