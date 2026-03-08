import base64
from datetime import datetime, timezone

from fpdf import FPDF


def _s(text: str) -> str:
    """Strip characters outside Latin-1 so Helvetica never raises."""
    return str(text).encode("latin-1", errors="ignore").decode("latin-1")


def generate_salary_complaint_pdf(data: dict) -> bytes:
    """Generate a filled salary complaint PDF and return raw bytes."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_margins(20, 20, 20)

    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "SALARY COMPLAINT FORM", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, "Government Labour Department - CivicFlow Portal", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    filed_date = datetime.now(timezone.utc).strftime("%d/%m/%Y")
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 6, f"Date Filed: {filed_date}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    def section(title: str) -> None:
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_fill_color(240, 240, 240)
        pdf.cell(0, 8, f"  {title}", fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

    def row(label: str, value: str) -> None:
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(72, 7, f"{label}:", new_x="RIGHT", new_y="TOP")
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 7, _s(value) or "-", new_x="LMARGIN", new_y="NEXT")

    section("EMPLOYER DETAILS")
    row("Employer / Company Name", data.get("employer_name", ""))
    row("Employer Address", data.get("employer_address", ""))
    pdf.ln(4)

    section("EMPLOYMENT DETAILS")
    row("Date of Joining", data.get("employment_start", ""))
    row("Last Salary Received Date", data.get("last_salary_date", ""))
    pdf.ln(4)

    section("SALARY DISPUTE")
    row("Months of Unpaid Salary", data.get("months_unpaid", ""))
    row("Total Amount Owed (INR)", data.get("amount_owed", ""))
    pdf.ln(4)

    section("DECLARATION")
    pdf.set_font("Helvetica", "", 9)
    pdf.multi_cell(
        0, 6,
        "I hereby declare that the information provided above is true and correct to the best "
        "of my knowledge. I understand that providing false information is a punishable offence "
        "under the relevant labour laws.",
    )
    pdf.ln(8)
    pdf.cell(80, 6, "Complainant Signature: _____________", new_x="RIGHT", new_y="TOP")
    pdf.cell(0, 6, "Date: ______________", new_x="LMARGIN", new_y="NEXT")

    return bytes(pdf.output())


def generate_salary_non_payment_pdf(data: dict) -> bytes:
    """
    Phase 3 PDF: COMPLAINT - SALARY NON-PAYMENT
    Fields: complainant_name, employer_name, employer_address,
            employment_start_date, last_paid_date, months_pending,
            amount_pending, attempts_made (list), declaration_date
    """
    pdf = FPDF()
    pdf.add_page()
    pdf.set_margins(20, 20, 20)

    # Header with reference number placeholder
    ref_num = data.get("ref_number") or "REF-__________"
    pdf.set_font("Helvetica", "B", 16)
    # Write ref at top right
    pdf.set_y(15)
    pdf.cell(0, 8, _s(ref_num), align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.set_y(15)
    pdf.cell(0, 8, "COMPLAINT - SALARY NON-PAYMENT", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, "Government Labour Department - CivicFlow Portal", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    filed_date = data.get("declaration_date") or datetime.now(timezone.utc).strftime("%d/%m/%Y")
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 6, f"Date: {_s(filed_date)}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    def section(title: str) -> None:
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_fill_color(240, 240, 240)
        pdf.cell(0, 8, f"  {title}", fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

    def row(label: str, value: str) -> None:
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(80, 7, f"{label}:", new_x="RIGHT", new_y="TOP")
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 7, _s(value) or "-", new_x="LMARGIN", new_y="NEXT")

    section("COMPLAINANT DETAILS")
    row("Complainant Name", data.get("complainant_name", ""))
    pdf.ln(4)

    section("EMPLOYER DETAILS")
    row("Employer / Company Name", data.get("employer_name", ""))
    row("Employer Address", data.get("employer_address", ""))
    pdf.ln(4)

    section("EMPLOYMENT DETAILS")
    row("Employment Start Date", data.get("employment_start_date", ""))
    row("Last Salary Paid Date", data.get("last_paid_date", ""))
    pdf.ln(4)

    section("SALARY DISPUTE")
    row("Months Pending", str(data.get("months_pending", "")))
    row("Amount Pending (INR)", str(data.get("amount_pending", "")))
    pdf.ln(4)

    section("ATTEMPTS MADE TO RESOLVE")
    attempts = data.get("attempts_made") or []
    if isinstance(attempts, list):
        for i, attempt in enumerate(attempts, 1):
            pdf.set_font("Helvetica", "", 10)
            pdf.cell(8, 7, f"{i}.", new_x="RIGHT", new_y="TOP")
            pdf.cell(0, 7, _s(str(attempt)), new_x="LMARGIN", new_y="NEXT")
    else:
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 7, _s(str(attempts)), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    section("DECLARATION")
    pdf.set_font("Helvetica", "", 9)
    pdf.multi_cell(
        0, 6,
        "I hereby declare that the information provided above is true and correct to the best "
        "of my knowledge. I understand that providing false information is a punishable offence "
        "under the relevant labour laws.",
    )
    pdf.ln(8)
    pdf.cell(80, 6, "Complainant Signature: _____________", new_x="RIGHT", new_y="TOP")
    pdf.cell(0, 6, f"Date: {_s(filed_date)}", new_x="LMARGIN", new_y="NEXT")

    return bytes(pdf.output())


def generate_pdf_b64(form_name: str, data: dict) -> str:
    """Generate a filled PDF and return it as a base64 string."""
    if "salary" in form_name.lower():
        pdf_bytes = generate_salary_non_payment_pdf(data)
    else:
        pdf_bytes = generate_pdf("", form_name, data)
    return base64.b64encode(pdf_bytes).decode()


def generate_pdf(category: str, subcategory: str, data: dict) -> bytes:
    """Route to the right PDF template based on category/subcategory."""
    if "labor" in category.lower() and "salary" in subcategory.lower():
        return generate_salary_complaint_pdf(data)

    # Generic fallback
    pdf = FPDF()
    pdf.add_page()
    pdf.set_margins(20, 20, 20)
    filed_date = datetime.now(timezone.utc).strftime("%d/%m/%Y")

    cat_label = _s(category.replace("_", " ").title())
    sub_label = _s(subcategory.replace("_", " ").title())

    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, f"{cat_label} - {sub_label}", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 6, f"Filed via CivicFlow  |  Date: {filed_date}", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    pdf.set_font("Helvetica", "B", 11)
    pdf.set_fill_color(240, 240, 240)
    pdf.cell(0, 8, "  COMPLAINT DETAILS", fill=True, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    for key, value in data.items():
        label = key.replace("_", " ").title()
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(72, 7, f"{label}:", new_x="RIGHT", new_y="TOP")
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 7, _s(value) or "-", new_x="LMARGIN", new_y="NEXT")

    return bytes(pdf.output())
