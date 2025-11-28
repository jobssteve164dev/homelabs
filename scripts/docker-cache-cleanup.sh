#!/bin/bash
# Docker 缓存清理脚本
# 用于定期清理Docker构建缓存和未使用的资源，防止磁盘空间耗尽

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 显示磁盘使用情况
show_disk_usage() {
    echo ""
    echo "================================================"
    echo "   Docker 磁盘使用情况"
    echo "================================================"
    docker system df
    echo "================================================"
    echo ""
}

# 显示帮助信息
show_help() {
    cat << EOF
Docker 缓存清理脚本

用法:
    $0 [选项]

选项:
    --light     轻度清理（仅清理悬空镜像和停止的容器）
    --medium    中度清理（清理悬空镜像、停止的容器、未使用的网络）
    --deep      深度清理（清理所有未使用资源，包括部分构建缓存）
    --full      完全清理（清理所有缓存，慎用！）
    --dry-run   模拟运行，不实际删除
    --help      显示此帮助信息

示例:
    $0 --light                    # 日常轻度清理（推荐）
    $0 --medium                   # 每周中度清理
    $0 --deep --dry-run          # 模拟深度清理
    $0 --full                     # 磁盘空间紧急时使用

清理级别说明:
    轻度: 清理悬空镜像和停止的容器（保留所有缓存）
    中度: 额外清理未使用的网络和卷（保留大部分缓存）
    深度: 清理7天以上的构建缓存（保留最近的缓存）
    完全: 清理所有缓存和未使用资源（需要重新构建）

EOF
}

# 检查磁盘空间
check_disk_space() {
    local available=$(df /var/lib/docker 2>/dev/null | awk 'NR==2 {print $4}' || echo "0")
    local available_gb=$((available / 1024 / 1024))
    
    log_info "可用磁盘空间: ${available_gb}GB"
    
    if [ "$available_gb" -lt 5 ]; then
        log_error "磁盘空间不足 5GB！建议立即清理"
        return 1
    elif [ "$available_gb" -lt 10 ]; then
        log_warning "磁盘空间少于 10GB，建议进行清理"
    else
        log_success "磁盘空间充足"
    fi
    
    return 0
}

# 轻度清理
cleanup_light() {
    log_info "开始轻度清理..."
    
    # 清理悬空镜像
    log_info "清理悬空镜像（<none>:<none>）..."
    if [ "$DRY_RUN" = "true" ]; then
        docker images -f "dangling=true" -q | wc -l | xargs -I {} echo "   将清理 {} 个悬空镜像"
    else
        DANGLING=$(docker images -f "dangling=true" -q 2>/dev/null || true)
        if [ -n "$DANGLING" ]; then
            docker rmi $DANGLING 2>/dev/null || true
            log_success "悬空镜像已清理"
        else
            log_info "没有悬空镜像需要清理"
        fi
    fi
    
    # 清理已停止的容器
    log_info "清理已停止的容器..."
    if [ "$DRY_RUN" = "true" ]; then
        docker ps -a -f "status=exited" -f "status=created" -q | wc -l | xargs -I {} echo "   将清理 {} 个已停止的容器"
    else
        docker container prune -f
        log_success "已停止的容器已清理"
    fi
    
    log_success "轻度清理完成"
}

# 中度清理
cleanup_medium() {
    log_info "开始中度清理..."
    
    cleanup_light
    
    # 清理未使用的网络
    log_info "清理未使用的网络..."
    if [ "$DRY_RUN" = "true" ]; then
        docker network ls -f "type=custom" -q | wc -l | xargs -I {} echo "   将检查 {} 个自定义网络"
    else
        docker network prune -f
        log_success "未使用的网络已清理"
    fi
    
    # 清理未使用的卷（小心！）
    log_warning "清理未使用的卷..."
    if [ "$DRY_RUN" = "true" ]; then
        docker volume ls -f "dangling=true" -q | wc -l | xargs -I {} echo "   将清理 {} 个未使用的卷"
    else
        # 只清理悬空卷，不清理所有未使用的卷
        docker volume ls -f "dangling=true" -q | xargs -r docker volume rm 2>/dev/null || true
        log_success "悬空卷已清理"
    fi
    
    log_success "中度清理完成"
}

# 深度清理
cleanup_deep() {
    log_info "开始深度清理..."
    
    cleanup_medium
    
    # 清理7天以上的构建缓存
    log_info "清理7天以上的构建缓存..."
    if [ "$DRY_RUN" = "true" ]; then
        echo "   将清理7天以上的构建缓存"
    else
        # 使用 --filter 只清理旧缓存
        docker buildx prune -f --filter "until=168h" 2>/dev/null || \
        docker builder prune -f --filter "until=168h" 2>/dev/null || \
        log_warning "无法清理构建缓存（可能不支持此命令）"
        log_success "旧构建缓存已清理"
    fi
    
    log_success "深度清理完成"
}

# 完全清理
cleanup_full() {
    log_error "⚠️  警告：完全清理将删除所有构建缓存和未使用资源！"
    log_error "⚠️  下次构建将需要重新下载所有依赖，可能需要很长时间！"
    
    if [ "$DRY_RUN" != "true" ]; then
        echo ""
        read -p "确定要继续吗？(输入 YES 确认): " confirm
        if [ "$confirm" != "YES" ]; then
            log_info "已取消完全清理"
            exit 0
        fi
    fi
    
    log_info "开始完全清理..."
    
    cleanup_medium
    
    # 清理所有未使用的镜像
    log_warning "清理所有未使用的镜像..."
    if [ "$DRY_RUN" = "true" ]; then
        docker images -q | wc -l | xargs -I {} echo "   将清理未使用的镜像"
    else
        docker image prune -a -f
        log_success "未使用的镜像已清理"
    fi
    
    # 清理所有构建缓存
    log_warning "清理所有构建缓存..."
    if [ "$DRY_RUN" = "true" ]; then
        echo "   将清理所有构建缓存"
    else
        docker buildx prune -a -f 2>/dev/null || \
        docker builder prune -a -f 2>/dev/null || \
        log_warning "无法清理构建缓存（可能不支持此命令）"
        log_success "所有构建缓存已清理"
    fi
    
    log_success "完全清理完成"
}

# 主函数
main() {
    # 解析参数
    MODE="light"
    DRY_RUN="false"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --light)
                MODE="light"
                shift
                ;;
            --medium)
                MODE="medium"
                shift
                ;;
            --deep)
                MODE="deep"
                shift
                ;;
            --full)
                MODE="full"
                shift
                ;;
            --dry-run)
                DRY_RUN="true"
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 显示模式
    if [ "$DRY_RUN" = "true" ]; then
        log_warning "运行模式: 模拟运行（不实际删除）"
    fi
    
    echo ""
    echo "================================================"
    echo "   Docker 缓存清理工具"
    echo "   模式: ${MODE}"
    echo "================================================"
    echo ""
    
    # 显示清理前的磁盘使用情况
    log_info "清理前磁盘使用情况:"
    show_disk_usage
    check_disk_space || true
    
    # 执行清理
    case $MODE in
        light)
            cleanup_light
            ;;
        medium)
            cleanup_medium
            ;;
        deep)
            cleanup_deep
            ;;
        full)
            cleanup_full
            ;;
    esac
    
    # 显示清理后的磁盘使用情况
    if [ "$DRY_RUN" != "true" ]; then
        echo ""
        log_info "清理后磁盘使用情况:"
        show_disk_usage
        check_disk_space || true
    fi
    
    log_success "清理任务完成！"
}

# 运行主函数
main "$@"

