import React, { useState, useEffect, useCallback } from 'react'
import { Brain, Sprout, Droplets, Sun, Wind, Bug, Trophy, RotateCcw, Lightbulb, Send } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GameState {
  day: number
  season: 'spring' | 'summer' | 'autumn' | 'winter'
  money: number
  reputation: number
  wheatHealth: number
  soilMoisture: number
  pestRisk: number
  weatherForecast: WeatherDay[]
  gameLog: string[]
  isGameOver: boolean
}

interface WeatherDay {
  day: number
  temp: number
  rain: number
  wind: number
  condition: 'sunny' | 'cloudy' | 'rainy' | 'storm'
}

interface AIResponse {
  advice: string
  confidence: number
  recommendedAction: string
  reasoning: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KIMI_API_KEY = localStorage.getItem('kimi_api_key') || ''
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions'

const INITIAL_STATE: GameState = {
  day: 1,
  season: 'spring',
  money: 1000,
  reputation: 50,
  wheatHealth: 80,
  soilMoisture: 50,
  pestRisk: 20,
  weatherForecast: [],
  gameLog: ['თამაში დაიწყო! თქვენი ფერმა მზად არის გაზაფხულისთვის.'],
  isGameOver: false,
}

// ─── Weather Generation ───────────────────────────────────────────────────────

function generateWeatherForecast(startDay: number, days: number = 7): WeatherDay[] {
  const forecast: WeatherDay[] = []
  const conditions: WeatherDay['condition'][] = ['sunny', 'cloudy', 'rainy', 'storm']
  
  for (let i = 0; i < days; i++) {
    const day = startDay + i
    const condition = conditions[Math.floor(Math.random() * conditions.length)]
    const temp = 15 + Math.floor(Math.random() * 20) // 15-35°C
    const rain = condition === 'rainy' ? 10 + Math.floor(Math.random() * 20) : 
                 condition === 'storm' ? 20 + Math.floor(Math.random() * 30) :
                 Math.floor(Math.random() * 5)
    const wind = Math.floor(Math.random() * 15)
    
    forecast.push({ day, temp, rain, wind, condition })
  }
  
  return forecast
}

// ─── Kimi API Integration ─────────────────────────────────────────────────────

async function askKimiAdvisor(
  gameState: GameState, 
  playerQuestion?: string
): Promise<AIResponse> {
  if (!KIMI_API_KEY) {
    return getLocalAdvisorResponse(gameState, playerQuestion)
  }

  const systemPrompt = `You are an expert agricultural AI advisor for a farming simulation game called "SmartFarm AI". 
The player manages a wheat farm in Georgia. Provide strategic advice based on:
- Current game day: ${gameState.day}
- Wheat health: ${gameState.wheatHealth}%
- Soil moisture: ${gameState.soilMoisture}%
- Pest risk: ${gameState.pestRisk}%
- Money: $${gameState.money}
- Season: ${gameState.season}

Weather forecast:
${gameState.weatherForecast.slice(0, 5).map(w => 
  `Day ${w.day}: ${w.condition}, ${w.temp}°C, rain ${w.rain}mm, wind ${w.wind}m/s`
).join('\n')}

Respond in Georgian language with:
1. Concise advice (2-3 sentences)
2. Confidence score (0-100)
3. Recommended action (irrigate/fertilize/spray/harvest/wait)
4. Brief reasoning

Format as JSON: {"advice": "...", "confidence": 85, "recommendedAction": "irrigate", "reasoning": "..."}`

  const userPrompt = playerQuestion || 'რა უნდა გავაკეთო შემდეგი 3 დღის განმავლობაში?'

  try {
    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'kimi-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) throw new Error('API error')
    
    const data = await response.json()
    const content = JSON.parse(data.choices[0].message.content)
    
    return {
      advice: content.advice,
      confidence: content.confidence,
      recommendedAction: content.recommendedAction,
      reasoning: content.reasoning
    }
  } catch (error) {
    console.error('Kimi API error:', error)
    return getLocalAdvisorResponse(gameState, playerQuestion)
  }
}

// Fallback local advisor when API is not available
function getLocalAdvisorResponse(gameState: GameState, _playerQuestion?: string): AIResponse {
  const { soilMoisture, wheatHealth, pestRisk, weatherForecast } = gameState
  const nextRain = weatherForecast.find(w => w.rain > 5)
  
  // Simple rule-based logic
  if (soilMoisture < 30 && !nextRain) {
    return {
      advice: 'ნიადაგის ტენიანობა დაბალია და ახლო მომავალში წვიმა არ იწინასწარმეტყველება. სარწყავი საჭიროა.',
      confidence: 92,
      recommendedAction: 'irrigate',
      reasoning: 'ტენიანობა < 30% და წვიმის გარეშე 3+ დღე'
    }
  }
  
  if (pestRisk > 60) {
    return {
      advice: 'მავნებლების რისკი მაღალია! პესტიციდის შეტანა რეკომენდებულია დაავადების თავიდან ასაცილებლად.',
      confidence: 88,
      recommendedAction: 'spray',
      reasoning: 'მავნებლების რისკი > 60%'
    }
  }
  
  if (wheatHealth < 50) {
    return {
      advice: 'მოსავლის ჯანმრთელობა კრიტიკულია. სასუქის შეტანა და მორწყვა აუცილებელია აღსადგენად.',
      confidence: 85,
      recommendedAction: 'fertilize',
      reasoning: 'მოსავლის ჯანმრთელობა < 50%'
    }
  }
  
  if (gameState.day > 90 && wheatHealth > 70) {
    return {
      advice: 'მკის დრო მოახლოვდა! მოსავალი მწიფდება და მკისთვის მზადება უნდა დაიწყოთ.',
      confidence: 90,
      recommendedAction: 'harvest',
      reasoning: 'დღე > 90, მოსავლის ჯანმრთელობა > 70%'
    }
  }
  
  return {
    advice: 'მდგომარეობა სტაბილურია. დააკვირდით ამინდის პროგნოზს და მოიცადეთ ოპტიმალური პირობები.',
    confidence: 70,
    recommendedAction: 'wait',
    reasoning: 'ყველა პარამეტრი ნორმის ფარგლებშია'
  }
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  max = 100 
}: { 
  icon: React.ElementType
  label: string
  value: number
  color: string
  max?: number
}): React.ReactElement {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  
  return (
    <div className="card p-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" style={{ color }} />
        <span className="text-xs text-text-muted">{label}</span>
      </div>
      <div className="text-xl font-bold text-text-primary">{Math.round(value)}</div>
      <div className="h-1.5 w-full bg-bg-border rounded-full mt-1.5 overflow-hidden">
        <div 
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function WeatherIcon({ condition }: { condition: WeatherDay['condition'] }): React.ReactElement {
  const icons = {
    sunny: <Sun className="h-5 w-5 text-yellow-500" />,
    cloudy: <Wind className="h-5 w-5 text-gray-400" />,
    rainy: <Droplets className="h-5 w-5 text-blue-500" />,
    storm: <Wind className="h-5 w-5 text-purple-500" />,
  }
  return icons[condition]
}

function AIAdvisor({ 
  gameState, 
  onAdvice 
}: { 
  gameState: GameState
  onAdvice: (advice: AIResponse) => void 
}): React.ReactElement {
  const [loading, setLoading] = useState(false)
  const [advice, setAdvice] = useState<AIResponse | null>(null)
  const [question, setQuestion] = useState('')

  const getAdvice = async (customQuestion?: string) => {
    setLoading(true)
    const response = await askKimiAdvisor(gameState, customQuestion)
    setAdvice(response)
    onAdvice(response)
    setLoading(false)
  }

  useEffect(() => {
    // Get initial advice
    if (!advice && !loading) {
      getAdvice()
    }
  }, [gameState.day])

  return (
    <div className="card p-4 bg-gradient-to-br from-accent/5 to-purple-500/5">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="h-5 w-5 text-accent" />
        <h3 className="font-semibold text-text-primary">AI მრჩეველი</h3>
        {advice && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
            ნდობა: {advice.confidence}%
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-text-secondary">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-bg-border border-t-accent" />
          <span className="text-sm">AI ფიქრობს...</span>
        </div>
      ) : advice ? (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary leading-relaxed">{advice.advice}</p>
          
          {advice.reasoning && (
            <div className="flex items-start gap-2 text-xs text-text-muted bg-bg-primary rounded p-2">
              <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{advice.reasoning}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-bg-border">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="დაუსვით კითხვა AI-ს..."
              className="flex-1 bg-bg-primary border border-bg-border rounded px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              onKeyPress={(e) => e.key === 'Enter' && question && getAdvice(question)}
            />
            <button
              onClick={() => question && getAdvice(question)}
              disabled={!question}
              className="p-1.5 rounded bg-accent text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

// ─── Main Game Component ──────────────────────────────────────────────────────

export default function AIFarmGame(): React.ReactElement {
  const [gameState, setGameState] = useState<GameState>({
    ...INITIAL_STATE,
    weatherForecast: generateWeatherForecast(1)
  })
  const [showApiKeyInput, setShowApiKeyInput] = useState(!KIMI_API_KEY)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [lastAdvice, setLastAdvice] = useState<AIResponse | null>(null)

  const executeAction = useCallback((action: string) => {
    setGameState(prev => {
      if (prev.isGameOver) return prev

      let newState = { ...prev }
      let logMessage = ''
      let cost = 0

      switch (action) {
        case 'irrigate':
          if (prev.money >= 50) {
            newState.soilMoisture = Math.min(100, prev.soilMoisture + 40)
            newState.wheatHealth = Math.min(100, prev.wheatHealth + 5)
            cost = 50
            logMessage = `💧 სარწყავი გაშვებულია. ტენიანობა +40%`
          } else {
            logMessage = `❌ არასაკმარისი თანხა სარწყავისთვის`
          }
          break

        case 'fertilize':
          if (prev.money >= 100) {
            newState.wheatHealth = Math.min(100, prev.wheatHealth + 15)
            cost = 100
            logMessage = `🌱 სასუქი შეტანილია. მოსავლის ჯანმრთელობა +15%`
          } else {
            logMessage = `❌ არასაკმარისი თანხა სასუქისთვის`
          }
          break

        case 'spray':
          if (prev.money >= 80) {
            newState.pestRisk = Math.max(0, prev.pestRisk - 40)
            newState.wheatHealth = Math.min(100, prev.wheatHealth + 10)
            cost = 80
            logMessage = `🛡️ პესტიციდი შეტანილია. მავნებლების რისკი -40%`
          } else {
            logMessage = `❌ არასაკმარისი თანხა პესტიციდისთვის`
          }
          break

        case 'harvest':
          if (prev.wheatHealth >= 60 && prev.day >= 80) {
            const yield_quality = (prev.wheatHealth / 100) * (prev.reputation / 100)
            const earnings = Math.floor(2000 * yield_quality)
            newState.money += earnings
            newState.reputation = Math.min(100, prev.reputation + 10)
            logMessage = `🌾 მკა დასრულებულია! შემოსავალი: $${earnings}`
            newState.isGameOver = true
          } else {
            logMessage = `❌ მკისთვის მოსავალი არ არის მზად`
          }
          break

        case 'wait':
          logMessage = `⏳ მოიცადა. ამინდის პირობები შეიცვალა.`
          break

        default:
          // Advance day
          newState.day += 1
          newState.weatherForecast = generateWeatherForecast(newState.day)
          
          // Apply weather effects
          const today = newState.weatherForecast[0]
          if (today) {
            newState.soilMoisture = Math.max(0, Math.min(100, 
              newState.soilMoisture + today.rain - (today.temp > 25 ? 10 : 5)
            ))
            
            if (today.temp > 35) {
              newState.wheatHealth -= 5
              logMessage = `🌡️ სიცხემ მოსავალს დააზარალა`
            }
            
            if (today.rain > 20) {
              newState.pestRisk += 10
            }
          }

          // Natural progression
          if (newState.soilMoisture < 20) {
            newState.wheatHealth -= 5
          }
          if (newState.pestRisk > 70) {
            newState.wheatHealth -= 8
          }

          // Check game over conditions
          if (newState.wheatHealth <= 0) {
            newState.isGameOver = true
            newState.gameLog.push('💀 მოსავალი დაიღუპა! თამაში დამთავრდა.')
          }
          if (newState.money < 0) {
            newState.isGameOver = true
            newState.gameLog.push('💸 ბანკროტი! თამაში დამთავრდა.')
          }
      }

      if (cost > 0) {
        newState.money -= cost
      }
      
      if (logMessage) {
        newState.gameLog = [logMessage, ...prev.gameLog].slice(0, 20)
      }

      // Determine season
      const day = newState.day
      if (day <= 20) newState.season = 'spring'
      else if (day <= 60) newState.season = 'summer'
      else if (day <= 90) newState.season = 'autumn'
      else newState.season = 'winter'

      return newState
    })
  }, [])

  const saveApiKey = () => {
    if (apiKeyInput.startsWith('sk-')) {
      localStorage.setItem('kimi_api_key', apiKeyInput)
      setShowApiKeyInput(false)
      window.location.reload()
    }
  }

  const resetGame = () => {
    setGameState({
      ...INITIAL_STATE,
      weatherForecast: generateWeatherForecast(1)
    })
    setLastAdvice(null)
  }

  if (showApiKeyInput) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Brain className="h-16 w-16 text-accent" />
        <h1 className="text-2xl font-bold text-text-primary">SmartFarm AI</h1>
        <p className="text-text-secondary text-center max-w-md">
          AI-ზე დაფუძნებული ფერმერული სიმულატორი. შეიყვანეთ თქვენი Kimi API გასაღები თამაშის დასაწყებად.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="sk-kimi-..."
            className="bg-bg-card border border-bg-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <button
              onClick={saveApiKey}
              disabled={!apiKeyInput.startsWith('sk-')}
              className="flex-1 btn btn-primary disabled:opacity-50"
            >
              დაწყება
            </button>
            <button
              onClick={() => setShowApiKeyInput(false)}
              className="btn btn-secondary"
            >
              გარეშე API-ს
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sprout className="h-6 w-6 text-accent" />
          <div>
            <h1 className="text-xl font-bold text-text-primary">SmartFarm AI</h1>
            <p className="text-xs text-text-secondary">
              დღე {gameState.day} • {gameState.season === 'spring' ? 'გაზაფხული' : 
                    gameState.season === 'summer' ? 'ზაფხული' :
                    gameState.season === 'autumn' ? 'შემოდგომა' : 'ზამთარი'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-lg font-bold text-accent">${gameState.money}</div>
            <div className="text-xs text-text-muted">ბალანსი</div>
          </div>
          <button onClick={resetGame} className="p-2 rounded-lg bg-bg-card hover:bg-bg-border">
            <RotateCcw className="h-4 w-4 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard 
          icon={Sprout} 
          label="მოსავლის ჯანმრთელობა" 
          value={gameState.wheatHealth} 
          color="#388e3c" 
        />
        <StatCard 
          icon={Droplets} 
          label="ნიადაგის ტენიანობა" 
          value={gameState.soilMoisture} 
          color="#58a6ff" 
        />
        <StatCard 
          icon={Bug} 
          label="მავნებლების რისკი" 
          value={gameState.pestRisk} 
          color="#d32f2f" 
        />
        <StatCard 
          icon={Trophy} 
          label="რეპუტაცია" 
          value={gameState.reputation} 
          color="#fbc02d" 
        />
      </div>

      {/* AI Advisor */}
      <AIAdvisor 
        gameState={gameState} 
        onAdvice={setLastAdvice}
      />

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { action: 'irrigate', icon: Droplets, label: 'სარწყავი', cost: 50, color: 'blue' },
          { action: 'fertilize', icon: Sprout, label: 'სასუქი', cost: 100, color: 'green' },
          { action: 'spray', icon: Bug, label: 'პესტიციდი', cost: 80, color: 'red' },
          { action: 'harvest', icon: Trophy, label: 'მკა', cost: 0, color: 'yellow' },
          { action: 'wait', icon: Sun, label: 'მოლოდინი', cost: 0, color: 'gray' },
        ].map(({ action, icon: Icon, label, cost, color }) => (
          <button
            key={action}
            onClick={() => executeAction(action)}
            disabled={gameState.isGameOver || (cost > 0 && gameState.money < cost)}
            className={`card p-3 flex flex-col items-center gap-2 hover:border-${color}-500 transition-colors disabled:opacity-50 ${
              lastAdvice?.recommendedAction === action ? 'ring-2 ring-accent' : ''
            }`}
          >
            <Icon className={`h-5 w-5 text-${color}-500`} />
            <span className="text-xs font-medium text-text-primary">{label}</span>
            {cost > 0 && <span className="text-[10px] text-text-muted">${cost}</span>}
          </button>
        ))}
      </div>

      {/* Weather Forecast */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">7-დღიანი პროგნოზი</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {gameState.weatherForecast.slice(0, 7).map((day, idx) => (
            <div 
              key={idx}
              className="flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-lg bg-bg-primary"
            >
              <span className="text-[10px] text-text-muted">დღე {day.day}</span>
              <WeatherIcon condition={day.condition} />
              <span className="text-xs font-medium text-text-primary">{day.temp}°C</span>
              <span className="text-[10px] text-text-muted">{day.rain}მმ</span>
            </div>
          ))}
        </div>
      </div>

      {/* Game Log */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">მოვლენები</h3>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {gameState.gameLog.map((log, idx) => (
            <div key={idx} className="text-xs text-text-secondary py-1 border-b border-bg-border last:border-0">
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* Next Day Button */}
      {!gameState.isGameOver && (
        <button
          onClick={() => executeAction('next_day')}
          className="btn btn-primary w-full py-3"
        >
          შემდეგი დღე →
        </button>
      )}

      {/* Game Over Screen */}
      {gameState.isGameOver && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200]">
          <div className="card p-8 max-w-sm w-full mx-4 text-center">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {gameState.wheatHealth > 0 ? 'თამაში დასრულებულია!' : 'მოსავალი დაიღუპა'}
            </h2>
            <p className="text-text-secondary mb-6">
              საბოლოო შედეგი: ${gameState.money} • რეპუტაცია: {gameState.reputation}%
            </p>
            <button onClick={resetGame} className="btn btn-primary w-full">
              ხელახლა დაწყება
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
