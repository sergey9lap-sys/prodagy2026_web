import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";

gsap.registerPlugin(ScrollTrigger);
gsap.defaults({ duration: 0.72, ease: "power3.out" });

const page = document.documentElement;
const progress = document.querySelector("[data-progress]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function initTabs() {
  document.querySelectorAll("[data-tabs]").forEach((tabs) => {
    const buttons = [...tabs.querySelectorAll('[role="tab"]')];
    const panels = [...tabs.querySelectorAll('[role="tabpanel"]')];

    const activate = (button, focus = false) => {
      buttons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
        item.tabIndex = active ? 0 : -1;
      });

      panels.forEach((panel) => {
        panel.hidden = panel.id !== button.getAttribute("aria-controls");
      });

      if (focus) button.focus();
      if (!focus && !reduceMotion.matches) {
        const panel = document.getElementById(button.getAttribute("aria-controls"));
        gsap.fromTo(panel, { autoAlpha: 0.55, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.48, overwrite: true });
      }
      ScrollTrigger.refresh();
    };

    buttons.forEach((button, index) => {
      button.addEventListener("click", () => activate(button));
      button.addEventListener("keydown", (event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        activate(buttons[(index + direction + buttons.length) % buttons.length], true);
      });
    });

    const selected = buttons.find((button) => button.getAttribute("aria-selected") === "true") || buttons[0];
    activate(selected);
  });
}

function initMotion() {
  const mm = gsap.matchMedia();

  mm.add(
    {
      desktop: "(min-width: 821px)",
      mobile: "(max-width: 820px)",
      reduce: "(prefers-reduced-motion: reduce)"
    },
    (context) => {
      const { desktop, mobile, reduce } = context.conditions;
      if (reduce) return;

      const heroTitle = new SplitType("[data-split]", { types: "lines,words" });
      const heroPath = document.querySelector("[data-hero-route]");
      const enterY = mobile ? 12 : 20;
      const enterDuration = mobile ? 0.42 : 0.56;
      const step = mobile ? 0.055 : 0.075;
      const sectionStart = mobile ? "clamp(top 86%)" : "clamp(top 78%)";
      const enter = { y: enterY, autoAlpha: 0, duration: enterDuration, ease: "power3.out" };

      if (desktop && heroPath) {
        const pathLength = heroPath.getTotalLength();
        gsap.set(heroPath, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
      }

      // First screen: promise first, context second, expert third, action last.
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .from(heroTitle.words, { yPercent: mobile ? 42 : 64, autoAlpha: 0, duration: mobile ? 0.56 : 0.68, stagger: 0.026 })
        .from(".hero .section-lead", { ...enter }, "-=0.28")
        .from(".hero-person", { x: desktop ? 32 : 0, y: mobile ? 10 : 0, autoAlpha: 0, duration: 0.62 }, "-=0.24")
        .from(".hero-description", { ...enter }, "-=0.3")
        .from(".hero-actions", { ...enter }, "-=0.28")
        .from(".hero-meta", { y: 10, autoAlpha: 0, duration: 0.42 }, "-=0.22");

      if (desktop && heroPath) {
        intro.to(heroPath, { strokeDashoffset: 0, duration: 0.95, ease: "power2.inOut" }, "-=1.08");
      }

      const routeSection = (section, stages) => {
        const trigger = document.querySelector(section);
        if (!trigger) return;

        if (mobile) {
          stages.forEach(({ targets, vars = {} }) => {
            const elements = gsap.utils.toArray(targets).filter((element) => trigger.contains(element) && !element.hidden);
            elements.forEach((element) => {
              gsap.from(element, {
                ...enter,
                ...vars,
                scrollTrigger: {
                  trigger: element,
                  start: "clamp(top 91%)",
                  once: true
                }
              });
            });
          });
          return;
        }

        const timeline = gsap.timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: {
            trigger,
            start: sectionStart,
            once: true
          }
        });

        stages.forEach(({ targets, stagger = 0, position = ">-0.34", vars = {} }) => {
          const elements = gsap.utils.toArray(targets).filter((element) => trigger.contains(element) && !element.hidden);
          if (!elements.length) return;
          timeline.from(elements, { ...enter, stagger, ...vars }, position);
        });
      };

      const systemPath = document.querySelector("[data-system-route]");
      let systemLength = 0;
      if (desktop && systemPath) {
        systemLength = systemPath.getTotalLength();
        gsap.set(systemPath, { strokeDasharray: systemLength, strokeDashoffset: 0 });
      }

      routeSection("#program", [
        { targets: "#program .section-heading h2", position: 0 },
        { targets: "#program .section-heading .section-lead" },
        { targets: "#program .question-card", stagger: step + 0.015 }
      ]);

      routeSection("#system", [
        { targets: "#system .section-heading h2", position: 0 },
        { targets: "#system .section-heading .section-lead" },
        ...(desktop ? [{ targets: "#system [data-system-route]", vars: { strokeDashoffset: systemLength, y: 0, autoAlpha: 1, duration: 0.72, ease: "power2.inOut" } }] : []),
        { targets: "#system .map-point", stagger: step + 0.02 },
        { targets: "#system .section-action" }
      ]);

      routeSection("#format", [
        { targets: "#format .timing-copy h2", position: 0 },
        { targets: "#format .timing-copy > p", stagger: step },
        { targets: "#format .timing-list li", stagger: step },
        { targets: "#format .bonus-card", vars: { y: mobile ? 12 : 24 } },
        { targets: "#format .record-note" },
        { targets: "#format .section-action" }
      ]);

      routeSection("#author", [
        { targets: "#author .author-copy h2", position: 0 },
        { targets: "#author .author-copy .section-lead" },
        { targets: "#author .author-photo", vars: { x: desktop ? -22 : 0, y: mobile ? 12 : 0 } },
        { targets: "#author .author-stats > *", stagger: step },
        { targets: "#author .logo-strip", position: "<+0.08" },
        { targets: "#author .author-facts > *", stagger: step },
      ]);

      routeSection("#tariffs", [
        { targets: "#tariffs .section-heading h2", position: 0 },
        { targets: "#tariffs .section-heading .section-lead" },
        { targets: "#tariffs .tariff-card", stagger: step + 0.02 }
      ]);

      routeSection("#questions", [
        { targets: "#questions .faq h2", position: 0 },
        { targets: "#questions .faq details", stagger: step },
        { targets: "#questions .closing-action > *", stagger: step }
      ]);

      routeSection("#care", [
        { targets: "#care .care-copy h2", position: 0 },
        { targets: "#care .care-copy .section-lead" },
        { targets: "#care .care-actions > *", stagger: step },
        { targets: "#care .care-phone", vars: { x: desktop ? 20 : 0, y: mobile ? 12 : 0 } }
      ]);

      if (desktop) {
        gsap.to(".hero-person img", {
          yPercent: 5,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: 0.8
          }
        });
      }

      return () => heroTitle.revert();
    }
  );
}

function initMicroInteractions() {
  if (reduceMotion.matches || !window.matchMedia("(pointer: fine)").matches) return;

  document.querySelectorAll(".magnetic").forEach((element) => {
    const xTo = gsap.quickTo(element, "x", { duration: 0.36, ease: "power3.out" });
    const yTo = gsap.quickTo(element, "y", { duration: 0.36, ease: "power3.out" });

    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      xTo((event.clientX - rect.left - rect.width / 2) * 0.12);
      yTo((event.clientY - rect.top - rect.height / 2) * 0.16);
    });

    element.addEventListener("pointerleave", () => {
      xTo(0);
      yTo(0);
    });
  });

  document.querySelectorAll(".interactive-card").forEach((card) => {
    const yTo = gsap.quickTo(card, "y", { duration: 0.34, ease: "power3.out" });
    card.addEventListener("pointerenter", () => yTo(-4));
    card.addEventListener("pointerleave", () => yTo(0));
  });
}

function updateScrollProgress() {
  const max = page.scrollHeight - window.innerHeight;
  const value = max > 0 ? window.scrollY / max : 0;
  gsap.set(progress, { scaleX: value });
}

initTabs();
initMotion();
initMicroInteractions();

window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("load", () => {
  updateScrollProgress();
  ScrollTrigger.refresh();
});
