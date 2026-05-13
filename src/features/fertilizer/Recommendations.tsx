/**
 * Recommendations Container
 * 
 * Wires the useRecommendations hook to the RecommendationsView.
 * All business logic lives in the hook; this is purely a wiring component.
 */

import { useRecommendations } from './hooks/useRecommendations'
import { RecommendationsView } from './components/RecommendationsView'

export default function Recommendations() {
  const {
    data,
    moonInfo,
    filteredData,
    sortedData,
    loading,
    error,
    recalculating,
    recalcMsg,
    emptyMessage,
    filterPriority,
    sortKey,
    setFilterPriority,
    setSortKey,
    stats,
    recalculate,
  } = useRecommendations()

  return (
    <RecommendationsView
      data={data}
      moonInfo={moonInfo}
      filteredData={filteredData}
      sortedData={sortedData}
      loading={loading}
      error={error}
      recalculating={recalculating}
      recalcMsg={recalcMsg}
      emptyMessage={emptyMessage}
      filterPriority={filterPriority}
      sortKey={sortKey}
      onFilterChange={setFilterPriority}
      onSortChange={setSortKey}
      stats={stats}
      onRecalculate={recalculate}
    />
  )
}
