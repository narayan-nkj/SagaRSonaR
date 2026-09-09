import os
import re

with open("app/api/routes_auth.py", "r") as f:
    content = f.read()

# Chunk 1: Imports
content = content.replace("import random", "import secrets\nfrom email.mime.multipart import MIMEMultipart")
content = content.replace("from app.database.models import User", "from app.database.models import User, get_utc_now")

# Chunk 2: send_verification_email
old_send = """def send_verification_email(email: str, token: str):
    logger.info("="*50)
    logger.info("S.A.G.A.R. SECURE VERIFICATION EMAIL")
    logger.info(f"TO: {email}")
    logger.info(f"CODE: {token}")
    logger.info("="*50)
    
    sender_email = os.environ.get("SMTP_EMAIL")
    sender_password = os.environ.get("SMTP_PASSWORD")
    
    if sender_email and sender_password:
        try:
            msg = MIMEText(f"Your S.A.G.A.R. access override code is:\\n\\n{token}\\n\\nIf you did not initiate this request, notify the Station Master immediately.")
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
        logger.info("SMTP credentials not configured in .env, falling back to console log.")"""

new_send = """def send_verification_email(email: str, token: str):
    logger.info("="*50)
    logger.info("S.A.G.A.R. SECURE VERIFICATION EMAIL")
    logger.info(f"TO: {email}")
    logger.info("="*50)
    
    sender_email = os.environ.get("SMTP_EMAIL")
    sender_password = os.environ.get("SMTP_PASSWORD")
    
    if not sender_email or not sender_password:
        logger.error("SMTP credentials not configured in .env.")
        raise HTTPException(status_code=500, detail="SMTP Configuration Missing: Cannot send verification email.")
        
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Your S.A.G.A.R verification code'
        msg['From'] = f"S.A.G.A.R <{sender_email}>"
        msg['To'] = email

        text = f"Hello,\\n\\nYour S.A.G.A.R verification code is: {token}\\n\\nThis code expires in 10 minutes and can be used only once.\\nIf you did not request this code, you can safely ignore this email.\\n\\n— S.A.G.A.R"
        html = f\"\"\"\\
        <html>
          <body>
            <p>Hello,</p>
            <p>Your S.A.G.A.R verification code is: <strong>{token}</strong></p>
            <p>This code expires in 10 minutes and can be used only once.<br>
            If you did not request this code, you can safely ignore this email.</p>
            <p>— S.A.G.A.R</p>
          </body>
        </html>
        \"\"\"
        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html, 'html')
        msg.attach(part1)
        msg.attach(part2)

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, sender_password)
            server.send_message(msg)
        logger.info("Verification email sent via SMTP successfully.")
        return True
    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP Authentication Failed. Invalid password or App Password required.")
        raise HTTPException(status_code=500, detail="Email provider authentication failed. Contact administrator.")
    except Exception as e:
        logger.error(f"Failed to send email via SMTP: {e}")
        raise HTTPException(status_code=500, detail="Failed to send verification email.")"""

content = content.replace(old_send, new_send)

# Chunk 3: signup
old_signup = """    # Generate 6-digit code
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
    
    return {"message": "Account created successfully. Please check your email to verify."}"""

new_signup = """    plain_token = str(secrets.randbelow(900000) + 100000)
    hashed_token = get_password_hash(plain_token)
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
        verification_token=hashed_token,
        verification_expiry=get_utc_now() + datetime.timedelta(minutes=10),
        verification_attempts=0,
        verification_last_sent=get_utc_now(),
        is_verified=is_verified
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    try:
        if not is_absolute_host:
            send_verification_email(new_user.email, plain_token)
    except Exception as e:
        db.delete(new_user)
        db.commit()
        raise e
    
    return {"message": "Account created successfully. Please check your email to verify."}"""

content = content.replace(old_signup, new_signup)

# Chunk 4: verify_email
old_verify = """@router.post("/verify")
async def verify_email(request: VerifyRequest, db: Session = Depends(get_db)):
    request.email = request.email.lower()
    user = db.query(User).filter(User.email == request.email, User.verification_token == request.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    user.is_verified = 1
    user.verification_token = None
    db.commit()
    
    return {"message": "Email successfully verified"}"""

new_verify = """@router.post("/verify")
async def verify_email(request: VerifyRequest, db: Session = Depends(get_db)):
    request.email = request.email.lower()
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification request.")
        
    if user.is_verified == 1:
        return {"message": "Email already verified"}

    if not user.verification_token:
        raise HTTPException(status_code=400, detail="No verification pending.")
        
    if user.verification_attempts >= 5:
        raise HTTPException(status_code=400, detail="Too many failed attempts. Please request a new code.")
        
    if user.verification_expiry and get_utc_now() > user.verification_expiry.replace(tzinfo=datetime.timezone.utc):
        raise HTTPException(status_code=400, detail="Verification code has expired.")
        
    if not verify_password(request.token, user.verification_token):
        user.verification_attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    user.is_verified = 1
    user.verification_token = None
    user.verification_expiry = None
    user.verification_attempts = 0
    db.commit()
    
    return {"message": "Email successfully verified"}"""

content = content.replace(old_verify, new_verify)

# Chunk 5: resend_verification
old_resend = """@router.post("/resend-verification")
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
    return {"message": "If that email exists and is unverified, a new link has been sent."}"""

new_resend = """@router.post("/resend-verification")
async def resend_verification(request: ResendVerifyRequest, db: Session = Depends(get_db)):
    request.email = request.email.lower()
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Don't reveal user existence
        return {"message": "If that email exists and is unverified, a new code has been sent."}
        
    if user.is_verified == 1:
        return {"message": "Email is already verified"}
        
    if user.verification_last_sent:
        elapsed = (get_utc_now() - user.verification_last_sent.replace(tzinfo=datetime.timezone.utc)).total_seconds()
        if elapsed < 60:
            raise HTTPException(status_code=429, detail=f"Please wait {int(60 - elapsed)} seconds before requesting a new code.")
            
    plain_token = str(secrets.randbelow(900000) + 100000)
    user.verification_token = get_password_hash(plain_token)
    user.verification_expiry = get_utc_now() + datetime.timedelta(minutes=10)
    user.verification_attempts = 0
    user.verification_last_sent = get_utc_now()
    db.commit()
    
    send_verification_email(user.email, plain_token)
    return {"message": "If that email exists and is unverified, a new link has been sent."}"""

content = content.replace(old_resend, new_resend)

with open("app/api/routes_auth.py", "w") as f:
    f.write(content)

print("Updated routes_auth.py")
