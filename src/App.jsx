import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import BarcodeScanner from './BarcodeScanner'
import './App.css'

function App() {
  const [meals, setMeals] = useState([]);
  const [variant, setVariant] = useState(1);
  const [isScanning, setIsScanning] = useState(false); // Controlla se la fotocamera è accesa

  useEffect(() => {
    async function fetchMeals() {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('variant', variant)
        .order('id');

      if (!error) {
        setMeals(data.map(meal => ({ ...meal, eaten: false })));
      }
    }
    fetchMeals();
  }, [variant]);

  const totalCalories = meals.reduce((acc, meal) => acc + meal.calories, 0);
  const consumedCalories = meals.filter(m => m.eaten).reduce((acc, meal) => acc + meal.calories, 0);

  const toggleMeal = (id) => {
    setMeals(meals.map(meal => 
      meal.id === id ? { ...meal, eaten: !meal.eaten } : meal
    ));
  };

  // Funzione magica che riceve il codice a barre e cerca il prodotto
  const handleScan = async (barcode) => {
    setIsScanning(false); // Chiudiamo la fotocamera
    
    try {
      // Chiamata all'API gratuita di Open Food Facts
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1) {
        const product = data.product;
        const name = product.product_name_it || product.product_name || "Prodotto Sconosciuto";
        const kcal = product.nutriments['energy-kcal_100g'] || "N/A";
        
        // Per ora mostriamo un alert visivo con i dati trovati
        alert(`Trovato: ${name}\nCalorie: ${kcal} kcal per 100g\n\n(Più avanti aggiungeremo la logica per inserirlo direttamente nella lista!)`);
      } else {
        alert("Prodotto non trovato nel database globale.");
      }
    } catch (err) {
      alert("Errore di connessione durante la ricerca del prodotto.");
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Diario Alimentare 🍎</h1>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '25px' }}>
          {[1, 2, 3].map(num => (
            <button key={num} onClick={() => setVariant(num)} 
              style={{ 
                padding: '8px 12px', borderRadius: '8px', border: 'none', 
                backgroundColor: variant === num ? '#007bff' : '#e0e0e0', 
                color: variant === num ? 'white' : 'black' 
              }}>
              Menu {num}
            </button>
          ))}
        </div>

        <div className="calorie-tracker">
          <h2>{consumedCalories} / {totalCalories} kcal</h2>
          <progress value={consumedCalories} max={totalCalories}></progress>
        </div>

        {/* Bottone per attivare lo scanner */}
        <button 
          onClick={() => setIsScanning(!isScanning)}
          style={{ width: '100%', padding: '15px', marginTop: '15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.1em', fontWeight: 'bold', cursor: 'pointer' }}>
          {isScanning ? "❌ Chiudi Fotocamera" : "📸 Scansiona Prodotto"}
        </button>
      </header>

      <main>
        {/* Mostriamo lo scanner se è attivo, altrimenti mostriamo la lista dei pasti */}
        {isScanning ? (
          <BarcodeScanner onScanSuccess={handleScan} />
        ) : (
          <div className="meal-list" style={{ marginTop: '20px' }}>
            {meals.map((meal) => (
              <label key={meal.id} className={`meal-item ${meal.eaten ? 'eaten' : ''}`}>
                <input type="checkbox" checked={meal.eaten} onChange={() => toggleMeal(meal.id)} />
                <div style={{ flex: 1, marginLeft: '15px', textAlign: 'left' }}>
                  <div className="meal-name">{meal.meal_type}: {meal.name}</div>
                  <div style={{ fontSize: '0.85em', color: '#666', marginTop: '4px', lineHeight: '1.4' }}>
                    {meal.description}
                  </div>
                </div>
                <span className="meal-calories" style={{ marginLeft: '10px' }}>{meal.calories} kcal</span>
              </label>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default App