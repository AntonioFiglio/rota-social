import { useEffect } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";

import type {
  FamilyProfile,
  StudentProfile,
} from "../types/models";
import type { SuggestionItem } from "../domain/suggestions";
import MatchCard from "./MatchCard";

type CardInsight = {
  text: string;
  source?: string;
};

export type DeckItem = {
  suggestion: SuggestionItem;
  student: StudentProfile;
  family?: FamilyProfile;
  distanceKm?: number;
};

type MatchDeckProps = {
  current: DeckItem | null;
  nextItems: DeckItem[];
  insight?: CardInsight;
  canHelp: boolean;
  isAnimating: boolean;
  setAnimating: (value: boolean) => void;
  onDecision: (direction: "left" | "right") => Promise<boolean>;
  onDetails: (item: DeckItem) => void;
};

const swipeThreshold = 80;

const MatchDeck = ({
  current,
  nextItems,
  insight,
  canHelp,
  isAnimating,
  setAnimating,
  onDecision,
  onDetails,
}: MatchDeckProps) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-10, 10]);
  const acceptOpacity = useTransform(x, [0, 140], [0, 1]);
  const skipOpacity = useTransform(x, [-140, 0], [1, 0]);

  useEffect(() => {
    x.set(0);
  }, [current?.student.id, x]);

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">
        <p className="text-lg font-semibold text-neutral-900">Tudo em dia! ✅</p>
        <p className="text-sm">
          Você revisou todas as sugestões atuais. Sincronize a zona ou aguarde novas demandas.
        </p>
      </div>
    );
  }

  const triggerDecision = async (direction: "left" | "right") => {
    if (isAnimating) return;

    setAnimating(true);
    await animate(x, direction === "right" ? 280 : -280, { duration: 0.25 });
    const success = await onDecision(direction);
    if (!success) {
      await animate(x, 0, { duration: 0.2 });
    } else {
      x.set(0);
    }
    setAnimating(false);
  };

  const handleDragEnd = async (
    _: unknown,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => {
    const { x: offsetX } = info.offset;
    const { x: velocityX } = info.velocity;
    if (offsetX > swipeThreshold || velocityX > 600) {
      await triggerDecision("right");
      return;
    }
    if (offsetX < -swipeThreshold || velocityX < -600) {
      await triggerDecision("left");
      return;
    }
    await animate(x, 0, { duration: 0.2 });
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-[460px] w-full max-w-sm">
        {nextItems.map((item, offset) => (
          <div
            key={item.student.id}
            className="absolute left-0 right-0 top-0 mx-auto scale-95 opacity-60"
            style={{
              transform: `translateY(${(offset + 1) * 16}px) scale(${1 - (offset + 1) * 0.06})`,
            }}
          >
            <MatchCard
              student={item.student}
              family={item.family}
              suggestion={item.suggestion}
              distanceKm={item.distanceKm}
              canHelp={false}
              onHelp={() => {}}
              onSkip={() => {}}
              onSeeMore={() => onDetails(item)}
            />
          </div>
        ))}

        <motion.div
          key={current.student.id}
          className="absolute inset-0 mx-auto"
          style={{ x, rotate }}
          drag="x"
          dragConstraints={{ left: -240, right: 240 }}
          dragElastic={0.35}
          onDragEnd={(event, info) => {
            void handleDragEnd(event, info);
          }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.span
            className="absolute left-3 top-3 rounded-full bg-warning-500/80 px-3 py-1 text-xs font-semibold text-white"
            style={{ opacity: skipOpacity }}
          >
            Pular
          </motion.span>
          <motion.span
            className="absolute right-3 top-3 rounded-full bg-success-500/80 px-3 py-1 text-xs font-semibold text-white"
            style={{ opacity: acceptOpacity }}
          >
            Ajudar
          </motion.span>
          <MatchCard
            student={current.student}
            family={current.family}
            suggestion={current.suggestion}
            distanceKm={current.distanceKm}
            insight={insight}
            canHelp={canHelp && !isAnimating}
            onHelp={() => {
              void triggerDecision("right");
            }}
            onSkip={() => {
              void triggerDecision("left");
            }}
            onSeeMore={() => onDetails(current)}
          />
        </motion.div>
      </div>

      <p className="text-xs text-neutral-500">
        Arraste para apoiar ou pular • Toque em "Ver mais" para aprofundar o caso
      </p>
    </div>
  );
};

export default MatchDeck;
