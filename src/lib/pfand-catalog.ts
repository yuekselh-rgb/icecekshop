/*
 * Kanonische Liste aller offiziellen Pfand-Arten (Name + Betrag). Wird
 * u. a. verwendet, um die Lagerübersicht/den Pfand-Ausgang in
 * /admin/pfand auch für Pfand-Arten anzuzeigen, die noch nie als
 * Eingang erfasst wurden. Kunden-/Kassen-Formulare (Warenkorb,
 * /pfand, Barverkauf) pflegen ihre eigene Kopie dieser Liste, da sie
 * jeweils ein anderes Datenformat brauchen — bei einer neuen Pfand-Art
 * müssen alle Stellen einzeln ergänzt werden.
 */
export const PFAND_CATALOG = [
  {
    key: "PET_025",
    nameDe: "PET / Dose (Einweg)",
    unitAmount: 0.25,
  },
  {
    key: "GLASS_008",
    nameDe: "Glasflasche Mehrweg 0,08 €",
    unitAmount: 0.08,
  },
  {
    key: "GLASS_015",
    nameDe: "Glasflasche Mehrweg 0,15 €",
    unitAmount: 0.15,
  },
  {
    key: "CRATE_330",
    nameDe: "Kiste / Getränkekasten",
    unitAmount: 3.3,
  },
  {
    key: "CRATE_510",
    nameDe: "Kasten Pfand 5,10 €",
    unitAmount: 5.1,
  },
  {
    key: "CRATE_390",
    nameDe: "Kasten Pfand 3,90 €",
    unitAmount: 3.9,
  },
  {
    key: "CRATE_342",
    nameDe: "Kasten Pfand 3,42 €",
    unitAmount: 3.42,
  },
  {
    key: "CRATE_310",
    nameDe: "Kasten Pfand 3,10 €",
    unitAmount: 3.1,
  },
  {
    key: "CRATE_150",
    nameDe: "Kasten Pfand 1,50 €",
    unitAmount: 1.5,
  },
] as const;
