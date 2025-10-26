import { useEffect, useMemo, useState } from "react";
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
import {
  STUDENT_NAME_PLACEHOLDER,
  useStudentNames,
} from "../store/useStudentDirectory";

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
  onHelp: () => Promise<boolean>;
  onSkip: () => Promise<boolean>;
  onDetails: (item: DeckItem) => void;
};

const swipeThreshold = 80;

const MatchDeck = ({
  current,
  nextItems,
  insight,
  canHelp,
  onHelp,
  onSkip,
  onDetails,
}: MatchDeckProps) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-10, 10]);
  const acceptOpacity = useTransform(x, [60, 160], [0, 1]);
  const skipOpacity = useTransform(x, [-160, -60], [1, 0]);
  const [isAnimating, setIsAnimating] = useState(false);

  const trackedIds = useMemo(() => {
    const ids: string[] = [];
    if (current) {
      ids.push(current.student.id);
    }
    nextItems.forEach((item) => {
      ids.push(item.student.id);
    });
    return ids;
  }, [current, nextItems]);

  const namesMap = useStudentNames(trackedIds);

  useEffect(() => {
    x.set(0);
    setIsAnimating(false);
  }, [current?.student.id, x]);

  const triggerDecision = async (direction: "left" | "right") => {
    if (isAnimating || !current) return;
    setIsAnimating(true);
    await animate(x, direction === "right" ? 320 : -320, {
      duration: 0.22,
      ease: "easeOut",
    });
    const success = await (direction === "right" ? onHelp() : onSkip());
    if (!success) {
      await animate(x, 0, { duration: 0.18, ease: "easeOut" });
      setIsAnimating(false);
      return;
    }
    x.set(0);
    setIsAnimating(false);
  };

  const handleDragEnd = async (
    _: unknown,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => {
    if (isAnimating || !current) return;
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
    await animate(x, 0, { duration: 0.18, ease: "easeOut" });
  };

  if (!current) {
    return (
      <div className="flex h-[440px] w-full max-w-sm flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-neutral-300 bg-white/70 p-6 text-center text-neutral-600 shadow-inner">
        <p className="text-lg font-semibold text-neutral-900">
          Tudo em dia! ✅
        </p>
        <p className="text-sm">
          Nenhuma sugestão pendente. Toque em &ldquo;Atualizar&rdquo; para buscar novos
          casos ou aguarde notificações.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex w-full max-w-sm justify-center">
      {nextItems.map((item, index) => (
        <div
          key={item.student.id}
          className="pointer-events-none absolute inset-x-6 top-6 mx-auto scale-95 opacity-50"
          style={{
            transform: `translateY(${(index + 1) * 18}px) scale(${
              1 - (index + 1) * 0.06
            })`,
          }}
          >
            <MatchCard
              student={item.student}
              studentName={
                namesMap[item.student.id] ?? STUDENT_NAME_PLACEHOLDER
              }
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
        className="relative z-10 w-full"
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: -280, right: 280 }}
        dragElastic={0.4}
        onDragEnd={(event, info) => {
          void handleDragEnd(event, info);
        }}
        whileTap={{ scale: 0.97 }}
      >
        <motion.span
          className="pointer-events-none absolute left-3 top-3 rounded-full bg-warning-500/80 px-3 py-1 text-xs font-semibold text-white"
          style={{ opacity: skipOpacity }}
        >
          Pular
        </motion.span>
        <motion.span
          className="pointer-events-none absolute right-3 top-3 rounded-full bg-success-500/80 px-3 py-1 text-xs font-semibold text-white"
          style={{ opacity: acceptOpacity }}
        >
          Ajudar
        </motion.span>
        <MatchCard
          student={current.student}
          studentName={
            namesMap[current.student.id] ?? STUDENT_NAME_PLACEHOLDER
          }
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
  );
};

export default MatchDeck;
