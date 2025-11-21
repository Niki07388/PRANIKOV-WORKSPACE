import os
import time
from uuid import uuid4
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy.dialects.postgresql import JSONB
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

load_dotenv()

# Get PORT from Render, default to 10000
PORT = int(os.getenv('PORT', 10000))

app = Flask(__name__)

# ---------------------- Configuration ----------------------
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'uphill_secret_key_2024'
app.config['JWT_SECRET_KEY'] = 'uphill_jwt_secret_2024'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

db = SQLAlchemy(app)

# ---------------------- CORS Configuration ----------------------
# Allow requests from Vercel and Localhost (for testing)
VERCEL_FRONTEND_URL = "https://pranikov-workspace.vercel.app"
allowed_origins = [VERCEL_FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"]

CORS(app, resources={r"/*": {"origins": allowed_origins}})

# Initialize JWT manager
jwt = JWTManager(app)


# ---------------------- Models ----------------------
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    role = db.Column(db.String, nullable=False)  # 'MANAGER' or 'EMPLOYEE'
    avatar = db.Column(db.String, nullable=True)
    password = db.Column(db.String, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'avatar': self.avatar,
        }


class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.String, primary_key=True)
    project_name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.String, nullable=False)
    deadline = db.Column(db.String, nullable=True)
    assigned_user_ids = db.Column(JSONB, nullable=False, default=list)
    checkpoints = db.Column(JSONB, nullable=False, default=list)
    progress = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'projectName': self.project_name,
            'description': self.description,
            'createdBy': self.created_by,
            'deadline': self.deadline,
            'assignedUserIds': self.assigned_user_ids,
            'checkpoints': self.checkpoints,
            'progress': self.progress,
        }


class ChatMessage(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.String, primary_key=True)
    project_id = db.Column(db.String, nullable=False)
    sender_id = db.Column(db.String, nullable=False)
    sender_name = db.Column(db.String, nullable=False)
    type = db.Column(db.String, nullable=False)
    content = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.BigInteger, nullable=False)
    file_name = db.Column(db.String, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'projectId': self.project_id,
            'senderId': self.sender_id,
            'senderName': self.sender_name,
            'type': self.type,
            'content': self.content,
            'timestamp': self.timestamp,
            'fileName': self.file_name,
        }


# ---------------------- Seed Data ----------------------
SEED_USERS = [
    { 'id': 'u1', 'name': 'Alex Manager', 'email': 'manager@pranikov.com', 'role': 'MANAGER', 'avatar': 'https://ui-avatars.com/api/?name=Alex+Manager&background=6366f1&color=fff', 'password': '123' },
    { 'id': 'u2', 'name': 'Sarah Dev', 'email': 'sarah@pranikov.com', 'role': 'EMPLOYEE', 'avatar': 'https://ui-avatars.com/api/?name=Sarah+Dev&background=10b981&color=fff', 'password': '123' },
    { 'id': 'u3', 'name': 'John Designer', 'email': 'john@pranikov.com', 'role': 'EMPLOYEE', 'avatar': 'https://ui-avatars.com/api/?name=John+Designer&background=f59e0b&color=fff', 'password': '123' },
]

SEED_PROJECTS = [
    {
        'id': 'p1',
        'projectName': 'Website Redesign',
        'description': 'Overhaul the corporate website with new branding.',
        'createdBy': 'u1',
        'deadline': '2023-12-31',
        'assignedUserIds': ['u2','u3'],
        'progress': 50,
        'checkpoints': [
            {
                'id': 'c1',
                'title': 'Design Phase',
                'description': 'Create Figma mockups for all pages.',
                'deadline': '2023-11-01',
                'status': 'COMPLETED',
                'tasks': [
                    { 'id': 't1', 'title': 'Homepage Mockup', 'status': 'COMPLETED' },
                    { 'id': 't2', 'title': 'About Us Mockup', 'status': 'COMPLETED' },
                ],
            },
            {
                'id': 'c2',
                'title': 'Development Phase',
                'description': 'Implement React components.',
                'deadline': '2023-12-01',
                'status': 'PENDING',
                'tasks': [
                    { 'id': 't3', 'title': 'Setup Repo', 'status': 'COMPLETED' },
                    { 'id': 't4', 'title': 'Build Header/Footer', 'status': 'PENDING' },
                ],
            },
        ],
    }
]

SEED_MESSAGES = [
    { 'id': 'm1', 'projectId': 'p1', 'senderId': 'u1', 'senderName': 'Alex Manager', 'type': 'text', 'content': 'Welcome to the project team!', 'timestamp': int(time.time()*1000) - 10000000 },
    { 'id': 'm2', 'projectId': 'p1', 'senderId': 'u2', 'senderName': 'Sarah Dev', 'type': 'text', 'content': 'Thanks Alex, ready to start.', 'timestamp': int(time.time()*1000) - 9000000 },
]


def seed_db():
    # Create tables
    db.create_all()

    if User.query.count() == 0:
        for u in SEED_USERS:
            user = User(id=u['id'], name=u['name'], email=u['email'], role=u['role'], avatar=u.get('avatar'), password=u.get('password'))
            db.session.add(user)
        db.session.commit()

    if Project.query.count() == 0:
        for p in SEED_PROJECTS:
            proj = Project(
                id=p['id'],
                project_name=p['projectName'],
                description=p.get('description'),
                created_by=p.get('createdBy'),
                deadline=p.get('deadline'),
                assigned_user_ids=p.get('assignedUserIds', []),
                checkpoints=p.get('checkpoints', []),
                progress=p.get('progress', 0),
            )
            db.session.add(proj)
        db.session.commit()

    if ChatMessage.query.count() == 0:
        for m in SEED_MESSAGES:
            msg = ChatMessage(id=m['id'], project_id=m['projectId'], sender_id=m['senderId'], sender_name=m['senderName'], type=m['type'], content=m.get('content'), timestamp=m['timestamp'])
            db.session.add(msg)
        db.session.commit()


# ---------------------- Helpers ----------------------
def generate_id(prefix: str = '') -> str:
    return f"{prefix}{uuid4().hex}"


def recalc_project_progress(project: Project):
    total_tasks = 0
    completed_tasks = 0
    cps = project.checkpoints or []
    for cp in cps:
        tasks = cp.get('tasks', [])
        cp_total = len(tasks)
        cp_done = len([t for t in tasks if t.get('status') == 'COMPLETED'])
        if cp_total > 0 and cp_done == cp_total:
            cp['status'] = 'COMPLETED'
        elif cp_total > 0 and cp_done < cp_total:
            cp['status'] = 'PENDING'
        total_tasks += cp_total
        completed_tasks += cp_done

    project.progress = 0 if total_tasks == 0 else round((completed_tasks / total_tasks) * 100)


# ---------------------- Routes ----------------------
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').lower()
    password = data.get('password')
    user = User.query.filter(db.func.lower(User.email) == email).first()
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    # simple password check (plain text for demo)
    if user.password and password and user.password != password:
        return jsonify({'error': 'Invalid credentials'}), 401
    access_token = create_access_token(identity=user.id)
    return jsonify({'user': user.to_dict(), 'accessToken': access_token})


@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    role = data.get('role')
    password = data.get('password')
    if not (name and email and role):
        return jsonify({'error': 'Missing fields'}), 400
    if User.query.filter(db.func.lower(User.email) == email.lower()).first():
        return jsonify({'error': 'Email already exists'}), 400
    uid = generate_id('u')
    avatar = f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=random&color=fff"
    user = User(id=uid, name=name, email=email, role=role, avatar=avatar, password=password)
    db.session.add(user)
    db.session.commit()
    access_token = create_access_token(identity=user.id)
    return jsonify({'user': user.to_dict(), 'accessToken': access_token}), 201


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(user.to_dict())


@app.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])


@app.route('/api/projects', methods=['GET', 'POST'])
def projects():
    if request.method == 'GET':
        user_id = request.args.get('userId')
        role = request.args.get('role')
        projects = Project.query.all()
        results = []
        for p in projects:
            if role == 'MANAGER' or (user_id and user_id in (p.assigned_user_ids or [])):
                results.append(p.to_dict())
        return jsonify(results)

    # POST -> create project
    data = request.get_json() or {}
    pid = data.get('id') or generate_id('p')
    proj = Project(
        id=pid,
        project_name=data.get('projectName') or data.get('project_name') or 'Untitled',
        description=data.get('description'),
        created_by=data.get('createdBy') or data.get('created_by') or '',
        deadline=data.get('deadline'),
        assigned_user_ids=data.get('assignedUserIds') or data.get('assigned_user_ids') or [],
        checkpoints=data.get('checkpoints') or [],
        progress=data.get('progress') or 0,
    )
    recalc_project_progress(proj)
    db.session.add(proj)
    db.session.commit()
    return jsonify(proj.to_dict()), 201


@app.route('/api/projects/<project_id>', methods=['GET'])
def get_project(project_id):
    p = Project.query.get(project_id)
    if not p:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(p.to_dict())


@app.route('/api/projects/<project_id>/checkpoints', methods=['PUT'])
def update_checkpoints(project_id):
    p = Project.query.get(project_id)
    if not p:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json() or {}
    cps = data.get('checkpoints') or data
    p.checkpoints = cps
    recalc_project_progress(p)
    db.session.commit()
    return jsonify(p.to_dict())


@app.route('/api/projects/<project_id>/messages', methods=['GET', 'POST'])
def project_messages(project_id):
    if request.method == 'GET':
        msgs = ChatMessage.query.filter_by(project_id=project_id).order_by(ChatMessage.timestamp.asc()).all()
        return jsonify([m.to_dict() for m in msgs])

    data = request.get_json() or {}
    mid = data.get('id') or generate_id('m')
    timestamp = data.get('timestamp') or int(time.time() * 1000)
    msg = ChatMessage(id=mid, project_id=project_id, sender_id=data.get('senderId'), sender_name=data.get('senderName') or '', type=data.get('type') or 'text', content=data.get('content'), timestamp=timestamp, file_name=data.get('fileName'))
    db.session.add(msg)
    db.session.commit()
    return jsonify(msg.to_dict()), 201


@app.route('/api/messages', methods=['GET'])
def all_messages():
    msgs = ChatMessage.query.order_by(ChatMessage.timestamp.asc()).all()
    return jsonify([m.to_dict() for m in msgs])


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


# ---------------------- INITIALIZATION (FIXED) ----------------------
# 🚨 THIS SECTION IS CRITICAL FOR RENDER 🚨
# We run this OUTSIDE of "if __name__ == '__main__'"
# because Render/Gunicorn does NOT run the main block.
# This ensures tables are created when Gunicorn imports the app.
with app.app_context():
    try:
        seed_db() # This calls db.create_all()
        print("✅ Database initialized and seeded successfully!")
    except Exception as e:
        print(f"⚠️ Error during database initialization: {e}")

# ---------------------- Local Development ----------------------
if __name__ == '__main__':
    # This only runs if you type 'python app.py' locally
    app.run(host='0.0.0.0', port=PORT)import os
import time
from uuid import uuid4
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy.dialects.postgresql import JSONB
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

load_dotenv()

# Get PORT from Render, default to 10000
PORT = int(os.getenv('PORT', 10000))

app = Flask(__name__)

# ---------------------- Configuration ----------------------
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'uphill_secret_key_2024'
app.config['JWT_SECRET_KEY'] = 'uphill_jwt_secret_2024'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

db = SQLAlchemy(app)

# ---------------------- CORS Configuration ----------------------
# Allow requests from Vercel and Localhost (for testing)
VERCEL_FRONTEND_URL = "https://pranikov-workspace.vercel.app"
allowed_origins = [VERCEL_FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"]

CORS(app, resources={r"/*": {"origins": allowed_origins}})

# Initialize JWT manager
jwt = JWTManager(app)


# ---------------------- Models ----------------------
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    role = db.Column(db.String, nullable=False)  # 'MANAGER' or 'EMPLOYEE'
    avatar = db.Column(db.String, nullable=True)
    password = db.Column(db.String, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'avatar': self.avatar,
        }


class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.String, primary_key=True)
    project_name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.String, nullable=False)
    deadline = db.Column(db.String, nullable=True)
    assigned_user_ids = db.Column(JSONB, nullable=False, default=list)
    checkpoints = db.Column(JSONB, nullable=False, default=list)
    progress = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'projectName': self.project_name,
            'description': self.description,
            'createdBy': self.created_by,
            'deadline': self.deadline,
            'assignedUserIds': self.assigned_user_ids,
            'checkpoints': self.checkpoints,
            'progress': self.progress,
        }


class ChatMessage(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.String, primary_key=True)
    project_id = db.Column(db.String, nullable=False)
    sender_id = db.Column(db.String, nullable=False)
    sender_name = db.Column(db.String, nullable=False)
    type = db.Column(db.String, nullable=False)
    content = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.BigInteger, nullable=False)
    file_name = db.Column(db.String, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'projectId': self.project_id,
            'senderId': self.sender_id,
            'senderName': self.sender_name,
            'type': self.type,
            'content': self.content,
            'timestamp': self.timestamp,
            'fileName': self.file_name,
        }


# ---------------------- Seed Data ----------------------
SEED_USERS = [
    { 'id': 'u1', 'name': 'Alex Manager', 'email': 'manager@pranikov.com', 'role': 'MANAGER', 'avatar': 'https://ui-avatars.com/api/?name=Alex+Manager&background=6366f1&color=fff', 'password': '123' },
    { 'id': 'u2', 'name': 'Sarah Dev', 'email': 'sarah@pranikov.com', 'role': 'EMPLOYEE', 'avatar': 'https://ui-avatars.com/api/?name=Sarah+Dev&background=10b981&color=fff', 'password': '123' },
    { 'id': 'u3', 'name': 'John Designer', 'email': 'john@pranikov.com', 'role': 'EMPLOYEE', 'avatar': 'https://ui-avatars.com/api/?name=John+Designer&background=f59e0b&color=fff', 'password': '123' },
]

SEED_PROJECTS = [
    {
        'id': 'p1',
        'projectName': 'Website Redesign',
        'description': 'Overhaul the corporate website with new branding.',
        'createdBy': 'u1',
        'deadline': '2023-12-31',
        'assignedUserIds': ['u2','u3'],
        'progress': 50,
        'checkpoints': [
            {
                'id': 'c1',
                'title': 'Design Phase',
                'description': 'Create Figma mockups for all pages.',
                'deadline': '2023-11-01',
                'status': 'COMPLETED',
                'tasks': [
                    { 'id': 't1', 'title': 'Homepage Mockup', 'status': 'COMPLETED' },
                    { 'id': 't2', 'title': 'About Us Mockup', 'status': 'COMPLETED' },
                ],
            },
            {
                'id': 'c2',
                'title': 'Development Phase',
                'description': 'Implement React components.',
                'deadline': '2023-12-01',
                'status': 'PENDING',
                'tasks': [
                    { 'id': 't3', 'title': 'Setup Repo', 'status': 'COMPLETED' },
                    { 'id': 't4', 'title': 'Build Header/Footer', 'status': 'PENDING' },
                ],
            },
        ],
    }
]

SEED_MESSAGES = [
    { 'id': 'm1', 'projectId': 'p1', 'senderId': 'u1', 'senderName': 'Alex Manager', 'type': 'text', 'content': 'Welcome to the project team!', 'timestamp': int(time.time()*1000) - 10000000 },
    { 'id': 'm2', 'projectId': 'p1', 'senderId': 'u2', 'senderName': 'Sarah Dev', 'type': 'text', 'content': 'Thanks Alex, ready to start.', 'timestamp': int(time.time()*1000) - 9000000 },
]


def seed_db():
    # Create tables
    db.create_all()

    if User.query.count() == 0:
        for u in SEED_USERS:
            user = User(id=u['id'], name=u['name'], email=u['email'], role=u['role'], avatar=u.get('avatar'), password=u.get('password'))
            db.session.add(user)
        db.session.commit()

    if Project.query.count() == 0:
        for p in SEED_PROJECTS:
            proj = Project(
                id=p['id'],
                project_name=p['projectName'],
                description=p.get('description'),
                created_by=p.get('createdBy'),
                deadline=p.get('deadline'),
                assigned_user_ids=p.get('assignedUserIds', []),
                checkpoints=p.get('checkpoints', []),
                progress=p.get('progress', 0),
            )
            db.session.add(proj)
        db.session.commit()

    if ChatMessage.query.count() == 0:
        for m in SEED_MESSAGES:
            msg = ChatMessage(id=m['id'], project_id=m['projectId'], sender_id=m['senderId'], sender_name=m['senderName'], type=m['type'], content=m.get('content'), timestamp=m['timestamp'])
            db.session.add(msg)
        db.session.commit()


# ---------------------- Helpers ----------------------
def generate_id(prefix: str = '') -> str:
    return f"{prefix}{uuid4().hex}"


def recalc_project_progress(project: Project):
    total_tasks = 0
    completed_tasks = 0
    cps = project.checkpoints or []
    for cp in cps:
        tasks = cp.get('tasks', [])
        cp_total = len(tasks)
        cp_done = len([t for t in tasks if t.get('status') == 'COMPLETED'])
        if cp_total > 0 and cp_done == cp_total:
            cp['status'] = 'COMPLETED'
        elif cp_total > 0 and cp_done < cp_total:
            cp['status'] = 'PENDING'
        total_tasks += cp_total
        completed_tasks += cp_done

    project.progress = 0 if total_tasks == 0 else round((completed_tasks / total_tasks) * 100)


# ---------------------- Routes ----------------------
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').lower()
    password = data.get('password')
    user = User.query.filter(db.func.lower(User.email) == email).first()
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    # simple password check (plain text for demo)
    if user.password and password and user.password != password:
        return jsonify({'error': 'Invalid credentials'}), 401
    access_token = create_access_token(identity=user.id)
    return jsonify({'user': user.to_dict(), 'accessToken': access_token})


@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    role = data.get('role')
    password = data.get('password')
    if not (name and email and role):
        return jsonify({'error': 'Missing fields'}), 400
    if User.query.filter(db.func.lower(User.email) == email.lower()).first():
        return jsonify({'error': 'Email already exists'}), 400
    uid = generate_id('u')
    avatar = f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=random&color=fff"
    user = User(id=uid, name=name, email=email, role=role, avatar=avatar, password=password)
    db.session.add(user)
    db.session.commit()
    access_token = create_access_token(identity=user.id)
    return jsonify({'user': user.to_dict(), 'accessToken': access_token}), 201


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(user.to_dict())


@app.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])


@app.route('/api/projects', methods=['GET', 'POST'])
def projects():
    if request.method == 'GET':
        user_id = request.args.get('userId')
        role = request.args.get('role')
        projects = Project.query.all()
        results = []
        for p in projects:
            if role == 'MANAGER' or (user_id and user_id in (p.assigned_user_ids or [])):
                results.append(p.to_dict())
        return jsonify(results)

    # POST -> create project
    data = request.get_json() or {}
    pid = data.get('id') or generate_id('p')
    proj = Project(
        id=pid,
        project_name=data.get('projectName') or data.get('project_name') or 'Untitled',
        description=data.get('description'),
        created_by=data.get('createdBy') or data.get('created_by') or '',
        deadline=data.get('deadline'),
        assigned_user_ids=data.get('assignedUserIds') or data.get('assigned_user_ids') or [],
        checkpoints=data.get('checkpoints') or [],
        progress=data.get('progress') or 0,
    )
    recalc_project_progress(proj)
    db.session.add(proj)
    db.session.commit()
    return jsonify(proj.to_dict()), 201


@app.route('/api/projects/<project_id>', methods=['GET'])
def get_project(project_id):
    p = Project.query.get(project_id)
    if not p:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(p.to_dict())


@app.route('/api/projects/<project_id>/checkpoints', methods=['PUT'])
def update_checkpoints(project_id):
    p = Project.query.get(project_id)
    if not p:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json() or {}
    cps = data.get('checkpoints') or data
    p.checkpoints = cps
    recalc_project_progress(p)
    db.session.commit()
    return jsonify(p.to_dict())


@app.route('/api/projects/<project_id>/messages', methods=['GET', 'POST'])
def project_messages(project_id):
    if request.method == 'GET':
        msgs = ChatMessage.query.filter_by(project_id=project_id).order_by(ChatMessage.timestamp.asc()).all()
        return jsonify([m.to_dict() for m in msgs])

    data = request.get_json() or {}
    mid = data.get('id') or generate_id('m')
    timestamp = data.get('timestamp') or int(time.time() * 1000)
    msg = ChatMessage(id=mid, project_id=project_id, sender_id=data.get('senderId'), sender_name=data.get('senderName') or '', type=data.get('type') or 'text', content=data.get('content'), timestamp=timestamp, file_name=data.get('fileName'))
    db.session.add(msg)
    db.session.commit()
    return jsonify(msg.to_dict()), 201


@app.route('/api/messages', methods=['GET'])
def all_messages():
    msgs = ChatMessage.query.order_by(ChatMessage.timestamp.asc()).all()
    return jsonify([m.to_dict() for m in msgs])


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


# ---------------------- INITIALIZATION (FIXED) ----------------------
# 🚨 THIS SECTION IS CRITICAL FOR RENDER 🚨
# We run this OUTSIDE of "if __name__ == '__main__'"
# because Render/Gunicorn does NOT run the main block.
# This ensures tables are created when Gunicorn imports the app.
with app.app_context():
    try:
        seed_db() # This calls db.create_all()
        print("✅ Database initialized and seeded successfully!")
    except Exception as e:
        print(f"⚠️ Error during database initialization: {e}")

# ---------------------- Local Development ----------------------
if __name__ == '__main__':
    # This only runs if you type 'python app.py' locally
    app.run(host='0.0.0.0', port=PORT)
