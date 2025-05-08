import os
from datetime import timedelta
from pathlib import Path

# المسار الأساسي للمشروع
BASE_DIR = Path(__file__).resolve().parent

# مسار مجلد قاعدة البيانات داخل المشروع
INSTANCE_DIR = BASE_DIR / "instance"
INSTANCE_DIR.mkdir(exist_ok=True)  # إنشاء المجلد إذا لم يكن موجودًا

class Config:
    # أمان الجلسات
    SECRET_KEY = os.urandom(32)

    # مسار قاعدة البيانات (مطلق)
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{INSTANCE_DIR / 'users.db'}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=30)
    SESSION_PROTECTION = 'strong'

    # إعدادات الأمان المتقدمة
    SECURITY_PASSWORD_SALT = os.urandom(32).hex()
    SECURITY_PASSWORD_HASH = 'pbkdf2_sha256'
    SECURITY_PASSWORD_LENGTH_MIN = 8
    SECURITY_TRACKABLE = True

    # إعدادات الحد من الطلبات
    RATELIMIT_DEFAULT = "5 per minute"
    RATELIMIT_STORAGE_URL = "memory://"
    RATELIMIT_STRATEGY = "moving-window"