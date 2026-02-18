from sqlalchemy import create_engine, Column, Integer, String, BigInteger, Float, DateTime, Boolean, Text, DECIMAL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from config import get_settings
from typing import Generator

settings = get_settings()

# Create database URL
DATABASE_URL = f"mysql+pymysql://{settings.db_user}:{settings.db_password}@{settings.db_host}:{settings.db_port}/{settings.db_name}"

# Create engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Database models matching Spring Boot entities
class User(Base):
    __tablename__ = "users"
    
    id = Column(BigInteger, primary_key=True)
    username = Column(String(255))
    email = Column(String(255))
    status = Column(String(50))

class Media(Base):
    __tablename__ = "media"
    
    id = Column(BigInteger, primary_key=True)
    mediaurl = Column(String(500))
    thumbnailurl = Column(String(500))
    duration = Column(Integer)
    title = Column(String(255))
    uploaded_at = Column(DateTime)
    media_type = Column(String(50))

class Video(Base):
    __tablename__ = "video"
    
    id = Column(BigInteger, primary_key=True)
    director = Column(String(255))
    year = Column(String(10))
    view_count = Column(BigInteger, default=0)
    description = Column(Text)
    rating = Column(DECIMAL(3, 1))
    cast = Column(Text)
    genre = Column(String(255))

class VideoView(Base):
    __tablename__ = "video_views"
    
    id = Column(BigInteger, primary_key=True)
    video_id = Column(BigInteger)
    user_id = Column(BigInteger)
    watch_duration = Column(Integer)
    watch_percentage = Column(Float)
    viewed_at = Column(DateTime)

class VideoLike(Base):
    __tablename__ = "video_likes"
    
    id = Column(BigInteger, primary_key=True)
    video_id = Column(BigInteger)
    user_id = Column(BigInteger)
    is_liked = Column(Boolean)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

class SearchHistory(Base):
    __tablename__ = "search_history"
    
    id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger)
    query = Column(String(500))
    searched_at = Column(DateTime)

# Dependency to get database session
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
