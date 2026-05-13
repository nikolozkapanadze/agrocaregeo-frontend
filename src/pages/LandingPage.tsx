/** Landing Page - First select crop, then login
 * 
 * Flow:
 * 1. User opens site → sees this landing page
 * 2. Selects a crop
 * 3. Clicks "Enter" → goes to login
 * 4. After login → dashboard with selected crop active
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Grape, Nut, CircleDot, Circle, Leaf, 
  Sun, Wheat, Bean, Flower2, ArrowRight,
  CheckCircle2
} from 'lucide-react'

// All available crops
const PERENNIAL_CROPS = [
  { key: 'vine', name: 'ვენახი', nameEn: 'Vineyard', icon: Grape, color: '#8B5CF6', desc: 'BBCH ფენოლოგია, დაავადებები, მოსავალი' },
  { key: 'hazelnut', name: 'თხილი', nameEn: 'Hazelnut', icon: Nut, color: '#A16207', desc: 'EFB რისკი, მოსავლის ზონები' },
  { key: 'olive', name: 'ზეთისხილი', nameEn: 'Olive', icon: CircleDot, color: '#65A30D', desc: 'ბუზის მონიტორინგი, ზეთის შემადგენლობა' },
  { key: 'walnut', name: 'კაკალი', nameEn: 'Walnut', icon: Nut, color: '#78350F', desc: 'Blight რისკი, ყვავილობა' },
  { key: 'blueberry', name: 'მოცვი', nameEn: 'Blueberry', icon: Circle, color: '#3B82F6', desc: 'Mummy berry, Botrytis' },
  { key: 'almond', name: 'ნუში', nameEn: 'Almond', icon: Nut, color: '#92400E', desc: 'Navel OW, ყინვის რისკი' },
  { key: 'tea', name: 'ჩაი', nameEn: 'Tea', icon: Leaf, color: '#15803D', desc: 'Blister blight, ფლუშები' },
  { key: 'citrus', name: 'ციტრუსი', nameEn: 'Citrus', icon: CircleDot, color: '#EAB308', desc: 'Brix, მწიფობის ინდექსი' },
]

const ANNUAL_CROPS = [
  { key: 'wheat', name: 'ხორბალი', nameEn: 'Wheat', icon: Wheat, color: '#EAB308', desc: 'მინერალები, Zadoks, VRA' },
  { key: 'corn', name: 'სიმინდი', nameEn: 'Corn', icon: Sun, color: '#FDE047', desc: 'FAO ერთეულები, Fusarium' },
  { key: 'sunflower', name: 'მზესუმზირა', nameEn: 'Sunflower', icon: Sun, color: '#F59E0B', desc: 'Sclerotinia, ზეთის პროგნოზი' },
  { key: 'barley', name: 'ჭვავი', nameEn: 'Barley', icon: Wheat, color: '#D4D4D8', desc: 'Scald, Net blotch' },
  { key: 'soybean', name: 'სოიო', nameEn: 'Soybean', icon: Bean, color: '#65A30D', desc: 'R-ფაზები, Frogeye' },
  { key: 'rapeseed', name: 'კამელი', nameEn: 'Rapeseed', icon: Flower2, color: '#FACC15', desc: 'Sclerotinia, Blackleg' },
]

export default function LandingPage(): React.ReactElement {
  const navigate = useNavigate()
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null)
  const [hoveredCrop, setHoveredCrop] = useState<string | null>(null)

  // Check if crop was previously selected
  useEffect(() => {
    const savedCrop = localStorage.getItem('agrocare_selected_crop')
    if (savedCrop) {
      setSelectedCrop(savedCrop)
    }
  }, [])

  const handleSelect = (cropKey: string) => {
    setSelectedCrop(cropKey)
    localStorage.setItem('agrocare_selected_crop', cropKey)
  }

  const handleEnter = () => {
    if (selectedCrop) {
      // Go to login, crop is already saved
      navigate('/login')
    }
  }

  const selectedCropData = [...PERENNIAL_CROPS, ...ANNUAL_CROPS].find(c => c.key === selectedCrop)

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-success/5" />
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-hover shadow-glow">
              <Sun className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">AgroCareGeo</h1>
              <p className="text-xs text-text-muted tracking-wider">AGRICULTURAL INTELLIGENCE</p>
            </div>
          </div>

          {/* Main heading */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              აირჩიეთ კულტურა
            </h2>
            <p className="text-lg text-text-muted">
              აირჩიეთ მოსავლის ტიპი და მიიღეთ პერსონალიზებული 
              რეკომენდაციები, ანალიზი და მართვის ინსტრუმენტები
            </p>
          </div>

          {/* Selected crop indicator */}
          {selectedCropData && (
            <div 
              className="max-w-md mx-auto mb-8 p-4 rounded-2xl border-2 animate-pulse"
              style={{ 
                borderColor: selectedCropData.color,
                backgroundColor: `${selectedCropData.color}10`
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${selectedCropData.color}30` }}
                >
                  <selectedCropData.icon className="w-6 h-6" style={{ color: selectedCropData.color }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-text-primary">{selectedCropData.name}</p>
                  <p className="text-sm text-text-muted">{selectedCropData.desc}</p>
                </div>
                <CheckCircle2 className="w-6 h-6" style={{ color: selectedCropData.color }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Crop Selection */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        
        {/* Perennials */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-success rounded-full" />
            <h3 className="text-lg font-semibold text-text-primary">მრავალწლოვანი კულტურები</h3>
            <span className="text-xs text-text-muted">(ხეები და ვაზი)</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {PERENNIAL_CROPS.map(crop => (
              <CropCard
                key={crop.key}
                crop={crop}
                isSelected={selectedCrop === crop.key}
                isHovered={hoveredCrop === crop.key}
                onSelect={() => handleSelect(crop.key)}
                onHover={() => setHoveredCrop(crop.key)}
                onLeave={() => setHoveredCrop(null)}
              />
            ))}
          </div>
        </section>

        {/* Annuals */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-info rounded-full" />
            <h3 className="text-lg font-semibold text-text-primary">ერთწლოვანი კულტურები</h3>
            <span className="text-xs text-text-muted">(ყოველსეზონურად)</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {ANNUAL_CROPS.map(crop => (
              <CropCard
                key={crop.key}
                crop={crop}
                isSelected={selectedCrop === crop.key}
                isHovered={hoveredCrop === crop.key}
                onSelect={() => handleSelect(crop.key)}
                onHover={() => setHoveredCrop(crop.key)}
                onLeave={() => setHoveredCrop(null)}
              />
            ))}
          </div>
        </section>

        {/* Enter button */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-primary via-bg-primary to-transparent">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleEnter}
              disabled={!selectedCrop}
              className={`
                w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl
                text-lg font-semibold transition-all duration-300
                ${selectedCrop 
                  ? 'bg-accent text-white hover:bg-accent-hover shadow-glow hover:shadow-glow-lg transform hover:-translate-y-1' 
                  : 'bg-white/5 text-text-muted cursor-not-allowed'
                }
              `}
            >
              {selectedCrop ? (
                <>
                  <span>შესვლა</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <span>აირჩიეთ კულტურა</span>
              )}
            </button>
            
            {selectedCrop && (
              <p className="text-center text-sm text-text-muted mt-3">
                გადამისამართება ავტორიზაციის გვერდზე...
              </p>
            )}
          </div>
        </div>
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
    desc: string
  }
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: () => void
  onLeave: () => void
}

function CropCard({ 
  crop, 
  isSelected, 
  isHovered,
  onSelect, 
  onHover,
  onLeave
}: CropCardProps): React.ReactElement {
  const Icon = crop.icon
  
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`
        relative group flex flex-col items-center p-4 rounded-2xl border-2 
        transition-all duration-300 text-left
        ${isSelected 
          ? 'border-accent bg-accent/10 shadow-glow scale-105' 
          : 'border-white/10 bg-bg-card hover:border-white/20 hover:bg-white/5'
        }
      `}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
      )}
      
      {/* Icon */}
      <div 
        className={`
          flex items-center justify-center w-14 h-14 rounded-xl mb-3
          transition-transform duration-300
          ${isHovered || isSelected ? 'scale-110' : ''}
        `}
        style={{ backgroundColor: `${crop.color}20` }}
      >
        <div style={{ color: crop.color }}>
          <Icon className="w-7 h-7 transition-colors" />
        </div>
      </div>
      
      {/* Name */}
      <span className="text-sm font-medium text-text-primary text-center">
        {crop.name}
      </span>
      <span className="text-xs text-text-muted text-center">
        {crop.nameEn}
      </span>
      
      {/* Description on hover */}
      <div className={`
        absolute inset-x-0 -bottom-12 px-2 transition-opacity duration-200
        ${isHovered || isSelected ? 'opacity-100' : 'opacity-0'}
      `}>
        <p className="text-[10px] text-text-muted text-center bg-bg-card/90 rounded px-2 py-1">
          {crop.desc}
        </p>
      </div>
    </button>
  )
}
