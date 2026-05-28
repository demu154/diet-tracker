import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const BarcodeScanner = ({ onScanSuccess }) => {
  const [qrCodeScanner, setQrCodeScanner] = useState(null);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    setQrCodeScanner(html5QrCode);

    // Manteniamo la fotocamera live in background per sicurezza
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 120 } },
      (decodedText) => {
        html5QrCode.stop().then(() => onScanSuccess(decodedText)).catch(console.error);
      },
      (errorMessage) => {} 
    ).catch(err => console.error("Video live fallito:", err));

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, []);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      if (qrCodeScanner && qrCodeScanner.isScanning) {
        await qrCodeScanner.stop();
      }

      // Trasformiamo la foto in un formato analizzabile dal telefono
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve) => { img.onload = resolve; });

      // SUPER TRUCCO: Usiamo il motore di visione nativo di iOS (Safari 17+)
      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code'] });
        const barcodes = await detector.detect(img);
        if (barcodes.length > 0) {
          onScanSuccess(barcodes[0].rawValue);
          return;
        }
      }

      // Se il motore Apple fallisce, riproviamo con la libreria
      if (qrCodeScanner) {
         const decodedText = await qrCodeScanner.scanFile(file, true);
         onScanSuccess(decodedText);
         return;
      }

      throw new Error("Codice non rilevato");
    } catch (err) {
      console.error(err);
      alert("La confezione riflette troppo o il codice è curvo. Scrivi i numerini a mano qua sotto, facciamo prima!");
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim() !== '') {
      if (qrCodeScanner && qrCodeScanner.isScanning) qrCodeScanner.stop();
      onScanSuccess(manualCode.trim());
    }
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '2px solid #007bff' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <label style={{
          backgroundColor: '#ff3b30', color: 'white', padding: '12px 20px', 
          borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-block',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '20px'
        }}>
          📸 Scatta una Foto al Codice
          <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} style={{ display: 'none' }} />
        </label>

        {/* L'ANCORA DI SALVEZZA: Inserimento manuale */}
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <input 
            type="number" 
            placeholder="O scrivi i numerini qui..." 
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', flex: 1, fontSize: '16px' }}
          />
          <button type="submit" style={{ padding: '10px 15px', borderRadius: '8px', border: 'none', backgroundColor: '#28a745', color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
            Cerca
          </button>
        </form>
      </div>

      <div id="reader" style={{ width: '100%', borderRadius: '8px', overflow: 'hidden' }}></div>
    </div>
  );
};

export default BarcodeScanner;