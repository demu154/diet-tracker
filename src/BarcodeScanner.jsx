import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const BarcodeScanner = ({ onScanSuccess }) => {
  const [qrCodeScanner, setQrCodeScanner] = useState(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    setQrCodeScanner(html5QrCode);

    // Proviamo comunque ad avviare lo scanner live
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 120 } },
      (decodedText) => {
        html5QrCode.stop().then(() => onScanSuccess(decodedText)).catch(console.error);
      },
      (errorMessage) => {} // Ignoriamo gli errori di scansione a vuoto
    ).catch(err => console.error("Video live fallito:", err));

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, []);

  // IL TRUCCO PER IPHONE: Analizza una foto scattata in alta risoluzione
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !qrCodeScanner) return;

    try {
      // Se il video sta andando, lo fermiamo
      if (qrCodeScanner.isScanning) {
        await qrCodeScanner.stop();
      }
      // Legge il codice direttamente dall'immagine in altissima qualità
      const decodedText = await qrCodeScanner.scanFile(file, true);
      onScanSuccess(decodedText);
    } catch (err) {
      alert("Non sono riuscito a trovare il codice nella foto. Assicurati che non ci siano riflessi e che sia ben a fuoco!");
    }
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '2px solid #007bff' }}>
      
      {/* BOTTONE MAGICO CHE APRE LA FOTOCAMERA NATIVA DI IOS */}
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <p style={{fontSize: '0.9em', color: '#333', marginBottom: '10px'}}>
          Non legge? Usa la fotocamera nativa dell'iPhone:
        </p>
        <label style={{
          backgroundColor: '#ff3b30', color: 'white', padding: '12px 20px', 
          borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-block',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          📸 Scatta una Foto al Codice
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            onChange={handleImageUpload}
            style={{ display: 'none' }} 
          />
        </label>
      </div>

      <div id="reader" style={{ width: '100%', borderRadius: '8px', overflow: 'hidden' }}></div>
    </div>
  );
};

export default BarcodeScanner;