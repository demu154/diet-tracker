import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
  const [meals, setMeals] = useState([]);
  const [variant, setVariant] = useState(1); // Parte di default con la Dieta 1

  // Questa funzione si attiva e scarica i dati da Supabase ogni volta che cambi variante
  useEffect(() => {
    async function fetchMeals() {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('variant', variant)
        .order('id');

      if (error) {
        console.error("Errore nel caricamento:", error);
      } else {
        // Aggiungiamo lo stato "eaten" (mangiato) a false per ogni pasto appena scaricato
        const mealsWithState = data.map(meal => ({ ...meal, eaten: false }));
        setMeals(mealsWithState);
      }
    }
    
    fetchMeals();
  }, [variant]);

  // Calcolo delle calorie
  const totalCalories = meals.reduce((acc, meal) => acc + meal.calories, 0);
  const consumedCalories = meals.filter(m => m.eaten).reduce((acc, meal) => acc + meal.calories, 0);

  // Funzione per spuntare la checklist
  const toggleMeal = (id) => {
    setMeals(meals.map(meal => 
      meal.id === id ? { ...meal, eaten: !meal.eaten } : meal
    ));
  };

  return (
    <div className="app-container">
      <header>
        <h1>Diario Alimentare 🍎</h1>
        
        {/* Bottoni per scegliere quale variante della dieta seguire oggi */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '25px' }}>
          <button 
            onClick={() => setVariant(1)} 
            style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: variant === 1 ? '#007bff' : '#e0e0e0', color: variant === 1 ? 'white' : 'black' }}>
            Menu 1
          </button>
          <button 
            onClick={() => setVariant(2)} 
            style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: variant === 2 ? '#007bff' : '#e0e0e0', color: variant === 2 ? 'white' : 'black' }}>
            Menu 2
          </button>
          <button 
            onClick={() => setVariant(3)} 
            style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: variant === 3 ? '#007bff' : '#e0e0e0', color: variant === 3 ? 'white' : 'black' }}>
            Menu 3
          </button>
        </div>

        <div className="calorie-tracker">
          <h2>{consumedCalories} / {totalCalories} kcal</h2>
          <progress value={consumedCalories} max={totalCalories}></progress>
        </div>
      </header>

      <main>
        <div className="meal-list">
          {meals.map((meal) => (
            <label key={meal.id} className={`meal-item ${meal.eaten ? 'eaten' : ''}`}>
              <input 
                type="checkbox" 
                checked={meal.eaten} 
                onChange={() => toggleMeal(meal.id)}
              />
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
      </main>
    </div>
  )
}

export default App