"use client"
import dynamic from "next/dynamic"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"

const LeafletHeatMap = dynamic(
  () => import("@/components/maps/LeafletHeatMap").then((m) => m.LeafletHeatMap),
  { ssr: false, loading: () => <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center"><LoadingSpinner /></div> }
)

export function HeatMapSection({ points }: { points: { lat: number; lng: number }[] }) {
  return <LeafletHeatMap points={points} />
}
