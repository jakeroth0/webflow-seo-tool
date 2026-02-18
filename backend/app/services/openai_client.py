import logging
from openai import AsyncOpenAI
from typing import Optional

logger = logging.getLogger(__name__)


class AltTextGenerator:
    """OpenAI client for generating SEO-friendly alt text using GPT-4 Vision."""

    def __init__(self, api_key: str, timeout: float = 60.0):
        self.client = AsyncOpenAI(api_key=api_key, timeout=timeout)
        self.model = "gpt-4o-mini"  # Fast and cost-effective vision model

    async def generate_alt_text(
        self,
        image_url: str,
        context: Optional[dict] = None,
        max_length: int = 125,
    ) -> str:
        """
        Generate SEO-friendly alt text for an image using GPT-4 Vision.

        Args:
            image_url: URL of the image to analyze
            context: Optional context (project name, existing alt text, etc.)
            max_length: Maximum character length for alt text (default 125 for SEO)

        Returns:
            Generated alt text string
        """
        try:
            project_name = context.get("name", "") if context else ""
            existing_alt = context.get("existing_alt", "") if context else ""

            # Build context-aware prompt
            context_str = ""
            if project_name:
                context_str += f"\nProject: {project_name}"
            if existing_alt:
                context_str += f"\nCurrent alt text: {existing_alt}"

            prompt = f"""Analyze this image and generate SEO-optimized alt text for a home remodeling/renovation website.
{context_str}

Requirements:
- Maximum {max_length} characters
- Describe what's visible in the image (rooms, features, materials, colors)
- Focus on renovation/remodeling aspects (before/after, improvements)
- Use natural language that's both accessible and SEO-friendly
- Include relevant keywords naturally (e.g., "kitchen remodel", "basement renovation", "custom cabinetry")
- Avoid starting with "Image of" or "Photo of"

Generate ONLY the alt text, nothing else."""

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at writing concise, SEO-friendly alt text for home renovation images that balances accessibility and search optimization.",
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": image_url, "detail": "low"},
                            },
                        ],
                    },
                ],
                max_tokens=100,
                temperature=0.7,
            )

            alt_text = response.choices[0].message.content.strip()

            # Ensure we don't exceed max length
            if len(alt_text) > max_length:
                alt_text = alt_text[:max_length].rsplit(" ", 1)[0] + "..."

            logger.info(
                f"Generated alt text ({len(alt_text)} chars) for {image_url[:50]}..."
            )
            return alt_text

        except Exception as e:
            logger.error(f"Failed to generate alt text: {str(e)}")
            raise


class MockAltTextGenerator(AltTextGenerator):
    """Mock generator for testing without using OpenAI API."""

    def __init__(self):
        self.model = "mock"

    async def generate_alt_text(
        self, image_url: str, context: Optional[dict] = None, max_length: int = 125
    ) -> str:
        """Return mock alt text."""
        project_name = context.get("name", "Project") if context else "Project"
        return f"Mock alt text for {project_name} - professionally remodeled space with modern finishes and custom design features."
