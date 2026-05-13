import React from 'react'
import { useParcelMap } from '../hooks/useParcelMap'
import ParcelMapView from './ParcelMapView'


interface Props {
  fullscreen?: boolean
  height?: string
  allowForms?: boolean
  focusCode?: string | null
}

export default function ParcelMap({ 
  fullscreen = false, 
  height = '300px', 
  allowForms = false, 
  focusCode 
}: Props): React.ReactElement {
  const {
    geojson,
    subzonesGeojson,
    diseaseGeojson,
    loading,
    error,
    layerMode,
    selectedParcel,
    formType,
    showFormModal,
    searchQuery,
    searchResult,
    searchError,
    geoJsonRef,
    highlightLayerRef,
    setLayerMode,
    setSelectedParcel,
    setFormType,
    setShowFormModal,
    setSearchQuery,
    handleSearch,
    clearSearch,
    handleParcelSelect,
    getStyle,
    getSubzoneStyle,
    layerButtons,
    refreshData,
    dataVersion,
  } = useParcelMap({ focusCode, allowForms })

  return (
    <ParcelMapView
      fullscreen={fullscreen}
      height={height}
      allowForms={allowForms}
      geojson={geojson}
      subzonesGeojson={subzonesGeojson}
      diseaseGeojson={diseaseGeojson}
      loading={loading}
      error={error}
      layerMode={layerMode}
      selectedParcel={selectedParcel}
      formType={formType}
      showFormModal={showFormModal}
      searchQuery={searchQuery}
      searchResult={searchResult}
      searchError={searchError}
      geoJsonRef={geoJsonRef}
      highlightLayerRef={highlightLayerRef}
      setLayerMode={setLayerMode}
      setSelectedParcel={setSelectedParcel}
      setFormType={setFormType}
      setShowFormModal={setShowFormModal}
      setSearchQuery={setSearchQuery}
      handleSearch={handleSearch}
      clearSearch={clearSearch}
      handleParcelSelect={handleParcelSelect}
      setSearchResult={() => {}}
      getStyle={getStyle}
      getSubzoneStyle={getSubzoneStyle}
      layerButtons={layerButtons}
      onParcelCreated={refreshData}
      dataVersion={dataVersion}
    />
  )
}
