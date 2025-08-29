# Flask Backend for CSS Picker SaaS Chrome Extension
# Handles authentication, payments, and user plan management
from dotenv import load_dotenv
import os
import json
import hashlib
import hmac
from datetime import datetime, timedelta
from functools import wraps


import libsql as libsql
import stripe
import requests
import jwt
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from werkzeug.exceptions import BadRequest

# ✅ .env 먼저 로드
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for Chrome extension

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
stripe.api_key = os.getenv('STRIPE_SECRET_KEY', 'sk_test_your_stripe_secret_key_here')

# Turso Database Configuration  
TURSO_DATABASE_URL = os.getenv('TURSO_DATABASE_URL', 'libsql://your-database-url.turso.io')
TURSO_AUTH_TOKEN = os.getenv('TURSO_AUTH_TOKEN', 'your-turso-auth-token')

# Stripe Configuration
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', 'whsec_your_webhook_secret')
STRIPE_PRICE_ID = os.getenv('STRIPE_PRICE_ID', 'price_your_premium_price_id')

# Clerk Configuration
CLERK_SECRET_KEY = os.getenv('CLERK_SECRET_KEY', 'sk_test_GvnKOcbAgR68NEfR8K91KsTgZjP4k3b6Nyw6VVwyuX')

class DatabaseManager:
    def __init__(self):
        self.db = None
        self.connect()
        self.create_tables()
    
    def connect(self):
        """Connect to Turso database"""
        try:
            self.db = libsql.connect(TURSO_DATABASE_URL, auth_token=TURSO_AUTH_TOKEN)
            print("Connected to Turso database")
        except Exception as e:
            print(f"Failed to connect to database: {e}")
            raise
    
    def create_tables(self):
        """Create database tables if they don't exist"""
        try:
            cursor = self.db.cursor()
            
            # Users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    clerk_user_id TEXT UNIQUE NOT NULL,
                    email TEXT NOT NULL,
                    plan TEXT DEFAULT 'free',
                    premium_activated_at DATETIME,
                    stripe_customer_id TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Payments table (for lifetime payments)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS payments (
                    id TEXT PRIMARY KEY,
                    user_id TEXT REFERENCES users(id),
                    stripe_payment_intent_id TEXT UNIQUE,
                    amount INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    payment_date DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Usage logs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS usage_logs (
                    id TEXT PRIMARY KEY,
                    user_id TEXT REFERENCES users(id),
                    feature TEXT,
                    usage_date DATE,
                    count INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            self.db.commit()
            print("Database tables created/verified")
            
        except Exception as e:
            print(f"Failed to create tables: {e}")
            raise

# Global database manager
db_manager = DatabaseManager()

def verify_clerk_session_token(token):
    """Verify Clerk JWT session token using networkless verification"""
    try:
        print(f"Verifying Clerk JWT token: {token[:10]}...")
        
        # Get Clerk JWKS to verify the token
        jwks_url = "https://meet-warthog-82.clerk.accounts.dev/.well-known/jwks.json"
        jwks_response = requests.get(jwks_url)
        
        if jwks_response.status_code != 200:
            print(f"Failed to fetch JWKS: {jwks_response.status_code}")
            return None
        
        jwks = jwks_response.json()
        
        # Decode JWT header to get the key ID
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get('kid')
        
        # Find the matching key
        key = None
        for jwk in jwks['keys']:
            if jwk['kid'] == kid:
                key = jwt.algorithms.RSAAlgorithm.from_jwk(jwk)
                break
        
        if not key:
            print(f"No matching key found for kid: {kid}")
            return None
        
        # Verify and decode the JWT
        payload = jwt.decode(
            token,
            key,
            algorithms=['RS256'],
            audience=None,  # Skip audience validation for now
            options={"verify_aud": False}  # Skip audience verification
        )
        
        print(f"JWT verified successfully, payload: {payload}")
        
        # Extract user information from JWT payload
        user_id = payload.get('sub')  # Subject is usually the user ID
        
        if user_id:
            # Get user details from Clerk API
            headers = {
                'Authorization': f'Bearer {CLERK_SECRET_KEY}',
                'Content-Type': 'application/json'
            }
            user_url = f"https://api.clerk.com/v1/users/{user_id}"
            user_response = requests.get(user_url, headers=headers)
            
            if user_response.status_code == 200:
                user_data = user_response.json()
                return {
                    'user_id': user_id,
                    'email': user_data.get('email_addresses', [{}])[0].get('email_address'),
                    'first_name': user_data.get('first_name'),
                    'last_name': user_data.get('last_name')
                }
            else:
                print(f"Failed to fetch user data: {user_response.status_code}")
                # Return basic info from JWT if API call fails
                return {
                    'user_id': user_id,
                    'email': payload.get('email'),
                    'first_name': None,
                    'last_name': None
                }
        
        return None
        
    except jwt.ExpiredSignatureError:
        print("JWT token has expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Invalid JWT token: {e}")
        return None
    except Exception as e:
        print(f"Error verifying Clerk token: {e}")
        return None

def verify_clerk_token(f):
    """Decorator to verify Clerk authentication token"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        
        # Verify token with Clerk API
        user_data = verify_clerk_session_token(token)
        
        if not user_data:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Set user data in request context
        request.user_id = user_data['user_id']
        request.user_email = user_data['email']
        request.user_first_name = user_data.get('first_name')
        request.user_last_name = user_data.get('last_name')
        
        return f(*args, **kwargs)
    return decorated_function


def get_or_create_user(clerk_user_id, email):
    """Get existing user or create new one"""
    cursor = db_manager.db.cursor()
    
    # Try to find existing user
    cursor.execute("SELECT id, clerk_user_id, email, plan, premium_activated_at, stripe_customer_id, created_at, updated_at FROM users WHERE clerk_user_id = ?", (clerk_user_id,))
    user_row = cursor.fetchone()
    
    if user_row:
        # Convert row to dictionary manually
        return {
            'id': user_row[0],
            'clerk_user_id': user_row[1],
            'email': user_row[2],
            'plan': user_row[3],
            'premium_activated_at': user_row[4],
            'stripe_customer_id': user_row[5],
            'created_at': user_row[6],
            'updated_at': user_row[7]
        }
    
    # Create new user
    user_id = f"usr_{hashlib.md5(clerk_user_id.encode()).hexdigest()[:12]}"
    cursor.execute("""
        INSERT INTO users (id, clerk_user_id, email, plan)
        VALUES (?, ?, ?, 'free')
    """, (user_id, clerk_user_id, email))
    
    db_manager.db.commit()
    
    # Return new user
    cursor.execute("SELECT id, clerk_user_id, email, plan, premium_activated_at, stripe_customer_id, created_at, updated_at FROM users WHERE id = ?", (user_id,))
    new_user_row = cursor.fetchone()
    
    return {
        'id': new_user_row[0],
        'clerk_user_id': new_user_row[1],
        'email': new_user_row[2],
        'plan': new_user_row[3],
        'premium_activated_at': new_user_row[4],
        'stripe_customer_id': new_user_row[5],
        'created_at': new_user_row[6],
        'updated_at': new_user_row[7]
    }

# Routes

@app.route('/')
def index():
    """Landing page"""
    return render_template('index.html')

@app.route('/success')
def success():
    """Payment success page"""
    return render_template('success.html')

@app.route('/upgrade')
def upgrade():
    """Upgrade to premium page"""
    return render_template('index.html')

@app.route('/cancel')
def cancel():
    """Payment cancelled page"""
    return render_template('cancel.html')

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

# 개발용 임시 엔드포인트
@app.route('/api/dev/set-premium', methods=['POST'])
def dev_set_premium():
    """Development only: Set user to premium by email"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email required'}), 400
            
        cursor = db_manager.db.cursor()
        
        # Find user by email
        cursor.execute("SELECT id, plan FROM users WHERE email = ?", (email,))
        user_row = cursor.fetchone()
        
        if not user_row:
            return jsonify({'error': 'User not found'}), 404
            
        user_id, current_plan = user_row
        
        # Update to lifetime
        cursor.execute("""
            UPDATE users 
            SET plan = 'lifetime', 
                premium_activated_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (user_id,))
        
        db_manager.db.commit()
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'email': email,
            'previous_plan': current_plan,
            'new_plan': 'lifetime'
        })
        
    except Exception as e:
        print(f"Error in dev endpoint: {e}")
        return jsonify({'error': str(e)}), 500


# User Management Endpoints

@app.route('/api/user/profile', methods=['GET'])
@verify_clerk_token
def get_user_profile():
    """Get user profile and plan information"""
    try:
        print(f"Getting user profile for user_id: {request.user_id}, email: {request.user_email}")
        user = get_or_create_user(request.user_id, request.user_email)
        print(f"User created/retrieved: {user}")
        
        return jsonify({
            'id': user['id'],
            'email': user['email'],
            'plan': user['plan'],
            'premium_activated_at': user.get('premium_activated_at'),
            'created_at': user['created_at']
        })
        
    except Exception as e:
        print(f"Error getting user profile: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/user/usage', methods=['GET'])
@verify_clerk_token
def get_user_usage():
    """Get user usage statistics"""
    try:
        user = get_or_create_user(request.user_id, request.user_email)
        cursor = db_manager.db.cursor()
        
        # Get today's usage
        today = datetime.now().date()
        cursor.execute("""
            SELECT feature, SUM(count) as total_count
            FROM usage_logs 
            WHERE user_id = ? AND usage_date = ?
            GROUP BY feature
        """, (user['id'], today))
        
        usage_data = {}
        for row in cursor.fetchall():
            usage_data[row['feature']] = row['total_count']
        
        return jsonify({
            'user_id': user['id'],
            'plan': user['plan'],
            'usage_date': today.isoformat(),
            'usage': usage_data
        })
        
    except Exception as e:
        print(f"Error getting user usage: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Usage Tracking Endpoints

@app.route('/api/usage/track', methods=['POST'])
@verify_clerk_token  
def track_usage():
    """Track feature usage"""
    try:
        data = request.get_json()
        feature = data.get('feature')
        
        if not feature:
            return jsonify({'error': 'Feature name required'}), 400
        
        user = get_or_create_user(request.user_id, request.user_email)
        cursor = db_manager.db.cursor()
        
        # Insert usage log
        usage_id = f"usage_{hashlib.md5(f'{user['id']}{feature}{datetime.now()}'.encode()).hexdigest()[:12]}"
        today = datetime.now().date()
        
        cursor.execute("""
            INSERT INTO usage_logs (id, user_id, feature, usage_date, count)
            VALUES (?, ?, ?, ?, 1)
        """, (usage_id, user['id'], feature, today))
        
        db_manager.db.commit()
        
        return jsonify({'success': True, 'feature': feature, 'timestamp': datetime.now().isoformat()})
        
    except Exception as e:
        print(f"Error tracking usage: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Payment Endpoints

@app.route('/api/checkout/create', methods=['POST'])
@verify_clerk_token
def create_checkout():
    """Create Stripe checkout session"""
    try:
        user = get_or_create_user(request.user_id, request.user_email)
        
        # Create or get Stripe customer
        stripe_customer_id = user.get('stripe_customer_id')
        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=user['email'],
                metadata={'user_id': user['id']}
            )
            stripe_customer_id = customer.id
            
            # Update user record
            cursor = db_manager.db.cursor()
            cursor.execute("""
                UPDATE users SET stripe_customer_id = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (stripe_customer_id, user['id']))
            db_manager.db.commit()
        
        # Create checkout session
        session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': STRIPE_PRICE_ID,
                'quantity': 1,
            }],
            mode='payment',
            success_url=request.host_url + 'success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=request.host_url + 'cancel',
            metadata={
                'user_id': user['id']
            }
        )
        
        return jsonify({'checkout_url': session.url, 'session_id': session.id})
        
    except Exception as e:
        print(f"Error creating checkout: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/billing/portal', methods=['POST'])
@verify_clerk_token
def create_billing_portal():
    """Create Stripe billing portal session"""
    try:
        user = get_or_create_user(request.user_id, request.user_email)
        
        if not user.get('stripe_customer_id'):
            return jsonify({'error': 'No billing information found'}), 400
        
        session = stripe.billing_portal.Session.create(
            customer=user['stripe_customer_id'],
            return_url=request.host_url
        )
        
        return jsonify({'portal_url': session.url})
        
    except Exception as e:
        print(f"Error creating billing portal: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Stripe Webhooks

@app.route('/webhooks/stripe', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhooks"""
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        print("Invalid payload")
        return '', 400
    except stripe.error.SignatureVerificationError:
        print("Invalid signature")  
        return '', 400
    
    # Handle the event
    if event['type'] == 'checkout.session.completed':
        handle_checkout_completed(event['data']['object'])
    elif event['type'] == 'payment_intent.succeeded':
        handle_payment_succeeded(event['data']['object'])
    
    return '', 200

def handle_checkout_completed(session):
    """Handle successful checkout completion for one-time lifetime payment"""
    try:
        user_id = session['metadata']['user_id']
        payment_intent_id = session['payment_intent']
        
        cursor = db_manager.db.cursor()
        
        # Update user plan to lifetime premium with activation timestamp
        cursor.execute("""
            UPDATE users SET plan = 'lifetime', premium_activated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (user_id,))
        
        # Record the lifetime payment ($29.00 = 2900 cents)
        payment_id = f"pay_{hashlib.md5(payment_intent_id.encode()).hexdigest()[:12]}"
        cursor.execute("""
            INSERT INTO payments (id, user_id, stripe_payment_intent_id, amount, status, payment_date)
            VALUES (?, ?, ?, 2900, 'succeeded', CURRENT_TIMESTAMP)
        """, (payment_id, user_id, payment_intent_id))
        
        db_manager.db.commit()
        print(f"User {user_id} upgraded to lifetime premium ($29.00)")
        
    except Exception as e:
        print(f"Error handling checkout completion: {e}")

def handle_payment_succeeded(payment_intent):
    """Handle successful one-time payment"""
    try:
        print(f"Payment succeeded for payment intent {payment_intent['id']}")
        
    except Exception as e:
        print(f"Error handling payment success: {e}")

if __name__ == '__main__':
    print("Starting CSS Picker Backend...")
    print("Database:", TURSO_DATABASE_URL.split('@')[-1] if '@' in TURSO_DATABASE_URL else TURSO_DATABASE_URL)
    print("Stripe Mode:", "Live" if stripe.api_key.startswith('sk_live') else "Test")
    
    port = int(os.getenv('PORT', 4242))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(debug=debug, host='0.0.0.0', port=port)