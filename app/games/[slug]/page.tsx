import { notFound } from "next/navigation";
import Image from "next/image";
import { dbService } from "@/lib/db-service";
import { TopupForm } from "@/components/topup-form";
import { ShieldCheck, Zap, Diamond, Award, Clock, HelpCircle } from "lucide-react";
import type { Metadata } from "next";

interface GamePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await dbService.getGameBySlug(slug);
  if (!game) return { title: "Game Not Found | អាណាចក្រDiamond" };

  return {
    title: `បញ្ចូលពេជ្រ ${game.name} (${game.nameKh}) | អាណាចក្រDiamond KHQR`,
    description: `បញ្ចូលពេជ្រ ${game.name} ស្វ័យប្រវត្តិតាម Bakong KHQR ទទួលបានពេជ្រក្នុង 5 វិនាទី។ តម្លៃពិសេសសម្រាប់អ្នកលេងហ្គេមនៅកម្ពុជា!`,
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = await dbService.getGameBySlug(slug);

  if (!game) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Game Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 bg-gradient-to-r from-[#090e1c] via-[#10182f] to-[#090e1c] p-6 lg:p-10 shadow-2xl">
        <div className="absolute inset-0 opacity-25 mix-blend-luminosity pointer-events-none">
          <Image
            src={game.bannerUrl}
            alt={game.name}
            fill
            className="object-cover object-center"
            unoptimized
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative w-24 h-24 lg:w-28 lg:h-28 rounded-2xl overflow-hidden border-2 border-cyan-400 shadow-neon-cyan flex-shrink-0">
            <Image
              src={game.iconUrl}
              alt={game.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase font-display">
                {game.publisher}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                ⚡ ស្វ័យប្រវត្តិ 24/7
              </span>
            </div>

            <h1 className="text-2xl lg:text-4xl font-extrabold text-white tracking-tight">
              {game.name}
            </h1>
            <p className="text-sm lg:text-base text-cyan-300 font-medium">
              {game.nameKh}
            </p>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>ចូលពេជ្រក្នុង 5-10 វិនាទី</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>MooGold API ផ្លូវការ</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>តម្លៃធូរថ្លៃបំផុតនៅខ្មែរ</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>គាំទ្រ Bakong KHQR 24/7</span>
          </div>
        </div>
      </div>

      {/* Main Top-up Interactive Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <TopupForm game={game} />
        </div>

        {/* Sidebar Info & Instructions */}
        <div className="space-y-6">
          {/* How it works */}
          <div className="glass-card rounded-2xl p-6 border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>របៀបបញ្ចូលពេជ្រ (How to top-up)</span>
            </h3>

            <ol className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold flex-shrink-0">1</span>
                <span>បញ្ចូល <strong>User ID</strong> និង <strong>Zone ID</strong> របស់អ្នក រួចចុច "ផ្ទៀងផ្ទាត់ឈ្មោះ"។</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold flex-shrink-0">2</span>
                <span>ជ្រើសរើសចំនួនពេជ្រដែលអ្នកចង់ទិញ។</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold flex-shrink-0">3</span>
                <span>ចុច "ទូទាត់ប្រាក់តាម KHQR" រួចស្កេនតាម App ធនាគាររបស់អ្នក (ABA, ACLEDA, Wing, etc.)។</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold flex-shrink-0">4</span>
                <span>ពេជ្រនឹងបញ្ជូនចូលគណនីហ្គេមរបស់អ្នកភ្លាមៗ!</span>
              </li>
            </ol>
          </div>

          {/* Guarantee Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c182a] to-[#070e1a] border border-cyan-500/30 space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <Diamond className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>ធានាសុវត្ថិភាព 100% (Safety Guarantee)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              មិនត្រូវការ Password ទេ! បញ្ចូលតែ User ID និង Zone ID គឺមានសុវត្ថិភាពខ្ពស់បំផុត និងមិនមានហានិភ័យបាត់បង់គណនីឡើយ។
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
