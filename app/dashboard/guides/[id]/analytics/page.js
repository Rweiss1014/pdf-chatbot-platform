"use client";
import { useParams } from "next/navigation";
import AnalyticsView from "./AnalyticsView";

export default function AnalyticsPage() {
  const { id } = useParams();
  return <AnalyticsView guideId={id} />;
}
