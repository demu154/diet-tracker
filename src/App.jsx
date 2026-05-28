import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
// import BarcodeScanner from './BarcodeScanner'
import './App.css'

function App() {
  const [meals, setMeals] = useState([]);
  const [variant, setVariant] = useState(1);
  // const [isScanning, setIsScanning] = useState(false);

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
  
  // Calcolo per la percentuale della barra di progresso
  const progressPercentage = totalCalories > 0 ? (consumedCalories / totalCalories) * 100 : 0;

  const toggleMeal = (id) => {
    setMeals(meals.map(meal => 
      meal.id === id ? { ...meal, eaten: !meal.eaten } : meal
    ));
  };

  /*
  const handleScan = (code) => { ... } // Lo teniamo pronto per il futuro
  */

  return (
    <div className="app-container">
      <header>
        <h1>Diario Alimentare</h1>
        
        {/* Segmented Control in perfetto stile iOS */}
        <div className="segmented-control">
          {[1, 2, 3].map(num => (
            <button 
              key={num} 
              onClick={() => setVariant(num)} 
              className={`segment-button ${variant === num ? 'active' : ''}`}
            >
              Menu {num}
            </button>
          ))}
        </div>

        {/* Nuova Barra di Progresso Fluida */}
        <div className="calorie-tracker">
          <h2>{consumedCalories} <span style={{ color: '#8e8e93', fontSize: '18px' }}>/ {totalCalories} kcal</span></h2>
          <div className="progress-bg">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* <button className="action-button" onClick={() => setIsScanning(!isScanning)}>
          📸 Scansiona Prodotto
        </button> */}
      </header>

      <main>
        <div className="meal-list">
          {meals.map((meal) => (
            <label key={meal.id} className={`meal-item ${meal.eaten ? 'eaten' : ''}`}>
              <input type="checkbox" checked={meal.eaten} onChange={() => toggleMeal(meal.id)} />
              
              {/* Checkbox rotondo custom */}
              <div className="custom-checkbox"></div>
              
              <div style={{ flex: 1 }}>
                <div className="meal-name">{meal.meal_type}: {meal.name}</div>
                <div className="meal-desc">
                  {meal.description}
                </div>
              </div>
              
              <div className="meal-calories">{meal.calories} kcal</div>
            </label>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App