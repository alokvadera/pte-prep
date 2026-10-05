import fs from 'fs';

let tsx = fs.readFileSync('src/pages/MockSetup.tsx', 'utf-8');

const returnStartIndex = tsx.indexOf('  return (\n    <>\n      <Seo />');
if (returnStartIndex === -1) {
    console.error("Could not find return block");
    process.exit(1);
}

const componentEndIndex = tsx.indexOf('}\n\nfunction Row', returnStartIndex);
if (componentEndIndex === -1) {
    console.error("Could not find end of component");
    process.exit(1);
}

const oldReturnStr = tsx.substring(returnStartIndex, componentEndIndex + 1);

const premiumReturn = `  return (
    <>
      <Seo />
      <PageWrapper
        breadcrumbs={<Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'Mock Setup' }]} />}
        eyebrow="Mock configuration"
        title="Start a new session"
        description="Pick a length and check your microphone."
      >
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="card relative overflow-hidden bg-white/50 backdrop-blur-xl dark:bg-ink-900/40 dark:backdrop-blur-2xl border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
              <h2 className="text-xl font-bold tracking-tight text-ink-900 dark:text-white mb-6">Test Length</h2>
              
              <div className="space-y-3">
                {(['full', 'half', 'quick'] as const).map((len) => {
                  const isActive = length === len
                  const meta =
                    len === 'full'
                      ? { label: 'Full mock', desc: 'All 3 sections · Official test pacing · Best for accurate scoring' }
                      : len === 'half'
                        ? { label: 'Half mock', desc: 'Shorter duration · Good for focused section testing' }
                        : { label: 'Quick run', desc: 'A handful of questions to test the platform and your equipment' }

                  return (
                    <label key={len} className={\`choice-card flex items-start gap-4 p-5 transition-all duration-300 \${isActive ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/10 shadow-[0_0_0_1px_rgba(23,86,176,1)]' : 'border-ink-200 bg-white hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]'}\`}>
                      <input
                        type="radio"
                        name="length"
                        className="mt-1 h-5 w-5 accent-brand-500 shrink-0 cursor-pointer"
                        checked={isActive}
                        onChange={() => { setLength(len); setSingleSection(null); }}
                      />
                      <div>
                        <div className="text-ink-900 dark:text-white font-semibold">{meta.label}</div>
                        <div className="text-ink-500 dark:text-ink-300 text-sm mt-1">{meta.desc}</div>
                      </div>
                    </label>
                  )
                })}
              </div>

              {length !== 'full' && (
                <div className="mt-6 pt-6 border-t border-ink-100 dark:border-white/10">
                  <h3 className="text-sm font-semibold text-ink-900 dark:text-white mb-3">Target a specific section (Optional)</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSingleSection(null)}
                      className={\`px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-200 cursor-pointer \${singleSection === null ? 'border-brand-500 bg-brand-500 text-white shadow-sm' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 dark:border-white/10 dark:bg-ink-800 dark:text-ink-300 dark:hover:border-white/20'}\`}
                    >
                      All sections
                    </button>
                    {(['speaking-writing', 'reading', 'listening'] as const).map((sId) => {
                      const isActive = singleSection === sId
                      const sectionTitle = SECTION_META[sId]?.longTitle || sId

                      return (
                        <button
                          key={sId}
                          type="button"
                          onClick={() => setSingleSection(sId)}
                          className={\`px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-200 cursor-pointer \${isActive ? 'border-brand-500 bg-brand-500 text-white shadow-sm' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 dark:border-white/10 dark:bg-ink-800 dark:text-ink-300 dark:hover:border-white/20'}\`}
                        >
                          {sectionTitle}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <MicChecker />
          </div>

          <div className="lg:col-span-1">
            <div className="card sticky top-24 bg-white/80 backdrop-blur-xl dark:bg-ink-900/80">
              <h2 className="text-lg font-bold tracking-tight text-ink-900 dark:text-white mb-4">Summary</h2>
              
              <dl className="space-y-4 mb-8 border-b border-ink-100 dark:border-white/10 pb-6">
                <Row label="Type" value={LENGTHS[length].label} />
                <Row label="Sections" value={preview.mock.sections.map((s) => SECTION_META[s.id]?.longTitle || s.id).join(' → ')} />
                <Row label="Scored Items" value={String(preview.scoredCount)} />
                <Row label="Estimated Time" value={formatClock(preview.mock.totalSeconds)} />
              </dl>
              
              <Button size="lg" className="w-full justify-center shadow-premium-light dark:shadow-premium-dark" onClick={handleStart}>
                Start session →
              </Button>

              <details className="border-ink-200 dark:border-white/10 group mt-5 border-t pt-4">
                <summary className="text-ink-700 dark:text-ink-200 flex cursor-pointer items-center justify-between gap-3 text-xs font-semibold">
                  <span>{includedTypes.length} question types included</span>
                  <span className="text-ink-500 dark:text-ink-400 font-normal group-open:hidden">Show</span>
                  <span className="text-ink-500 dark:text-ink-400 hidden font-normal group-open:inline">Hide</span>
                </summary>
                <ul className="text-ink-600 dark:text-ink-300 mt-3 max-h-48 space-y-1 overflow-y-auto pr-2 text-xs">
                  {includedTypes.map((type) => <li key={type}>{QUESTION_META[type]?.label || type}</li>)}
                </ul>
              </details>
            </div>
          </div>
        </div>

        {confirmOverwrite ? (
          <div className="fixed inset-0 z-100 grid place-items-center p-4">
            <button
              type="button"
              className="bg-ink-950/70 animate-fade-in absolute inset-0 cursor-pointer backdrop-blur-sm"
              onClick={() => setConfirmOverwrite(false)}
              aria-label="Cancel"
            />
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-overwrite-title"
              className="card relative z-10 w-full max-w-sm p-6 shadow-2xl animate-modal-enter"
            >
              <h3 id="confirm-overwrite-title" className="text-lg font-bold text-ink-900 dark:text-white">Discard active mock?</h3>
              <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
                You already have a mock in progress ({activeMock?.title}). Starting a new one will discard it permanently.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setConfirmOverwrite(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={() => { setConfirmOverwrite(false); begin(); }}>
                  Discard & Start
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </PageWrapper>
    </>
  )
}`;

tsx = tsx.replace(oldReturnStr, premiumReturn);
fs.writeFileSync('src/pages/MockSetup.tsx', tsx);
