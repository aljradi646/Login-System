from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from app.models import User, db
from app import limiter
from passlib.hash import pbkdf2_sha256
from datetime import datetime, timedelta
import re

auth = Blueprint('auth', __name__)

def validate_password(password):
    if len(password) < 8:
        return False
    if not re.search("[a-z]", password):
        return False
    if not re.search("[A-Z]", password):
        return False
    if not re.search("[0-9]", password):
        return False
    if not re.search("[!@#$%^&*(),.?\":{}|<>]", password):
        return False
    return True

@auth.route('/check_username', methods=['POST'])
def check_username():
    username = request.form.get('username')
    user = User.query.filter_by(username=username).first()
    return jsonify({'available': not user})

@auth.route('/login', methods=['GET', 'POST'])
@limiter.limit("5 per minute")
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()
        
        if user and user.locked_until and user.locked_until > datetime.utcnow():
            flash('Account is temporarily locked. Please try again later.', 'danger')
            return render_template('login.html', email=email)
            
        if user and pbkdf2_sha256.verify(password, user.password_hash):
            login_user(user, remember=True)
            user.last_login = datetime.utcnow()
            user.login_count += 1
            user.failed_login_attempts = 0
            db.session.commit()
            return redirect(url_for('main.dashboard'))
        else:
            if user:
                user.failed_login_attempts += 1
                if user.failed_login_attempts >= 5:
                    user.locked_until = datetime.utcnow() + timedelta(minutes=15)
                db.session.commit()
            flash('Invalid email or password', 'danger')
            return render_template('login.html', email=email)
    
    return render_template('login.html')

@auth.route('/register', methods=['GET', 'POST'])
@limiter.limit("5 per minute")
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
        
    if request.method == 'POST':
        data = {
            'first_name': request.form.get('first_name'),
            'last_name': request.form.get('last_name'),
            'username': request.form.get('username'),
            'email': request.form.get('email'),
            'country': request.form.get('country'),
            'phone': request.form.get('phone'),
            'password': request.form.get('password'),
            'confirm_password': request.form.get('confirm_password'),
            'terms': request.form.get('terms')
        }
        
        if not all(data.values()):
            flash('Please fill all required fields', 'danger')
            return render_template('register.html', **data)
            
        if not data['terms']:
            flash('You must agree to the terms and privacy policy', 'danger')
            return render_template('register.html', **data)
            
        if data['password'] != data['confirm_password']:
            flash('Passwords do not match', 'danger')
            return render_template('register.html', **data)
            
        if not re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', data['email']):
            flash('Please enter a valid email address', 'danger')
            return render_template('register.html', **data)
            
        if not validate_password(data['password']):
            flash('Password must contain uppercase, lowercase, number and special char', 'danger')
            return render_template('register.html', **data)
            
        if User.query.filter_by(username=data['username']).first():
            flash('Username already taken', 'danger')
            return render_template('register.html', **data)
            
        if User.query.filter_by(email=data['email']).first():
            flash('Email already registered', 'danger')
            return render_template('register.html', **data)
            
        hashed_password = pbkdf2_sha256.hash(data['password'])
        user = User(
            first_name=data['first_name'],
            last_name=data['last_name'],
            username=data['username'],
            email=data['email'],
            country=data['country'],
            phone=data['phone'],
            password_hash=hashed_password
        )
        
        db.session.add(user)
        db.session.commit()
        
        flash('Account created successfully! Please login.', 'success')
        return redirect(url_for('auth.login'))
        
    return render_template('register.html')

@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))
