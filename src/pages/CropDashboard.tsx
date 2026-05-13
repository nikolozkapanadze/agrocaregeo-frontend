import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import {
  VineDashboard,
  HazelnutDashboard,
  OliveDashboard,
  WalnutDashboard,
  BlueberryDashboard,
  AlmondDashboard,
  TeaDashboard,
  CitrusDashboard,
  WheatDashboard,
  CornDashboard,
  SunflowerDashboard,
  BarleyDashboard,
  SoybeanDashboard,
  RapeseedDashboard,
} from '@/modules'

type CropDashboardComponent = React.ComponentType

const CROP_COMPONENTS: Record<string, CropDashboardComponent> = {
  vine:      VineDashboard,
  hazelnut:  HazelnutDashboard,
  olive:     OliveDashboard,
  walnut:    WalnutDashboard,
  blueberry: BlueberryDashboard,
  almond:    AlmondDashboard,
  tea:       TeaDashboard,
  citrus:    CitrusDashboard,
  wheat:     WheatDashboard,
  corn:      CornDashboard,
  sunflower: SunflowerDashboard,
  barley:    BarleyDashboard,
  soybean:   SoybeanDashboard,
  rapeseed:  RapeseedDashboard,
}

export default function CropDashboard(): React.ReactElement {
  const { cropId } = useParams<{ cropId: string }>()

  const DashboardComponent = cropId ? CROP_COMPONENTS[cropId] : undefined

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link
          to="/crops"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          კულტურები
        </Link>
      </div>

      {/* Dashboard content */}
      {DashboardComponent ? (
        <DashboardComponent />
      ) : (
        <div className="card flex flex-col items-center justify-center gap-4 py-20 text-center">
          <p className="text-text-secondary text-lg">კულტურა ვერ მოიძებნა</p>
          <Link
            to="/crops"
            className="text-sm text-accent hover:underline"
          >
            კულტურების სიაში დაბრუნება
          </Link>
        </div>
      )}
    </div>
  )
}
