import base64
import random
from datetime import datetime, timezone
from io import BytesIO

from fpdf import FPDF


def _s(text: str) -> str:
    """Strip characters outside Latin-1 so Helvetica never raises."""
    return str(text).encode("latin-1", errors="ignore").decode("latin-1")


def _orient_image(img_bytes: bytes) -> bytes:
    """Apply EXIF orientation (phone photos are often 90° rotated) using Pillow."""
    try:
        from PIL import Image, ImageOps
        img = Image.open(BytesIO(img_bytes))
        img = ImageOps.exif_transpose(img)   # applies rotation/flip from EXIF tag
        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGB")
        out = BytesIO()
        img.save(out, format="JPEG", quality=88)
        return out.getvalue()
    except Exception:
        return img_bytes  # Pillow unavailable or unsupported format — use original


def _detect_doc_type(filename: str) -> str:
    """Map an uploaded filename to a Section-5 checkbox key."""
    name = filename.lower()
    if any(k in name for k in ["contract", "appointment", "offer", "joining"]):
        return "contract"
    if any(k in name for k in ["salary", "pay", "slip", "payslip", "wage", "payroll"]):
        return "salary_slip"
    if any(k in name for k in ["bank", "statement", "account", "passbook"]):
        return "bank_statement"
    if any(k in name for k in ["notice", "warning", "legal", "demand"]):
        return "notice"
    if any(k in name for k in ["email", "mail", "message", "correspondence", "chat"]):
        return "email"
    return "other"


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


def generate_salary_complaint(form_data: dict, signature_b64: str = None, supporting_docs: list = None) -> str:
    """
    Professional A4 salary complaint form for the Office of the Labour Commissioner.
    Returns base64-encoded PDF string.
    Layout: header (logo + title + ref), 6 numbered sections, declaration.
    """
    year = datetime.now(timezone.utc).year
    ref_num = _s(form_data.get("ref_number") or f"REF-{year}-{random.randint(10000, 99999)}")
    decl_date = _s(form_data.get("declaration_date") or datetime.now(timezone.utc).strftime("%d/%m/%Y"))

    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.add_page()
    pdf.set_margins(20, 15, 20)
    pdf.set_auto_page_break(auto=True, margin=20)

    W = 170  # usable width (210 - 20 left - 20 right)

    # ── HEADER ────────────────────────────────────────────────────────────────
    # Logo placeholder (rectangle, top-left)
    pdf.set_xy(20, 15)
    pdf.set_fill_color(210, 218, 235)
    pdf.set_draw_color(100, 120, 180)
    pdf.rect(20, 15, 24, 22, style="FD")
    pdf.set_xy(20, 20)
    pdf.set_font("Helvetica", "B", 6)
    pdf.cell(24, 4, "GOVT", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_xy(20, 25)
    pdf.cell(24, 4, "SEAL", align="C")

    # Ref No + Date (top-right)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_xy(20, 15)
    pdf.cell(W, 5, f"Ref No: {ref_num}", align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.set_xy(20, 21)
    pdf.cell(W, 5, f"Date: {decl_date}", align="R")

    # Centred title
    pdf.set_xy(20, 17)
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(W, 7, "OFFICE OF THE LABOUR COMMISSIONER", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_xy(20, 25)
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(W, 5, "COMPLAINT UNDER THE PAYMENT OF WAGES ACT", align="C")

    # Divider line
    pdf.set_y(40)
    pdf.set_draw_color(30, 60, 160)
    pdf.line(20, 40, 190, 40)
    pdf.ln(5)

    # ── Section helpers ────────────────────────────────────────────────────────
    def section(label: str) -> None:
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_fill_color(215, 225, 245)
        pdf.set_draw_color(60, 90, 160)
        pdf.cell(W, 7, _s(f"  {label}"), fill=True, border=1, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(1)

    def row(label: str, value: str, lw: int = 68) -> None:
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(lw, 6, f"{label}:", new_x="RIGHT", new_y="TOP")
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(W - lw, 6, _s(value) or "-", new_x="LMARGIN", new_y="NEXT")

    def checkbox(label: str, checked: bool = False) -> None:
        mark = "[X]" if checked else "[ ]"
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(9, 6, mark, new_x="RIGHT", new_y="TOP")
        pdf.cell(W - 9, 6, label, new_x="LMARGIN", new_y="NEXT")

    # ── SECTION 1: COMPLAINANT DETAILS ────────────────────────────────────────
    section("Section 1 - Complainant Details")
    row("Full Name", form_data.get("complainant_name", ""))
    row("Address", form_data.get("complainant_address", ""))
    row("Phone", form_data.get("complainant_phone", ""))
    row("Email", form_data.get("complainant_email", ""))
    pdf.ln(3)

    # ── SECTION 2: EMPLOYER DETAILS ───────────────────────────────────────────
    section("Section 2 - Employer Details")
    row("Employer / Company Name", form_data.get("employer_name", ""))
    row("Employer Address", form_data.get("employer_address", ""))
    row("Nature of Business", form_data.get("nature_of_business", ""))
    pdf.ln(3)

    # ── SECTION 3: EMPLOYMENT DETAILS ─────────────────────────────────────────
    section("Section 3 - Employment Details")
    row("Date of Joining", form_data.get("employment_start_date", ""))
    row("Designation / Post", form_data.get("designation", ""))
    row("Last Date Salary Paid", form_data.get("last_paid_date", ""))
    row("Months of Pending Salary", str(form_data.get("months_pending", "")))
    row("Total Amount Pending (INR)", str(form_data.get("amount_pending", "")))
    pdf.ln(3)

    # ── SECTION 4: STEPS ALREADY TAKEN ────────────────────────────────────────
    section("Section 4 - Steps Already Taken")
    attempts = str(form_data.get("attempts_made") or "")
    al = attempts.lower()
    checkbox("Written notice sent to employer",          "written" in al or "notice" in al)
    checkbox("Verbal complaint to HR / Management",       "verbal" in al or "hr" in al)
    checkbox("Complaint raised with HR Department",       "hr department" in al or "hr complaint" in al)
    checkbox("Approached Labour Welfare Officer",         "labour welfare" in al or "welfare officer" in al)
    checkbox("Complaint filed with Trade Union",          "trade union" in al or "union" in al)
    pdf.ln(1)
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(W, 5, "Response received from employer:", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 9)
    pdf.multi_cell(W, 5, _s(attempts) or "No response received.", border=1)
    pdf.ln(3)

    # ── SECTION 5: DOCUMENTS ATTACHED ─────────────────────────────────────────
    # Auto-tick based on filenames of uploaded supporting documents
    doc_types = {_detect_doc_type(d.get("filename", "")) for d in (supporting_docs or [])}
    section("Section 5 - Documents Attached")
    checkbox("Employment Contract / Appointment Letter", "contract"        in doc_types)
    checkbox("Salary Slips / Pay Stubs",                "salary_slip"     in doc_types)
    checkbox("Bank Statements showing salary credits",  "bank_statement"  in doc_types)
    checkbox("Written Notice Copy (if sent)",           "notice"          in doc_types)
    checkbox("Email Correspondence with Employer",      "email"           in doc_types)
    pdf.ln(3)

    # ── SECTION 6: DECLARATION ────────────────────────────────────────────────
    section("Section 6 - Declaration")
    pdf.set_font("Helvetica", "", 9)
    pdf.multi_cell(
        W, 5,
        "I declare that the above information is true to the best of my knowledge and belief. "
        "I understand that providing false information is a punishable offence under the relevant labour laws.",
    )
    pdf.ln(8)
    pdf.set_font("Helvetica", "", 9)
    half = W // 2
    sig_y = pdf.get_y()
    pdf.cell(half, 6, "Complainant Signature: ___________________", new_x="RIGHT", new_y="TOP")
    pdf.cell(W - half, 6, f"Date: {decl_date}", new_x="LMARGIN", new_y="NEXT")
    if signature_b64:
        try:
            raw = _orient_image(base64.b64decode(signature_b64))
            pdf.image(BytesIO(raw), x=65, y=sig_y - 1, w=48, h=10)
        except Exception:
            pass  # bad image data — leave blank line as-is
    pdf.ln(6)
    pdf.cell(W, 5, "Place: _______________________________", new_x="LMARGIN", new_y="NEXT")

    # ── ATTACHMENT PAGES ──────────────────────────────────────────────────────
    MAX_IMAGE_BYTES = 700_000  # ~700 KB decoded — skip larger images to keep generation fast
    for doc in (supporting_docs or []):
        file_b64  = doc.get("file_b64", "")
        filename  = _s(doc.get("filename", "Document"))[:100]
        mime_type = doc.get("mime_type", "").lower()
        if not file_b64:
            continue
        try:
            file_bytes = base64.b64decode(file_b64)
        except Exception:
            continue
        if "pdf" not in mime_type and not filename.lower().endswith(".pdf"):
            # Image attachment — add as a new page
            pdf.add_page()
            pdf.set_font("Helvetica", "B", 10)
            pdf.set_draw_color(60, 90, 160)
            pdf.cell(W, 8, f"Attachment: {filename}", border="B", new_x="LMARGIN", new_y="NEXT")
            pdf.ln(2)
            if len(file_bytes) > MAX_IMAGE_BYTES:
                pdf.set_font("Helvetica", "", 9)
                pdf.cell(W, 6, f"[File too large to embed — {len(file_bytes) // 1024} KB. Attach separately.]")
                continue
            try:
                corrected = _orient_image(file_bytes)
                pdf.image(BytesIO(corrected), x=20, y=pdf.get_y(), w=170)
            except Exception:
                pdf.set_font("Helvetica", "", 9)
                pdf.cell(W, 6, "[Image could not be rendered]")

    main_pdf_bytes = bytes(pdf.output())

    # Merge PDF attachments using pypdf
    pdf_docs = [
        doc for doc in (supporting_docs or [])
        if doc.get("file_b64")
        and ("pdf" in doc.get("mime_type", "").lower() or doc.get("filename", "").lower().endswith(".pdf"))
    ]
    if pdf_docs:
        try:
            from pypdf import PdfWriter, PdfReader
            writer = PdfWriter()
            for page in PdfReader(BytesIO(main_pdf_bytes)).pages:
                writer.add_page(page)
            for doc in pdf_docs:
                try:
                    att_bytes = base64.b64decode(doc["file_b64"])
                    for page in PdfReader(BytesIO(att_bytes)).pages:
                        writer.add_page(page)
                except Exception:
                    pass  # skip unreadable PDF attachment
            out = BytesIO()
            writer.write(out)
            return base64.b64encode(out.getvalue()).decode()
        except Exception:
            pass  # pypdf unavailable — return without PDF attachments

    return base64.b64encode(main_pdf_bytes).decode()


def generate_pdf_b64(form_name: str, data: dict, signature_b64: str = None, supporting_docs: list = None) -> str:
    """Generate a filled PDF and return it as a base64 string."""
    if "salary" in form_name.lower():
        return generate_salary_complaint(data, signature_b64=signature_b64, supporting_docs=supporting_docs)
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
        # Sanitize: reject non-string types (dicts/lists → skip), cap length at 500 chars
        if not isinstance(value, (str, int, float)):
            continue
        safe_value = _s(str(value))[:500] or "-"
        label = key.replace("_", " ").title()
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(72, 7, f"{label}:", new_x="RIGHT", new_y="TOP")
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 7, safe_value, new_x="LMARGIN", new_y="NEXT")

    return bytes(pdf.output())
