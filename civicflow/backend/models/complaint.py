from datetime import datetime, timezone


def complaint_schema(
    user_id: str,
    category: str,
    subcategory: str,
    form_data: dict | None = None,
    title: str = "",
) -> dict:
    now = datetime.now(timezone.utc)
    return {
        "user_id": user_id,
        "category": category,
        "subcategory": subcategory,
        "title": title or f"{subcategory.replace('_', ' ').title()} Complaint",
        "status": "pending",
        "current_step_label": "",
        "form_data": form_data or {},
        "portal_ref_id": None,
        "rejection_reason": "",
        "resubmission_count": 0,
        "timeline": [],
        "documents": [],
        "created_at": now,
        "updated_at": now,
    }
