/**
 * Module-level store for passing PDF data + callbacks to the pdf-viewer route.
 * Works because expo-router keeps the source screen mounted while the viewer is open.
 */

export interface PdfViewerData {
  pdfBase64: string;
  filename: string;
  /** Display title shown in the header (e.g. "Salary Not Paid Complaint Form") */
  category: string;
  onApprove: () => void;
  onRequestChanges: (text: string) => void;
}

let _store: PdfViewerData | null = null;

export function setPdfViewerData(data: PdfViewerData) {
  _store = data;
}

export function getPdfViewerData(): PdfViewerData | null {
  return _store;
}

export function clearPdfViewerData() {
  _store = null;
}
