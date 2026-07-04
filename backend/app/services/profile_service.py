from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.profile import ProfileUpdate


def get_profile(db: Session, user: User) -> User:
    return user


def update_profile(db: Session, user: User, data: ProfileUpdate) -> User:
    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        if field == "target_sectors" and value is not None:
            value = value.strip() or None
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user
