import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Float, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Metric(Base):
    __tablename__ = "metrics"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    site_id = Column(
        UUID(as_uuid=True),
        ForeignKey("sites.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    timestamp = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    carbon_sequestration_tons = Column(Float, nullable=False, default=0.0)
    biodiversity_index = Column(Float, nullable=False, default=0.0)
    vegetation_index = Column(Float, nullable=True, default=0.0)
    soil_organic_matter = Column(Float, nullable=True, default=0.0)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    site = relationship("Site", back_populates="metrics")


# Composite index for time-series queries
Index("idx_metric_site_time", Metric.site_id, Metric.timestamp.desc())
