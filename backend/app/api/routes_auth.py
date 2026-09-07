import os
import uuid
import datetime
import logging
import random
import smtplib
from email.mime.text import MIMEText
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
    email: EmailStr
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
    logger.info("="*50)
    logger.info("S.A.G.A.R. SECURE VERIFICATION EMAIL")
    logger.info(f"TO: {email}")
    logger.info(f"CODE: {token}")
    logger.info("="*50)
    
    sender_email = os.environ.get("SMTP_EMAIL")
    sender_password = os.environ.get("SMTP_PASSWORD")
    
    if sender_email and sender_password:
        try:
            msg = MIMEText(f"Your S.A.G.A.R. access override code is:\n\n{token}\n\nIf you did not initiate this request, notify the Station Master immediately.")
            msg['Subject'] = 'S.A.G.A.R. Access Code'
            msg['From'] = f"S.A.G.A.R. Command <{sender_email}>"
            msg['To'] = email

            with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
                server.login(sender_email, sender_password)
                server.send_message(msg)
            logger.info("Verification email sent via SMTP successfully.")
        except Exception as e:
            logger.error(f"Failed to send email via SMTP: {e}")
    else:
        logger.info("SMTP credentials not configured in .env, falling back to console log.")

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    request.email = request.email.lower()
    
    # Check domain
    if not (request.email.endswith("@gmail.com") or request.email.endswith("@sagar.gov.in")):
        raise HTTPException(status_code=400, detail="Only approved Gmail or SAGAR domains are permitted.")
        
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Generate 6-digit code
    verification_token = str(random.randint(100000, 999999))
    hashed_pw = get_password_hash(request.password)
    
    is_absolute_host = request.email == "narayan.nkj@gmail.com"
    role = "Admin" if is_absolute_host else "Operator"
    is_approved = 1 if is_absolute_host else 0
    is_verified = 1 if is_absolute_host else 0
    
    new_user = User(
        email=request.email,
        full_name=request.fullName,
        hashed_password=hashed_pw,
        role=role,
        is_approved=is_approved,
        verification_token=verification_token,
        is_verified=is_verified
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    send_verification_email(new_user.email, new_user.verification_token)
    
    return {"message": "Account created successfully. Please check your email to verify."}

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    request.email = request.email.lower()
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
        
    if user.is_approved == 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account pending admin approval.",
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
    request.email = request.email.lower()
    user = db.query(User).filter(User.email == request.email, User.verification_token == request.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    user.is_verified = 1
    user.verification_token = None
    db.commit()
    
    return {"message": "Email successfully verified"}

@router.post("/resend-verification")
async def resend_verification(request: ResendVerifyRequest, db: Session = Depends(get_db)):
    request.email = request.email.lower()
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Don't reveal user existence
        return {"message": "If that email exists and is unverified, a new code has been sent."}
        
    if user.is_verified == 1:
        return {"message": "Email is already verified"}
        
    user.verification_token = str(random.randint(100000, 999999))
    db.commit()
    
    send_verification_email(user.email, user.verification_token)
    return {"message": "If that email exists and is unverified, a new link has been sent."}

@router.get("/users")
async def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    users = db.query(User).all()
    return [{
        "id": u.id,
        "email": u.email,
        "full_name": u.full_name,
        "role": u.role,
        "is_verified": bool(u.is_verified),
        "is_approved": bool(u.is_approved)
    } for u in users]

@router.post("/users/{user_id}/approve")
async def approve_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_approved = 1
    db.commit()
    return {"message": "User approved"}

@router.post("/users/{user_id}/revoke")
async def revoke_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.email == "narayan.nkj@gmail.com":
        raise HTTPException(status_code=400, detail="Cannot revoke absolute host")
    user.is_approved = 0
    db.commit()
    return {"message": "User access revoked"}
