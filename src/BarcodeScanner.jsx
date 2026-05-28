import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const BarcodeScanner = ({ onScanSuccess }) => {
  useEffect(() => {
    // Configuriamo lo scanner: 10 frame al secondo, riquadro di scansione ottimizzato
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 150 } },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear(); // Spegne la fotocamera appena legge il codice
        onScanSuccess(decodedText);
      },
      (error) => {
        // Ignoriamo i fisiologici errori di quando non c'è un codice inquadrato
      }
    );

    // Pulizia quando chiudiamo lo scanner
    return () => {
      scanner.clear().catch(error => console.error("Errore chiusura scanner: ", error));
    };
  }, []);

  return (
    <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '12px' }}>
      <div id="reader" style={{ width: '100%' }}></div>
    </div>
  );
};

export default BarcodeScanner;