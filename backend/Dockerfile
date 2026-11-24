# syntax=docker/dockerfile:1.7
FROM python:3.14-slim AS python-base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DJANGO_SETTINGS_MODULE=config.settings

FROM python-base AS build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    libgit2-dev \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY requirements.txt ./requirements.txt
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip \
    && /opt/venv/bin/pip install -r requirements.txt

FROM python-base AS runtime
ENV PATH="/opt/venv/bin:$PATH" \
    HOME=/home/metafrix \
    DJANGO_MEDIA_ROOT=/var/lib/metafrix/media \
    GIT_REPOSITORY_ROOT=/var/lib/metafrix/git/repos
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    ffmpeg \
    git \
    libgit2-1.9 \
    libpq5 \
    tini \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 10001 metafrix \
    && useradd --system --uid 10001 --gid metafrix --home-dir /home/metafrix --create-home metafrix \
    && install -d -o metafrix -g metafrix /app /app/staticfiles /var/lib/metafrix/media /var/lib/metafrix/git/repos
WORKDIR /app
COPY --from=build /opt/venv /opt/venv
COPY --chown=metafrix:metafrix . .
USER metafrix:metafrix
EXPOSE 8000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--threads", "2", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-"]
