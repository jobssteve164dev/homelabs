import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AuthSession } from '@/types/auth';
import { StarForm } from '@/components/dashboard/StarForm';
import { prisma } from '@/lib/db';

export default async function StarPage() {
  const session = await getServerSession(authOptions) as AuthSession | null;

  if (!session) {
    redirect('/auth/signin');
  }

  // 查询用户是否已经有恒星项目
  const existingStar = await prisma.project.findFirst({
    where: {
      authorId: session.user.id,
      projectType: 'STAR',
    },
  });

  return (
    <div className="min-h-screen bg-sci-darker py-12 px-4">
      <StarForm 
        mode={existingStar ? 'edit' : 'create'}
        initialData={existingStar ? {
          title: existingStar.title,
          userTitle: existingStar.userTitle || undefined,
          userBio: existingStar.userBio || undefined,
          userSkills: existingStar.userSkills as string[] | undefined,
          socialLinks: existingStar.socialLinks as {
            github?: string;
            linkedin?: string;
            twitter?: string;
            website?: string;
            email?: string;
          } | undefined,
        } : undefined}
      />
    </div>
  );
}

