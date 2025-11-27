#!/bin/bash
set -e

echo "🚀 All-in-One 容器启动..."
echo "=========================================="

# ========================================
# 配置
# ========================================
PGDATA="${PGDATA:-/var/lib/postgresql/data}"
POSTGRES_DB="${POSTGRES_DB:-homelabs_portal}"
POSTGRES_USER="${POSTGRES_USER:-homelabs}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-homelabs_password}"

# 日志配置
LOG_DIR="${LOGS_DIR:-/app/logs}"
PG_LOG_DIR="${LOG_DIR}/postgresql"
APP_LOG_DIR="${LOG_DIR}/app"
COMBINED_LOG="${LOG_DIR}/combined.log"

# 设置本地数据库连接URL（使用 localhost）
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?schema=public"

# ========================================
# 日志函数
# ========================================
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_line="[$timestamp] [$level] $message"
    echo "$log_line"
    echo "$log_line" >> "$COMBINED_LOG" 2>/dev/null || true
}

log_info() { log "INFO" "$1"; }
log_warn() { log "WARN" "$1"; }
log_error() { log "ERROR" "$1"; }

# ========================================
# 0. 初始化日志系统
# ========================================
echo ""
echo "0️⃣  初始化日志系统..."

# 创建日志目录结构
mkdir -p "$PG_LOG_DIR" "$APP_LOG_DIR"
chmod 755 "$LOG_DIR" "$PG_LOG_DIR" "$APP_LOG_DIR"

# PostgreSQL 日志目录需要 postgres 用户权限
chown -R postgres:postgres "$PG_LOG_DIR"

# 应用日志目录需要 nextjs 用户权限
chown -R nextjs:nodejs "$APP_LOG_DIR"

# 初始化组合日志文件
touch "$COMBINED_LOG"
chmod 666 "$COMBINED_LOG"

log_info "日志系统初始化完成"
log_info "日志目录结构:"
log_info "  - PostgreSQL 日志: $PG_LOG_DIR"
log_info "  - 应用日志: $APP_LOG_DIR"
log_info "  - 组合日志: $COMBINED_LOG"

echo "📋 配置信息:"
echo "  数据库: $POSTGRES_DB"
echo "  用户: $POSTGRES_USER"
echo "  数据目录: $PGDATA"
echo "  日志目录: $LOG_DIR"
echo ""

# ========================================
# 1. 初始化 PostgreSQL
# ========================================
log_info "1️⃣  初始化 PostgreSQL..."

# 检查数据目录是否已初始化
if [ ! -s "$PGDATA/PG_VERSION" ]; then
    log_info "首次启动，初始化数据库..."
    
    # 确保数据目录存在且权限正确
    mkdir -p "$PGDATA"
    chown -R postgres:postgres "$PGDATA"
    chmod 700 "$PGDATA"
    
    # 初始化数据库
    su-exec postgres initdb -D "$PGDATA" --encoding=UTF8 --locale=C
    
    # 配置 PostgreSQL 允许本地连接
    echo "host all all 127.0.0.1/32 md5" >> "$PGDATA/pg_hba.conf"
    echo "host all all ::1/128 md5" >> "$PGDATA/pg_hba.conf"
    echo "local all all trust" >> "$PGDATA/pg_hba.conf"
    
    # 配置监听地址和日志
    cat >> "$PGDATA/postgresql.conf" <<PGCONF

# ========================================
# 网络配置
# ========================================
listen_addresses = 'localhost'
port = 5432

# ========================================
# 日志配置 (All-in-One 模式优化)
# ========================================
# 日志输出目标
logging_collector = on
log_directory = '${PG_LOG_DIR}'
log_filename = 'postgresql-%Y-%m-%d.log'
log_file_mode = 0644

# 日志轮转
log_rotation_age = 1d
log_rotation_size = 100MB
log_truncate_on_rotation = off

# 日志内容配置
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_timezone = 'UTC'

# 记录级别
log_min_messages = warning
log_min_error_statement = error

# 记录连接信息
log_connections = on
log_disconnections = on

# 记录慢查询 (超过 1 秒)
log_min_duration_statement = 1000

# 记录检查点
log_checkpoints = on

# 记录锁等待
log_lock_waits = on

# 记录临时文件使用
log_temp_files = 0

# 记录自动清理
log_autovacuum_min_duration = 0
PGCONF

    log_info "数据库初始化完成"
else
    log_info "数据库已初始化，跳过"
    
    # 确保日志配置是最新的（更新现有配置）
    if ! grep -q "log_directory = '${PG_LOG_DIR}'" "$PGDATA/postgresql.conf" 2>/dev/null; then
        log_info "更新 PostgreSQL 日志配置..."
        # 追加或更新日志配置
        sed -i '/^logging_collector/d' "$PGDATA/postgresql.conf" 2>/dev/null || true
        sed -i '/^log_directory/d' "$PGDATA/postgresql.conf" 2>/dev/null || true
        sed -i '/^log_filename/d' "$PGDATA/postgresql.conf" 2>/dev/null || true
        
        cat >> "$PGDATA/postgresql.conf" <<PGCONF_UPDATE

# 日志配置 (自动更新)
logging_collector = on
log_directory = '${PG_LOG_DIR}'
log_filename = 'postgresql-%Y-%m-%d.log'
log_file_mode = 0644
PGCONF_UPDATE
    fi
fi

# ========================================
# 2. 启动 PostgreSQL
# ========================================
echo ""
log_info "2️⃣  启动 PostgreSQL..."

# 确保运行目录存在
mkdir -p /run/postgresql
chown postgres:postgres /run/postgresql

# 启动 PostgreSQL（使用日志收集器）
# 注意：当 logging_collector = on 时，不需要 -l 参数
su-exec postgres pg_ctl -D "$PGDATA" -w start 2>&1 | tee -a "$COMBINED_LOG"

log_info "PostgreSQL 已启动"

# 验证日志文件创建
sleep 2
if ls "$PG_LOG_DIR"/*.log 1> /dev/null 2>&1; then
    log_info "PostgreSQL 日志文件已创建:"
    ls -la "$PG_LOG_DIR"/*.log 2>/dev/null | head -3 | while read line; do
        log_info "  $line"
    done
else
    log_warn "PostgreSQL 日志文件尚未创建，可能需要等待"
fi

# ========================================
# 3. 创建数据库和用户
# ========================================
echo ""
log_info "3️⃣  配置数据库用户和权限..."

# 等待 PostgreSQL 就绪
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if su-exec postgres pg_isready -q; then
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    log_info "等待 PostgreSQL 就绪... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 1
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    log_error "PostgreSQL 启动超时！"
    exit 1
fi

# 创建用户和数据库（如果不存在）
su-exec postgres psql -v ON_ERROR_STOP=0 <<-EOSQL 2>&1 | tee -a "$COMBINED_LOG"
    -- 创建用户（如果不存在）
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${POSTGRES_USER}') THEN
            CREATE USER ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASSWORD}';
        ELSE
            ALTER USER ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASSWORD}';
        END IF;
    END
    \$\$;
    
    -- 创建数据库（如果不存在）
    SELECT 'CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER}'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${POSTGRES_DB}')\gexec
    
    -- 授予权限
    GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_USER};
EOSQL

log_info "数据库配置完成"

# ========================================
# 4. 运行 Prisma 数据库迁移
# ========================================
echo ""
log_info "4️⃣  运行 Prisma 数据库迁移..."

# 检查 Prisma 是否可用
PRISMA_CMD=""
if [ -f "node_modules/prisma/build/index.js" ]; then
    PRISMA_CMD="node node_modules/prisma/build/index.js"
elif [ -f "node_modules/.bin/prisma" ]; then
    PRISMA_CMD="node node_modules/.bin/prisma"
elif command -v npx > /dev/null 2>&1; then
    PRISMA_CMD="npx prisma"
fi

if [ -n "$PRISMA_CMD" ]; then
    log_info "使用 Prisma CLI: $PRISMA_CMD"
    
    # 运行数据库推送
    if $PRISMA_CMD db push --accept-data-loss --skip-generate 2>&1 | tee -a "$COMBINED_LOG"; then
        log_info "数据库迁移完成"
    else
        log_warn "数据库迁移失败，但继续启动..."
    fi
    
    # 验证 Prisma 客户端
    if [ ! -d "node_modules/.prisma/client" ]; then
        log_info "生成 Prisma 客户端..."
        $PRISMA_CMD generate 2>&1 | tee -a "$COMBINED_LOG" || log_warn "Prisma 客户端生成失败"
    fi
else
    log_warn "未找到 Prisma CLI，跳过数据库迁移"
fi

# ========================================
# 5. 启动日志监控（后台）
# ========================================
echo ""
log_info "5️⃣  启动日志监控..."

# 创建日志聚合脚本（后台运行）
cat > /tmp/log-aggregator.sh <<'LOGAGG'
#!/bin/bash
# 日志聚合器：将 PostgreSQL 和应用日志合并到组合日志

PG_LOG_DIR="$1"
COMBINED_LOG="$2"

# 监控 PostgreSQL 日志并追加到组合日志
while true; do
    # 找到最新的 PostgreSQL 日志文件
    LATEST_PG_LOG=$(ls -t "$PG_LOG_DIR"/*.log 2>/dev/null | head -1)
    if [ -n "$LATEST_PG_LOG" ]; then
        # 使用 tail -F 持续监控（支持日志轮转）
        tail -F "$LATEST_PG_LOG" 2>/dev/null | while read line; do
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] [POSTGRES] $line" >> "$COMBINED_LOG"
        done
    fi
    sleep 5
done
LOGAGG

chmod +x /tmp/log-aggregator.sh

# 启动日志聚合器（后台）
nohup /tmp/log-aggregator.sh "$PG_LOG_DIR" "$COMBINED_LOG" > /dev/null 2>&1 &
LOGAGG_PID=$!
log_info "日志聚合器已启动 (PID: $LOGAGG_PID)"

# ========================================
# 6. 清理旧日志（可选）
# ========================================
# 保留最近 7 天的日志
find "$PG_LOG_DIR" -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
find "$APP_LOG_DIR" -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
log_info "旧日志清理完成（保留 7 天）"

# ========================================
# 7. 启动 Next.js 应用
# ========================================
echo ""
log_info "6️⃣  启动 Next.js 应用..."
echo "=========================================="
echo "🌐 应用地址: http://localhost:3000"
echo "📊 数据库: localhost:5432/${POSTGRES_DB}"
echo ""
echo "📁 日志文件:"
echo "  PostgreSQL: $PG_LOG_DIR/postgresql-$(date +%Y-%m-%d).log"
echo "  应用日志: $APP_LOG_DIR/"
echo "  组合日志: $COMBINED_LOG"
echo "=========================================="
echo ""

log_info "Next.js 应用启动中..."

# 设置应用日志目录环境变量
export APP_LOG_DIR="$APP_LOG_DIR"
export LOGS_DIR="$LOG_DIR"

# 以 nextjs 用户身份运行应用，并将输出同时写入日志文件
exec su-exec nextjs sh -c "node server.js 2>&1 | tee -a '$APP_LOG_DIR/app-\$(date +%Y-%m-%d).log' '$COMBINED_LOG'"
