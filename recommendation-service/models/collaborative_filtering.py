import pandas as pd
import numpy as np
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from database import VideoView, VideoLike, Video, Media
from typing import List, Dict, Tuple
import pickle
import logging
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CollaborativeFilteringModel:
    def __init__(self, n_components: int = 50, min_interactions: int = 5):
        """
        Initialize the collaborative filtering model
        
        Args:
            n_components: Number of latent features for matrix factorization
            min_interactions: Minimum interactions required for a user to get personalized recommendations
        """
        self.n_components = n_components
        self.min_interactions = min_interactions
        self.svd_model = None
        self.user_item_matrix = None
        self.user_ids = None
        self.video_ids = None
        self.user_features = None
        self.video_features = None
        self.video_popularity = {}
        self.trained = False
        
    def prepare_data(self, db: Session, days_lookback: int = 90) -> pd.DataFrame:
        """
        Prepare interaction data from database
        
        Args:
            db: Database session
            days_lookback: Number of days of historical data to consider
            
        Returns:
            DataFrame with user-video interactions and scores
        """
        cutoff_date = datetime.now() - timedelta(days=days_lookback)
        
        # Get video views
        views = db.query(
            VideoView.user_id,
            VideoView.video_id,
            VideoView.watch_percentage,
            VideoView.viewed_at
        ).filter(VideoView.viewed_at >= cutoff_date).all()
        
        # Get video likes/dislikes
        likes = db.query(
            VideoLike.user_id,
            VideoLike.video_id,
            VideoLike.is_liked
        ).filter(VideoLike.created_at >= cutoff_date).all()
        
        # Convert to DataFrames
        views_df = pd.DataFrame(views, columns=['user_id', 'video_id', 'watch_percentage', 'viewed_at'])
        likes_df = pd.DataFrame(likes, columns=['user_id', 'video_id', 'is_liked'])
        
        if views_df.empty:
            logger.warning("No view data found in database")
            return pd.DataFrame(columns=['user_id', 'video_id', 'score'])
        
        # Calculate interaction scores
        # Base score from views: 1.0 for any view
        interactions = views_df.groupby(['user_id', 'video_id']).agg({
            'watch_percentage': 'max'  # Take max watch percentage
        }).reset_index()
        
        # Start with base score of 1.0 for viewing
        interactions['score'] = 1.0
        
        # Add bonus based on watch percentage (0 to 2.0 bonus)
        interactions['score'] += (interactions['watch_percentage'] / 100.0) * 2.0
        
        # Merge with likes/dislikes
        if not likes_df.empty:
            likes_scores = likes_df.copy()
            likes_scores['like_score'] = likes_scores['is_liked'].apply(lambda x: 3.0 if x else -2.0)
            likes_scores = likes_scores.groupby(['user_id', 'video_id'])['like_score'].last().reset_index()
            
            interactions = interactions.merge(
                likes_scores, 
                on=['user_id', 'video_id'], 
                how='left'
            )
            interactions['score'] += interactions['like_score'].fillna(0)
        
        # Ensure non-negative scores
        interactions['score'] = interactions['score'].clip(lower=0)
        
        logger.info(f"Prepared {len(interactions)} interactions from {len(interactions['user_id'].unique())} users and {len(interactions['video_id'].unique())} videos")
        
        return interactions[['user_id', 'video_id', 'score']]
    
    def calculate_video_popularity(self, db: Session):
        """Calculate popularity scores for all videos"""
        videos = db.query(
            Video.id,
            Video.view_count,
            Video.rating
        ).all()
        
        for video_id, view_count, rating in videos:
            rating_value = float(rating) if rating else 5.0
            # Popularity = weighted combination of views and rating
            popularity = (view_count * 0.7) + (rating_value * 0.3 * 100)
            self.video_popularity[video_id] = popularity
        
        logger.info(f"Calculated popularity for {len(self.video_popularity)} videos")
    
    def train(self, db: Session, days_lookback: int = 90):
        """
        Train the recommendation model
        
        Args:
            db: Database session
            days_lookback: Number of days of historical data to use
        """
        logger.info("Starting model training...")
        
        # Prepare interaction data
        interactions_df = self.prepare_data(db, days_lookback)
        
        if interactions_df.empty or len(interactions_df) < 10:
            logger.warning("Insufficient data for training. Need at least 10 interactions.")
            self.trained = False
            return
        
        # Calculate video popularity for cold start
        self.calculate_video_popularity(db)
        
        # Create user-item matrix
        self.user_item_matrix = interactions_df.pivot_table(
            index='user_id',
            columns='video_id',
            values='score',
            fill_value=0
        )
        
        self.user_ids = self.user_item_matrix.index.tolist()
        self.video_ids = self.user_item_matrix.columns.tolist()
        
        logger.info(f"User-item matrix shape: {self.user_item_matrix.shape}")
        
        # Apply matrix factorization using SVD
        n_components = min(self.n_components, min(self.user_item_matrix.shape) - 1)
        self.svd_model = TruncatedSVD(n_components=n_components, random_state=42)
        
        # Decompose the user-item matrix
        self.user_features = self.svd_model.fit_transform(self.user_item_matrix)
        self.video_features = self.svd_model.components_.T
        
        self.trained = True
        logger.info(f"Model training completed. Explained variance: {self.svd_model.explained_variance_ratio_.sum():.3f}")
    
    def predict_for_user(self, user_id: int, top_n: int = 10) -> List[Dict]:
        """
        Generate recommendations for a specific user
        
        Args:
            user_id: User ID to generate recommendations for
            top_n: Number of recommendations to return
            
        Returns:
            List of video IDs with recommendation scores
        """
        if not self.trained:
            logger.warning("Model not trained. Using popularity-based recommendations.")
            return self._get_popular_videos(top_n)
        
        if user_id not in self.user_ids:
            logger.info(f"User {user_id} not in training data. Using popularity-based recommendations.")
            return self._get_popular_videos(top_n)
        
        # Get user index
        user_idx = self.user_ids.index(user_id)
        
        # Get user's feature vector
        user_vector = self.user_features[user_idx].reshape(1, -1)
        
        # Calculate predicted scores for all videos
        predicted_scores = np.dot(user_vector, self.video_features.T).flatten()
        
        # Get videos user has already interacted with
        interacted_videos = set(self.user_item_matrix.iloc[user_idx][self.user_item_matrix.iloc[user_idx] > 0].index)
        
        # Create recommendations list
        recommendations = []
        for i, video_id in enumerate(self.video_ids):
            if video_id not in interacted_videos:
                recommendations.append({
                    'video_id': int(video_id),
                    'score': float(predicted_scores[i])
                })
        
        # Sort by score and return top N
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        return recommendations[:top_n]
    
    def _get_popular_videos(self, top_n: int = 10) -> List[Dict]:
        """Get popular videos as fallback"""
        sorted_videos = sorted(
            self.video_popularity.items(),
            key=lambda x: x[1],
            reverse=True
        )[:top_n]
        
        return [
            {'video_id': int(video_id), 'score': float(score)}
            for video_id, score in sorted_videos
        ]
    
    def save_model(self, filepath: str):
        """Save trained model to disk"""
        model_data = {
            'svd_model': self.svd_model,
            'user_item_matrix': self.user_item_matrix,
            'user_ids': self.user_ids,
            'video_ids': self.video_ids,
            'user_features': self.user_features,
            'video_features': self.video_features,
            'video_popularity': self.video_popularity,
            'trained': self.trained,
            'n_components': self.n_components,
            'min_interactions': self.min_interactions
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        logger.info(f"Model saved to {filepath}")
    
    def load_model(self, filepath: str):
        """Load trained model from disk"""
        try:
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)
            
            self.svd_model = model_data['svd_model']
            self.user_item_matrix = model_data['user_item_matrix']
            self.user_ids = model_data['user_ids']
            self.video_ids = model_data['video_ids']
            self.user_features = model_data['user_features']
            self.video_features = model_data['video_features']
            self.video_popularity = model_data['video_popularity']
            self.trained = model_data['trained']
            self.n_components = model_data.get('n_components', self.n_components)
            self.min_interactions = model_data.get('min_interactions', self.min_interactions)
            
            logger.info(f"Model loaded from {filepath}")
            return True
        except FileNotFoundError:
            logger.warning(f"Model file not found: {filepath}")
            return False
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return False
