"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { MergathonData } from "../types";

interface DataContextType {
  data: MergathonData | null;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType>({
  data: null,
  loading: true,
  error: null,
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<MergathonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch static JSON file located in public directory
        const response = await fetch("/data/mergathon-data.json", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.statusText}`);
        }
        const json = await response.json();
        setData(json);
        setError(null);
      } catch (err: any) {
        console.error("Error loading dashboard data:", err);
        setError(err.message || "Failed to load Mergathon data.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <DataContext.Provider value={{ data, loading, error }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
