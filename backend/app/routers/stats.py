from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, auth, models
from ..database import get_db
from sqlalchemy import func
from sqlalchemy import and_
from datetime import datetime, timedelta

router = APIRouter()


@router.get("/", dependencies=[Depends(auth.get_current_admin)])
def get_order_stats(
    db: Session = Depends(get_db),
    range: str = Query(None, description="Options: day, week, month, year, or custom"),
    start_date: str = Query(None),
    end_date: str = Query(None),
):
    """
    Returns statistics. Important: total_orders counts unique order codes (not item rows).
    Date filters apply to the Order.created_at column.
    """

    # Base query: collected orders only
    query = db.query(models.Order).filter(models.Order.collected == True)

    now = datetime.utcnow()

    # Apply date range filters to `query`
    if range == "day":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(models.Order.created_at >= start)
    elif range == "week":
        start = now - timedelta(days=7)
        query = query.filter(models.Order.created_at >= start)
    elif range == "month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(models.Order.created_at >= start)
    elif range == "year":
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(models.Order.created_at >= start)
    elif range == "custom" and start_date and end_date:
        try:
            start = datetime.fromisoformat(start_date)
            end = datetime.fromisoformat(end_date)
            query = query.filter(
                and_(models.Order.created_at >= start, models.Order.created_at <= end)
            )
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid date format. Use YYYY-MM-DD."
            )

    # --- total_orders: count distinct codes (unique orders) ---
    total_orders = (
        query.with_entities(func.count(func.distinct(models.Order.code))).scalar() or 0
    )

    # --- total_revenue: sum of total_amount across filtered rows (this is correct for revenue) ---
    total_revenue = (
        query.with_entities(func.sum(models.Order.total_amount)).scalar() or 0
    )

    # --- monthly_stats: revenue per month (formatted YYYY-MM) ---
    monthly_stats = (
        query.with_entities(
            func.strftime("%Y-%m", models.Order.created_at).label("month"),
            func.sum(models.Order.total_amount).label("revenue"),
        )
        .group_by("month")
        .order_by("month")
        .all()
    )

    # --- top_products: use the same filtered query joined to Product to get sums ---
    top_products = (
        query.join(models.Product)
        .with_entities(
            models.Product.name,
            func.sum(models.Order.quantity).label("total_sold"),
            func.sum(models.Order.total_amount).label("revenue"),
        )
        .group_by(models.Product.name)
        .order_by(func.sum(models.Order.quantity).desc())
        .limit(5)
        .all()
    )

    return {
        "total_orders": int(total_orders),
        "total_revenue": float(total_revenue),
        "monthly_stats": [
            {"month": m, "revenue": float(r or 0)} for m, r in monthly_stats
        ],
        "top_products": [
            {"name": n, "total_sold": int(s or 0), "revenue": float(r or 0)}
            for n, s, r in top_products
        ],
    }
