"""
Redis-based caching layer for performance optimization.
Provides decorator-based caching with TTL and automatic invalidation.
"""

import json
import hashlib
import functools
import os
from typing import Any, Optional, Callable
import redis
from logging_utils import logger


# Redis connection
_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> Optional[redis.Redis]:
    """Get Redis client instance (lazy initialization)."""
    global _redis_client

    if _redis_client is not None:
        return _redis_client

    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    try:
        _redis_client = redis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        # Test connection
        _redis_client.ping()
        logger.info(f"Redis connected successfully: {redis_url}")
        return _redis_client
    except (redis.ConnectionError, redis.TimeoutError) as e:
        logger.warning(f"Redis connection failed (caching disabled): {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected Redis error: {e}")
        return None


def cache(ttl: int = 300, key_prefix: str = ""):
    """
    Decorator to cache function results in Redis.

    Args:
        ttl: Time to live in seconds (default: 5 minutes)
        key_prefix: Prefix for cache keys

    Example:
        @cache(ttl=600, key_prefix="products")
        def get_all_products():
            return fetch_from_db()
    """

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            client = get_redis_client()

            # Skip cache if Redis unavailable
            if client is None:
                return func(*args, **kwargs)

            # Generate cache key from function name and arguments
            key_parts = [
                key_prefix or func.__module__,
                func.__name__,
                str(args),
                str(sorted(kwargs.items())),
            ]
            cache_key = hashlib.md5(
                json.dumps(key_parts, sort_keys=True).encode()
            ).hexdigest()

            # Try to get from cache
            try:
                cached = client.get(cache_key)
                if cached:
                    logger.debug(f"Cache HIT: {func.__name__}")
                    return json.loads(cached)
            except Exception as e:
                logger.warning(f"Cache read error: {e}")

            # Cache miss - execute function
            logger.debug(f"Cache MISS: {func.__name__}")
            result = func(*args, **kwargs)

            # Store in cache
            try:
                client.setex(cache_key, ttl, json.dumps(result, default=str))
            except Exception as e:
                logger.warning(f"Cache write error: {e}")

            return result

        return wrapper

    return decorator


def invalidate_cache(pattern: str):
    """
    Invalidate cache keys matching pattern.

    Args:
        pattern: Redis key pattern (e.g., "products:*")

    Example:
        invalidate_cache("products:*")  # Clear all product caches
    """
    client = get_redis_client()
    if client is None:
        return

    try:
        keys = client.keys(pattern)
        if keys:
            client.delete(*keys)
            logger.info(f"Invalidated {len(keys)} cache entries matching '{pattern}'")
    except Exception as e:
        logger.error(f"Cache invalidation error: {e}")


def clear_all_cache():
    """Clear all cached data (use with caution)."""
    client = get_redis_client()
    if client is None:
        return

    try:
        client.flushdb()
        logger.info("All cache cleared")
    except Exception as e:
        logger.error(f"Cache clear error: {e}")


def get_cache_stats() -> dict:
    """Get cache statistics."""
    client = get_redis_client()
    if client is None:
        return {"status": "unavailable"}

    try:
        info = client.info("stats")
        return {
            "status": "available",
            "keys": client.dbsize(),
            "hits": info.get("keyspace_hits", 0),
            "misses": info.get("keyspace_misses", 0),
            "memory_used": info.get("used_memory_human", "N/A"),
        }
    except Exception as e:
        logger.error(f"Cache stats error: {e}")
        return {"status": "error", "error": str(e)}
