export function AboutPage() {
  return (
    <section className="relative overflow-hidden bg-brand-cream">
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top_left,_rgba(123,47,190,0.18),_transparent_58%)]" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="overflow-hidden rounded-[36px] border border-brand-gray bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-purple">
                Despre Noi
              </p>
              <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight text-brand-black sm:text-5xl">
                Grupa B2, între cod, cafea și dorința de a ajuta
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-brand-gray-text sm:text-lg">
                Micro-Volunteer Crisis Router este un proiect realizat din dorința de a
                construi ceva util, nu doar ceva care „arată bine în prezentare”.
              </p>
              <p className="mt-4 max-w-2xl text-base leading-8 text-brand-gray-text sm:text-lg">
                Am lucrat la el pas cu pas, cu idei schimbate, probleme rezolvate pe
                ultima sută de metri și momente în care am învățat că uneori un bug mic
                poate strica o seară întreagă.
              </p>
              <div className="mt-8 flex flex-wrap gap-3"></div>
            </div>

            <div className="flex items-center justify-center bg-[linear-gradient(180deg,_rgba(123,47,190,0.12),_rgba(230,219,247,0.25))] p-5 sm:p-6">
              <div className="grid w-full max-w-[34rem] grid-cols-2 items-start gap-4">
                <div className="self-start overflow-hidden rounded-[24px] border border-white/70 bg-white p-3 shadow-sm">
                  <img
                    alt="Membri ai echipei in timpul unui eveniment."
                    className="block h-auto w-full rounded-[18px]"
                    src="/about/team-event.jpeg"
                  />
                </div>
                <div className="mt-8 self-start overflow-hidden rounded-[24px] border border-white/70 bg-white p-3 shadow-sm">
                  <img
                    alt="Membri ai echipei intr-un moment relaxat."
                    className="block h-auto w-full rounded-[18px]"
                    src="/about/team-picnic.jpeg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-[36px] border border-brand-gray bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="flex items-center justify-center bg-[linear-gradient(180deg,_rgba(123,47,190,0.12),_rgba(230,219,247,0.25))] p-5 sm:p-6">
              <div className="grid w-full max-w-[34rem] grid-cols-2 items-start gap-4">
                <div className="self-center overflow-hidden rounded-[24px] border border-white/70 bg-white p-3 shadow-sm">
                  <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[18px]">
                    <img
                      alt="Membri ai echipei intr-un moment festiv."
                      className="h-[145%] w-auto rotate-90"
                      src="/about/team-party.jpeg"
                    />
                  </div>
                </div>
                <div className="mt-8 self-start overflow-hidden rounded-[24px] border border-white/70 bg-white p-3 shadow-sm">
                  <img
                    alt="Echipa fotografiata in fata Facultatii de Informatica."
                    className="block h-auto w-full rounded-[18px]"
                    src="/about/team-campus.jpeg"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
              <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-tight text-brand-black sm:text-4xl">
                O idee simplă. O echipă hotărâtă. Un proiect cu impact.
              </h2>
              <div className="mt-6 max-w-2xl">
                <p className="text-base leading-8 text-brand-gray-text sm:text-lg">
                  Dincolo de cod, pagini și funcționalități, proiectul nostru pornește de
                  la o idee foarte simplă: în momentele dificile, ajutorul ar trebui să
                  fie mai ușor de cerut și mai ușor de oferit.
                </p>
                <p className="mt-4 text-base leading-8 text-brand-gray-text sm:text-lg">
                  Nu a ieșit perfect din prima, dar a fost construit cu implicare, muncă
                  în echipă și cu intenția sinceră de a face ceva care contează.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full bg-brand-purple-light px-4 py-2 text-sm font-medium text-brand-purple-dark">
                  #B2
                </span>
                <span className="rounded-full bg-brand-cream px-4 py-2 text-sm font-medium text-brand-gray-text">
                  #FII
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AboutPage
