import os
import uuid
import datetime
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User
import bcrypt
import jwt

logger = logging.getLogger("sonar-x")

router = APIRouter()
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "sagar-dev-secret-key-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

class SignupRequest(BaseModel):
    fullName: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyRequest(BaseModel):
    token: str
    
class ResendVerifyRequest(BaseModel):
    email: EmailStr

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

def get_password_hash(password):
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password, hashed_password):
    pwd_bytes = plain_password.encode('utf-8')
    hashed_password_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed_password_bytes)

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email_sub: str = payload.get("sub")
        if email_sub is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    user = db.query(User).filter(User.email == email_sub).first()
    if user is None:
        raise credentials_exception
    return user

def send_verification_email(email: str, token: str):
    # Simulated email sending
    verification_link = f"http://localhost:5173/verify/{token}"
    logger.info("="*50)
    logger.info("S.A.G.A.R. SECURE VERIFICATION EMAIL")
    logger.info(f"TO: {email}")
    logger.info(f"LINK: {verification_link}")
    logger.info("="*50)

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    # Check domain
    if not (request.email.endswith("@gmail.com") or request.email.endswith("@sagar.gov.in")):
        raise HTTPException(status_code=400, detail="Only approved Gmail or SAGAR domains are permitted.")
        
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    verification_token = str(uuid.uuid4())
    hashed_pw = get_password_hash(request.password)
    
    new_user = User(
        email=request.email,
        full_name=request.fullName,
        hashed_password=hashed_pw,
        verification_token=verification_token,
        is_verified=1 # Auto-verify for now
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "Account created successfully. You can now log in."}

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    if user.is_verified == 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not verified. Please check your email.",
        )
        
    access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "fullName": user.full_name,
            "role": user.role
        }
    }

@router.post("/verify")
async def verify_email(request: VerifyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == request.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification link")
        
    user.is_verified = 1
    user.verification_token = None
    db.commit()
    
    return {"message": "Email successfully verified"}

@router.post("/resend-verification")
async def resend_verification(request: ResendVerifyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Don't reveal user existence
        return {"message": "If that email exists and is unverified, a new link has been sent."}
        
    if user.is_verified == 1:
        return {"message": "Email is already verified"}
        
    user.verification_token = str(uuid.uuid4())
    db.commit()
    
    send_verification_email(user.email, user.verification_token)
    return {"message": "If that email exists and is unverified, a new link has been sent."}
