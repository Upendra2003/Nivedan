export interface Subcategory {
  id: string;
  label: string;
  description?: string;
  steps?: string[];
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  subcategories: Subcategory[];
}

export const CATEGORIES: Category[] = [
  {
    id: "labor_issues",
    label: "Labor Issues",
    icon: "⚖️",
    subcategories: [
      {
        id: "salary_not_paid",
        label: "Salary Not Paid",
        description: "Employer has not paid your salary",
        steps: ["Legal Notice", "Labour Commissioner", "File Claim", "Escalation"],
      },
      { id: "wrongful_termination", label: "Wrongful Termination" },
      { id: "workplace_harassment", label: "Workplace Harassment" },
    ],
  },
  {
    id: "police_criminal",
    label: "Police & Criminal",
    icon: "🚔",
    subcategories: [
      { id: "file_fir", label: "File an FIR" },
      { id: "police_detention", label: "Wrongful Detention" },
      { id: "bail_process", label: "Bail Process" },
    ],
  },
  {
    id: "consumer_complaint",
    label: "Consumer Complaint",
    icon: "🛒",
    subcategories: [
      { id: "product_defect", label: "Product Defect" },
      { id: "service_fraud", label: "Service Fraud" },
      { id: "refund_denied", label: "Refund Denied" },
    ],
  },
  {
    id: "cyber_fraud",
    label: "Cyber Fraud",
    icon: "🔐",
    subcategories: [
      { id: "online_scam", label: "Online Scam / Fraud" },
      { id: "account_hack", label: "Account Hacked" },
      { id: "phishing", label: "Phishing Attack" },
    ],
  },
];

/** Find the parent category for a given subcategory id. */
export function findSubcategory(subcategoryId: string): {
  category: Category;
  subcategory: Subcategory;
} | null {
  for (const cat of CATEGORIES) {
    const sub = cat.subcategories.find((s) => s.id === subcategoryId);
    if (sub) return { category: cat, subcategory: sub };
  }
  return null;
}
