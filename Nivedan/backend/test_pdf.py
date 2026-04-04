"""
Quick PDF generation test — run with:
    uv run python test_pdf.py

Opens the generated PDF automatically.
"""

import base64
import os
import subprocess
import sys

# Allow imports from the backend package
sys.path.insert(0, os.path.dirname(__file__))

from services.pdf_generator import generate_salary_complaint

# ── Sample form data ──────────────────────────────────────────────────────────

FORM_DATA = {
    "complainant_name":     "Ravi Kumar Sharma",
    "complainant_address":  "12, MG Road, Hyderabad, Telangana - 500001",
    "complainant_phone":    "9876543210",
    "complainant_email":    "ravi.kumar@example.com",
    "employer_name":        "TechSoft Solutions Pvt. Ltd.",
    "employer_address":     "Plot 45, Hitech City, Hyderabad - 500081",
    "nature_of_business":   "Software Development",
    "designation":          "Senior Software Engineer",
    "employment_start_date":"01 June 2022",
    "last_paid_date":       "31 October 2024",
    "months_pending":       "4",
    "amount_pending":       "1,20,000",
    "attempts_made":        (
        "Sent email to HR on 05 Nov 2024 — no response\n"
        "Spoke to manager on 12 Nov 2024 — promised payment in a week\n"
        "Sent legal notice via courier on 20 Nov 2024 — no response"
    ),
    "declaration_date":     "22 March 2026",
}

# ── Optional: load a real signature from a file ────────────────────────────────
# Place any PNG/JPG at backend/assets/test_signature.png to embed it.
SIG_B64 = None
_sig_path = os.path.join(os.path.dirname(__file__), "assets", "test_signature.png")
if os.path.exists(_sig_path):
    with open(_sig_path, "rb") as f:
        SIG_B64 = base64.b64encode(f.read()).decode()
    print(f"  Signature loaded from {_sig_path}")
else:
    print("  No test_signature.png found — signature section will be blank.")

# ── Generate ──────────────────────────────────────────────────────────────────

print("\nGenerating PDF...")
pdf_b64 = generate_salary_complaint(FORM_DATA, signature_b64=SIG_B64, supporting_docs=[])

# ── Save ──────────────────────────────────────────────────────────────────────

out_path = os.path.join(os.path.dirname(__file__), "test_output.pdf")
with open(out_path, "wb") as f:
    f.write(base64.b64decode(pdf_b64))

size_kb = os.path.getsize(out_path) / 1024
print(f"  Saved to: {out_path}  ({size_kb:.1f} KB)")

# ── Open automatically ────────────────────────────────────────────────────────

print("  Opening PDF...")
if sys.platform == "win32":
    os.startfile(out_path)
elif sys.platform == "darwin":
    subprocess.run(["open", out_path])
else:
    subprocess.run(["xdg-open", out_path])

print("Done.")
