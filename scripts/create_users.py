#!/usr/bin/env python3
"""
Script to create ALS system users
"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'back'))

from app.database import Base, get_db
from app.models.system_user import SystemUser
from app.services.auth_service import get_password_hash

def create_user(db_session, email, full_name, password):
    """Create a new user or update existing user"""
    try:
        # Check if user already exists
        existing_user = db_session.query(SystemUser).filter(SystemUser.email == email).first()
        
        if existing_user:
            # Update existing user
            existing_user.full_name = full_name
            existing_user.hashed_password = get_password_hash(password)
            existing_user.is_active = True
            print(f"✅ Updated user: {email}")
        else:
            # Create new user
            new_user = SystemUser(
                email=email,
                full_name=full_name,
                hashed_password=get_password_hash(password),
                is_active=True
            )
            db_session.add(new_user)
            print(f"✅ Created user: {email}")
        
        db_session.commit()
        return True
        
    except Exception as e:
        print(f"❌ Error creating user {email}: {str(e)}")
        db_session.rollback()
        return False

def main():
    """Main function to create users"""
    print("🚀 Starting ALS user creation...")
    
    # Database setup
    from app.core.config import settings
    
    # Use the appropriate database URL
    if settings.database_url:
        database_url = settings.database_url
    else:
        database_url = settings.postgres_url
    
    # For SQLite, adjust the URL format
    if database_url.startswith('sqlite'):
        # SQLAlchemy 2.0+ format for SQLite
        database_url = database_url.replace('sqlite:///', 'sqlite:///')
    
    print(f"Using database: {database_url}")
    
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # User list to create
    users = [
        ("ana.melendez@alsglobal.com", "Ana Melendez"),
        ("feipe.martinez@alsglobal.com", "Andres Marinez"),
        ("Alvaroj.audivetc@gmail.com", "Audivet Castro Alvaro Jose"),
        ("Ivan.barrera@alsglobal.com", "Barrera Pérez Iván Germán"),
        ("Raul.calderon@alsglobal.com", "Calderón Hernández Raúl Adolfo"),
        ("Juandavidcd.fc@gmail.com", "Carreño Duarte Juan David"),
        ("Freddy.castro@alsglobal.com", "Castro Orellano Freddy Junior"),
        ("Yeisoncastro11@gmail.com", "Castro Peña Jeison De Jesus"),
        ("Paola.cervera@alsglobal.com", "Cervera Marmolejo Paola Andrea"),
        ("Haroldandres_144@hotmail.com", "Cid Fernández Harold Andres"),
        ("Luis.correa@alsglobal.com", "Correa Jaramillo Luis Ramon"),
        ("Jesus.delahoz@alsglobal.com", "De La Hoz Salcedo Jesus Eduardo"),
        ("Juan.garcia@alsglobal.com", "Garcia Peluffo Juan David"),
        ("Edwinguayber@hotmail.com", "Guayacundo Bernal Edwin Fernando"),
        ("Gerarguty.10@gmail.com", "Gutierrez Noya Gerardo Andres"),
        ("Eduardo.ibarra@alsglobal.com", "Ibarra Trujillo Eduardo Junior"),
        ("Emiro.martinez@alsglobal.com", "Martinez Alvarez Emiro Jose"),
        ("Ingeniero.campo10@alsglobal.com", "Martinez Del Toro Reynel David"),
        ("Danielmelendez807@gmail.com", "Melendez Monserrat Daniel Issac"),
        ("Normannarvaez888@gmail.com", "Narvaez Charris Norman Camilo"),
        ("Shirley.osorio@alsglobal.com", "Osorio Guerra Shirley Camila"),
        ("Ingeniero.campo39als@gmail.com", "Pedraza Gonzalez Cristhian Santiago"),
        ("Majopece.18@gmail.com", "Peña Cervantes Manuel Jose"),
        ("Andresfprimo@hotmail.com", "Primo Oliveros Andres Felipe"),
        ("Armandop2810@gmail.com", "Pumarejo Jimenez Armando Jesus"),
        ("Josue.trespalacios@alsglobal.com", "Trespalacios Solano Josue"),
        ("Juantrillos.so@gmail.com", "Trillos Osorio Juan Sebastian"),
        ("dayana.delaasuncion@alsglobal.com", "Dayana De La Asunción"),
        ("lorayme.bohorquez@alsglobal.com", "Bohorquez Rodriguez Lorayme Maria"),
        ("valentina.lora@alsglobal.com", "Lora Cespedes Valentina"),
        ("juan.bustamante@alsglobal.com", "Bustamante Rebollo Juan Esteban"),
        ("andrea.ruiz@alsglobal.com", "Andrea Ruiz"),
        ("Ana.Blanco@ALSGlobal.com", "Blanco Aponte Ana Maria"),
        ("Maria.Estrada@alsglobal.com", "Estrada Catalan Maria Fernanda"),
        ("dylanp.arango12@gmail.com", "Dylan Alexander Peña"),
    ]
    
    # Default password for all users
    default_password = "als12325"
    
    db = SessionLocal()
    try:
        created_count = 0
        
        for email, full_name in users:
            if create_user(db, email, full_name, default_password):
                created_count += 1
        
        print(f"\n✅ Successfully processed {created_count} users!")
        print(f"📧 Default password for all users: {default_password}")
        
    except Exception as e:
        print(f"❌ Database error: {str(e)}")
        return 1
    finally:
        db.close()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())