import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './App.css'
import RegistrationModal from './components/RegistrationModal'

gsap.registerPlugin(ScrollTrigger)

const tracksPoster = {
  src: '/sdg poster.jpg',
  alt: 'Sustainable Development Goals poster showing the full set of hackathon tracks.',
}

const metrics = [
  {
    label: 'Participants from diverse academic backgrounds',
    value: 300,
    suffix: '+',
  },
  {
    label: 'Teams working on SDG-aligned challenges',
    value: 35,
    suffix: '+',
  },
  {
    label: 'Hours of ideation, development, and pitching',
    value: 12,
    suffix: '',
  },
]

const marqueeWords = ['Build', 'Ship', 'Pitch', 'Win']

const eventDetails = [
  {
    label: 'Theme',
    value: 'Sustainable Development Goals',
  },
  {
    label: 'Venue',
    value: 'SRM-AP University, Amaravati',
  },
  {
    label: 'Date',
    value: '25th & 26th April, 2026',
  },
  {
    label: 'Time',
    value: '10 pm (25th April) - 10 am (26th April)',
  },
]

const prizeSpotlight = {
  label: 'Prize pool',
  value: '20,000',
  summary: 'A focused reward pool for the strongest SDG-driven builds presented at the final pitch.',
}

const previousHackathonPhotos = [
  {
    src: '/carousel/_MG_1937.jpg',
    alt: 'Participants and organizers gathered during a previous hackathon session.',
    title: 'Hackathon floor energy',
    summary: 'A live look at the atmosphere, turnout, and momentum from the previous edition.',
    position: 'center center',
  },
  {
    src: '/carousel/_MG_1966.jpg',
    alt: 'Participants during a previous hackathon captured in the event venue.',
    title: 'Previous event highlights',
    summary: 'Scenes from the earlier hackathon showcasing participation, teamwork, and event scale.',
    position: 'center center',
  },
]

function App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const marqueeViewportRef = useRef<HTMLDivElement>(null)
  const marqueeTrackRef = useRef<HTMLDivElement>(null)
  const marqueeMeasureRef = useRef<HTMLDivElement>(null)
  const [marqueeCycles, setMarqueeCycles] = useState(2)
  const [activeSnapshot, setActiveSnapshot] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const hasMultipleSnapshots = previousHackathonPhotos.length > 1

  const shiftSnapshot = (direction: 1 | -1 = 1) => {
    if (!hasMultipleSnapshots) {
      return
    }

    setActiveSnapshot((currentIndex) => {
      const nextIndex =
        (currentIndex + direction + previousHackathonPhotos.length) %
        previousHackathonPhotos.length

      return nextIndex
    })
  }

  const autoplaySnapshot = useEffectEvent(() => {
    shiftSnapshot(1)
  })

  useLayoutEffect(() => {
    const marqueeViewport = marqueeViewportRef.current
    const marqueeMeasure = marqueeMeasureRef.current

    if (!marqueeViewport || !marqueeMeasure) {
      return undefined
    }

    const syncMarqueeCycles = () => {
      const cycleWidth = marqueeMeasure.offsetWidth
      const viewportWidth = marqueeViewport.offsetWidth

      if (!cycleWidth || !viewportWidth) {
        return
      }

      const nextCycles = Math.max(2, Math.ceil(viewportWidth / cycleWidth) + 1)

      setMarqueeCycles((currentCycles) =>
        currentCycles === nextCycles ? currentCycles : nextCycles,
      )
    }

    syncMarqueeCycles()

    const resizeObserver = new ResizeObserver(syncMarqueeCycles)
    resizeObserver.observe(marqueeViewport)
    resizeObserver.observe(marqueeMeasure)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    const mm = gsap.matchMedia()

    const ctx = gsap.context(() => {
      const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } })

      heroTimeline
        .from('.hero-copy > *', {
          y: 48,
          autoAlpha: 0,
          duration: 0.9,
          stagger: 0.12,
        })
        .from(
          '.hero-marquee',
          {
            y: 32,
            autoAlpha: 0,
            duration: 0.8,
          },
          0.5,
        )

      gsap.to('.hero-orb--a', {
        yPercent: -28,
        xPercent: 12,
        rotate: 14,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.1,
        },
      })

      gsap.to('.hero-orb--b', {
        yPercent: 18,
        xPercent: -10,
        rotate: -18,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.4,
        },
      })

      gsap.to('.hero-grid', {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })

      gsap.utils.toArray<HTMLElement>('.reveal').forEach((element) => {
        gsap.fromTo(
          element,
          {
            y: 48,
            autoAlpha: 0,
          },
          {
            y: 0,
            autoAlpha: 1,
            duration: 1,
            ease: 'power3.out',
            immediateRender: false,
            scrollTrigger: {
              trigger: element,
              start: 'top 82%',
              once: true,
            },
          },
        )
      })

      gsap.utils.toArray<HTMLElement>('.metric-value').forEach((element) => {
        const targetValue = Number(element.dataset.value)
        const suffix = element.dataset.suffix ?? ''
        const counter = { value: 0 }

        gsap.to(counter, {
          value: targetValue,
          duration: 1.6,
          ease: 'power2.out',
          snap: { value: 1 },
          scrollTrigger: {
            trigger: element,
            start: 'top 82%',
          },
          onUpdate: () => {
            element.textContent = `${counter.value}${suffix}`
          },
        })
      })

      mm.add('(min-width: 900px)', () => {
        gsap.to('.signal-poster-shell', {
          y: -18,
          ease: 'none',
          scrollTrigger: {
            trigger: '.signals',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
        })
      })

      mm.add('(max-width: 899px)', () => {
        gsap.fromTo(
          '.signal-poster-shell',
          {
            y: 30,
            autoAlpha: 0,
          },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.8,
            ease: 'power3.out',
            immediateRender: false,
            scrollTrigger: {
              trigger: '.signal-poster-shell',
              start: 'top 88%',
              once: true,
            },
          },
        )
      })
    }, rootRef)

    return () => {
      mm.revert()
      ctx.revert()
    }
  }, [])

  useLayoutEffect(() => {
    const marqueeTrack = marqueeTrackRef.current

    if (!marqueeTrack || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    gsap.set(marqueeTrack, { xPercent: 0 })

    const marqueeTween = gsap.to(marqueeTrack, {
      xPercent: -50,
      duration: 18,
      ease: 'none',
      repeat: -1,
    })

    return () => {
      marqueeTween.kill()
    }
  }, [marqueeCycles])

  useEffect(() => {
    if (
      !hasMultipleSnapshots ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return undefined
    }

    const autoplay = window.setInterval(() => {
      autoplaySnapshot()
    }, 4500)

    return () => {
      window.clearInterval(autoplay)
    }
  }, [autoplaySnapshot, hasMultipleSnapshots])

  return (
    <div className="page-shell" ref={rootRef}>
      <RegistrationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <main>
        <section className="hero section">
          <div className="hero-scene" aria-hidden="true">
            <span className="hero-orb hero-orb--a" />
            <span className="hero-orb hero-orb--b" />
            <span className="hero-grid" />
          </div>

          <div className="hero-copy">
            <p className="eyebrow">Sustainable Development Goals Hackathon</p>
            <div className="hero-title-wrap">
              <span className="hero-whisper hero-whisper--left">Your</span>
              <h1 className="hero-title">
                <span>Global</span>
                <span>Goals</span>
                <span>Hackathon</span>
              </h1>
              <span className="hero-whisper hero-whisper--right">Live</span>
            </div>
            <p className="hero-body">
              A 12-hour build sprint at SRM-AP University, Amaravati, bringing teams together
              to prototype bold solutions aligned with the Sustainable Development Goals.
            </p>
            <div className="hero-actions">
              <button
                className="button button--solid button--primary-cta"
                onClick={() => setIsModalOpen(true)}
              >
                Register now
              </button>

              <div className="hero-actions-secondary">
                <a href="#sustainable-goals" className="button button--subtle">
                  Explore tracks
                </a>
                <a href="#contact-details" className="button button--subtle">
                  Contact organizers
                </a>
              </div>
            </div>
          </div>

          <div className="hero-marquee" ref={marqueeViewportRef}>
            <div className="marquee-measure" aria-hidden="true">
              <div className="marquee-cycle" ref={marqueeMeasureRef}>
                {marqueeWords.map((word) => (
                  <span key={`measure-${word}`}>{word}</span>
                ))}
              </div>
            </div>

            <div className="marquee-track" ref={marqueeTrackRef}>
              {[0, 1].map((groupIndex) => (
                <div className="marquee-group" key={groupIndex} aria-hidden={groupIndex > 0}>
                  {Array.from({ length: marqueeCycles }, (_, cycleIndex) => (
                    <div className="marquee-cycle" key={`${groupIndex}-${cycleIndex}`}>
                      {marqueeWords.map((word) => (
                        <span key={`${groupIndex}-${cycleIndex}-${word}`}>{word}</span>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="event-details section reveal" aria-label="Hackathon details">
          <div className="event-details-panel">
            <div className="event-details-copy">
              <p className="eyebrow">Event details</p>
              <span className="event-details-label">{eventDetails[0].label}</span>
              <h2 className="event-details-theme">{eventDetails[0].value}</h2>
              <p className="event-details-summary">
                A 12-hour campus hackathon hosted at SRM-AP University, designed for teams
                building around real Sustainable Development Goal challenges.
              </p>

              <div className="event-prize-spotlight" aria-label="Prize pool highlight">
                <div className="event-prize-head">
                  <span className="event-prize-label">{prizeSpotlight.label}</span>
                  <span className="event-prize-tag">Featured</span>
                </div>
                <div className="event-prize-value">{prizeSpotlight.value}</div>
                <p className="event-prize-summary">{prizeSpotlight.summary}</p>
              </div>
            </div>

            <div className="event-details-list">
              {eventDetails.slice(1).map((detail) => (
                <article className="event-detail-row" key={detail.label}>
                  <span className="event-detail-key">{detail.label}</span>
                  <p>{detail.value}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="signals section" id="sustainable-goals">
          <div className="section-heading section-heading--wide">
          
            <h2>Hackathon Tracks</h2>
            {/* <p className="section-copy">
              On desktop, the site leans into motion and pacing. On mobile, those same
              sections collapse into a cleaner stacked sequence without losing the tone.
            </p> */}
          </div>

          <div className="signal-viewport">
            <figure className="signal-poster-shell">
              <img className="signal-poster-image" src={tracksPoster.src} alt={tracksPoster.alt} />
            </figure>
          </div>
        </section>

        <section className="metrics section reveal">
          <div className="metrics-overview">
            <div className="metrics-copy">
              <p className="eyebrow">Event snapshot</p>
              <h2>Our Previous </h2>
              <p>
                A quick read on participation, team volume, and the focused sprint window
                that shaped the final round of prototype pitching.
              </p>
            </div>

            <div className="snapshot-carousel" aria-label="Previous hackathon image carousel">
              <div className="snapshot-carousel-frame">
                {previousHackathonPhotos.map((photo, index) => {
                  const isActive = index === activeSnapshot

                  return (
                    <figure
                      className={`snapshot-slide${isActive ? ' is-active' : ''}`}
                      key={photo.title}
                      aria-hidden={!isActive}
                    >
                      <img
                        src={photo.src}
                        alt={photo.alt}
                        style={{ objectPosition: photo.position }}
                      />
                    </figure>
                  )
                })}
              </div>

              {hasMultipleSnapshots ? (
                <div className="snapshot-carousel-controls">
                  <div className="snapshot-carousel-dots" aria-label="Select gallery image">
                    {previousHackathonPhotos.map((photo, index) => (
                      <button
                        key={photo.src}
                        type="button"
                        className={`snapshot-dot${index === activeSnapshot ? ' is-active' : ''}`}
                        onClick={() => {
                          setActiveSnapshot(index)
                        }}
                        aria-label={`Show ${photo.title}`}
                        aria-pressed={index === activeSnapshot}
                      />
                    ))}
                  </div>

                  <div className="snapshot-carousel-actions">
                    <button
                      type="button"
                      className="snapshot-action"
                      onClick={() => {
                        shiftSnapshot(-1)
                      }}
                      aria-label="Show previous image"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      className="snapshot-action"
                      onClick={() => {
                        shiftSnapshot(1)
                      }}
                      aria-label="Show next image"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="metrics-grid">
            {metrics.map((metric) => (
              <article className="metric-card" key={metric.label}>
                <span
                  className="metric-value"
                  data-value={metric.value}
                  data-suffix={metric.suffix}
                >
                  0
                </span>
                <p>{metric.label}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="contact section reveal" id="contact-details">
          <div className="contact-card">
            <p className="eyebrow">We are here</p>
            <h2>Contact Us</h2>
            <p>
              Feel free to contact us with your doubts regarding hackathons either via Whatsapp messages or calls.
            </p>
            <a href="mailto:pratheek.r@aiesecmember.in" className="button button--solid">
            pratheek.r@aiesecmember.in
            </a>
            <a
              href="https://wa.me/919150613156"
              className="button button--subtle"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp Nandkishan: +91 91506 13156
            </a>
            <a
              href="https://wa.me/919092111033"
              className="button button--subtle"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp Rhaiya: +91 90921 11033
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
