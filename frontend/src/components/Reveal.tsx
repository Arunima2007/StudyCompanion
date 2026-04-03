import {
  type CSSProperties,
  type HTMLAttributes,
  type PropsWithChildren,
  useEffect,
  useRef,
  useState
} from "react";
import { cn } from "../lib/utils";

type RevealProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    delay?: number;
    direction?: "up" | "left" | "right";
    once?: boolean;
  }
>;

export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
  once = true,
  ...props
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) {
            observer.unobserve(entry.target);
          }
          return;
        }

        if (!once) {
          setVisible(false);
        }
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      className={cn(
        "reveal",
        direction === "up" && "reveal-up",
        direction === "left" && "reveal-left",
        direction === "right" && "reveal-right",
        visible && "reveal-visible",
        className
      )}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
}
