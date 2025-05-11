from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from passlib.hash import pbkdf2_sha256  # تغيير هنا
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from config import Config

db = SQLAlchemy()
login_manager = LoginManager()
# تم إزالة bcrypt لأننا سنستخدم pbkdf2_sha256 مباشرة
limiter = Limiter(key_func=get_remote_address)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    login_manager.init_app(app)
    # تم إزالة bcrypt.init_app(app) لأننا لا نحتاج تهيئة
    limiter.init_app(app)

    login_manager.login_view = 'auth.login'
    login_manager.login_message_category = 'info'

    from app.auth import auth as auth_blueprint
    from app.routes import main as main_blueprint

    app.register_blueprint(auth_blueprint)
    app.register_blueprint(main_blueprint)

    return app
