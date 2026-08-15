"use client";

import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";

type ProductsResult = {
  shop: string;
  data: {
    shop: { name: string };
    products: { edges: { node: { id: string; title: string } }[] };
  };
};

export default function Home() {
  const shopify = useAppBridge();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [result, setResult] = useState<ProductsResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const token = await shopify.idToken();
        const res = await fetch("/api/products", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (cancelled) return;

        if (!res.ok) {
          setError(`Request failed with status ${res.status}`);
          setStatus("error");
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        setResult(data);
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [shopify]);

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Configurator</h1>

      {status === "loading" && <p className="text-zinc-500">Loading products…</p>}

      {status === "error" && (
        <p className="text-red-600">
          Failed to load products{error ? `: ${error}` : ""}
        </p>
      )}

      {status === "ready" && result && (
        <>
          <p className="text-sm text-zinc-600">
            Connected to{" "}
            <span className="font-medium">{result.data.shop.name}</span>
          </p>
          <ul className="list-disc pl-6">
            {result.data.products.edges.map(({ node }) => (
              <li key={node.id}>{node.title}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
