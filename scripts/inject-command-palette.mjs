import fs from 'fs';

let tsx = fs.readFileSync('src/App.tsx', 'utf-8');

tsx = tsx.replace(
  "import { ErrorBoundary } from './components/ErrorBoundary'",
  "import { ErrorBoundary } from './components/ErrorBoundary'\nimport { CommandPalette } from './components/ui/CommandPalette'"
);

tsx = tsx.replace(
  "      </Suspense>\n    </ErrorBoundary>",
  "      </Suspense>\n      <CommandPalette />\n    </ErrorBoundary>"
);

fs.writeFileSync('src/App.tsx', tsx);
