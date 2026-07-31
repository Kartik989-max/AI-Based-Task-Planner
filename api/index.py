"""Vercel serverless entrypoint for Guide Todoo API."""

from guide_todoo.api import app

# Vercel expects `app` at module level
