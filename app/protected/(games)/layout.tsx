import { GameNavbar } from '@/components/game-navbar';

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <GameNavbar />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}