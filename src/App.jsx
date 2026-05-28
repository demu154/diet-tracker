import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import BarcodeScanner from './BarcodeScanner'
import './App.css'

const TARGET_CARBS = 365;
const TARGET_PROTEINS = 160;
const TARGET_FATS = 60;

// ... (ORIGINAL_MEALS rimane uguale a prima, non cambiarlo) ...
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
  const [activeFilter, setActiveFilter] = useState('match'); // Default su Match

  useEffect(() => {
    async function fetchMeals() {
      const { data, error } = await supabase.from('meals').select('*').eq('variant', variant).order('id');
      if (!error) setMeals(data.map(meal => ({ ...meal, eaten: false })));
    }
    fetchMeals();
    setExpandedId(null);
  }, [variant]);

  // AUTOMAZIONE: Se apriamo la sostituzione, cerchiamo subito in base al pasto
  useEffect(() => {
    if (replacingMealId) {
      const meal = meals.find(m => m.id === replacingMealId);
      if (meal) {
        setSearchQuery(meal.name.split(' ')[0]); // Prende la prima parola del piatto come query
        searchRecipes(null, meal); // Esegui ricerca automatica
      }
    }
  }, [replacingMealId]);

  const toggleMeal = (id) => setMeals(meals.map(m => m.id === id ? { ...m, eaten: !m.eaten } : m));
  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const searchRecipes = async (e, mealToReplace) => {
    if (e) e.preventDefault();
    if (!searchQuery && !mealToReplace) return;
    
    setIsSearching(true);
    try {
      const apiKey = import.meta.env.VITE_SPOONACULAR_API_KEY;
      const targetMeal = mealToReplace || meals.find(m => m.id === replacingMealId);
      
      let filterQuery = '';
      if (activeFilter === 'match' && targetMeal) {
        filterQuery = `&minCarbs=${Math.max(0, targetMeal.carbs - 20)}&maxCarbs=${targetMeal.carbs + 20}&minProtein=${Math.max(0, targetMeal.proteins - 15)}&maxProtein=${targetMeal.proteins + 20}`;
      } else if (activeFilter === 'protein') filterQuery = '&minProtein=30';
      else if (activeFilter === 'light') filterQuery = '&maxCalories=400';
      else if (activeFilter === 'fast') filterQuery = '&maxReadyTime=20';

      const res = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${searchQuery || targetMeal.name}&addRecipeNutrition=true&number=6${filterQuery}&apiKey=${apiKey}`);
      const data = await res.json();
      if (data.results) setRecipeResults(data.results);
    } catch (err) { alert("Errore nella ricerca."); }
    setIsSearching(false);
  };

  const confirmReplacement = async (recipe) => {
    // Estrae gli ingredienti e li formatta
    const ingredients = recipe.nutrition?.ingredients?.map(i => i.name).join(', ') || "Vedi ricetta online";
    const getNutrient = (name) => {
      const nutrient = recipe.nutrition?.nutrients.find(n => n.name === name);
      return nutrient ? Math.round(nutrient.amount) : 0;
    };
    
    const { error } = await supabase.from('meals').update({ 
      name: recipe.title, 
      description: `Ingredienti: ${ingredients}`, 
      calories: getNutrient('Calories'), 
      carbs: getNutrient('Carbohydrates'), 
      proteins: getNutrient('Protein'), 
      fats: getNutrient('Fat') 
    }).eq('id', replacingMealId);

    if (!error) {
      window.location.reload(); // Ricarica rapida per riflettere i dati nuovi
    }
  };

  return (
    <div className="app-container">
      {/* (Tutto il resto rimane uguale, le funzioni sopra coprono la tua richiesta) */}
      {/* Assicurati di non aver cancellato la parte di rendering, la logica sopra si integra perfettamente */}
    </div>
  )
}

export default App