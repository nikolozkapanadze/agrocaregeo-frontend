import React from 'react'
import { Link } from 'react-router-dom'

interface Crop {
  id: string
  nameKa: string
  nameEn: string
  color: string
  emoji: string
}

const CROPS: Crop[] = [
  // Perennial
  { id: 'vine',       nameKa: 'ვენახი',     nameEn: 'Vineyard',    color: '#8B5CF6', emoji: '🍇' },
  { id: 'hazelnut',   nameKa: 'თხილი',      nameEn: 'Hazelnut',    color: '#92400E', emoji: '🌰' },
  { id: 'olive',      nameKa: 'ზეთისხილი',  nameEn: 'Olive',       color: '#4D7C0F', emoji: '🫒' },
  { id: 'walnut',     nameKa: 'ნიგოზი',     nameEn: 'Walnut',      color: '#78350F', emoji: '🥜' },
  { id: 'blueberry',  nameKa: 'მოცვი',      nameEn: 'Blueberry',   color: '#3730A3', emoji: '🫐' },
  { id: 'almond',     nameKa: 'ნუში',       nameEn: 'Almond',      color: '#D97706', emoji: '🌸' },
  { id: 'tea',        nameKa: 'ჩაი',        nameEn: 'Tea',         color: '#15803D', emoji: '🍵' },
  { id: 'citrus',     nameKa: 'ციტრუსი',    nameEn: 'Citrus',      color: '#EA580C', emoji: '🍊' },
  // Annual
  { id: 'wheat',      nameKa: 'ხორბალი',    nameEn: 'Wheat',       color: '#CA8A04', emoji: '🌾' },
  { id: 'corn',       nameKa: 'სიმინდი',    nameEn: 'Corn',        color: '#EAB308', emoji: '🌽' },
  { id: 'sunflower',  nameKa: 'მზესუმზირა', nameEn: 'Sunflower',   color: '#F59E0B', emoji: '🌻' },
  { id: 'barley',     nameKa: 'ქერი',       nameEn: 'Barley',      color: '#A78BFA', emoji: '🌾' },
  { id: 'soybean',    nameKa: 'სოია',       nameEn: 'Soybean',     color: '#65A30D', emoji: '🫘' },
  { id: 'rapeseed',   nameKa: 'რაფსი',      nameEn: 'Rapeseed',    color: '#FBBF24', emoji: '🌼' },
]

const PERENNIAL_CROPS = CROPS.slice(0, 8)
const ANNUAL_CROPS = CROPS.slice(8)

interface CropCardProps {
  crop: Crop
}

function CropCard({ crop }: CropCardProps): React.ReactElement {
  return (
    <Link
      to={`/crops/${crop.id}`}
      className="card flex flex-col items-center gap-2 p-5 hover:border-white/20 hover:bg-white/5 transition-all duration-200 group"
      style={{ borderBottom: `2px solid ${crop.color}` }}
    >
      <span className="text-4xl group-hover:scale-110 transition-transform duration-200">
        {crop.emoji}
      </span>
      <span className="text-text-primary font-semibold text-sm text-center">
        {crop.nameKa}
      </span>
      <span className="text-text-muted text-xs text-center">
        {crop.nameEn}
      </span>
    </Link>
  )
}

export default function Crops(): React.ReactElement {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">კულტურები</h1>
        <p className="mt-1 text-text-secondary">აირჩიეთ კულტურა სამართავად</p>
      </div>

      {/* Perennial section */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-muted">
          მრავალწლიანი
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {PERENNIAL_CROPS.map((crop) => (
            <CropCard key={crop.id} crop={crop} />
          ))}
        </div>
      </section>

      {/* Annual section */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-muted">
          ერთწლიანი
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {ANNUAL_CROPS.map((crop) => (
            <CropCard key={crop.id} crop={crop} />
          ))}
        </div>
      </section>
    </div>
  )
}
