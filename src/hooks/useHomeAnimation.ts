import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface UseHomeAnimationProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isYearly: boolean;
}

export const useHomeAnimation = ({ containerRef, isYearly }: UseHomeAnimationProps) => {
  const isHeroStateRef = useRef<boolean>(true);
  const introTlRef = useRef<gsap.core.Timeline | null>(null);

  // Animate pricing toggle slider when isYearly changes
  useEffect(() => {
    if (!containerRef.current) return;

    const toggleMonthly = containerRef.current.querySelector("#toggle-monthly") as HTMLElement;
    const toggleYearly = containerRef.current.querySelector("#toggle-yearly") as HTMLElement;
    const slider = containerRef.current.querySelector("#pricing-toggle-slider") as HTMLElement;

    if (!toggleMonthly || !toggleYearly || !slider) return;

    const activeBtn = isYearly ? toggleYearly : toggleMonthly;
    
    gsap.to(slider, {
      left: activeBtn.offsetLeft,
      width: activeBtn.offsetWidth,
      duration: 0.3,
      ease: "power2.out",
    });
  }, [isYearly, containerRef]);

  // Main ScrollTrigger and GSAP setup
  useEffect(() => {
    const rootEl = containerRef.current;
    if (!rootEl) return;

    // Use gsap.context to isolate and safely clean up all animations
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".cardItem");
      const texts = gsap.utils.toArray<HTMLElement>(".stepText");
      const tags = gsap.utils.toArray<HTMLElement>(".floatingTag");
      
      const isMobile = window.innerWidth < 768;

      // 1. Initialize Positions & Scales
      gsap.set(texts, { yPercent: -50, y: 30, opacity: 0 });
      gsap.set(cards, {
        xPercent: -50,
        yPercent: -50,
        x: 0,
        y: 0,
        opacity: 0,
        scale: 0.8,
      });
      gsap.set(tags, {
        xPercent: -50,
        yPercent: -50,
        opacity: 0,
        scale: 0.8,
      });

      // Calculate spread values dynamically based on viewport width
      const getHeroSpread = () => {
        const width = window.innerWidth;
        if (width < 640) {
          return [
            { x: -80, y: 0, rot: -12, scale: 0.82, z: 1 },
            { x: -40, y: 0, rot: -6, scale: 0.88, z: 2 },
            { x: 0, y: 0, rot: 0, scale: 1.0, z: 5 }, // Center
            { x: 40, y: 0, rot: 6, scale: 0.88, z: 4 },
            { x: 80, y: 0, rot: 12, scale: 0.82, z: 3 },
          ];
        } else if (width < 1024) {
          const factor = (width - 640) / (1024 - 640);
          const spreadX = 90 + factor * 70;
          return [
            { x: -spreadX * 1.8, y: 0, rot: -14, scale: 0.85, z: 1 },
            { x: -spreadX * 0.9, y: 0, rot: -7, scale: 0.9, z: 2 },
            { x: 0, y: 0, rot: 0, scale: 1.05, z: 5 }, // Center
            { x: spreadX * 0.9, y: 0, rot: 7, scale: 0.9, z: 4 },
            { x: spreadX * 1.8, y: 0, rot: 14, scale: 0.85, z: 3 },
          ];
        } else {
          return [
            { x: -320, y: 0, rot: -16, scale: 0.9, z: 1 },
            { x: -160, y: 0, rot: -8, scale: 0.95, z: 2 },
            { x: 0, y: 0, rot: 0, scale: 1.1, z: 5 }, // Center
            { x: 160, y: 0, rot: 8, scale: 0.95, z: 4 },
            { x: 320, y: 0, rot: 16, scale: 0.9, z: 3 },
          ];
        }
      };

      const getTagPos = () => {
        const width = window.innerWidth;
        if (width < 640) {
          return [
            { x: -120, y: -10 },
            { x: 120, y: -10 },
            { x: 70, y: 190 },
          ];
        } else if (width < 1024) {
          const factor = (width - 640) / (1024 - 640);
          const spreadX = 180 + factor * 140;
          return [
            { x: -spreadX, y: -20 },
            { x: spreadX, y: -20 },
            { x: spreadX * 0.6, y: 220 },
          ];
        } else {
          return [
            { x: -420, y: -30 },
            { x: 420, y: -30 },
            { x: 260, y: 280 },
          ];
        }
      };

      const spread = getHeroSpread();
      const tagPos = getTagPos();

      // Apply initial z-indexes
      spread.forEach((pos, i) => {
        if (cards[i]) gsap.set(cards[i], { zIndex: pos.z });
      });

      // 2. Play Intro Animation
      const introTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      introTlRef.current = introTl;

      introTl
        .to(cards, { opacity: 1, duration: 0.6, stagger: 0.05 })
        .to(
          cards,
          {
            x: (i) => spread[i].x,
            y: (i) => spread[i].y,
            rotation: (i) => spread[i].rot,
            scale: (i) => spread[i].scale,
            duration: 1.2,
            stagger: 0.02,
          },
          "-=0.2"
        )
        .to(
          tags,
          {
            x: (i) => tagPos[i].x,
            y: (i) => tagPos[i].y,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: "back.out(1.5)",
            stagger: 0.1,
          },
          "-=0.8"
        );

      // Fast-forward intro animation if already scrolled down
      if (window.scrollY > 5) {
        introTl.progress(1).kill();
      } else {
        const handleScroll = () => {
          if (window.scrollY > 5) {
            introTl.progress(1).kill();
            window.removeEventListener("scroll", handleScroll);
          }
        };
        window.addEventListener("scroll", handleScroll);
      }

      // Continuous Floating effect for tags
      gsap.to(tags, {
        y: "+=15",
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        stagger: { each: 0.3, from: "random" },
      });

      // Card hover animations (only active when in Hero/unscrolled state)
      cards.forEach((card, i) => {
        card.addEventListener("mouseenter", () => {
          if (!isHeroStateRef.current) return;
          gsap.to(card, {
            y: spread[i].y - 20,
            scale: spread[i].scale + 0.05,
            rotation: 0,
            zIndex: 20,
            duration: 0.4,
            boxShadow:
              "0 30px 60px -12px rgba(0,0,0,0.9), 0 0 0 1px rgba(99,102,241,0.5)",
          });
          cards.forEach(
            (c) =>
              c !== card &&
              gsap.to(c, { filter: "brightness(0.4)", duration: 0.4 })
          );
        });

        card.addEventListener("mouseleave", () => {
          if (!isHeroStateRef.current) return;
          gsap.to(card, {
            y: spread[i].y,
            scale: spread[i].scale,
            rotation: spread[i].rot,
            zIndex: spread[i].z,
            duration: 0.5,
            boxShadow: "none",
          });
          cards.forEach(
            (c) =>
              c !== card &&
              gsap.to(c, { filter: "brightness(1)", duration: 0.5 })
          );
        });
      });

      // 3. Scroll Story Stacking Timeline
      const getRightSideX = () => {
        const width = window.innerWidth;
        if (width < 651) return 0;
        if (width < 1200) return width * 0.22;
        return width * 0.25;
      };

      const getLeftOffScreen = () => {
        const width = window.innerWidth;
        if (width < 651) return -width;
        if (width < 1200) return -width * 0.45;
        return -width * 0.5;
      };

      const rightSideX = getRightSideX();
      const leftOffScreen = getLeftOffScreen();

      // Shifts standard centered card stack upwards as description shifts
      const recenterShift = -(1.02 - 0.5) * window.innerHeight;
      
      const getStackYOffset = () => {
        const width = window.innerWidth;
        if (width < 651) return recenterShift + window.innerHeight * 0.26;
        if (width < 1200) return recenterShift - 12;
        return recenterShift - 15;
      };

      const getActiveScale = () => {
        const width = window.innerWidth;
        if (width < 651) return 1.0;
        if (width < 1200) return 1.15;
        return 1.3;
      };

      const getRestingScale = () => {
        const width = window.innerWidth;
        if (width < 651) return 0.85;
        if (width < 1200) return 0.92;
        return 1.0;
      };

      const stackYOffset = getStackYOffset();
      const activeScale = getActiveScale();
      const restingScale = getRestingScale();

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#scroll-track",
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          onUpdate: (self) => {
            isHeroStateRef.current = self.progress === 0;
            if (self.progress > 0) {
              cards.forEach((c) => gsap.set(c, { filter: "brightness(1)" }));
            }
          },
        },
      });

      // Clear brightness dim on scroll start
      scrollTl.set(cards, { filter: "brightness(1)" }, 0);

      // Scroll Down & Fade Out Hero text/tags
      scrollTl
        .to("#hero-text", { opacity: 0, y: -50, duration: 1 }, 0)
        .to(tags, { opacity: 0, scale: 0.8, y: "+=40", duration: 0.5 }, 0)
        .to(cards, { y: "+=50", ease: "power1.inOut", duration: 1 }, 0);

      // Stack resting cards on the right side
      const restCards = cards.slice(1);
      scrollTl.to(
        restCards,
        {
          x: rightSideX,
          y: (i) => stackYOffset + (i + 1) * 2,
          rotation: (i) => (i + 1) * 1.5,
          scale: restingScale,
          opacity: 0.45,
          duration: 1.5,
          ease: "power2.inOut",
        },
        1
      );

      // Activate Step 1 Card & Text
      scrollTl.set(cards[0], { zIndex: 10 }, 1);
      scrollTl
        .to(texts[0], { opacity: 1, y: 0, duration: 1 }, 1.5)
        .to(
          cards[0],
          {
            x: rightSideX,
            opacity: 1,
            scale: activeScale,
            y: stackYOffset,
            rotation: 0,
            duration: 1.5,
            ease: "power2.inOut",
            boxShadow:
              "0 25px 50px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.2)",
          },
          1
        );

      // Helper function to handle transition step sequences
      const transitionStep = (prevIdx: number, nextIdx: number, startTime: number) => {
        scrollTl.to(texts[prevIdx], { opacity: 0, y: -30, duration: 1 }, startTime);
        scrollTl.to(texts[nextIdx], { opacity: 1, y: 0, duration: 1 }, startTime + 0.5);

        // Slide previous card left offscreen
        scrollTl.to(
          cards[prevIdx],
          {
            x: leftOffScreen,
            opacity: 0,
            scale: 0.8,
            rotation: -10,
            duration: 1.5,
          },
          startTime
        );

        // Bring next card to the center/top
        scrollTl.set(cards[nextIdx], { zIndex: 10 }, startTime + 0.5);
        scrollTl.to(
          cards[nextIdx],
          {
            x: rightSideX,
            y: stackYOffset,
            opacity: 1,
            scale: activeScale,
            rotation: 0,
            boxShadow:
              "0 30px 60px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.3)",
            duration: 1.5,
          },
          startTime + 0.5
        );
      };

      // Set transitions for all 5 cards
      transitionStep(0, 1, 3.5);
      transitionStep(1, 2, 6.5);
      transitionStep(2, 3, 9.5);
      transitionStep(3, 4, 12.5);

      // Final scaling focus for Card 5
      scrollTl.to(
        cards[4],
        { scale: isMobile ? 0.95 : 1.35, duration: 1 },
        14.5
      );

      // Retain card 5 state at the end
      scrollTl.to({}, { duration: 2.5 }, 15.5);

      // 4. Industry Stacking Cards Animation
      const stackCards = gsap.utils.toArray<HTMLElement>(".industryStackCard");
      stackCards.forEach((card, index) => {
        if (index < stackCards.length - 1) {
          gsap.to(card, {
            scale: 0.95 - (stackCards.length - 1 - index) * 0.01,
            opacity: 0.85,
            scrollTrigger: {
              trigger: stackCards[index + 1],
              start: "top 75%",
              end: "top 18vh",
              scrub: true,
            },
          });
        }
      });

      // 5. Pricing Cards Stagger
      gsap.fromTo(
        ".pricingCard",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#pricing-section",
            start: "top 80%",
            toggleActions: "play none none none",
          },
          clearProps: "transform,opacity",
        }
      );

      // 6. FAQ Items Stagger
      gsap.fromTo(
        ".faqItem",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#faq-section",
            start: "top 80%",
            toggleActions: "play none none none",
          },
          clearProps: "transform,opacity",
        }
      );

      // 7. CTA Container scale-in
      const ctaBlock = rootEl.querySelector("#cta-block");
      if (ctaBlock) {
        gsap.fromTo(
          ctaBlock,
          { scale: 0.95, opacity: 0, y: 40 },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: "#cta-section",
              start: "top 85%",
              toggleActions: "play none none none",
            },
            clearProps: "transform,opacity,scale",
          }
        );
      }

      // Initialize Pricing Slider position correctly on mount
      const toggleMonthly = rootEl.querySelector("#toggle-monthly") as HTMLElement;
      const slider = rootEl.querySelector("#pricing-toggle-slider") as HTMLElement;
      if (toggleMonthly && slider) {
        gsap.set(slider, {
          left: toggleMonthly.offsetLeft,
          width: toggleMonthly.offsetWidth,
        });
      }
    }, rootEl);

    // Refresh ScrollTrigger and resize recalculations
    const handleResize = () => {
      if (isHeroStateRef.current) {
        window.location.reload();
      } else {
        ScrollTrigger.refresh();
      }
    };
    
    window.addEventListener("resize", handleResize);

    return () => {
      // Revert all gsap context-bound animations and scroll triggers
      ctx.revert();
      window.removeEventListener("resize", handleResize);
    };
  }, [containerRef]);
};
