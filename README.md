# Stop-Following-Company

*Stop-Following-Company*; tarayıcı uzantısı olarak çalışır ve kullanıcıların “takip et” (follow) isteği gönderdikleri şirket profillerinden gelen bildirimleri, takip tekliflerini veya benzer araçları durdurmayı amaçlar.  

---

## İçindekiler

•⁠  ⁠[Özellikler](#özellikler)  
•⁠  ⁠[Kurulum](#kurulum)  
•⁠  ⁠[Kullanım](#kullanım)  
•⁠  ⁠[Dosya Yapısı](#dosya-yapısı)  
---

## Özellikler

•⁠  Şirketleri bilinçsizce takip etmeyi engeller.  
•⁠  ⁠Başvuru yaptığımız zaman tarayıcı diline göre eğlenceli bildirimler verir.   
•⁠  ⁠Basit ve hafif; kullanıcı arayüzü minimum düzeyde, yük düşük.  
•⁠  ⁠JavaScript + HTML tabanlı, manifest vX uyumlu tarayıcı uzantısı.  
•⁠  Eklenti günlük takip edilmeyen şirket sayısını bildirim olarak gösterir.
•⁠  Eklentiyi kullanmaya başladıktan sonra başvuru yapılan ve takip edilmeyen şirketlerin listesine erişebilirsiniz. 
---

## Kurulum

1.⁠ ⁠Reposunu bilgisayarına klonla:

   ```bash
   git clone https://github.com/meryemisik/Stop-Following-Company.git
```
## Dosya Yapısı
   ```bash
Stop-Following-Company/
│
├─ manifest.json      # Tarayıcı uzantısı tanımı
├─ background.js      # Arka plan scripti
├─ content.js         # İçerik scripti
├─ popup.html         # Popup arayüzü
├─ styles.css         # Stil dosyaları
├─ messages.js        #  Uyarılar, bildirimler ve metin içerikleri
├─ popup.js           # Popup arayüzündeki UI ve kullanıcı etkileşimleri
└─ README.md          # Proje açıklaması
```