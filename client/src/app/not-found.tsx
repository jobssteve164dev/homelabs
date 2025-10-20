import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-sci-darker">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-neon-blue mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">页面未找到</h2>
        <p className="text-foreground/60 mb-8">抱歉，您访问的页面不存在。</p>
        <Link 
          href="/"
          className="inline-block px-6 py-3 bg-neon-blue/20 border border-neon-blue/30 text-neon-blue rounded-lg hover:bg-neon-blue/30 transition-all"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}

