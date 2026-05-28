import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const BarcodeScanner = ({ onScanSuccess }) => {
  useEffect(() => {
    // Abbiamo tolto il "qrbox" rigido per far scansionare tutto lo schermo 
    // e forzato l'uso della fotocamera posteriore (environment)
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10,
        videoConstraints: { facingMode: "environment" }
      },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear(); // Spegne la fotocamera appena legge il codice
        onScanSuccess(decodedText);
      },
      (error) => {
        // Ignoriamo gli errori di "codice non trovato"
      }
    );

    return () => {
      scanner.clear().catch(error => console.error("Errore chiusura scanner: ", error));
    };
  }, []);

  return (
    <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '12px' }}>
      <p style={{textAlign: 'center', fontSize: '0.85em', color: '#666', marginBottom: '10px'}}>
        Tieni il prodotto a <strong>10-15 cm</strong> di distanza per mettere a fuoco.
      </p>
      <div id="reader" style={{ width: '100%' }}></div>
    </div>
  );
};

export default BarcodeScanner;