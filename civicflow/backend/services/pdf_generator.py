import base64
import os
import random
from datetime import datetime, timezone
from io import BytesIO

from fpdf import FPDF

# ── Asset paths ───────────────────────────────────────────────────────────────
_ASSETS = os.path.join(os.path.dirname(__file__), "..", "assets")
_EMBLEM_PATH    = os.path.join(_ASSETS, "indian_emblem.png")
_WATERMARK_PATH = os.path.join(_ASSETS, "watermark.png")

_FORM_PDF_META = {
    "wrongful_termination": {
        "office_title": "OFFICE OF THE LABOUR COMMISSIONER",
        "subtitle": "Complaint regarding wrongful termination from employment",
        "authority_lines": "To,\nThe Labour Commissioner,\nGovernment of India.",
        "subject_prefix": "Complaint Regarding Wrongful Termination by",
        "entity_keys": ("employer_name",),
    },
    "workplace_harassment": {
        "office_title": "OFFICE OF THE LABOUR COMMISSIONER",
        "subtitle": "Complaint regarding workplace harassment",
        "authority_lines": "To,\nThe Labour Commissioner / Internal Complaints Committee,\nGovernment of India.",
        "subject_prefix": "Complaint Regarding Workplace Harassment at",
        "entity_keys": ("employer_name",),
    },
    "fir_not_registered": {
        "office_title": "OFFICE OF THE SUPERINTENDENT OF POLICE",
        "subtitle": "Complaint regarding refusal to register FIR",
        "authority_lines": "To,\nThe Superintendent of Police,\nGovernment of India.",
        "subject_prefix": "Complaint Regarding FIR Non-Registration at",
        "entity_keys": ("police_station",),
    },
    "police_misconduct": {
        "office_title": "OFFICE OF THE SUPERINTENDENT OF POLICE",
        "subtitle": "Complaint regarding police misconduct",
        "authority_lines": "To,\nThe Superintendent of Police / State Human Rights Commission,\nGovernment of India.",
        "subject_prefix": "Complaint Regarding Police Misconduct at",
        "entity_keys": ("police_station",),
    },
    "defective_product": {
        "office_title": "OFFICE OF THE CONSUMER DISPUTES REDRESSAL FORUM",
        "subtitle": "Complaint regarding a defective product",
        "authority_lines": "To,\nThe Consumer Disputes Redressal Forum,\nGovernment of India.",
        "subject_prefix": "Complaint Regarding Defective Product Sold by",
        "entity_keys": ("seller_name",),
    },
    "online_scam": {
        "office_title": "OFFICE OF THE CYBER CRIME CELL",
        "subtitle": "Complaint regarding online scam / cyber fraud",
        "authority_lines": "To,\nThe Cyber Crime Cell,\nGovernment of India.",
        "subject_prefix": "Complaint Regarding Online Scam / Cyber Fraud by",
        "entity_keys": ("scammer_details",),
    },
    "generic": {
        "office_title": "OFFICE OF THE RELEVANT AUTHORITY",
        "subtitle": "Formal complaint",
        "authority_lines": "To,\nThe Relevant Authority,\nGovernment of India.",
        "subject_prefix": "Complaint Regarding",
        "entity_keys": (),
    },
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _s(text: str) -> str:
    """Strip characters outside Latin-1 so built-in fonts never raise."""
    return str(text).encode("latin-1", errors="ignore").decode("latin-1")


def _orient_image(img_bytes: bytes) -> bytes:
    """Apply EXIF orientation (phone photos are often 90° rotated)."""
    try:
        from PIL import Image, ImageOps
        img = Image.open(BytesIO(img_bytes))
        img = ImageOps.exif_transpose(img)
        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGB")
        out = BytesIO()
        img.save(out, format="JPEG", quality=88)
        return out.getvalue()
    except Exception:
        return img_bytes


def _detect_doc_type(filename: str) -> str:
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


def _make_watermark_bytes(opacity: float = 0.10) -> bytes | None:
    """Return PNG bytes of the watermark image at reduced opacity, or None."""
    try:
        from PIL import Image as PILImage
        img = PILImage.open(_WATERMARK_PATH).convert("RGBA")
        r, g, b, a = img.split()
        a = a.point(lambda x: int(x * opacity))
        merged = PILImage.merge("RGBA", (r, g, b, a))
        buf = BytesIO()
        merged.save(buf, format="PNG")
        return buf.getvalue()
    except Exception:
        return None


def _make_pdf(wm_bytes: bytes | None) -> FPDF:
    """
    Return an FPDF subclass instance whose header() stamps the watermark
    (centered, full page) on every page as a background layer.
    """
    class _PDF(FPDF):
        def header(self):
            if wm_bytes:
                pw, ph = self.w, self.h
                side = min(pw, ph) * 0.62   # ~130mm on A4
                self.image(
                    BytesIO(wm_bytes),
                    x=(pw - side) / 2,
                    y=(ph - side) / 2,
                    w=side, h=side,
                )
            # Always reset cursor to the top margin after the background layer
            self.set_y(self.t_margin)

    pdf = _PDF(orientation="P", unit="mm", format="A4")
    pdf.set_margins(25, 20, 25)
    pdf.set_auto_page_break(auto=True, margin=20)
    return pdf


def _build_common_letter_pdf(
    office_title: str,
    subtitle: str,
    authority_lines: str,
    subject_line: str,
    paragraphs: list[str],
    form_data: dict,
    signature_b64: str = None,
    supporting_docs: list = None,
) -> str:
    year = datetime.now(timezone.utc).year
    ref_num = _s(form_data.get("ref_number") or f"LC/{year}/{random.randint(10000, 99999)}")
    decl_date = _s(
        form_data.get("declaration_date")
        or datetime.now(timezone.utc).strftime("%d %B %Y")
    )

    wm_bytes = _make_watermark_bytes(0.10)
    pdf = _make_pdf(wm_bytes)
    W = 160
    pdf.add_page()

    EW, EH = 22, 28
    try:
        pdf.image(_EMBLEM_PATH, x=(210 - EW) / 2, y=14, w=EW, h=EH)
    except Exception:
        pass

    pdf.set_y(14 + EH + 2)
    pdf.set_font("Times", "", 8)
    pdf.cell(W, 4, "Government of India", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Times", "B", 13)
    pdf.cell(W, 7, _s(office_title), align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Times", "I", 9)
    pdf.cell(W, 5, _s(subtitle), align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    yl = pdf.get_y()
    pdf.set_draw_color(0, 0, 0)
    pdf.line(25, yl, 185, yl)
    pdf.line(25, yl + 1.5, 185, yl + 1.5)
    pdf.ln(6)

    pdf.set_font("Times", "", 10)
    pdf.cell(W / 2, 5, f"Ref. No.: {ref_num}", new_x="RIGHT", new_y="TOP")
    pdf.cell(W / 2, 5, f"Date: {decl_date}", align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    pdf.set_font("Times", "", 11)
    pdf.multi_cell(W, 6, _s(authority_lines), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)

    pdf.set_font("Times", "B", 11)
    pdf.multi_cell(W, 6, _s(subject_line), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    pdf.set_font("Times", "", 11)
    pdf.cell(W, 6, "Respected Sir / Madam,", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    for paragraph in paragraphs:
        pdf.multi_cell(W, 6, _s(f"    {paragraph}"), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)

    doc_labels = {
        "contract":       "Employment Contract / Appointment Letter",
        "salary_slip":    "Salary Slips / Pay Stubs",
        "bank_statement": "Bank Statement showing salary credits",
        "notice":         "Copy of written notice sent to respondent",
        "email":          "Email / message correspondence",
    }
    doc_types = {_detect_doc_type(d.get("filename", "")) for d in (supporting_docs or [])}
    enc_labels = [v for k, v in doc_labels.items() if k in doc_types]
    if supporting_docs:
        pdf.set_font("Times", "", 11)
        pdf.cell(W, 6, "Enclosed herewith:", new_x="LMARGIN", new_y="NEXT")
        for i, lbl in enumerate(enc_labels or ["Supporting documents (see attached)"], 1):
            pdf.cell(8, 6, f"  {i}.", new_x="RIGHT", new_y="TOP")
            pdf.cell(W - 8, 6, _s(lbl), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)

    pdf.set_font("Times", "", 11)
    pdf.cell(W, 6, "Yours faithfully,", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(14)

    sig_y = pdf.get_y()
    if signature_b64:
        try:
            decoded = base64.b64decode(signature_b64)
            if len(decoded) <= 1_200_000:
                raw = _orient_image(decoded)
                pdf.image(BytesIO(raw), x=25, y=sig_y, w=55, h=16)
                pdf.set_y(sig_y + 16)
        except Exception:
            pass

    complainant_name = _s(form_data.get("complainant_name", "_______________"))
    complainant_address = _s(form_data.get("complainant_address") or form_data.get("location") or "_______________")
    sig_line_y = pdf.get_y()
    pdf.set_draw_color(0, 0, 0)
    pdf.line(25, sig_line_y, 110, sig_line_y)
    pdf.ln(2)
    pdf.set_font("Times", "B", 11)
    pdf.cell(W, 6, complainant_name, new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Times", "", 11)
    pdf.cell(W, 6, f"Place: {complainant_address}", new_x="LMARGIN", new_y="NEXT")

    MAX_IMG = 700_000
    for doc in (supporting_docs or []):
        file_b64 = doc.get("file_b64", "")
        filename = _s(doc.get("filename", "Document"))[:100]
        mime_type = doc.get("mime_type", "").lower()
        if not file_b64:
            continue
        try:
            file_bytes = base64.b64decode(file_b64)
        except Exception:
            continue
        if "pdf" in mime_type or filename.lower().endswith(".pdf"):
            continue
        pdf.add_page()
        pdf.set_font("Times", "B", 10)
        pdf.set_draw_color(0, 0, 0)
        pdf.cell(W, 8, f"Enclosure: {filename}", border="B", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)
        if len(file_bytes) > MAX_IMG:
            pdf.set_font("Times", "", 9)
            pdf.cell(W, 6, f"[File too large to embed - {len(file_bytes)//1024} KB. Attach separately.]")
            continue
        try:
            corrected = _orient_image(file_bytes)
            pdf.image(BytesIO(corrected), x=25, y=pdf.get_y(), w=160)
        except Exception:
            pdf.set_font("Times", "", 9)
            pdf.cell(W, 6, "[Image could not be rendered]")

    main_bytes = bytes(pdf.output())
    pdf_docs = [
        d for d in (supporting_docs or [])
        if d.get("file_b64")
        and ("pdf" in d.get("mime_type", "").lower() or d.get("filename", "").lower().endswith(".pdf"))
    ]
    if pdf_docs:
        try:
            from pypdf import PdfWriter, PdfReader
            writer = PdfWriter()
            for page in PdfReader(BytesIO(main_bytes)).pages:
                writer.add_page(page)
            for doc in pdf_docs:
                try:
                    att = base64.b64decode(doc["file_b64"])
                    for page in PdfReader(BytesIO(att)).pages:
                        writer.add_page(page)
                except Exception:
                    pass
            out = BytesIO()
            writer.write(out)
            return base64.b64encode(out.getvalue()).decode()
        except Exception:
            pass

    return base64.b64encode(main_bytes).decode()


def _build_generic_paragraphs(form_name: str, form_data: dict) -> tuple[str, list[str]]:
    meta = _FORM_PDF_META.get(form_name, _FORM_PDF_META["generic"])
    entity = ""
    for key in meta.get("entity_keys", ()):
        value = str(form_data.get(key) or "").strip()
        if value:
            entity = _s(value)
            break

    subject = meta["subject_prefix"]
    if entity:
        subject = f"{subject} {entity}"
    else:
        subject = f"{subject} This Matter"

    complainant_name = _s(form_data.get("complainant_name", "the undersigned"))
    address = _s(form_data.get("complainant_address") or form_data.get("location") or "the address mentioned below")
    phone = _s(form_data.get("complainant_phone", ""))
    email = _s(form_data.get("complainant_email", ""))
    contact = ", ".join([part for part in (phone, email) if part]) or "not provided"

    paragraphs = [
        (
            f"I, {complainant_name}, residing at {address}, respectfully submit this complaint "
            f"before your office and request appropriate action in the matter described below. "
            f"My contact details are {contact}."
        )
    ]

    detail_lines = []
    preferred_order = [
        "employer_name", "employer_address", "seller_name", "seller_address", "product_name",
        "police_station", "officer_name", "harasser_name", "incident_date", "visit_date",
        "termination_date", "purchase_date", "purchase_amount", "amount_lost", "transaction_id",
        "reason_given", "notice_period", "defect_description", "incident_description",
        "scam_description", "scammer_details", "witnesses", "attempts_made",
    ]
    seen = set()
    for key in preferred_order + list(form_data.keys()):
        if key in seen:
            continue
        seen.add(key)
        value = form_data.get(key)
        if key in {"complainant_name", "complainant_address", "complainant_phone", "complainant_email", "declaration_date", "ref_number"}:
            continue
        if not isinstance(value, (str, int, float)):
            continue
        safe_val = str(value).strip()
        if not safe_val:
            continue
        label = key.replace("_", " ")
        detail_lines.append(f"{label.title()}: {safe_val}")

    if detail_lines:
        paragraphs.append(
            "The facts and supporting details of my complaint are as follows:\n" + "\n".join(detail_lines[:12])
        )

    attempts = str(form_data.get("attempts_made") or "").strip()
    if attempts:
        paragraphs.append(
            "I have already taken the following steps to resolve this issue, but I have not received satisfactory relief: "
            f"{attempts}"
        )

    paragraphs.append(
        "I therefore request your good office to review this complaint, take cognizance of the facts stated above, "
        "and provide the appropriate relief in accordance with law at the earliest."
    )
    return subject, paragraphs


# ── Main complaint PDF ────────────────────────────────────────────────────────

def generate_salary_complaint(
    form_data: dict,
    signature_b64: str = None,
    supporting_docs: list = None,
) -> str:
    """
    Formal letter-format complaint to the Office of the Labour Commissioner.
    Design: Indian emblem, Times New Roman, watermark, letter prose, no boxes.
    Returns base64-encoded PDF string.
    """
    year     = datetime.now(timezone.utc).year
    ref_num  = _s(form_data.get("ref_number") or f"LC/{year}/{random.randint(10000, 99999)}")
    decl_date = _s(
        form_data.get("declaration_date")
        or datetime.now(timezone.utc).strftime("%d %B %Y")
    )

    wm_bytes = _make_watermark_bytes(0.10)
    pdf = _make_pdf(wm_bytes)

    W = 160  # usable width: 210 - 25 left - 25 right

    # ── PAGE 1 ─────────────────────────────────────────────────────────────────
    pdf.add_page()

    # ── Emblem (centered, top) ─────────────────────────────────────────────────
    EW, EH = 22, 28
    try:
        pdf.image(_EMBLEM_PATH, x=(210 - EW) / 2, y=14, w=EW, h=EH)
    except Exception:
        pass

    pdf.set_y(14 + EH + 2)

    # ── Letterhead text ────────────────────────────────────────────────────────
    pdf.set_font("Times", "", 8)
    pdf.cell(W, 4, "Government of India", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Times", "B", 13)
    pdf.cell(W, 7, "OFFICE OF THE LABOUR COMMISSIONER", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Times", "I", 9)
    pdf.cell(W, 5, "Complaint under the Payment of Wages Act, 1936", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    # Double rule
    yl = pdf.get_y()
    pdf.set_draw_color(0, 0, 0)
    pdf.line(25, yl, 185, yl)
    pdf.line(25, yl + 1.5, 185, yl + 1.5)
    pdf.ln(6)

    # Ref / Date row
    pdf.set_font("Times", "", 10)
    pdf.cell(W / 2, 5, f"Ref. No.: {ref_num}", new_x="RIGHT", new_y="TOP")
    pdf.cell(W / 2, 5, f"Date: {decl_date}", align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    # ── Addressee ──────────────────────────────────────────────────────────────
    pdf.set_font("Times", "", 11)
    pdf.multi_cell(
        W, 6,
        "To,\nThe Labour Commissioner,\nGovernment of India.",
        new_x="LMARGIN", new_y="NEXT",
    )
    pdf.ln(5)

    # ── Subject ───────────────────────────────────────────────────────────────
    employer = _s(form_data.get("employer_name", "the concerned employer"))
    pdf.set_font("Times", "B", 11)
    pdf.multi_cell(
        W, 6,
        f"Subject: Complaint Regarding Non-Payment of Salary by {employer}",
        new_x="LMARGIN", new_y="NEXT",
    )
    pdf.ln(4)

    # ── Salutation ────────────────────────────────────────────────────────────
    pdf.set_font("Times", "", 11)
    pdf.cell(W, 6, "Respected Sir / Madam,", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    # ── Extract fields ────────────────────────────────────────────────────────
    name        = _s(form_data.get("complainant_name",     "_______________"))
    address     = _s(form_data.get("complainant_address",  "_______________"))
    phone       = _s(form_data.get("complainant_phone",    "_______________"))
    email       = _s(form_data.get("complainant_email",    ""))
    emp_address = _s(form_data.get("employer_address",     "_______________"))
    business    = _s(form_data.get("nature_of_business",   ""))
    joined      = _s(form_data.get("employment_start_date","_______________"))
    designation = _s(form_data.get("designation",          "_______________"))
    last_paid   = _s(form_data.get("last_paid_date",       "_______________"))
    months_pend = _s(str(form_data.get("months_pending",  "___")))
    amount_pend = _s(str(form_data.get("amount_pending",  "_______________")))
    attempts    = _s(str(form_data.get("attempts_made",    "") or ""))

    contact = phone + (f", {email}" if email else "")

    # ── Body paragraphs ───────────────────────────────────────────────────────
    # Each part is either a plain str (static text) or (str, "B") for bold user data.
    def inline_para(*parts) -> None:
        """Write a paragraph with mixed normal/bold segments, then a blank line."""
        pdf.set_x(pdf.l_margin)
        for part in parts:
            if isinstance(part, tuple):
                text, style = part
                pdf.set_font("Times", style, 11)
            else:
                text = part
                pdf.set_font("Times", "", 11)
            pdf.write(6, _s(text))
        pdf.ln(6)
        pdf.ln(3)

    inline_para(
        "    I, ", (name, "B"), ", residing at ", (address, "B"),
        ", contact: ", (contact, "B"),
        ", humbly submit this complaint before your esteemed office and "
        "respectfully request your kind intervention in the matter described below.",
    )

    inline_para(
        "    I was employed at ", (employer, "B"),
        ", located at ", (emp_address, "B"),
        (f", engaged in {business}," if business else ","),
        " having joined the organisation on ", (joined, "B"),
        " and serving in the capacity of ", (designation, "B"), ".",
    )

    inline_para(
        "    My employer has failed to pay my salary for ", (months_pend, "B"),
        " month(s). The last salary payment received by me was on ", (last_paid, "B"),
        ". The total outstanding amount due is INR ", (amount_pend, "B"),
        "/- (Rupees ", (amount_pend, "B"), " only).",
    )

    if attempts:
        inline_para(
            "    I have made the following attempts to resolve this matter, "
            "however no satisfactory response has been received:"
        )
        attempt_list = [
            a.strip()
            for a in attempts.replace(";", "\n").split("\n")
            if a.strip()
        ] or [attempts]
        for i, att in enumerate(attempt_list[:6], 1):
            pdf.set_font("Times", "", 11)
            pdf.cell(8,     6, f"  {i}.", new_x="RIGHT", new_y="TOP")
            pdf.set_font("Times", "B", 11)
            pdf.cell(W - 8, 6, _s(att),  new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)
    else:
        inline_para(
            "    Despite making repeated requests both verbally and in writing, "
            "the employer has not responded or made any payment towards the dues."
        )

    inline_para(
        "    In light of the above, I earnestly request your good office to take "
        "cognizance of this complaint and direct my employer to clear all pending "
        "salary dues forthwith. I shall be grateful for your timely intervention."
    )

    # Enclosures list
    doc_labels = {
        "contract":       "Employment Contract / Appointment Letter",
        "salary_slip":    "Salary Slips / Pay Stubs",
        "bank_statement": "Bank Statement showing salary credits",
        "notice":         "Copy of written notice sent to employer",
        "email":          "Email correspondence with employer",
    }
    doc_types   = {_detect_doc_type(d.get("filename", "")) for d in (supporting_docs or [])}
    enc_labels  = [v for k, v in doc_labels.items() if k in doc_types]
    if supporting_docs:
        pdf.set_font("Times", "", 11)
        pdf.cell(W, 6, "Enclosed herewith:", new_x="LMARGIN", new_y="NEXT")
        for i, lbl in enumerate(enc_labels or ["Supporting documents (see attached)"], 1):
            pdf.cell(8,     6, f"  {i}.", new_x="RIGHT", new_y="TOP")
            pdf.cell(W - 8, 6, lbl,       new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)

    # ── Closing ───────────────────────────────────────────────────────────────
    pdf.set_font("Times", "", 11)
    pdf.cell(W, 6, "Yours faithfully,", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(14)

    # ── Signature ─────────────────────────────────────────────────────────────
    sig_y = pdf.get_y()
    if signature_b64:
        try:
            decoded = base64.b64decode(signature_b64)
            if len(decoded) <= 1_200_000:
                raw = _orient_image(decoded)
                pdf.image(BytesIO(raw), x=25, y=sig_y, w=55, h=16)
                pdf.set_y(sig_y + 16)
        except Exception:
            pass

    # Signature underline + name + place
    sig_line_y = pdf.get_y()
    pdf.set_draw_color(0, 0, 0)
    pdf.line(25, sig_line_y, 110, sig_line_y)
    pdf.ln(2)
    pdf.set_font("Times", "B", 11)
    pdf.cell(W, 6, name, new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Times", "", 11)
    pdf.cell(W, 6, f"Place: {address}", new_x="LMARGIN", new_y="NEXT")

    # ── Attachment pages (image docs) ─────────────────────────────────────────
    MAX_IMG = 700_000
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
        if "pdf" in mime_type or filename.lower().endswith(".pdf"):
            continue  # PDF attachments merged later via pypdf
        pdf.add_page()
        pdf.set_font("Times", "B", 10)
        pdf.set_draw_color(0, 0, 0)
        pdf.cell(W, 8, f"Enclosure: {filename}", border="B", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)
        if len(file_bytes) > MAX_IMG:
            pdf.set_font("Times", "", 9)
            pdf.cell(W, 6, f"[File too large to embed — {len(file_bytes)//1024} KB. Attach separately.]")
            continue
        try:
            corrected = _orient_image(file_bytes)
            pdf.image(BytesIO(corrected), x=25, y=pdf.get_y(), w=160)
        except Exception:
            pdf.set_font("Times", "", 9)
            pdf.cell(W, 6, "[Image could not be rendered]")

    main_bytes = bytes(pdf.output())

    # Merge PDF attachments via pypdf
    pdf_docs = [
        d for d in (supporting_docs or [])
        if d.get("file_b64")
        and ("pdf" in d.get("mime_type", "").lower() or d.get("filename", "").lower().endswith(".pdf"))
    ]
    if pdf_docs:
        try:
            from pypdf import PdfWriter, PdfReader
            writer = PdfWriter()
            for page in PdfReader(BytesIO(main_bytes)).pages:
                writer.add_page(page)
            for doc in pdf_docs:
                try:
                    att = base64.b64decode(doc["file_b64"])
                    for page in PdfReader(BytesIO(att)).pages:
                        writer.add_page(page)
                except Exception:
                    pass
            out = BytesIO()
            writer.write(out)
            return base64.b64encode(out.getvalue()).decode()
        except Exception:
            pass

    return base64.b64encode(main_bytes).decode()


def _append_signature_and_docs(
    main_pdf_bytes: bytes,
    signature_b64: str = None,
    supporting_docs: list = None,
) -> bytes:
    """Append signature + supporting docs to any non-salary PDF, with watermark."""
    MAX_IMG = 700_000
    wm_bytes = _make_watermark_bytes(0.10)
    extra = _make_pdf(wm_bytes)
    extra.set_margins(20, 20, 20)
    W = extra.w - 40
    added_pages = False

    if signature_b64:
        try:
            raw = base64.b64decode(signature_b64)
            if len(raw) <= MAX_IMG:
                corrected = _orient_image(raw)
                extra.add_page()
                extra.set_font("Times", "B", 10)
                extra.cell(W, 8, "Complainant Signature", border="B", new_x="LMARGIN", new_y="NEXT")
                extra.ln(4)
                extra.image(BytesIO(corrected), x=20, y=extra.get_y(), w=80, h=20)
                added_pages = True
        except Exception:
            pass

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
        if "pdf" in mime_type or filename.lower().endswith(".pdf"):
            continue
        extra.add_page()
        extra.set_font("Times", "B", 10)
        extra.cell(W, 8, f"Enclosure: {filename}", border="B", new_x="LMARGIN", new_y="NEXT")
        extra.ln(2)
        if len(file_bytes) > MAX_IMG:
            extra.set_font("Times", "", 9)
            extra.cell(W, 6, f"[File too large — {len(file_bytes)//1024} KB. Attach separately.]")
        else:
            try:
                corrected = _orient_image(file_bytes)
                extra.image(BytesIO(corrected), x=20, y=extra.get_y(), w=170)
                added_pages = True
            except Exception:
                extra.set_font("Times", "", 9)
                extra.cell(W, 6, "[Image could not be rendered]")

    try:
        from pypdf import PdfWriter, PdfReader
        writer = PdfWriter()
        for page in PdfReader(BytesIO(main_pdf_bytes)).pages:
            writer.add_page(page)
        if added_pages:
            for page in PdfReader(BytesIO(bytes(extra.output()))).pages:
                writer.add_page(page)
        for doc in (supporting_docs or []):
            if not doc.get("file_b64"):
                continue
            mt = doc.get("mime_type", "").lower()
            fn = doc.get("filename", "")
            if "pdf" in mt or fn.lower().endswith(".pdf"):
                try:
                    att = base64.b64decode(doc["file_b64"])
                    for page in PdfReader(BytesIO(att)).pages:
                        writer.add_page(page)
                except Exception:
                    pass
        out = BytesIO()
        writer.write(out)
        return out.getvalue()
    except Exception:
        return main_pdf_bytes


def generate_pdf_b64(
    form_name: str,
    data: dict,
    signature_b64: str = None,
    supporting_docs: list = None,
) -> str:
    if "salary" in form_name.lower():
        return generate_salary_complaint(data, signature_b64=signature_b64, supporting_docs=supporting_docs)
    meta = _FORM_PDF_META.get(form_name, _FORM_PDF_META["generic"])
    subject_line, paragraphs = _build_generic_paragraphs(form_name, data)
    return _build_common_letter_pdf(
        office_title=meta["office_title"],
        subtitle=meta["subtitle"],
        authority_lines=meta["authority_lines"],
        subject_line=subject_line,
        paragraphs=paragraphs,
        form_data=data,
        signature_b64=signature_b64,
        supporting_docs=supporting_docs,
    )


def generate_pdf(category: str, subcategory: str, data: dict) -> bytes:
    wm_bytes = _make_watermark_bytes(0.10)
    pdf = _make_pdf(wm_bytes)
    pdf.add_page()
    W = 160
    filed_date = datetime.now(timezone.utc).strftime("%d %B %Y")
    cat_label  = _s(category.replace("_", " ").title())
    sub_label  = _s(subcategory.replace("_", " ").title())
    pdf.set_font("Times", "B", 14)
    pdf.cell(W, 10, f"{cat_label} - {sub_label}", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Times", "", 9)
    pdf.cell(W, 6, f"Date: {filed_date}", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)
    for key, value in data.items():
        if not isinstance(value, (str, int, float)):
            continue
        safe_val = _s(str(value))[:500] or "-"
        label    = key.replace("_", " ").title()
        pdf.set_font("Times", "B", 10)
        pdf.cell(72, 7, f"{label}:", new_x="RIGHT", new_y="TOP")
        pdf.set_font("Times", "", 10)
        pdf.cell(0,  7, safe_val, new_x="LMARGIN", new_y="NEXT")
    return bytes(pdf.output())
