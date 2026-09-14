import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

// Both domains use the same confirmation page. Never edit two copies by hand.
const confirmation = () => readFileSync(new URL('./src/thank-you.html', import.meta.url), 'utf8');
const deployment = JSON.parse(readFileSync(new URL('./deployment.json', import.meta.url), 'utf8'));
if (!/^\d+$/.test(deployment.widgetId) || !/^[a-f0-9]+$/.test(deployment.scriptId) || !['/thanks/', '/spasibo/'].includes(deployment.successPath)) throw new Error('Invalid deployment configuration');
export default defineConfig({
  plugins: [{
    name: 'registration-confirmation-pages',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replaceAll('%%WIDGET_ID%%', deployment.widgetId)
          .replaceAll('%%SCRIPT_ID%%', deployment.scriptId)
          .replaceAll('%%SUCCESS_PATH%%', deployment.successPath);
      },
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!/^\/(thanks|spasibo)\/?$/.test((req.url || '').split('?')[0])) return next();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(confirmation());
      });
    },
    generateBundle() {
      for (const route of ['thanks', 'spasibo']) {
        this.emitFile({ type: 'asset', fileName: `${route}/index.html`, source: confirmation() });
      }
    },
  }],
});
