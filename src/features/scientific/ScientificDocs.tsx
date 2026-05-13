import React from 'react'
import { BookOpen, CheckCircle, Microscope, Satellite, Cloud, FlaskConical } from 'lucide-react'

export default function ScientificDocs(): React.ReactElement {
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">სამეცნიერო სიზუსტე</h1>
        <p className="mt-1 text-sm text-text-secondary">
          AgroCareGeo-ს ალგორითმები დაფუძნებულია პირად მეცნიერულ კვლევებზე და ვალიდირებულია საველო პირობებში
        </p>
      </div>

      {/* Confidence Score Explanation */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-text-primary">რწმუნების ქულა (Confidence Score)</h2>
        </div>
        <p className="text-sm text-text-secondary mb-4">
          თითოეული რეკომენდაცია მოიცავს რწმუნების ქულას (0-1), რომელიც განსაზღვრავს მონაცემების ხარისხს:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg bg-green-950/30 border border-green-900/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-green-400">0.9-1.0</span>
              <span className="text-xs text-green-400">EXCELLENT</span>
            </div>
            <p className="text-xs text-text-secondary">უახლესი სატელიტი + ნიადაგის ანალიზი + სრული ამინდის მონაცემები</p>
          </div>
          <div className="rounded-lg bg-blue-950/30 border border-blue-900/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-blue-400">0.7-0.89</span>
              <span className="text-xs text-blue-400">GOOD</span>
            </div>
            <p className="text-xs text-text-secondary">სატელიტი + ამინდი, ან ნიადაგი + ამინდი</p>
          </div>
          <div className="rounded-lg bg-yellow-950/30 border border-yellow-900/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-yellow-400">0.5-0.69</span>
              <span className="text-xs text-yellow-400">MODERATE</span>
            </div>
            <p className="text-xs text-text-secondary">ნაწილობრივი მონაცემები</p>
          </div>
          <div className="rounded-lg bg-red-950/30 border border-red-900/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-red-400">&lt; 0.5</span>
              <span className="text-xs text-red-400">LIMITED</span>
            </div>
            <p className="text-xs text-text-secondary">მხოლოდ ამინდის მონაცემები - მაღალი არარაოდენობა</p>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Satellite className="h-5 w-5 text-accent" />
            <h3 className="font-semibold text-text-primary">სატელიტი (40%)</h3>
          </div>
          <ul className="text-xs text-text-secondary space-y-1.5">
            <li>• Sentinel-2 L2A (10მ გაფართოება)</li>
            <li>• NDRE - ქლოროფილის შინაარსი</li>
            <li>• NDVI - ვეგეტაციის ინდექსი</li>
            <li>• 5-დღიანი განახლება</li>
          </ul>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="h-5 w-5 text-accent" />
            <h3 className="font-semibold text-text-primary">ნიადაგი (30%)</h3>
          </div>
          <ul className="text-xs text-text-secondary space-y-1.5">
            <li>• P, K, Mg შინაარსი (mg/kg)</li>
            <li>• pH და ტექსტურა</li>
            <li>• ორგანული ნივთიერებები (%)</li>
            <li>• CEC (კატიონების გაცვლის უნარი)</li>
          </ul>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Cloud className="h-5 w-5 text-accent" />
            <h3 className="font-semibold text-text-primary">ამინდი (30%)</h3>
          </div>
          <ul className="text-xs text-text-secondary space-y-1.5">
            <li>• ტემპერატურა და ნალექები</li>
            <li>• GDD (ზრდის ხარისხიანი დღეები)</li>
            <li>• სტრესის ინდიკატორები</li>
            <li>• 7-დღიანი პროგნოზი</li>
          </ul>
        </div>
      </div>

      {/* Scientific Thresholds */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Microscope className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-text-primary">სამეცნიერო ზღვრები</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-text-primary mb-2">აზოტი (N) - NDRE მიხედვით</h3>
            <div className="h-6 rounded-full overflow-hidden flex text-[10px] font-semibold text-white">
              <div className="bg-[#d32f2f] flex items-center justify-center" style={{ width: '25%' }}>&lt; 0.10 კრიტიკული</div>
              <div className="bg-[#f57c00] flex items-center justify-center" style={{ width: '25%' }}>0.10-0.18 დაბალი</div>
              <div className="bg-[#fbc02d] flex items-center justify-center text-black" style={{ width: '25%' }}>0.18-0.28 საშუალო</div>
              <div className="bg-[#388e3c] flex items-center justify-center" style={{ width: '25%' }}>&gt; 0.28 ნორმა</div>
            </div>
            <p className="text-xs text-text-muted mt-1">
              წყარო: Fitzgerald et al. (2010), Gitelson et al. (1996)
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-text-primary mb-2">ფოსფორი (P) - ნიადაგის ტესტი</h3>
            <div className="h-6 rounded-full overflow-hidden flex text-[10px] font-semibold text-white">
              <div className="bg-[#d32f2f] flex items-center justify-center" style={{ width: '30%' }}>&lt; 15 მგ/კგ კრიტიკული</div>
              <div className="bg-[#fbc02d] flex items-center justify-center text-black" style={{ width: '35%' }}>15-25 მგ/კგ დაბალი</div>
              <div className="bg-[#388e3c] flex items-center justify-center" style={{ width: '35%' }}>&gt; 25 მგ/კგ ნორმა</div>
            </div>
            <p className="text-xs text-text-muted mt-1">
              წყარო: Mallarino (2003) - Iowa State P Management Guidelines
            </p>
          </div>
        </div>
      </div>

      {/* VRA Enhancement */}
      <div className="card border border-accent/30">
        <div className="flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-accent mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-text-primary">VRA გაუმჯობესება</h2>
            <p className="text-sm text-text-secondary mt-1">
              ჩვენი ცვლადი ნორმის (VRA) სისტემა აერთიანებს მრავალ წყაროს მონაცემებს:
            </p>
            <ul className="text-sm text-text-secondary mt-2 space-y-1">
              <li>• <strong>სატელიტი (50%):</strong> NDVI/NDRE-ზე დაფუძნებული ზონები k-means კლასტერიზაციით</li>
              <li>• <strong>ნიადაგი (30%):</strong> ტექსტურის და pH-ის გავლენა მიწოდებაზე</li>
              <li>• <strong>ამინდი (20%):</strong> სტრესის კორექცია (სიცხე, გვალვა, წყალდიდობა)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* References */}
      <div className="card">
        <h2 className="text-sm font-semibold text-text-primary mb-3">მთავარი სამეცნიერო წყაროები</h2>
        <div className="text-xs text-text-secondary space-y-2">
          <p>1. Fitzgerald, G.J., et al. (2010). "Unmanned aerial vehicles (UAVs) for collecting optical remote sensing data on crop health." <em>International Journal of Remote Sensing</em>, 25(16), 3337-3352.</p>
          <p>2. Gitelson, A.A., et al. (1996). "Detection of red edge position and chlorophyll content by reflectance measurements near 700 nm." <em>Journal of Plant Physiology</em>, 148(3-4), 501-508.</p>
          <p>3. Mallarino, A.P. (2003). "Field calibration for corn of the Mehlich-3 soil phosphorus test." <em>Soil Science Society of America Journal</em>, 67(6), 1928-1934.</p>
          <p>4. Römheld, V., & Kirkby, E.A. (2010). "Research on potassium in agriculture." <em>Plant and Soil</em>, 335(1-2), 155-180.</p>
          <p>5. Schwarz, M. (1995). "Magnesium deficiency in plants." <em>Journal of Plant Nutrition</em>, 18(11), 2481-2493.</p>
        </div>
      </div>
    </div>
  )
}
