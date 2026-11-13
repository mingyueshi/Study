FROM python:3.12-slim-bookworm AS dependencies
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 PIP_NO_CACHE_DIR=1
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates gpg \
    && rm -rf /var/lib/apt/lists/*
ADD https://www.postgresql.org/media/keys/ACCC4CF8.asc /tmp/postgresql.asc
RUN test "$(gpg --batch --show-keys --with-colons /tmp/postgresql.asc | awk -F: '$1 == "fpr" { print $10; exit }')" = B97B0AFCAA1A47F044F244A07FCC7D46ACCC4CF8 \
    && gpg --batch --dearmor --output /tmp/postgresql.gpg /tmp/postgresql.asc \
    && chmod 644 /tmp/postgresql.gpg
WORKDIR /build
COPY requirements.txt requirements-postgres.txt requirements-deploy.txt ./
RUN python -m venv /opt/venv && /opt/venv/bin/pip install -r requirements-deploy.txt

FROM python:3.12-slim-bookworm
# 使用 PostgreSQL 官方签名源，客户端与数据库固定在同一主版本。
COPY --from=dependencies /tmp/postgresql.gpg /usr/share/keyrings/postgresql.gpg
RUN echo 'deb [signed-by=/usr/share/keyrings/postgresql.gpg] https://apt.postgresql.org/pub/repos/apt bookworm-pgdg main' > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update && apt-get install -y --no-install-recommends postgresql-client-16 ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV PATH="/opt/venv/bin:$PATH" PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 \
    PRIMARY_DOCKER=1 DJANGO_SETTINGS_MODULE=config.settings
RUN groupadd --gid 10001 primary && useradd --uid 10001 --gid primary --no-create-home primary \
    && mkdir -p /app /data /backups && chown primary:primary /data /backups
COPY --from=dependencies /opt/venv /opt/venv
WORKDIR /app
# 基础包和校验器未变时复用该校验层，日常改页面不再扫描 250 万行内容。
# BuildKit 的只读绑定输入参与缓存校验，不将临时校验文件留在镜像中。
RUN --mount=type=bind,source=data/baseline,target=/baseline \
    --mount=type=bind,source=config/base_data.py,target=/tmp/base_data.py \
    PYTHONPATH=/tmp python -c 'from base_data import verify_package; print(verify_package("/baseline")["digest"])'
COPY --chown=10001:10001 . .
# 构建时不使用运行密钥，也不读取宿主机数据库。
RUN PRIMARY_SECRET_KEY=build-only-not-a-runtime-secret python manage.py collectstatic --noinput
ARG PRIMARY_REVISION=unknown
ENV PRIMARY_IMAGE_REVISION=$PRIMARY_REVISION
LABEL org.opencontainers.image.title="乐学堂" org.opencontainers.image.revision=$PRIMARY_REVISION
USER 10001:10001
EXPOSE 8012
CMD ["python", "deploy/runtime.py", "serve"]
