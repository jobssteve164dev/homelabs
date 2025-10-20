#!/usr/bin/env tsx

import { PrismaClient, Role } from '@prisma/client';
import readline from 'readline';

const prisma = new PrismaClient();

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function ask(question: string): Promise<string> {
  const rl = createInterface();
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function main() {
  console.log('\n=== Promote User to ADMIN ===');

  let email = process.argv[2] || '';
  if (!email) {
    email = await ask('请输入要提升为管理员的邮箱: ');
  }

  if (!isValidEmail(email)) {
    console.error('\n❌ 邮箱格式不正确:', email);
    process.exit(1);
  }

  console.log(`\n目标邮箱: ${email}`);
  const confirm = (await ask('确认将该用户设为 ADMIN? (y/N): ')).toLowerCase();
  if (confirm !== 'y' && confirm !== 'yes') {
    console.log('已取消');
    process.exit(0);
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error('\n❌ 未找到该邮箱的用户');
      process.exit(1);
    }

    if (user.role === Role.ADMIN) {
      console.log('\nℹ️ 该用户已是 ADMIN，无需变更');
      process.exit(0);
    }

    const updated = await prisma.user.update({ where: { id: user.id }, data: { role: Role.ADMIN } });
    console.log('\n✅ 提升成功');
    console.log(`用户: ${updated.name ?? '(未命名)'} <${updated.email}>`);
    console.log(`角色: ${user.role} -> ${updated.role}`);
  } catch (error) {
    console.error('\n❌ 操作失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


