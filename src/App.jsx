import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import BarcodeScanner from './BarcodeScanner'
import './App.css'

const TARGET_CARBS = 365;
const TARGET_PROTEINS = 160;
const TARGET_FATS = 60;

function App() {
  const [meals, setMeals] = useState([]);
  const [variant, setVariant] = useState(1);
  const [expandedId, setExpandedId] = useState(null); // Controlla quale ricetta è aperta
  
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);

  useEffect(() => {
    async function fetchMeals() {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('variant', variant)
        .order('id');
      if (!error) setMeals(data.map(meal => ({ ...meal, eaten: false })));
    }
    fetchMeals();
    setExpandedId(null); // Chiude le card se cambi menù
  }, [variant]);

  const totalCalories = meals.reduce((acc, meal) => acc + meal.calories, 0);
  const consumedCalories = meals.filter(m => m.eaten).reduce((acc, meal) => acc + meal.calories, 0);
  const progressPercentage = totalCalories > 0 ? (consumedCalories / totalCalories) * 100 : 0;
  
  const consumedCarbs = meals.filter(m => m.eaten).reduce((acc, meal) => acc + (meal.carbs || 0), 0);
  const consumedProteins = meals.filter(m => m.eaten).reduce((acc, meal) => acc + (meal.proteins || 0), 0);
  const consumedFats = meals.filter(m => m.eaten).reduce((acc, meal) => acc + (meal.fats || 0), 0);

  const toggleMeal = (id) => {
    setMeals(meals.map(meal => meal.id === id ? { ...meal, eaten: !meal.eaten } : meal));
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleScan = async (barcode) => {
    setShowScanner(false); 
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      if (data.status === 1) {
        const p = data.product;
        setScannedProduct({
          name: p.product_name_it || p.product_name || "Prodotto",
          image: p.image_url || "https://via.placeholder.com/150?text=No+Foto",
          score: p.nutriscore_grade ? p.nutriscore_grade.toLowerCase() : "unknown",
          kcal: p.nutriments['energy-kcal_100g'] || 0,
          carbs: p.nutriments['carbohydrates_100g'] || 0,
          proteins: p.nutriments['proteins_100g'] || 0,
          fats: p.nutriments['fat_100g'] || 0
        });
      } else {
        alert("Prodotto non trovato.");
      }
    } catch (err) {
      alert("Errore di connessione.");
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Diario Alimentare</h1>
        
        <div className="segmented-control">
          {[1, 2, 3].map(num => (
            <button key={num} onClick={() => setVariant(num)} className={`segment-button ${variant === num ? 'active' : ''}`}>
              Menu {num}
            </button>
          ))}
        </div>

        <div className="calorie-tracker">
          <h2>{consumedCalories} <span style={{ color: '#64748b', fontSize: '18px' }}>/ {totalCalories} kcal</span></h2>
          <div className="progress-bg"><div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div></div>
        </div>

        <div className="macros-container">
          <div className="macro-box">CARBO<span className="macro-carbs">{consumedCarbs}/{TARGET_CARBS}g</span></div>
          <div className="macro-box">PRO<span className="macro-proteins">{consumedProteins}/{TARGET_PROTEINS}g</span></div>
          <div className="macro-box">GRASSI<span className="macro-fats">{consumedFats}/{TARGET_FATS}g</span></div>
        </div>
      </header>

      <main>
        <div className="meal-list">
          {meals.map((meal) => (
            <div key={meal.id} className={`meal-card ${meal.eaten ? 'eaten' : ''}`}>
              
              {/* HEADER COMPATTO (Cliccabile per espandere) */}
              <div className="meal-header" onClick={() => toggleExpand(meal.id)}>
                <div className="meal-info-compact">
                  <div className="meal-type">{meal.meal_type}</div>
                  <div className="meal-name">{meal.name}</div>
                </div>
                <div className="meal-actions">
                  <div className="meal-calories">{meal.calories} kcal</div>
                  {/* BOTTONE SPUNTA (Separato) */}
                  <button 
                    className={`check-btn ${meal.eaten ? 'checked' : ''}`} 
                    onClick={(e) => { 
                      e.stopPropagation(); // Evita che si apra la card se clicchi solo la spunta
                      toggleMeal(meal.id); 
                    }}>
                    {meal.eaten ? '✓' : ''}
                  </button>
                </div>
              </div>

              {/* CONTENUTO ESPANDIBILE (La Fisarmonica) */}
              <div className={`meal-details ${expandedId === meal.id ? 'expanded' : ''}`}>
                <div className="meal-desc">{meal.description}</div>
                <div className="meal-macros">
                  <span className="micro-tag">🍞 {meal.carbs}g</span>
                  <span className="micro-tag">🍗 {meal.proteins}g</span>
                  <span className="micro-tag">🥑 {meal.fats}g</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      </main>

      <button className="fab-button" onClick={() => setShowScanner(true)}>📷</button>

      {showScanner && (
        <div className="scanner-overlay">
          <button className="close-button" onClick={() => setShowScanner(false)}>✕</button>
          <div style={{ width: '100%', maxWidth: '400px', marginTop: '40px' }}>
            <BarcodeScanner onScanSuccess={handleScan} />
          </div>
        </div>
      )}

      {scannedProduct && (
        <div className="scanner-overlay">
          <div className="product-modal">
            <button className="close-button" style={{top: '10px', right: '10px'}} onClick={() => setScannedProduct(null)}>✕</button>
            <img src={scannedProduct.image} alt="Prodotto" className="product-image" />
            <div className="product-title">{scannedProduct.name}</div>
            <div className={`nutriscore score-${scannedProduct.score}`}>
              {scannedProduct.score === 'unknown' ? '?' : `Nutri-Score: ${scannedProduct.score.toUpperCase()}`}
            </div>
            <div className="product-macros">
              <div className="pm-item">Kcal<span>{Math.round(scannedProduct.kcal)}</span></div>
              <div className="pm-item">Carbo<span>{Math.round(scannedProduct.carbs)}g</span></div>
              <div className="pm-item">Pro<span>{Math.round(scannedProduct.proteins)}g</span></div>
              <div className="pm-item">Grassi<span>{Math.round(scannedProduct.fats)}g</span></div>
            </div>
            <button className="add-to-meal-btn" onClick={() => {
              alert("Aggiunta al diario in arrivo nello Step 2!");
              setScannedProduct(null);
            }}>
              Aggiungi prodotto
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default App