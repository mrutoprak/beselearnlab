import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // Sadece POST isteklerine izin ver
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    // 1. İstek gövdesinden lisans anahtarını al
    const { licenseKey } = req.body;

    if (!licenseKey) {
      return res.status(400).json({ success: false, message: 'Lisans kodu gerekli' });
    }

    // 2. licenses.json dosyasını oku
    // process.cwd() Vercel'de projenin kök dizinini verir
    const filePath = path.resolve(process.cwd(), 'api/licenses.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const licenses = JSON.parse(fileData);

    // 3. Lisansı bul
    const foundLicense = licenses.find(license => license.key === licenseKey);

    if (!foundLicense) {
      return res.status(401).json({ success: false, message: 'Geçersiz lisans kodu' });
    }

    // 4. Lisansın son kullanma tarihini kontrol et
    const today = new Date();
    const expiryDate = new Date(foundLicense.expiryDate);

    // Tarih karşılaştırması için saat, dakika ve saniyeleri sıfırla
    today.setHours(0, 0, 0, 0);
    
    // Eğer 'bugün' son kullanma tarihinden 'büyükse', lisansın süresi dolmuştur
    if (today > expiryDate) {
      return res.status(401).json({ success: false, message: 'Lisansınızın süresi dolmuş' });
    }

    // 5. Her şey yolundaysa başarı mesajı döndür
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error(error); // Hatayı Vercel loglarına yazdır
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
}
