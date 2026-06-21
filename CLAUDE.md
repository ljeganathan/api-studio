# CLAUDE.md — API Studio (Postman-like API Client)

## Project Overview

**API Studio** is a full-stack web application for testing and managing HTTP APIs — similar to Postman. It features a tree-based sidebar for organizing collections, folders, and requests; drag-and-drop; right-click context menus; user authentication; an admin dashboard; and a leaderboard for usage trends.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, TailwindCSS, shadcn/ui |
| State Management | Zustand |
| Drag & Drop | @dnd-kit/core |
| Right-click Menus | React Context Menu (radix-ui) |
| Backend | FastAPI (Python 3.11+) |
| Database | PostgreSQL 15 |
| Auth | JWT (python-jose) + bcrypt |
| Containerization | Docker + Docker Compose |
| HTTP Client (FE) | Axios |
| API Docs | FastAPI auto Swagger UI |

---

## Project Structure

```
api-studio/
├── docker-compose.yml
├── CLAUDE.md
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── store/                  # Zustand stores
│       │   ├── authStore.js
│       │   ├── collectionStore.js
│       │   └── requestStore.js
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppLayout.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   └── TopBar.jsx
│       │   ├── sidebar/
│       │   │   ├── CollectionTree.jsx
│       │   │   ├── TreeNode.jsx
│       │   │   ├── ContextMenu.jsx
│       │   │   └── DragDropTree.jsx
│       │   ├── request/
│       │   │   ├── RequestPanel.jsx
│       │   │   ├── MethodSelector.jsx
│       │   │   ├── UrlBar.jsx
│       │   │   ├── TabsPanel.jsx
│       │   │   ├── HeadersTab.jsx
│       │   │   ├── BodyTab.jsx
│       │   │   ├── ParamsTab.jsx
│       │   │   └── AuthTab.jsx
│       │   ├── response/
│       │   │   ├── ResponsePanel.jsx
│       │   │   ├── ResponseBody.jsx
│       │   │   └── ResponseMeta.jsx
│       │   ├── auth/
│       │   │   ├── LoginPage.jsx
│       │   │   └── RegisterPage.jsx
│       │   ├── dashboard/
│       │   │   ├── AdminDashboard.jsx
│       │   │   ├── LeaderDashboard.jsx
│       │   │   └── UserTable.jsx
│       │   ├── history/
│       │   │   ├── HistoryPanel.jsx        # Slide-in panel listing past requests
│       │   │   ├── HistoryItem.jsx         # Single history row with replay button
│       │   │   └── HistoryFilter.jsx       # Filter by method / date / URL search
│       │   └── collection/
│       │       ├── ImportModal.jsx         # Drag-drop or paste JSON to import
│       │       └── ExportModal.jsx         # Preview + download exported JSON
│       ├── hooks/
│       │   ├── useAuth.js
│       │   ├── useRequest.js
│       │   └── useHistory.js               # Fetch & replay history entries
│       └── api/
│           └── client.js
└── backend/
    ├── Dockerfile
    ├── requirements.txt
    └── app/
        ├── main.py
        ├── database.py
        ├── models/
        │   ├── user.py
        │   ├── collection.py
        │   ├── folder.py
        │   ├── request.py
        │   └── request_log.py              # Extended: stores full request snapshot
        ├── schemas/
        │   ├── user.py
        │   ├── collection.py
        │   ├── folder.py
        │   ├── request.py
        │   └── history.py                  # Schema for history list & replay
        ├── routers/
        │   ├── auth.py
        │   ├── collections.py
        │   ├── folders.py
        │   ├── requests.py
        │   ├── proxy.py
        │   ├── admin.py
        │   ├── leaderboard.py
        │   ├── history.py                  # GET /history, GET /history/{id}/replay
        │   └── importexport.py             # POST /collections/import, GET /collections/{id}/export
        └── core/
            ├── config.py
            ├── security.py
            ├── dependencies.py
            └── postman_converter.py        # Pure functions: parse & emit Postman v2.1 JSON
```

---

## Step-by-Step Build Guide

---

### STEP 1 — Project Scaffold

```bash
mkdir api-studio && cd api-studio

# Frontend
npm create vite@latest frontend -- --template react
cd frontend
npm install

# Backend
cd ../
mkdir -p backend/app/{models,schemas,routers,core}
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-jose[cryptography] passlib[bcrypt] httpx python-dotenv alembic
pip freeze > requirements.txt
```

---

### STEP 2 — Docker Compose

Create `docker-compose.yml` in the root:

```yaml
version: "3.9"

services:
  db:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: apistudio
      POSTGRES_PASSWORD: apistudio
      POSTGRES_DB: apistudio
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    restart: always
    environment:
      DATABASE_URL: postgresql://apistudio:apistudio@db:5432/apistudio
      SECRET_KEY: your-secret-key-change-in-production
      ALGORITHM: HS256
      ACCESS_TOKEN_EXPIRE_MINUTES: 1440
    ports:
      - "8000:8000"
    depends_on:
      - db

  frontend:
    build: ./frontend
    restart: always
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  pgdata:
```

---

### STEP 3 — Backend: Database Models

**`backend/app/database.py`**
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://apistudio:apistudio@localhost:5432/apistudio")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**`backend/app/models/user.py`**
```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
```

**`backend/app/models/collection.py`**
```python
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class Collection(Base):
    __tablename__ = "collections"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, default="")
    owner_id = Column(Integer, ForeignKey("users.id"))
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    folders = relationship("Folder", back_populates="collection", cascade="all, delete")
    requests = relationship("Request", back_populates="collection", cascade="all, delete")

class Folder(Base):
    __tablename__ = "folders"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    collection_id = Column(Integer, ForeignKey("collections.id"))
    parent_folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    collection = relationship("Collection", back_populates="folders")
    requests = relationship("Request", back_populates="folder", cascade="all, delete")
```

**`backend/app/models/request.py`**
```python
from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class Request(Base):
    __tablename__ = "requests"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    method = Column(String, default="GET")
    url = Column(Text, default="")
    headers = Column(JSON, default=[])
    params = Column(JSON, default=[])
    body_type = Column(String, default="none")  # none | raw | form-data | x-www-form-urlencoded
    body_content = Column(Text, default="")
    auth_type = Column(String, default="none")
    auth_data = Column(JSON, default={})
    collection_id = Column(Integer, ForeignKey("collections.id"), nullable=True)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    collection = relationship("Collection", back_populates="requests")
    folder = relationship("Folder", back_populates="requests")

class RequestLog(Base):
    __tablename__ = "request_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    request_id = Column(Integer, ForeignKey("requests.id"), nullable=True)
    method = Column(String)
    url = Column(Text)
    status_code = Column(Integer)
    response_time_ms = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
```

---

### STEP 4 — Backend: Core Auth & Config

**`backend/app/core/config.py`**
```python
import os

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))
```

**`backend/app/core/security.py`**
```python
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)
def hash_password(password): return pwd_context.hash(password)

def create_access_token(data: dict):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({**data, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
```

**`backend/app/core/dependencies.py`**
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.core.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.id == int(payload.get("sub"))).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_admin_user(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
```

---

### STEP 5 — Backend: Routers

**`backend/app/routers/auth.py`**
```python
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.core.security import verify_password, hash_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register")
def register(email: str, username: str, password: str, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(400, "Email already registered")
    user = User(email=email, username=username, hashed_password=hash_password(password))
    db.add(user); db.commit(); db.refresh(user)
    return {"message": "User created", "id": user.id}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token({"sub": str(user.id), "is_admin": user.is_admin})
    return {"access_token": token, "token_type": "bearer", "username": user.username, "is_admin": user.is_admin}
```

**`backend/app/routers/proxy.py`** — HTTP proxy to forward API calls
```python
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
import httpx, time
from app.database import get_db
from app.models.request import RequestLog
from app.models.user import User
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/proxy", tags=["proxy"])

@router.post("/send")
async def send_request(payload: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    method = payload.get("method", "GET")
    url = payload.get("url", "")
    headers = {h["key"]: h["value"] for h in payload.get("headers", []) if h.get("enabled", True)}
    params = {p["key"]: p["value"] for p in payload.get("params", []) if p.get("enabled", True)}
    body = payload.get("body", None)
    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(method, url, headers=headers, params=params, content=body)
        elapsed = int((time.time() - start) * 1000)
        log = RequestLog(user_id=user.id, method=method, url=url, status_code=response.status_code, response_time_ms=elapsed)
        db.add(log); db.commit()
        return {
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "body": response.text,
            "time_ms": elapsed,
            "size_bytes": len(response.content)
        }
    except Exception as e:
        return {"error": str(e)}
```

**`backend/app/routers/admin.py`**
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.core.dependencies import get_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users")
def get_users(db: Session = Depends(get_db), _=Depends(get_admin_user)):
    return db.query(User).all()

@router.patch("/users/{user_id}/toggle")
def toggle_user(user_id: int, db: Session = Depends(get_db), _=Depends(get_admin_user)):
    user = db.query(User).filter(User.id == user_id).first()
    user.is_active = not user.is_active
    db.commit()
    return {"active": user.is_active}

@router.patch("/users/{user_id}/make-admin")
def make_admin(user_id: int, db: Session = Depends(get_db), _=Depends(get_admin_user)):
    user = db.query(User).filter(User.id == user_id).first()
    user.is_admin = True
    db.commit()
    return {"message": "User promoted to admin"}
```

**`backend/app/routers/leaderboard.py`**
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.request import RequestLog
from app.models.user import User
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

@router.get("/top-users")
def top_users(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(User.username, func.count(RequestLog.id).label("count")) \
             .join(RequestLog, User.id == RequestLog.user_id) \
             .group_by(User.username).order_by(func.count(RequestLog.id).desc()).limit(10).all()

@router.get("/method-stats")
def method_stats(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(RequestLog.method, func.count(RequestLog.id).label("count")) \
             .group_by(RequestLog.method).all()

@router.get("/daily-trends")
def daily_trends(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(func.date(RequestLog.created_at).label("date"), func.count(RequestLog.id).label("count")) \
             .group_by(func.date(RequestLog.created_at)).order_by(func.date(RequestLog.created_at).desc()).limit(30).all()
```

**`backend/app/main.py`**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, collections, folders, requests, proxy, admin, leaderboard

Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Studio", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router)
app.include_router(collections.router)
app.include_router(folders.router)
app.include_router(requests.router)
app.include_router(proxy.router)
app.include_router(admin.router)
app.include_router(leaderboard.router)

@app.get("/health")
def health(): return {"status": "ok"}
```

---

### STEP 6 — Frontend: Install Dependencies

```bash
cd frontend
npm install axios zustand @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities \
  @radix-ui/react-context-menu @radix-ui/react-tabs @radix-ui/react-select \
  @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  lucide-react react-router-dom react-hot-toast \
  @codemirror/react @codemirror/lang-json \
  recharts tailwindcss @tailwindcss/vite
```

---

### STEP 7 — Frontend: Zustand Stores

**`src/store/authStore.js`**
```javascript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(persist(
  (set) => ({
    token: null,
    user: null,
    setAuth: (token, user) => set({ token, user }),
    logout: () => set({ token: null, user: null }),
  }),
  { name: 'auth-storage' }
))
```

**`src/store/collectionStore.js`**
```javascript
import { create } from 'zustand'

export const useCollectionStore = create((set) => ({
  collections: [],
  activeRequestId: null,
  setCollections: (collections) => set({ collections }),
  setActiveRequest: (id) => set({ activeRequestId: id }),
  addCollection: (col) => set(s => ({ collections: [...s.collections, col] })),
  removeCollection: (id) => set(s => ({ collections: s.collections.filter(c => c.id !== id) })),
}))
```

---

### STEP 8 — Frontend: Key Components

#### `src/components/sidebar/CollectionTree.jsx`
Renders the tree using `@dnd-kit` for drag-and-drop and `@radix-ui/react-context-menu` for right-click menus.

```jsx
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from '@radix-ui/react-context-menu'
import TreeNode from './TreeNode'

export default function CollectionTree({ collections, onSelect, onRename, onDelete, onAdd, onDragEnd }) {
  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={collections.map(c => c.id)} strategy={verticalListSortingStrategy}>
        {collections.map(col => (
          <ContextMenu key={col.id}>
            <ContextMenuTrigger>
              <TreeNode node={col} onSelect={onSelect} />
            </ContextMenuTrigger>
            <ContextMenuContent className="bg-gray-800 text-white rounded shadow-lg p-1 min-w-40">
              <ContextMenuItem onSelect={() => onAdd('folder', col.id)} className="px-3 py-1 hover:bg-gray-700 cursor-pointer rounded text-sm">Add Folder</ContextMenuItem>
              <ContextMenuItem onSelect={() => onAdd('request', col.id)} className="px-3 py-1 hover:bg-gray-700 cursor-pointer rounded text-sm">Add Request</ContextMenuItem>
              <ContextMenuItem onSelect={() => onRename(col)} className="px-3 py-1 hover:bg-gray-700 cursor-pointer rounded text-sm">Rename</ContextMenuItem>
              <ContextMenuItem onSelect={() => onDelete(col.id)} className="px-3 py-1 hover:bg-red-700 cursor-pointer rounded text-sm text-red-400">Delete</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </SortableContext>
    </DndContext>
  )
}
```

#### `src/components/request/RequestPanel.jsx`
The main panel with method selector, URL bar, and tabbed body/headers/params/auth.

```jsx
import { useState } from 'react'
import MethodSelector from './MethodSelector'
import UrlBar from './UrlBar'
import TabsPanel from './TabsPanel'
import ResponsePanel from '../response/ResponsePanel'
import { useAuthStore } from '../../store/authStore'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function RequestPanel({ request }) {
  const { token } = useAuthStore()
  const [method, setMethod] = useState(request?.method || 'GET')
  const [url, setUrl] = useState(request?.url || '')
  const [headers, setHeaders] = useState(request?.headers || [])
  const [params, setParams] = useState(request?.params || [])
  const [body, setBody] = useState(request?.body_content || '')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)

  const sendRequest = async () => {
    setLoading(true)
    try {
      const { data } = await axios.post('/api/proxy/send', { method, url, headers, params, body },
        { headers: { Authorization: `Bearer ${token}` } })
      setResponse(data)
    } catch (e) {
      toast.error('Request failed')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="flex items-center gap-2 p-3 border-b border-gray-700">
        <MethodSelector method={method} onChange={setMethod} />
        <UrlBar url={url} onChange={setUrl} onSend={sendRequest} loading={loading} />
      </div>
      <TabsPanel headers={headers} setHeaders={setHeaders} params={params} setParams={setParams} body={body} setBody={setBody} />
      <ResponsePanel response={response} loading={loading} />
    </div>
  )
}
```

#### `src/components/response/ResponsePanel.jsx`
Shows status code, time, size and response body with syntax highlighting.

```jsx
import { useState } from 'react'

const STATUS_COLORS = { 2: 'text-green-400', 3: 'text-yellow-400', 4: 'text-orange-400', 5: 'text-red-400' }

export default function ResponsePanel({ response, loading }) {
  const [activeTab, setActiveTab] = useState('body')
  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-400 animate-pulse">Sending request...</div>
  if (!response) return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-3">
      <p className="text-lg">Send a request to see the response</p>
    </div>
  )

  const statusColor = STATUS_COLORS[Math.floor(response.status_code / 100)] || 'text-gray-400'
  let body = response.body
  try { body = JSON.stringify(JSON.parse(response.body), null, 2) } catch {}

  return (
    <div className="flex-1 flex flex-col border-t border-gray-700 min-h-0">
      <div className="flex items-center gap-4 px-4 py-2 bg-gray-800 text-sm">
        <span className={`font-bold ${statusColor}`}>Status: {response.status_code}</span>
        <span className="text-gray-400">Time: {response.time_ms}ms</span>
        <span className="text-gray-400">Size: {(response.size_bytes / 1024).toFixed(2)} KB</span>
        <div className="ml-auto flex gap-2">
          {['body', 'headers'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-3 py-1 rounded text-xs ${activeTab === t ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 font-mono text-sm text-green-300 bg-gray-950">
        {activeTab === 'body' ? <pre>{body}</pre> :
          <table className="text-xs w-full">
            <tbody>{Object.entries(response.headers || {}).map(([k, v]) => (
              <tr key={k} className="border-b border-gray-800">
                <td className="py-1 pr-4 text-orange-300 font-semibold">{k}</td>
                <td className="py-1 text-gray-300 break-all">{v}</td>
              </tr>
            ))}</tbody>
          </table>
        }
      </div>
    </div>
  )
}
```

---

### STEP 9 — Frontend: App Layout

**`src/App.jsx`**
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import LoginPage from './components/auth/LoginPage'
import AppLayout from './components/layout/AppLayout'
import AdminDashboard from './components/dashboard/AdminDashboard'
import LeaderDashboard from './components/dashboard/LeaderDashboard'

function PrivateRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
        <Route path="/leaderboard" element={<PrivateRoute><LeaderDashboard /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
```

---

### STEP 10 — Frontend: Sidebar Layout

**`src/components/layout/AppLayout.jsx`**
```jsx
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import RequestPanel from '../request/RequestPanel'
import TopBar from './TopBar'
import { useCollectionStore } from '../../store/collectionStore'
import { useAuthStore } from '../../store/authStore'
import axios from 'axios'

export default function AppLayout() {
  const { token } = useAuthStore()
  const { setCollections, activeRequestId } = useCollectionStore()
  const [activeRequest, setActiveRequest] = useState(null)

  useEffect(() => {
    axios.get('/api/collections', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setCollections(r.data))
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar onSelectRequest={setActiveRequest} />
        <main className="flex-1 flex flex-col min-h-0">
          {activeRequest
            ? <RequestPanel key={activeRequest.id} request={activeRequest} />
            : <div className="flex-1 flex items-center justify-center text-gray-500 text-xl">Select a request or create a new one</div>
          }
        </main>
      </div>
    </div>
  )
}
```

---

### STEP 11 — Admin & Leaderboard Dashboards

**`src/components/dashboard/AdminDashboard.jsx`** — table of all users with activate/deactivate/promote actions.

**`src/components/dashboard/LeaderDashboard.jsx`** — uses `recharts` to show:
- Bar chart: requests per user (top 10)
- Pie chart: HTTP method distribution (GET/POST/PUT/DELETE)
- Line chart: daily request trends (last 30 days)

```jsx
import { useEffect, useState } from 'react'
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'

const COLORS = ['#f97316','#3b82f6','#22c55e','#a855f7','#ef4444']

export default function LeaderDashboard() {
  const { token } = useAuthStore()
  const [topUsers, setTopUsers] = useState([])
  const [methodStats, setMethodStats] = useState([])
  const [trends, setTrends] = useState([])
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    axios.get('/api/leaderboard/top-users', { headers }).then(r => setTopUsers(r.data))
    axios.get('/api/leaderboard/method-stats', { headers }).then(r => setMethodStats(r.data))
    axios.get('/api/leaderboard/daily-trends', { headers }).then(r => setTrends(r.data.reverse()))
  }, [])

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-8 text-orange-400">Usage Leaderboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-4">Top Users</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topUsers}>
              <XAxis dataKey="username" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
              <Bar dataKey="count" fill="#f97316" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-4">Methods Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={methodStats} dataKey="count" nameKey="method" cx="50%" cy="50%" outerRadius={80} label>
                {methodStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Daily Trends (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trends}>
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
              <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
```

---

### STEP 12 — Dockerfiles

**`backend/Dockerfile`**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

**`frontend/Dockerfile`**
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**`frontend/nginx.conf`** — proxy API calls to backend
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

### STEP 13 — Deploy

```bash
# From the root api-studio/ directory:
docker-compose up --build -d

# Verify containers
docker-compose ps

# View logs
docker-compose logs -f backend

# Run DB migrations (first time)
docker-compose exec backend alembic upgrade head

# Create first admin user via API
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","username":"admin","password":"admin123"}'

# Then promote in DB or add is_admin=True logic to first user
```

Access:
- **App UI**: http://localhost:3000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **Admin Panel**: http://localhost:3000/admin
- **Leaderboard**: http://localhost:3000/leaderboard

---

---

### STEP 14 — Import / Export Postman Collections

#### 14a — Backend: Postman Converter Utility

**`backend/app/core/postman_converter.py`**

This module converts between the internal DB schema and the Postman Collection v2.1 JSON format.

```python
"""
Postman Collection v2.1 ↔ API Studio converter.
Spec: https://schema.postman.com/collection/json/v2.1.0/draft-04/collection.json
"""
import uuid
from typing import Optional

# ── Postman → Internal ──────────────────────────────────────────────────────

def _pm_headers(header_list: list) -> list:
    """Convert Postman header array to internal [{key, value, enabled}] format."""
    result = []
    for h in header_list or []:
        if isinstance(h, dict) and h.get("key"):
            result.append({
                "key": h.get("key", ""),
                "value": h.get("value", ""),
                "enabled": not h.get("disabled", False)
            })
    return result

def _pm_params(url_obj) -> list:
    """Extract query params from Postman URL object."""
    if not isinstance(url_obj, dict):
        return []
    return [
        {"key": p.get("key", ""), "value": p.get("value", ""), "enabled": not p.get("disabled", False)}
        for p in url_obj.get("query", [])
    ]

def _pm_url(url_obj) -> str:
    """Resolve Postman URL object or string to a plain URL string."""
    if isinstance(url_obj, str):
        return url_obj
    if isinstance(url_obj, dict):
        raw = url_obj.get("raw", "")
        if raw:
            return raw
        host = ".".join(url_obj.get("host", []))
        path = "/".join(url_obj.get("path", []))
        protocol = url_obj.get("protocol", "https")
        return f"{protocol}://{host}/{path}"
    return ""

def _pm_body(body_obj: Optional[dict]) -> tuple[str, str]:
    """Return (body_type, body_content) from a Postman body object."""
    if not body_obj:
        return "none", ""
    mode = body_obj.get("mode", "none")
    if mode == "raw":
        return "raw", body_obj.get("raw", "")
    if mode == "urlencoded":
        pairs = "&".join(f"{p['key']}={p.get('value','')}" for p in body_obj.get("urlencoded", []))
        return "x-www-form-urlencoded", pairs
    if mode == "formdata":
        pairs = "&".join(f"{p['key']}={p.get('value','')}" for p in body_obj.get("formdata", []))
        return "form-data", pairs
    return "none", ""

def _parse_item(item: dict, collection_id: int, folder_id: Optional[int] = None) -> list[dict]:
    """
    Recursively parse a Postman item.
    Returns a flat list of dicts ready to insert as Request rows.
    """
    rows = []
    if "item" in item:
        # This is a folder — recurse; folder creation is handled by caller
        for child in item["item"]:
            rows.extend(_parse_item(child, collection_id, folder_id))
    else:
        req = item.get("request", {})
        method = req.get("method", "GET").upper() if isinstance(req, dict) else "GET"
        url_obj = req.get("url", "") if isinstance(req, dict) else ""
        body_type, body_content = _pm_body(req.get("body") if isinstance(req, dict) else None)
        rows.append({
            "name": item.get("name", "Untitled"),
            "method": method,
            "url": _pm_url(url_obj),
            "headers": _pm_headers(req.get("header", []) if isinstance(req, dict) else []),
            "params": _pm_params(url_obj),
            "body_type": body_type,
            "body_content": body_content,
            "collection_id": collection_id,
            "folder_id": folder_id,
        })
    return rows

def postman_to_internal(pm_json: dict, owner_id: int) -> dict:
    """
    Parse a full Postman v2.1 collection JSON.
    Returns:
      {
        "collection": { name, description, owner_id },
        "folders":    [ { name, parent_name } ],
        "requests":   [ { ...request fields, folder_name } ]
      }
    """
    info = pm_json.get("info", {})
    col_name = info.get("name", "Imported Collection")
    col_desc = info.get("description", "")

    folders = []
    requests = []

    for item in pm_json.get("item", []):
        if "item" in item:
            folder_name = item.get("name", "Folder")
            folders.append({"name": folder_name})
            for child in item["item"]:
                req = child.get("request", {})
                method = req.get("method", "GET").upper() if isinstance(req, dict) else "GET"
                url_obj = req.get("url", "") if isinstance(req, dict) else ""
                body_type, body_content = _pm_body(req.get("body") if isinstance(req, dict) else None)
                requests.append({
                    "name": child.get("name", "Untitled"),
                    "method": method,
                    "url": _pm_url(url_obj),
                    "headers": _pm_headers(req.get("header", []) if isinstance(req, dict) else []),
                    "params": _pm_params(url_obj),
                    "body_type": body_type,
                    "body_content": body_content,
                    "folder_name": folder_name,
                })
        else:
            req = item.get("request", {})
            method = req.get("method", "GET").upper() if isinstance(req, dict) else "GET"
            url_obj = req.get("url", "") if isinstance(req, dict) else ""
            body_type, body_content = _pm_body(req.get("body") if isinstance(req, dict) else None)
            requests.append({
                "name": item.get("name", "Untitled"),
                "method": method,
                "url": _pm_url(url_obj),
                "headers": _pm_headers(req.get("header", []) if isinstance(req, dict) else []),
                "params": _pm_params(url_obj),
                "body_type": body_type,
                "body_content": body_content,
                "folder_name": None,
            })

    return {
        "collection": {"name": col_name, "description": col_desc, "owner_id": owner_id},
        "folders": folders,
        "requests": requests,
    }


# ── Internal → Postman ──────────────────────────────────────────────────────

def _to_pm_header(headers: list) -> list:
    return [
        {"key": h["key"], "value": h["value"], "disabled": not h.get("enabled", True)}
        for h in (headers or [])
    ]

def _to_pm_url(url: str, params: list) -> dict:
    query = [{"key": p["key"], "value": p["value"], "disabled": not p.get("enabled", True)} for p in (params or [])]
    return {"raw": url, "query": query}

def _to_pm_body(body_type: str, body_content: str) -> Optional[dict]:
    if body_type == "raw":
        return {"mode": "raw", "raw": body_content, "options": {"raw": {"language": "json"}}}
    if body_type == "x-www-form-urlencoded":
        pairs = [{"key": k, "value": v} for p in body_content.split("&") for k, _, v in [p.partition("=")]]
        return {"mode": "urlencoded", "urlencoded": pairs}
    if body_type == "form-data":
        pairs = [{"key": k, "value": v, "type": "text"} for p in body_content.split("&") for k, _, v in [p.partition("=")]]
        return {"mode": "formdata", "formdata": pairs}
    return None

def internal_to_postman(collection, folders, requests) -> dict:
    """
    Build a Postman v2.1 collection JSON from DB objects.
    `folders`  — list of Folder ORM objects
    `requests` — list of Request ORM objects
    """
    folder_map = {}  # folder_id → list of pm_items

    for req in requests:
        pm_item = {
            "name": req.name,
            "request": {
                "method": req.method,
                "header": _to_pm_header(req.headers or []),
                "url": _to_pm_url(req.url, req.params or []),
            }
        }
        body = _to_pm_body(req.body_type or "none", req.body_content or "")
        if body:
            pm_item["request"]["body"] = body

        if req.folder_id:
            folder_map.setdefault(req.folder_id, []).append(pm_item)
        else:
            folder_map.setdefault(None, []).append(pm_item)

    items = []
    for folder in folders:
        items.append({
            "name": folder.name,
            "item": folder_map.get(folder.id, [])
        })
    items.extend(folder_map.get(None, []))

    return {
        "info": {
            "_postman_id": str(uuid.uuid4()),
            "name": collection.name,
            "description": collection.description or "",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "item": items
    }
```

#### 14b — Backend: Import / Export Router

**`backend/app/routers/importexport.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import json

from app.database import get_db
from app.models.collection import Collection, Folder
from app.models.request import Request
from app.core.dependencies import get_current_user
from app.core.postman_converter import postman_to_internal, internal_to_postman
from app.models.user import User

router = APIRouter(prefix="/collections", tags=["import-export"])


@router.post("/import")
async def import_collection(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Accept a Postman v2.1 JSON file upload and persist it as a new collection.
    Returns the created collection id and counts.
    """
    raw = await file.read()
    try:
        pm_json = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON file")

    # Validate it looks like a Postman collection
    if "info" not in pm_json or "item" not in pm_json:
        raise HTTPException(400, "File does not look like a Postman v2.1 collection")

    parsed = postman_to_internal(pm_json, user.id)

    # 1. Create collection
    col = Collection(**parsed["collection"])
    db.add(col); db.flush()  # get col.id before inserting children

    # 2. Create folders and build name→id map
    folder_id_map = {}
    for f in parsed["folders"]:
        folder = Folder(name=f["name"], collection_id=col.id)
        db.add(folder); db.flush()
        folder_id_map[f["name"]] = folder.id

    # 3. Create requests
    request_count = 0
    for r in parsed["requests"]:
        folder_name = r.pop("folder_name", None)
        folder_id = folder_id_map.get(folder_name) if folder_name else None
        req = Request(**r, collection_id=col.id, folder_id=folder_id)
        db.add(req)
        request_count += 1

    db.commit()
    return {
        "message": "Import successful",
        "collection_id": col.id,
        "collection_name": col.name,
        "folders_created": len(parsed["folders"]),
        "requests_created": request_count,
    }


@router.post("/import/json")
async def import_collection_json(
    payload: dict,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Accept a raw Postman JSON payload (for paste-import in the UI).
    Same logic as file import but reads from request body.
    """
    if "info" not in payload or "item" not in payload:
        raise HTTPException(400, "Invalid Postman collection JSON")

    parsed = postman_to_internal(payload, user.id)
    col = Collection(**parsed["collection"])
    db.add(col); db.flush()

    folder_id_map = {}
    for f in parsed["folders"]:
        folder = Folder(name=f["name"], collection_id=col.id)
        db.add(folder); db.flush()
        folder_id_map[f["name"]] = folder.id

    request_count = 0
    for r in parsed["requests"]:
        folder_name = r.pop("folder_name", None)
        folder_id = folder_id_map.get(folder_name) if folder_name else None
        db.add(Request(**r, collection_id=col.id, folder_id=folder_id))
        request_count += 1

    db.commit()
    return {"collection_id": col.id, "requests_created": request_count}


@router.get("/{collection_id}/export")
def export_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Export a collection as a Postman v2.1 JSON response.
    The browser will receive it as a downloadable file.
    """
    col = db.query(Collection).filter(
        Collection.id == collection_id,
        Collection.owner_id == user.id
    ).first()
    if not col:
        raise HTTPException(404, "Collection not found")

    folders = db.query(Folder).filter(Folder.collection_id == collection_id).all()
    requests = db.query(Request).filter(Request.collection_id == collection_id).all()

    pm_json = internal_to_postman(col, folders, requests)

    filename = col.name.replace(" ", "_") + ".postman_collection.json"
    return JSONResponse(
        content=pm_json,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
```

Register the router in `main.py`:
```python
from app.routers import importexport
app.include_router(importexport.router)
```

#### 14c — Frontend: ImportModal Component

**`src/components/collection/ImportModal.jsx`**

```jsx
import { useState, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { useCollectionStore } from '../../store/collectionStore'
import { Upload, FileJson, X, CheckCircle } from 'lucide-react'

export default function ImportModal({ onClose, onImported }) {
  const { token } = useAuthStore()
  const [tab, setTab] = useState('file')       // 'file' | 'paste'
  const [dragging, setDragging] = useState(false)
  const [jsonText, setJsonText] = useState('')
  const [preview, setPreview] = useState(null)  // parsed JSON for preview
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef()

  const parsePreview = (json) => {
    try {
      const parsed = JSON.parse(json)
      if (!parsed.info || !parsed.item) throw new Error()
      setPreview({
        name: parsed.info.name,
        requests: parsed.item.reduce((acc, i) => acc + (i.item ? i.item.length : 1), 0),
        folders: parsed.item.filter(i => i.item).length,
        raw: parsed
      })
    } catch {
      toast.error('Not a valid Postman v2.1 JSON')
      setPreview(null)
    }
  }

  const handleFile = async (file) => {
    const text = await file.text()
    setJsonText(text)
    parsePreview(text)
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const doImport = async () => {
    if (!preview) return
    setLoading(true)
    try {
      const { data } = await axios.post('/api/collections/import/json', preview.raw, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      setResult(data)
      onImported()
      toast.success(`Imported "${data.collection_name}" with ${data.requests_created} requests`)
    } catch {
      toast.error('Import failed')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FileJson className="text-orange-400" size={22} /> Import Postman Collection
        </h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {['file', 'paste'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${tab === t ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              {t === 'file' ? 'Upload File' : 'Paste JSON'}
            </button>
          ))}
        </div>

        {tab === 'file' ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors
              ${dragging ? 'border-orange-400 bg-orange-400/10' : 'border-gray-600 hover:border-gray-400'}`}>
            <Upload size={36} className="text-gray-400" />
            <p className="text-gray-300 text-sm">Drop your <span className="text-orange-400 font-semibold">.json</span> file here or click to browse</p>
            <p className="text-gray-500 text-xs">Postman Collection v2.1 format</p>
            <input ref={fileRef} type="file" accept=".json" className="hidden"
              onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
          </div>
        ) : (
          <textarea
            className="w-full h-40 bg-gray-900 text-green-300 font-mono text-xs rounded-xl p-3 border border-gray-600 focus:border-orange-400 outline-none resize-none"
            placeholder='Paste Postman v2.1 JSON here...'
            value={jsonText}
            onChange={e => { setJsonText(e.target.value); if (e.target.value.trim()) parsePreview(e.target.value) }}
          />
        )}

        {/* Preview card */}
        {preview && !result && (
          <div className="mt-4 bg-gray-700 rounded-xl p-4 text-sm">
            <p className="text-white font-semibold text-base mb-1">{preview.name}</p>
            <div className="flex gap-6 text-gray-300">
              <span>📁 {preview.folders} folders</span>
              <span>📄 {preview.requests} requests</span>
            </div>
          </div>
        )}

        {/* Success */}
        {result && (
          <div className="mt-4 bg-green-900/40 border border-green-500 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="text-green-400" size={20} />
            <div>
              <p className="text-green-300 font-semibold">Import successful!</p>
              <p className="text-green-400 text-xs">{result.requests_created} requests in "{result.collection_name}"</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm">Cancel</button>
          {!result && (
            <button onClick={doImport} disabled={!preview || loading}
              className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm disabled:opacity-40">
              {loading ? 'Importing...' : 'Import Collection'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

#### 14d — Frontend: ExportModal Component

**`src/components/collection/ExportModal.jsx`**

```jsx
import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { Download, X, FileJson } from 'lucide-react'

export default function ExportModal({ collection, onClose }) {
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)

  const fetchPreview = async () => {
    const { data } = await axios.get(`/api/collections/${collection.id}/export`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setPreview(JSON.stringify(data, null, 2))
  }

  const download = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`/api/collections/${collection.id}/export`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${collection.name.replace(/ /g, '_')}.postman_collection.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Collection exported!')
      onClose()
    } catch {
      toast.error('Export failed')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <FileJson className="text-orange-400" size={22} /> Export as Postman Collection
        </h2>
        <p className="text-gray-400 text-sm mb-4">"{collection.name}" will be exported in Postman v2.1 format</p>

        {!preview ? (
          <button onClick={fetchPreview} className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 mb-4">
            Preview JSON
          </button>
        ) : (
          <pre className="bg-gray-950 text-green-300 text-xs font-mono rounded-xl p-4 max-h-72 overflow-auto mb-4">
            {preview}
          </pre>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm">Cancel</button>
          <button onClick={download} disabled={loading}
            className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40">
            <Download size={16} /> {loading ? 'Exporting...' : 'Download JSON'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

Wire up in the sidebar's right-click context menu for each collection node:
```jsx
// In CollectionTree.jsx — add to the ContextMenuContent for collections:
<ContextMenuItem onSelect={() => setImportOpen(true)}>Import Collection</ContextMenuItem>
<ContextMenuItem onSelect={() => setExportTarget(col)}>Export as Postman JSON</ContextMenuItem>

// Render modals at the bottom of CollectionTree:
{importOpen && <ImportModal onClose={() => setImportOpen(false)} onImported={refreshCollections} />}
{exportTarget && <ExportModal collection={exportTarget} onClose={() => setExportTarget(null)} />}
```

---

### STEP 15 — History Panel with Replay

#### 15a — Backend: Extend RequestLog Model

Update **`backend/app/models/request.py`** — extend `RequestLog` to store the full request snapshot so replays don't need the original Request row:

```python
class RequestLog(Base):
    __tablename__ = "request_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    request_id = Column(Integer, ForeignKey("requests.id"), nullable=True)

    # Snapshot of what was actually sent (for replay)
    method = Column(String, nullable=False)
    url = Column(Text, nullable=False)
    headers = Column(JSON, default=[])
    params = Column(JSON, default=[])
    body_type = Column(String, default="none")
    body_content = Column(Text, default="")

    # Response metadata
    status_code = Column(Integer, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    response_size_bytes = Column(Integer, nullable=True)
    response_body_preview = Column(Text, default="")   # first 500 chars for display

    created_at = Column(DateTime, server_default=func.now())
```

Also update **`backend/app/routers/proxy.py`** to save the full snapshot:
```python
log = RequestLog(
    user_id=user.id,
    request_id=payload.get("request_id"),
    method=method,
    url=url,
    headers=payload.get("headers", []),
    params=payload.get("params", []),
    body_type=payload.get("body_type", "none"),
    body_content=payload.get("body", ""),
    status_code=response.status_code,
    response_time_ms=elapsed,
    response_size_bytes=len(response.content),
    response_body_preview=response.text[:500]
)
```

#### 15b — Backend: History Router

**`backend/app/routers/history.py`**

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.request import RequestLog
from app.models.user import User
from app.core.dependencies import get_current_user
import httpx, time

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/")
def get_history(
    limit: int = Query(50, le=200),
    offset: int = 0,
    method: str = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Return paginated request history for the current user."""
    q = db.query(RequestLog).filter(RequestLog.user_id == user.id)
    if method:
        q = q.filter(RequestLog.method == method.upper())
    if search:
        q = q.filter(RequestLog.url.ilike(f"%{search}%"))
    total = q.count()
    items = q.order_by(desc(RequestLog.created_at)).offset(offset).limit(limit).all()
    return {"total": total, "items": items}


@router.delete("/")
def clear_history(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Delete all history entries for the current user."""
    db.query(RequestLog).filter(RequestLog.user_id == user.id).delete()
    db.commit()
    return {"message": "History cleared"}


@router.delete("/{log_id}")
def delete_history_item(log_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Delete a single history entry."""
    log = db.query(RequestLog).filter(RequestLog.id == log_id, RequestLog.user_id == user.id).first()
    if log:
        db.delete(log); db.commit()
    return {"message": "Deleted"}


@router.post("/{log_id}/replay")
async def replay_request(
    log_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Re-send the exact request stored in a history entry.
    Returns a fresh response and logs it as a new history entry.
    """
    log = db.query(RequestLog).filter(RequestLog.id == log_id, RequestLog.user_id == user.id).first()
    if not log:
        from fastapi import HTTPException
        raise HTTPException(404, "History entry not found")

    headers = {h["key"]: h["value"] for h in (log.headers or []) if h.get("enabled", True)}
    params = {p["key"]: p["value"] for p in (log.params or []) if p.get("enabled", True)}
    body = log.body_content or None

    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.request(log.method, log.url, headers=headers, params=params, content=body)
        elapsed = int((time.time() - start) * 1000)

        # Log the replay as a new entry
        new_log = RequestLog(
            user_id=user.id, method=log.method, url=log.url,
            headers=log.headers, params=log.params,
            body_type=log.body_type, body_content=log.body_content,
            status_code=resp.status_code, response_time_ms=elapsed,
            response_size_bytes=len(resp.content),
            response_body_preview=resp.text[:500]
        )
        db.add(new_log); db.commit()

        return {
            "status_code": resp.status_code,
            "headers": dict(resp.headers),
            "body": resp.text,
            "time_ms": elapsed,
            "size_bytes": len(resp.content)
        }
    except Exception as e:
        return {"error": str(e)}
```

Register in `main.py`:
```python
from app.routers import history
app.include_router(history.router)
```

#### 15c — Frontend: useHistory Hook

**`src/hooks/useHistory.js`**

```javascript
import { useState, useCallback } from 'react'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

export function useHistory() {
  const { token } = useAuthStore()
  const headers = { Authorization: `Bearer ${token}` }
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async ({ limit = 50, offset = 0, method = '', search = '' } = {}) => {
    setLoading(true)
    const params = { limit, offset }
    if (method) params.method = method
    if (search) params.search = search
    const { data } = await axios.get('/api/history', { headers, params })
    setItems(data.items); setTotal(data.total)
    setLoading(false)
  }, [token])

  const replay = useCallback(async (logId) => {
    const { data } = await axios.post(`/api/history/${logId}/replay`, {}, { headers })
    return data
  }, [token])

  const remove = useCallback(async (logId) => {
    await axios.delete(`/api/history/${logId}`, { headers })
    setItems(prev => prev.filter(i => i.id !== logId))
  }, [token])

  const clearAll = useCallback(async () => {
    await axios.delete('/api/history', { headers })
    setItems([]); setTotal(0)
  }, [token])

  return { items, total, loading, fetch, replay, remove, clearAll }
}
```

#### 15d — Frontend: HistoryPanel Component

**`src/components/history/HistoryPanel.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useHistory } from '../../hooks/useHistory'
import HistoryItem from './HistoryItem'
import HistoryFilter from './HistoryFilter'
import { History, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function HistoryPanel({ onReplayResponse, onClose }) {
  const { items, total, loading, fetch, replay, remove, clearAll } = useHistory()
  const [filters, setFilters] = useState({ method: '', search: '' })
  const [replayingId, setReplayingId] = useState(null)

  useEffect(() => { fetch(filters) }, [filters])

  const handleReplay = async (log) => {
    setReplayingId(log.id)
    try {
      const response = await replay(log.id)
      onReplayResponse({ request: log, response })
      toast.success(`Replayed ${log.method} — ${response.status_code}`)
    } catch {
      toast.error('Replay failed')
    }
    setReplayingId(null)
  }

  const handleClear = async () => {
    if (!confirm('Clear all history?')) return
    await clearAll()
    toast.success('History cleared')
  }

  return (
    <div className="flex flex-col h-full bg-gray-850 border-l border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2 text-white font-semibold">
          <History size={18} className="text-orange-400" />
          History
          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{total}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleClear} title="Clear all" className="text-gray-400 hover:text-red-400 transition-colors">
            <Trash2 size={16} />
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <HistoryFilter filters={filters} onChange={setFilters} />

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-700/50">
        {loading && <p className="text-center text-gray-500 py-8 text-sm animate-pulse">Loading...</p>}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
            <History size={32} />
            <p className="text-sm">No history yet</p>
          </div>
        )}
        {items.map(item => (
          <HistoryItem
            key={item.id}
            log={item}
            replaying={replayingId === item.id}
            onReplay={() => handleReplay(item)}
            onDelete={() => remove(item.id)}
          />
        ))}
      </div>
    </div>
  )
}
```

**`src/components/history/HistoryItem.jsx`**

```jsx
import { RotateCcw, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const METHOD_COLORS = {
  GET: 'text-green-400', POST: 'text-orange-400', PUT: 'text-blue-400',
  DELETE: 'text-red-400', PATCH: 'text-purple-400'
}
const STATUS_COLORS = { 2: 'text-green-400', 3: 'text-yellow-400', 4: 'text-orange-400', 5: 'text-red-400' }

export default function HistoryItem({ log, replaying, onReplay, onDelete }) {
  const statusColor = STATUS_COLORS[Math.floor((log.status_code || 0) / 100)] || 'text-gray-400'
  const timeAgo = formatDistanceToNow(new Date(log.created_at), { addSuffix: true })

  return (
    <div className="group flex items-start gap-3 px-4 py-3 hover:bg-gray-700/40 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-xs font-bold w-14 shrink-0 ${METHOD_COLORS[log.method] || 'text-gray-400'}`}>
            {log.method}
          </span>
          {log.status_code && (
            <span className={`text-xs font-semibold ${statusColor}`}>{log.status_code}</span>
          )}
          {log.response_time_ms && (
            <span className="text-xs text-gray-500">{log.response_time_ms}ms</span>
          )}
        </div>
        <p className="text-gray-300 text-xs truncate" title={log.url}>{log.url}</p>
        <p className="text-gray-600 text-xs mt-0.5">{timeAgo}</p>
      </div>

      {/* Actions — shown on hover */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-0.5">
        <button
          onClick={onReplay}
          disabled={replaying}
          title="Replay request"
          className="p-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 transition-colors disabled:opacity-40">
          <RotateCcw size={13} className={replaying ? 'animate-spin' : ''} />
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
```

**`src/components/history/HistoryFilter.jsx`**

```jsx
import { Search } from 'lucide-react'

const METHODS = ['', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH']
const METHOD_COLORS = { GET: '#22c55e', POST: '#f97316', PUT: '#3b82f6', DELETE: '#ef4444', PATCH: '#a855f7' }

export default function HistoryFilter({ filters, onChange }) {
  return (
    <div className="px-3 py-2 border-b border-gray-700 space-y-2">
      {/* Search */}
      <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-1.5">
        <Search size={13} className="text-gray-500" />
        <input
          className="bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none flex-1"
          placeholder="Search URL..."
          value={filters.search}
          onChange={e => onChange(f => ({ ...f, search: e.target.value }))}
        />
      </div>
      {/* Method filter pills */}
      <div className="flex gap-1 flex-wrap">
        {METHODS.map(m => (
          <button key={m}
            onClick={() => onChange(f => ({ ...f, method: m }))}
            style={filters.method === m && m ? { color: METHOD_COLORS[m], borderColor: METHOD_COLORS[m] } : {}}
            className={`px-2 py-0.5 rounded text-xs border transition-colors
              ${filters.method === m
                ? m ? 'border-current bg-current/10' : 'border-orange-400 text-orange-400 bg-orange-400/10'
                : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}>
            {m || 'All'}
          </button>
        ))}
      </div>
    </div>
  )
}
```

#### 15e — Wire History Panel into AppLayout

Update **`src/components/layout/AppLayout.jsx`** to toggle the history panel as a right-side drawer:

```jsx
import HistoryPanel from '../history/HistoryPanel'
import { History } from 'lucide-react'

// Inside AppLayout:
const [showHistory, setShowHistory] = useState(false)
const [replayData, setReplayData] = useState(null)

// In the TopBar area, add a History toggle button:
// <button onClick={() => setShowHistory(v => !v)}><History /></button>

// Wrap main content in a flex row:
<div className="flex flex-1 min-h-0">
  <Sidebar onSelectRequest={setActiveRequest} />
  <main className="flex-1 flex flex-col min-h-0">
    <RequestPanel request={replayData?.request || activeRequest} prefillResponse={replayData?.response} />
  </main>
  {showHistory && (
    <div className="w-80 shrink-0 flex flex-col min-h-0">
      <HistoryPanel
        onReplayResponse={(data) => { setReplayData(data); setShowHistory(false) }}
        onClose={() => setShowHistory(false)}
      />
    </div>
  )}
</div>
```

Also install `date-fns` for the relative timestamps:
```bash
cd frontend && npm install date-fns
```

---

## UI/UX Design Principles

- **Dark theme** throughout — `bg-gray-900` base, `bg-gray-800` panels, `bg-gray-700` hover
- **Accent color**: Orange (`#f97316`) for Send button, active states, method badges
- **Method badge colors**: GET=green, POST=orange, PUT=blue, DELETE=red, PATCH=purple
- **Left sidebar**: fixed 280px width, collapsible, tree with indent levels and icons
- **Right-click menus**: appear on any tree node — Add, Rename, Duplicate, Delete
- **Drag-and-drop**: reorder requests within collections or move between folders
- **Split pane**: top = URL bar + tabs, bottom = response (resizable)
- **Top bar**: logo, workspace name, nav links (Home / Admin / Leaderboard), user avatar + logout

---

## Collections Router (CRUD — implement similarly)

**`backend/app/routers/collections.py`** — implement:
- `GET /collections` — list user's collections
- `POST /collections` — create collection
- `PUT /collections/{id}` — rename/update
- `DELETE /collections/{id}` — delete with cascade
- `PATCH /collections/reorder` — accept list of `[{id, order_index}]` to save drag-drop order

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | postgresql://... | PostgreSQL connection string |
| `SECRET_KEY` | dev-secret | JWT signing key (change in prod!) |
| `ALGORITHM` | HS256 | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 1440 | Token TTL (24 hours) |

---

## Testing

```bash
# Backend unit tests
cd backend && pytest

# Frontend
cd frontend && npm test

# Integration test — send a test request via the proxy
curl -X POST http://localhost:8000/proxy/send \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"method":"GET","url":"https://httpbin.org/get","headers":[],"params":[]}'
```

---

## Roadmap (Future Enhancements)

- [ ] WebSocket support for streaming responses
- [ ] Environment variables (like Postman environments)
- [x] Import/Export Postman collections (JSON format) — **Step 14**
- [x] History panel — replay past requests — **Step 15**
- [ ] Team workspaces — share collections across users
- [ ] Pre-request scripts and tests (JavaScript)
- [ ] Mock server mode
- [ ] gRPC & GraphQL support
