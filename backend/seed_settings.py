from app.core.database import get_db_context
from app.models.settings import SystemSettings
from app.schemas.settings import SchoolSettings, NotificationSettings, SecuritySettings

def seed_settings():
    try:
        with get_db_context() as db:
            # Check if settings exist
            existing = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
            if existing:
                print("Settings already exist.")
                return

            print("Seeding default system settings...")
            settings = SystemSettings(
                id=1,
                school_config=SchoolSettings().dict(),
                notification_config=NotificationSettings().dict(),
                security_config=SecuritySettings().dict()
            )
            db.add(settings)
            db.commit()
            print("[OK] Default settings created successfully!")
    except Exception as e:
        print(f"[ERROR] Error seeding settings: {e}")

if __name__ == "__main__":
    seed_settings()
