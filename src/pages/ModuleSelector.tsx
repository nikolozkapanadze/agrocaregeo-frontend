/** Portal entry - Crop/Module selection page */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Grape, Nut, CircleDot, Circle, Leaf, 
  Sun, Wheat, Bean, Flower2 
} from 'lucide-react'

// Crop configurations matching backend
const PERENNIAL_CROPS = [
  { key: 'vine', name: 'ვენახი', nameEn: 'Vineyard', icon: Grape, color: '#8B5CF6' },
  { key: 'hazelnut', name: 'თხილი', nameEn: 'Hazelnut', icon: Nut, color: '#A16207' },
  { key: 'olive', name: 'ზეთისხილი', nameEn: 'Olive', icon: CircleDot, color: '#65A30D' },
  { key: 'walnut', name: 'კაკალი', nameEn: 'Walnut', icon: Nut, color: '#78350F' },
  { key: 'blueberry', name: 'მოცვი', nameEn: 'Blueberry', icon: Circle, color: '#3B82F6' },
  { key: 'almond', name: 'ნუში', nameEn: 'Almond', icon: Nut, color: '#92400E' },
  { key: 'tea', name: 'ჩაი', nameEn: 'Tea', icon: Leaf, color: '#15803D' },
  { key: 'citrus', name: 'ციტრუსი', nameEn: 'Citrus', icon: CircleDot, color: '#EAB308' },
]

const ANNUAL_CROPS = [
  { key: 'wheat', name: 'ხორბალი', nameEn: 'Wheat', icon: Wheat, color: '#EAB308' },
  { key: 'corn', name: 'სიმინდი', nameEn: 'Corn', icon: Sun, color: '#FDE047' },
  { key: 'sunflower', name: 'მზესუმზირა', nameEn: 'Sunflower', icon: Sun, color: '#F59E0B' },
  { key: 'barley', name: 'ჭვავი', nameEn: 'Barley', icon: Wheat, color: '#D4D4D8' },
  { key: 'soybean', name: 'სოიო', nameEn: 'Soybean', icon: Bean, color: '#65A30D' },
  { key: 'rapeseed', name: 'კამელი', nameEn: 'Rapeseed', icon: Flower2, color: '#FACC15' },
]

export default function ModuleSelector(): React.ReactElement {
  const navigate = useNavigate()
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null)

  const handleSelect = (cropKey: string) => {
    setSelectedCrop(cropKey)
    // Store in localStorage
    localStorage.setItem('agrocare_selected_crop', cropKey)
    // Navigate to dashboard for this crop
    navigate(`/dashboard?crop=${cropKey}`)
  }

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            AgroCareGeo Portal
          </h1>
          <p className="text-text-muted">
            აირჩიეთ კულტურა მართვის დასაწყებად
          </p>
        </div>

        {/* Perennials */}
        <section className="mb-12">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-6">
            მრავალწლოვანი კულტურები
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {PERENNIAL_CROPS.map(crop => (
              <CropCard
                key={crop.key}
                crop={crop}
                isSelected={selectedCrop === crop.key}
                onClick={() => handleSelect(crop.key)}
              />
            ))}
          </div>
        </section>

        {/* Annuals */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-6">
            ერთწლოვანი კულტურები
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {ANNUAL_CROPS.map(crop => (
              <CropCard
                key={crop.key}
                crop={crop}
                isSelected={selectedCrop === crop.key}
                onClick={() => handleSelect(crop.key)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

interface CropCardProps {
  crop: {
    key: string
    name: string
    nameEn: string
    icon: React.ComponentType<{ className?: string }>
    color: string
  }
  isSelected: boolean
  onClick: () => void
}

function CropCard({ crop, isSelected, onClick }: CropCardProps): React.ReactElement {
  const Icon = crop.icon
  
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200
        ${isSelected 
          ? 'border-accent bg-accent/10 shadow-glow' 
          : 'border-white/10 bg-bg-card hover:border-white/20 hover:bg-white/5'
        }
      `}
    >
      <div 
        className="flex items-center justify-center w-12 h-12 rounded-xl mb-3"
        style={{ backgroundColor: `${crop.color}20` }}
      >
        <div style={{ color: crop.color }}><Icon className="w-6 h-6" /></div>
      </div>
      <span className="text-sm font-medium text-text-primary text-center">
        {crop.name}
      </span>
      <span className="text-xs text-text-muted text-center">
        {crop.nameEn}
      </span>
    </button>
  )
}
