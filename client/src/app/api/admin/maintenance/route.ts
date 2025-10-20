import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// 验证管理员权限
async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return false;
  }
  
  return true;
}

// POST /api/admin/maintenance - 执行维护操作
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'clear-cache':
        return await handleClearCache();
      
      case 'backup':
        return await handleBackup();
      
      case 'restart':
        return await handleRestart();
      
      default:
        return NextResponse.json(
          { error: '无效的操作类型' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('维护操作错误:', error);
    return NextResponse.json(
      { error: '操作失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// 清理缓存
async function handleClearCache() {
  try {
    const cacheDir = path.join(process.cwd(), '.next/cache');
    
    // 检查缓存目录是否存在
    try {
      await fs.access(cacheDir);
      
      // 清理 .next/cache 目录
      await fs.rm(cacheDir, { recursive: true, force: true });
      
      // 重新创建空的缓存目录
      await fs.mkdir(cacheDir, { recursive: true });
      
      console.log('缓存清理成功');
    } catch {
      // 如果目录不存在，直接创建
      await fs.mkdir(cacheDir, { recursive: true });
    }

    return NextResponse.json({
      success: true,
      message: '缓存清理成功',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('清理缓存失败:', error);
    throw new Error('清理缓存失败');
  }
}

// 备份数据
async function handleBackup() {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}.sql`);

    // 确保备份目录存在
    await fs.mkdir(backupDir, { recursive: true });

    // 获取数据库URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('数据库配置未找到');
    }

    // 解析数据库连接信息
    const dbUrl = new URL(databaseUrl);
    const dbName = dbUrl.pathname.slice(1);
    const dbUser = dbUrl.username;
    const dbPassword = dbUrl.password;
    const dbHost = dbUrl.hostname;
    const dbPort = dbUrl.port || '5432';

    // 使用 pg_dump 备份 PostgreSQL 数据库
    const pgDumpCommand = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F c -f ${backupPath}`;

    try {
      await execAsync(pgDumpCommand);
      console.log(`数据库备份成功: ${backupPath}`);
    } catch {
      // 如果 pg_dump 不可用，使用 Prisma 进行数据导出
      console.warn('pg_dump 不可用，使用备用备份方案');
      
      // 使用 Prisma 导出数据
      const { prisma } = await import('@/lib/db');
      
      // 导出所有数据
      const users = await prisma.user.findMany();
      const projects = await prisma.project.findMany();
      
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          users,
          projects
        }
      };
      
      // 保存为JSON格式
      const jsonBackupPath = backupPath.replace('.sql', '.json');
      await fs.writeFile(jsonBackupPath, JSON.stringify(backupData, null, 2));
      console.log(`数据库备份成功 (JSON格式): ${jsonBackupPath}`);
    }

    // 清理旧备份（保留最近10个）
    const backupFiles = await fs.readdir(backupDir);
    const sortedBackups = backupFiles
      .filter(file => file.startsWith('backup-'))
      .sort()
      .reverse();

    // 删除超过10个的旧备份
    for (let i = 10; i < sortedBackups.length; i++) {
      const oldBackupPath = path.join(backupDir, sortedBackups[i]);
      await fs.unlink(oldBackupPath);
      console.log(`删除旧备份: ${sortedBackups[i]}`);
    }

    return NextResponse.json({
      success: true,
      message: '数据备份成功',
      backupFile: path.basename(backupPath),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('数据备份失败:', error);
    throw new Error('数据备份失败: ' + (error instanceof Error ? error.message : '未知错误'));
  }
}

// 系统重启
async function handleRestart() {
  try {
    // 记录重启操作
    console.log('系统重启请求已接收');

    // 在生产环境中，这应该触发进程管理器（如PM2）的重启
    // 在开发环境中，我们只记录日志
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      console.log('开发环境：系统重启请求已记录，但不会实际重启');
      return NextResponse.json({
        success: true,
        message: '开发环境：系统重启请求已记录',
        note: '在开发环境中，请手动重启服务器',
        timestamp: new Date().toISOString()
      });
    }

    // 生产环境：延迟3秒后退出进程，让进程管理器自动重启
    setTimeout(() => {
      console.log('执行系统重启...');
      process.exit(0);
    }, 3000);

    return NextResponse.json({
      success: true,
      message: '系统重启指令已发送，服务将在3秒后重启',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('系统重启失败:', error);
    throw new Error('系统重启失败');
  }
}

