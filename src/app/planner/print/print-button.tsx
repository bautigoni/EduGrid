"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600"
      onClick={() => window.print()}
    >
      Imprimir / Guardar PDF
    </button>
  );
}
