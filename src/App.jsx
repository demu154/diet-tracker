import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import BarcodeScanner from './BarcodeScanner'
import './App.css'

const TARGET_CARBS = 365;
const TARGET_PROTEINS = 160;
const TARGET_FATS = 60;

// MEMORIA DELLE DIETE ORIGINALI (Per il tasto Ripristina)
const ORIGINAL_MEALS = {
  "1-Colazione": { name: "Polifenoli & Fibre Prebiotiche", desc: "80-100g avena integrale cotti, 100g frutti di bosco, 1 cucchiaino cacao amaro, scorza limone, 30g proteine isolate.", kcal: 450, carbs: 70, proteins: 40, fats: 10 },
  "1-Pranzo": { name: "Focus Energia & Amido Resistente", desc: "130g riso basmati o quinoa (freddi), 150g pesce o tempeh, carciofi/asparagi, 15g Olio EVO a crudo.", kcal: 720, carbs: 110, proteins: 45, fats: 20 },
  "1-Spuntino": { name: "Pre-Workout / Pre-Ballo", desc: "1 banana acerba o mela con buccia, 20-30g noci/mandorle, 1 bicchiere Kombucha o Kefir d'acqua.", kcal: 280, carbs: 50, proteins: 25, fats: 10 },
  "1-Cena": { name: "Recupero Muscolare & Butirrato", desc: "350g patate/patate dolci fredde, 200g fagioli neri/azuki o pesce azzurro, radicchio e carote, 15g Olio EVO.", kcal: 650, carbs: 135, proteins: 50, fats: 20 },
  "2-Colazione": { name: "Overnight Oats", desc: "100g fiocchi d'avena (ammollo a freddo in latte vegetale), 1 mela a cubetti, cannella, 30g proteine.", kcal: 520, carbs: 70, proteins: 40, fats: 10 },
  "2-Pranzo": { name: "Il Piatto del Microbiota", desc: "140g Riso Venere o Grano Saraceno freddo, 180g Tempeh a cubetti, Topinambur o sedano saltati, 15g Olio EVO.", kcal: 850, carbs: 110, proteins: 45, fats: 20 },
  "2-Spuntino": { name: "Ricarica Pre-Allenamento", desc: "1 banana leggermente verde, Kombucha o Kefir d'acqua, 20g noci.", kcal: 250, carbs: 50, proteins: 25, fats: 10 },
  "2-Cena": { name: "Recupero con Legumi", desc: "250g zuppa densa di lenticchie/azuki, 300g patate fredde, crauti al naturale, 15g Olio EVO, cioccolato fondente (>85%).", kcal: 700, carbs: 135, proteins: 50, fats: 20 },
  "3-Colazione": { name: "Porridge agli Agrumi", desc: "100g avena cotta in acqua, 1 arancia a fette, scorza di limone, 10g cacao amaro, 30g proteine.", kcal: 450, carbs: 70, proteins: 40, fats: 10 },
  "3-Pranzo": { name: "Pasta \"Fredda\" Potenziata", desc: "140g Pasta di farro o integrale fredda, 180g filetto pesce bianco (es. merluzzo), carote/asparagi, 15g Olio EVO.", kcal: 780, carbs: 110, proteins: 45, fats: 20 },
  "3-Spuntino": { name: "Snack Veloce", desc: "4-5 gallette di mais al naturale, 50g fesa di tacchino, 20g mandorle.", kcal: 280, carbs: 50, proteins: 25, fats: 10 },
  "3-Cena": { name: "Ricarica Omega-3", desc: "400g Patate dolci fredde, 150g Salmone fresco al forno o Sgombro, carciofi al vapore, 10g Olio EVO, aceto di mele.", kcal: 750, carbs: 135, proteins: 50, fats: 20 }
};

function App() {
  const [meals, setMeals] = useState([]);
  const [variant, setVariant] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);

  const [replacingMealId, setReplacingMealId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recipeResults, setRecipeResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    async function fetchMeals() {
      const { data, error } = await supabase.from('meals').select('*').eq('variant', variant).order('id');
      if (!error) setMeals(data.map(meal => ({ ...meal, eaten: false })));
    }
    fetchMeals();
    setExpandedId(null);
  }, [variant]);

  const totalCalories = meals.reduce((acc, meal) => acc + meal.calories, 0);
  const consumedCalories = meals.filter(m => m.eaten).reduce((acc, meal) => acc + meal.calories, 0);
  const progressPercentage = totalCalories > 0 ? (consumedCalories / totalCalories) * 100 : 0;
  const consumedCarbs = meals.filter(m => m.eaten).reduce((acc, meal) => acc + (meal.carbs || 0), 0);
  const consumedProteins = meals.filter(m => m.eaten).reduce((acc, meal) => acc + (meal.proteins || 0), 0);
  const consumedFats = meals.filter(m => m.eaten).reduce((acc, meal) => acc + (meal.fats || 0), 0);

  const toggleMeal = (id) => setMeals(meals.map(m => m.id === id ? { ...m, eaten: !m.eaten } : m));
  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const handleScan = async (barcode) => {
    setShowScanner(false); 
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      if (data.status === 1) {
        const p = data.product;
        setScannedProduct({
          name: p.product_name_it || p.product_name || "Prodotto",
          image: p.image_url || "https://via.placeholder.com/150?text=Foto",
          score: p.nutriscore_grade ? p.nutriscore_grade.toLowerCase() : "unknown",
          kcal: p.nutriments['energy-kcal_100g'] || 0,
          carbs: p.nutriments['carbohydrates_100g'] || 0,
          proteins: p.nutriments['proteins_100g'] || 0,
          fats: p.nutriments['fat_100g'] || 0
        });
      } else { alert("Prodotto non trovato."); }
    } catch (err) { alert("Errore di connessione."); }
  };

  const searchRecipes = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const apiKey = import.meta.env.VITE_SPOONACULAR_API_KEY;
      const res = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${searchQuery}&addRecipeNutrition=true&number=6&apiKey=${apiKey}`);
      const data = await res.json();
      if (data.results) setRecipeResults(data.results);
      else alert("Nessuna ricetta trovata.");
    } catch (err) { alert("Errore nella ricerca."); }
    setIsSearching(false);
  };

  const confirmReplacement = async (recipe) => {
    const getNutrient = (name) => {
      const nutrient = recipe.nutrition?.nutrients.find(n => n.name === name);
      return nutrient ? Math.round(nutrient.amount) : 0;
    };
    const kcal = getNutrient('Calories');
    const carbs = getNutrient('Carbohydrates');
    const proteins = getNutrient('Protein');
    const fats = getNutrient('Fat');
    const newName = recipe.title;
    const newDesc = "Ricetta personalizzata trovata con Spoonacular!";

    const { error } = await supabase.from('meals').update({ name: newName, description: newDesc, calories: kcal, carbs, proteins, fats }).eq('id', replacingMealId);
    if (!error) {
      setMeals(meals.map(m => m.id === replacingMealId ? { ...m, name: newName, description: newDesc, calories: kcal, carbs, proteins, fats, eaten: false } : m));
      setReplacingMealId(null); setRecipeResults([]); setSearchQuery('');
    } else { alert("Errore di salvataggio."); }
  };

  // NUOVA FUNZIONE: Ripristina la ricetta originale
  const revertToOriginal = async (meal) => {
    const original = ORIGINAL_MEALS[`${meal.variant}-${meal.meal_type}`];
    if (!original) return;

    const { error } = await supabase.from('meals').update({ 
      name: original.name, description: original.desc, calories: original.kcal, carbs: original.carbs, proteins: original.proteins, fats: original.fats 
    }).eq('id', meal.id);

    if (!error) {
      setMeals(meals.map(m => m.id === meal.id ? { ...m, name: original.name, description: original.desc, calories: original.kcal, carbs: original.carbs, proteins: original.proteins, fats: original.fats, eaten: false } : m));
    } else { alert("Errore durante il ripristino."); }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Diario Alimentare</h1>
        <div className="segmented-control">
          {[1, 2, 3].map(num => (
            <button key={num} onClick={() => setVariant(num)} className={`segment-button ${variant === num ? 'active' : ''}`}>Menu {num}</button>
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
          {meals.map((meal) => {
            // Controlliamo se il pasto attuale è diverso da quello originale
            const isReplaced = meal.name !== ORIGINAL_MEALS[`${meal.variant}-${meal.meal_type}`]?.name;

            return (
              <div key={meal.id} className={`meal-card ${meal.eaten ? 'eaten' : ''}`}>
                <div className="meal-header" onClick={() => toggleExpand(meal.id)}>
                  <div className="meal-info-compact">
                    <div className="meal-type">{meal.meal_type}</div>
                    <div className="meal-name">{meal.name}</div>
                  </div>
                  <div className="meal-actions">
                    <div className="meal-calories">{meal.calories} kcal</div>
                    <button className={`check-btn ${meal.eaten ? 'checked' : ''}`} onClick={(e) => { e.stopPropagation(); toggleMeal(meal.id); }}>
                      {meal.eaten ? '✓' : ''}
                    </button>
                  </div>
                </div>

                <div className={`meal-details ${expandedId === meal.id ? 'expanded' : ''}`}>
                  <div className="meal-desc">{meal.description}</div>
                  <div className="meal-macros">
                    <span className="micro-tag">🍞 {meal.carbs}g</span>
                    <span className="micro-tag">🍗 {meal.proteins}g</span>
                    <span className="micro-tag">🥑 {meal.fats}g</span>
                  </div>
                  
                  {/* Nuova riga con i bottoni Sostituisci & Ripristina */}
                  <div className="meal-actions-row">
                    <button className="action-btn btn-replace" onClick={() => setReplacingMealId(meal.id)}>
                      🔄 Trova Sostituto
                    </button>
                    {isReplaced && (
                      <button className="action-btn btn-revert" onClick={() => revertToOriginal(meal)}>
                        ↩️ Originale
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      <button className="fab-button" onClick={() => setShowScanner(true)}>📷</button>

      {showScanner && (
        <div className="scanner-overlay">
          <button className="close-button" onClick={() => setShowScanner(false)}>✕</button>
          <div style={{ width: '100%', maxWidth: '400px', marginTop: '40px' }}><BarcodeScanner onScanSuccess={handleScan} /></div>
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
          </div>
        </div>
      )}

      {/* OVERLAY RICETTARIO A BOTTOM SHEET CON GRIGLIA */}
      {replacingMealId && (
        <div className="scanner-overlay bottom-sheet">
          <div className="recipe-modal">
            <button className="close-button" style={{top: '15px', right: '15px'}} onClick={() => { setReplacingMealId(null); setRecipeResults([]); setSearchQuery(''); }}>✕</button>
            <h2>Sostituisci Pasto</h2>
            
            <form onSubmit={searchRecipes} className="recipe-search-bar">
              <input type="text" className="recipe-search-input" placeholder="Es. Salmon, Beef, Rice..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <button type="submit" className="recipe-search-btn">{isSearching ? '...' : 'Cerca'}</button>
            </form>

            <div className="recipe-results">
              {recipeResults.map((recipe) => {
                const previewKcal = recipe.nutrition?.nutrients.find(n => n.name === 'Calories')?.amount || 0;
                const previewPro = recipe.nutrition?.nutrients.find(n => n.name === 'Protein')?.amount || 0;
                
                return (
                  <div key={recipe.id} className="recipe-card">
                    <img src={recipe.image} className="recipe-img" alt="Ricetta" />
                    <div className="recipe-info">
                      <div className="recipe-title">{recipe.title}</div>
                      <div className="meal-macros" style={{marginBottom: '10px'}}>
                        <span className="micro-tag">🔥 {Math.round(previewKcal)}</span>
                        <span className="micro-tag">🍗 {Math.round(previewPro)}g</span>
                      </div>
                      <button className="confirm-replace-btn" onClick={() => confirmReplacement(recipe)}>
                        Usa questo
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App