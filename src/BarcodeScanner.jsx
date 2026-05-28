import { useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const BarcodeScanner = ({ onScanSuccess }) => {
  useEffect(() => {
    // Usiamo il motore puro, molto più reattivo
    const html5QrCode = new Html5Qrcode("reader");

    const config = {
      fps: 15, // Aumentiamo i frame per secondo per catturarlo al volo
      qrbox: { width: 250, height: 120 }, // Riquadro perfetto per i codici a barre
      aspectRatio: 1.777778 // Forza l'uso in 16:9 per avere più risoluzione
    };

    html5QrCode.start(
      { facingMode: "environment" }, // Fotocamera posteriore
      config,
      (decodedText) => {
        // Appena lo becca, spegne tutto e invia il codice
        html5QrCode.stop().then(() => {
          onScanSuccess(decodedText);
        }).catch(err => console.error(err));
      },
      (errorMessage) => {
        // Silenziamo gli errori continui finché non trova il codice
      }
    ).catch(err => {
      console.error("Errore avvio fotocamera:", err);
    });

    // Spegne la fotocamera se chiudi prima di scansionare
    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error(err));
      }
    };
  }, []);

  return (
    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '2px solid #007bff' }}>
      <p style={{textAlign: 'center', fontSize: '0.9em', color: '#333', marginBottom: '15px'}}>
        Centra il codice a barre nel riquadro.<br/>
        <strong>Muovi il telefono avanti e indietro</strong> per mettere a fuoco.
      </p>
      <div id="reader" style={{ width: '100%', borderRadius: '8px', overflow: 'hidden' }}></div>
    </div>
  );
};

export default BarcodeScanner;