export const API_BASE = "http://localhost:3000/api";

export type Annonce = {
  _id: string;
  titre: string;
  description: string;
  prix: number;
  surface?: number;
  pieces?: number;
  type: "appartement" | "maison" | "terrain" | "local";
  ville: string;
  codePostal?: string;
  balcon?: boolean;
  jardin?: boolean;
  statut: "active" | "inactive" | "archive";
  photos: string[];
  dateCreation: string;
  dateModification: string;
};

export type AnnonceForm = {
  titre: string;
  description: string;
  prix: string;
  surface?: string;
  pieces?: string;
  type: "appartement" | "maison" | "terrain" | "local" | "";
  ville: string;
  codePostal?: string;
  balcon: boolean;
  jardin: boolean;
};

export async function fetchAnnonces(): Promise<Annonce[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function fetchAnnonce(id: string): Promise<Annonce> {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function createAnnonce(data: Record<string, unknown>): Promise<Annonce> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function updateAnnonce(id: string, data: Record<string, unknown>): Promise<Annonce> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function deleteAnnonce(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}
