import React from 'react'
import SummaryCard from './SummaryCard'
import IterationsTable from './IterationsTable'

export default function ResultsPanel({ result, methodId }) {
  return (
    <>
      <SummaryCard result={result} />
      <IterationsTable result={result} />
    </>
  )
}
